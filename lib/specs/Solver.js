'use strict'

var FunctionExpression = require('../expressions/FunctionExpression.js')
  , TypeParameter = require('../types/TypeParameter.js')
  , ValueExpression = require('../expressions/ValueExpression.js')
  , MatchExpression = require('../expressions/MatchExpression.js')
  , Type = require('../types/Type.js')
  , Expression = require('../expressions/Expression.js')
  , util = require('../util.js')
  , verbosityLevels = require('../verbosityLevels.js')
  , traversalUtil = require('./traversalUtil.js')
  , UniqueType = require('../types/UniqueType.js')

function Solver(maxAstNodes, ignoredTypes, options) {
  this.maxAstNodes = maxAstNodes
  this.unexploredPaths = 0
  this.ignoredTypes = ignoredTypes
  this.options = options
}

function refineExpression(state, expressions, varCounter) {
  var parentNode = state.parentNode
    , parent = state.parent
    , childIndex = state.childIndex
    , parentId = parentNode.id
    , unionType = parentNode.expr.args[0].type
    , matchedType = unionType.children[childIndex - 1]

  var siblingList = util.listFilter(parent, function(candidate) {
    return candidate.parentId === parentId
  })

  var bindExpression = util.listLast(siblingList).expr

  if(bindExpression instanceof ValueExpression) {
    var removed = util.listRemoveFirst(expressions, bindExpression)
    expressions = removed
  }

  var refinementValue = new ValueExpression('refinement' + varCounter)
  refinementValue.returnsResolved(matchedType)
  refinementValue.as('refinement' + varCounter)
  
  expressions = {
    head: refinementValue,
    tail: expressions
  }

  return expressions
}

Solver.prototype.traverse = function(state) {

  var parentExpressions = state.expressions
    , parentTypes = state.types
    , parentVarCounter = state.varCounter
    , node = state.node
    , parent = state.parent
    , typeFilterList = state.typeFilterList
    , parentNode = state.parentNode
    , parentExpr = parentNode.expr
    , parentId = parentNode.id
    , childIndex = state.childIndex
    , len = state.len
    , cont = state.cont
    , self = this

  if(isNaN(len)) throw new Error('len isNaN')
  if(len + 1 > self.maxAstNodes) {
    self.unexploredPaths++
    return null
  }

  var expressions = parentExpressions
    , types = parentTypes
    , varCounter = parentVarCounter

  if(node instanceof FunctionExpression) {

    // We need to add the function's arguments as candidates expressions.
    for(var p = 0; p < node.bindingTypes.length; p++) {

      var argType = node.bindingTypes[p]
        , argIndex = varCounter++

      if(argType instanceof TypeParameter)
        argType = new UniqueType()

      var argValue = new ValueExpression('arg' + argIndex)
      argValue.returnsResolved(argType)
      argValue.as('arg' + argIndex)
      expressions = {
        head: argValue,
        tail: expressions
      }
    }
  }

  if(parentExpr instanceof MatchExpression
    && node instanceof Type
    && childIndex !== 0) {
    expressions = refineExpression(state, expressions, varCounter++)
  }

  if(node instanceof Type) {

    if(self.options.searchPath) {
      var traversalStr = traversalUtil.toString(parent)
      if(traversalStr.indexOf(self.options.searchPath) < 0 &&
        self.options.searchPath.indexOf(traversalStr) < 0) {
        return
      }
    }

    if(self.options.verbosity >= verbosityLevels.traversal) {
      tap.comment()
      tap.comment('~ traversing ~')
      tap.comment(traversalUtil.toString(parent) || 'nil')
    }

    // Find expressions that match type.
    var candidate = expressions
      , match = false

    if(self.options.verbosity >= verbosityLevels.expression)
      tap.comment('expression ' + parentExpr)

    while(candidate) {

      var childExpression = null
        , childTypeFilterList = null

      if(candidate.head.type === node) {
        childExpression = candidate.head
        childTypeFilterList = typeFilterList
      } else {

        var typeFilters =
          util.copy(util.listFindValue(childTypeFilterList, parentId)) || {}

        // The parent type should always be a proper or improper superset
        // of the expression's type.
        typeFilters = 
          util.copy(util.listFindValue(childTypeFilterList, parentId)) || {}

        if(node.containsType(candidate.head.type, typeFilters)) {
          childExpression = candidate.head
          childTypeFilterList = util.listAddKeyValue(
            typeFilterList, parentId, typeFilters)
        } else {
          // There is still a case we need to check.
          // The expression's type can be a superset of the parent's type
          // before filtering, but after filtering it may still be
          // a proper or improper subset of the parent.

          // Example:
          // Let's look at the ternary expression:
          // ?: : 'a takes (Boolean, 'a, 'a)
          // Let's say we have a specification that returns a Number.
          // So Number is the node and "?:" is the candidate.head.
          // The candidate.head type is 'a
          // We should be able to use a ternary expression to return a Number.
          // Number is not a superset of 'a.
          // 'a is a superset of Number.
          // After we find that 'a is a superset of Number,
          // we have a typeFilter that maps 'a to Number.
          // After type filtering, the ternary operator looks like:
          // ?: : Number takes (Boolean, Number, Number)
          // Now the expression type is Number
          // This a strict subset of 'node', so this is a valid match.

          // First check if the expression result's type is
          // a proper or improper superset of the parent type.
          typeFilters = 
            util.copy(util.listFindValue(childTypeFilterList, parentId)) || {}

          var expressionContainsParentType =
            candidate.head.type.containsType(node, typeFilters)
          if(expressionContainsParentType) {

            // We know that the expression is a proper/improper superset
            // of the parent type.  This may be because of a typeParameter 
            // match.  After matching a typeParameter, the expression's
            // type may be a proper/improper subset of the parent's type.
            // If it is, we can traverse the AST with this type.

            var filteredChildExpression =
              candidate.head.filterType(typeFilters)
            // We need to check that the parent type
            // contains the type-filtered-expression's result type.
            var parentContainsFilteredChild = node.containsType(
              filteredChildExpression.type, util.copy(typeFilters))
            if(parentContainsFilteredChild) {
              childExpression = candidate.head.filterType(typeFilters)
              childTypeFilterList = util.listAddKeyValue(
                typeFilterList, parentId, typeFilters)
            }
          }
        }
      }

      if(childExpression) {
        if(!childExpression.allowParent(parentExpr, childIndex)) {
          if(childExpression.constraintsFailSilently)
            match = true

          if(self.options.verbosity >= verbosityLevels.expression)
            tap.comment('  ? candidate ' + candidate.head,
              '- child forbade parent')
        } else if (!parentExpr.allowChild(childExpression, childIndex)) {

          if(parentExpr.constraintsFailSilently)
            match = true

          if(self.options.verbosity >= verbosityLevels.expression)
            tap.comment('  ? candidate ' + candidate.head,
              '- parent forbade child')

        } else {

          match = true

          if(self.options.verbosity >= verbosityLevels.expression)
            tap.comment('  ? candidate ' + candidate.head, '- yes')

          var traversal = self.traverse({
            expressions: expressions,
            types: types,
            varCounter: varCounter,
            node: childExpression,
            parent: parent,
            // Pass typeFilters down through types.
            typeFilterList: childTypeFilterList,
            parentNode: parentNode,
            childIndex: childIndex,
            len: len,
            cont: cont
          })
          if(traversal) return traversal
        }
      } else if(self.options.verbosity >= verbosityLevels.expression) {
        tap.comment('  ? candidate ' + candidate.head, '- no')
      }

      candidate = candidate.tail
    }

    if(!match) {
      for(var i = 0; i < this.ignoredTypes.length; i++) {
        if(!this.ignoredTypes[i].containsType(node, {})) continue
        if(self.options.verbosity >= verbosityLevels.expression)
          tap.comment('ignoring traversal for ' + node)
        return
      }
      tap.comment('problematic traversal:')
      tap.comment(traversalUtil.toString(parent))
      throw new Error('Found no expression that returns type ' + node)
    }

  } else if(node instanceof Expression) {

    var children = node.args
      , id = len + 1
    var expressionNode = {
      expr: node,
      id: id,
      parentId: parentId,
      varCount: parentVarCounter
    }

    var traverseBranch = function(
      index, branchTraversal, branchLen, typeFilterList) {

      if(index >= node.args.length) {
        // Branch termination means typeFilter isn't propagated.
        return cont(branchTraversal, branchLen, typeFilterList, expressions)
      }

      var childTypeFilters = util.listFindValue(typeFilterList, id)
        , child = node.args[index].type.filterType(childTypeFilters)

      return self.traverse({
        types: types,
        expressions: expressions,
        varCounter: varCounter,
        node: child,
        parent: branchTraversal,
        typeFilterList: typeFilterList,
        parentNode: expressionNode,
        childIndex: index,
        len: branchLen,
        cont: function onBranch(termTraversal, termLen, typeFilterList) {
          return traverseBranch(
            index + 1,
            termTraversal,
            termLen,
            typeFilterList)
        }
      })
    }

    return traverseBranch(0, {
      head: expressionNode,
      tail: parent
    }, len + 1, typeFilterList) // No typeFilter for first child.
  } else {
    throw new Error('Unexpected node type: ' + typeof node)
  }
}

module.exports = Solver
