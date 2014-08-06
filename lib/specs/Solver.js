'use strict'

var FunctionExpression = require('../expressions/FunctionExpression.js')
  , TypeParameter = require('../types/TypeParameter.js')
  , ValueExpression = require('../expressions/ValueExpression.js')
  , MatchExpression = require('../expressions/MatchExpression.js')
  , Type = require('../types/Type.js')
  , FunctionType = require('../types/FunctionType.js')
  , Expression = require('../expressions/Expression.js')
  , util = require('../util.js')
  , verbosityLevels = require('../verbosityLevels.js')
  , traversalUtil = require('./traversalUtil.js')
  , UniqueType = require('../types/UniqueType.js')
  , tap = require('../tap.js')
  , typeUtil = require('../types/typeUtil.js')

function Solver(maxAstNodes, ignoredTypes, insertFunctionExpressions, options) {
  this.insertFunctionExpressions = insertFunctionExpressions
  this.maxAstNodes = maxAstNodes
  this.unexploredPaths = 0
  this.ignoredTypes = ignoredTypes
  this.options = options
}

function checkLen(len) {
  if(isNaN(len)) throw new Error('len isNaN')
  if(len + 1 > this.maxAstNodes) {
    this.unexploredPaths++
    return false
  }
  return true
}

Solver.prototype.traverse = function(state) {
  return traverseExpression.call(this, state)
}

function addFunctionArgumentsAsExpressions(state) {

  var node = state.node
    , varCounter = state.varCounter
    , expressions = state.expressions

  // Add the function's arguments as candidates expressions:
  for(var p = 0; p < node.bindingTypes.length; p++) {

    var argType = typeUtil.instantiateTypeParameters(node.bindingTypes[p])
      , argIndex = varCounter++

    //if(argType instanceof TypeParameter)
    //  argType = new UniqueType(argType.name)

    var argValue = new ValueExpression('arg' + argIndex)
    argValue.returnsResolved(argType)
    argValue.as('arg' + argIndex)
    expressions = {
      head: argValue,
      tail: expressions
    }
  }

  return expressions
}

function traverseExpression(state) {

  var self = this
    , parentExpressions = state.expressions
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
    , expressions = parentExpressions
    , types = parentTypes
    , varCounter = parentVarCounter
    , children = node.args
    , id = len + 1

  if(!checkLen.call(self, len)) return null

  if(node instanceof FunctionExpression) {
    var boundExpressions = addFunctionArgumentsAsExpressions(state)
    varCounter += expressions ?
      util.listIndexOf(boundExpressions, expressions.head) :
      util.listCount(boundExpressions)
    expressions = boundExpressions
  }

  var expressionNode = {
    expr: node,
    id: id,
    parentId: parentId,
    varCount: parentVarCounter
  }

  function traverseBranch(
    index, branchTraversal, branchLen, branchTypeFilterList) {

    if(index >= node.args.length) {
      // Branch termination means typeFilter isn't propagated.
      return cont(
        branchTraversal, branchLen, branchTypeFilterList, expressions)
    }

    // Don't apply type filters across branches of MatchExpressions
    var childTypeFilters = node instanceof MatchExpression ?
      util.listFindLastValue(branchTypeFilterList, id) :
      util.listFindValue(branchTypeFilterList, id)

    var child = node.args[index].type.filterType(childTypeFilters)

    return traverseType.call(self, {
      types: types,
      expressions: expressions,
      varCounter: varCounter,
      node: child,
      parent: branchTraversal,
      typeFilterList: branchTypeFilterList,
      parentNode: expressionNode,
      childIndex: index,
      len: branchLen,
      cont: function onBranch(termTraversal, termLen, termTypeFilterList) {
        return traverseBranch(
          index + 1,
          termTraversal,
          termLen,
          termTypeFilterList)
      }
    })
  }

  var initialBranchTraversal = { head: expressionNode, tail: parent }

  return traverseBranch(0, initialBranchTraversal, len + 1,
    typeFilterList) // No typeFilter for first child.
}

function refineType(state, expressions, varCounter) {

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
  refinementValue.returnsResolved(
    typeUtil.instantiateTypeParameters(matchedType))
  refinementValue.as('refinement' + varCounter)

  expressions = {
    head: refinementValue,
    tail: expressions
  }

  return expressions
}

function traverseType(state) {

  var self = this
    , parentExpressions = state.expressions
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
    , expressions = parentExpressions
    , types = parentTypes
    , varCounter = parentVarCounter

  if(!checkLen.call(self, len)) return null

  if(parentExpr instanceof MatchExpression && childIndex) {
    var refinedTypeExpressions = refineType(state, expressions, varCounter)
    varCounter += util.listIndexOf(expressions, refinedTypeExpressions.head)
    expressions = refinedTypeExpressions
  }

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
    tap.comment('expression ' + parentExpr + ' (childIndex ' + childIndex + ')')

  if(self.insertFunctionExpressions && node instanceof FunctionType) {
    // create new functionExpression
    candidate = { head: new FunctionExpression('fn', node), tail: candidate }
    match = true
  }

  while(candidate) {

    var filterTypeResult = filterCandidateByType.call(
      self, node, candidate, parentId, typeFilterList)

    if(filterTypeResult) {

      var childExpression = filterTypeResult.childExpression
        , childTypeFilterList = filterTypeResult.childTypeFilterList

      if(!childExpression.allowParent(parentExpr, childIndex)) {
        if(childExpression.constraintsFailSilently)
          match = true

        if(self.options.verbosity >= verbosityLevels.expression) {
          tap.comment('  candidate: ' + candidate.head,
            '- child forbade parent')
        }
      } else if (!parentExpr.allowChild(childExpression, childIndex)) {

        if(parentExpr.constraintsFailSilently)
          match = true

        if(self.options.verbosity >= verbosityLevels.expression) {
          tap.comment('  candidate: ' + candidate.head,
            '- parent forbade child')
        }

      } else {

        match = true

        if(self.options.verbosity >= verbosityLevels.expression) {
          tap.comment('  candidate: ' + candidate.head, '- yes')
        }

        var traversal = traverseExpression.call(self, {
          expressions: expressions,
          types: types,
          varCounter: varCounter,
          node: childExpression,
          parent: parent,
          // Pass typeFilters down through types:
          typeFilterList: childTypeFilterList,
          parentNode: parentNode,
          childIndex: childIndex,
          len: len,
          cont: cont
        })
        if(traversal) return traversal
      }
    } else if(self.options.verbosity >= verbosityLevels.expression) {
      tap.comment('  candidate: ' + candidate.head, '- no')
    }

    candidate = candidate.tail
  }

  // Handle match found but no solution:
  if(match) return null

  // Log a failed match:
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

function filterCandidateByType(node, candidate, parentId, typeFilterList) {

  if(candidate.head.type === node) {
    return {
      childExpression: candidate.head,
      childTypeFilterList: typeFilterList
    }
  }

  // The child type should always be a proper or improper superset
  // of the parent expression's type.
  var typeFilters = {}

  if(node.containsType(candidate.head.type, typeFilters)) {
    return {
      childExpression: candidate.head,
      childTypeFilterList: util.listAddKeyValue(
        typeFilterList, parentId, typeFilters)
    }
  }
/*
tap.comment()
tap.comment('  node (super) ' + node)
tap.comment('  candidate.head.type (sub) ' + candidate.head.type)
tap.comment('  typeFilters', JSON.stringify(typeFilters))
*/
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
  var expressionContainsParentType =
    candidate.head.type.containsType(node, typeFilters = {})
  if(!expressionContainsParentType) {
    if(this.options.verbosity >= verbosityLevels.diagnostic)
      tap.comment('  expression does not contain parent type')
    return null
  }

  // We know that the expression is a proper/improper superset
  // of the parent type.  This may be because of a typeParameter 
  // match.  After matching a typeParameter, the expression's
  // type may be a proper/improper subset of the parent's type.
  // If it is, we can traverse the AST with this type.

  var filteredChildExpression = candidate.head.tryFilterType(typeFilters)
  if(!filteredChildExpression) {
    if(this.options.verbosity >= verbosityLevels.diagnostic)
      tap.comment('  expression cannot be filtered by typeFilters')
    return null
  }

  // We need to check that the parent type
  // contains the type-filtered-expression's result type.
  // (Note that we just pass new typeFilters here.
  // This is because the filteredChildExpression.type already
  // has the type filtered applied.  We don't want to apply them again.
  // Otherwise we could run into the following case:
  //   'a contains Array<'a> is true
  //   typeFilters are 'a: Array<'a>
  // Reapplying the type filter would generate Array<Array<'a>>,
  // which would be incorrect.)
  var parentContainsFilteredChild = node.containsType(
    filteredChildExpression.type, {})
  if(parentContainsFilteredChild) {
    return {
      childExpression: filteredChildExpression,
      childTypeFilterList: util.listAddKeyValue(
        typeFilterList, parentId, typeFilters)
    }
  }

  if(this.options.verbosity >= verbosityLevels.diagnostic)
    tap.comment('  parent does not contain filtered child')
  return null
}

module.exports = Solver
