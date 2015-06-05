'use strict'

var Specification = require('./Specification.js')
  , typeUtil = require('../types/typeUtil.js')
  , UnionType = require('../types/UnionType.js')
  , ArgumentsTupleType = require('../types/ArgumentsTupleType.js')
  , FunctionType = require('../types/FunctionType.js')
  , Mock = require('./Mock.js')
  , FunctionExpression = require('../expressions/FunctionExpression.js')
  , RefinementExpression = require('../expressions/RefinementExpression.js')
  , ValueExpression = require('../expressions/ValueExpression.js')
  , util = require('../util.js')
  , tap = require('../tap.js')
  , nativeTypes = require('../types/nativeTypes.js')
  , typePlaceholder = require('../types/typePlaceholder.js')

var SpecificationCallExpression = require(
  '../expressions/SpecificationCallExpression.js')

var MatchArgumentExpression = require(
  '../expressions/MatchArgumentExpression.js')

function MatchSpecification(name, childSpecs) {
  var self = this
  Specification.call(self, name)
  Object.defineProperty(self, 'recursion', {
    value: false,
    enumerable: true
  })
  self.childSpecs = childSpecs
  self.childSpecs.forEach(function(childSpec) {
    Specification.prototype.use.call(self, childSpec)
    var mock = new Mock(null, childSpec)
    childSpec.scenarios.forEach(function(childScenario) {
      var scenario = self.createScenario(childScenario.condition)
      if('thisArg' in childScenario) scenario.context(childScenario.thisArg)
      mock.scenario = scenario  // TODO refactor to remove this mutation
      scenario.mocks[mock.target.name] = mock
      mock.verify.apply(mock, childScenario.condition)
    })
  })
}
MatchSpecification.prototype = Object.create(Specification.prototype)
MatchSpecification.prototype.constructor = MatchSpecification

;['use',
  'given',
  'takes',
  'returns',
  'takesContext',
  'givenNoArgs',
  'mockEach',
  'beforeEach',
  'afterEach',
  'beforeAll',
  'afterAll',
  'ignore',
  'defaultMock'
].forEach(function(key) {
  // Disable these functions in MatchSpecification
  MatchSpecification.prototype[key] = undefined
})

MatchSpecification.prototype.createSpecificationCallExpression =
  function(specName, resolvedType, isConstructor) {

  var spec = this

  var result = new SpecificationCallExpression(
    specName, resolvedType, isConstructor)

  result.constrainChild(function(filteredSelf, child, index) {
    var valueExpression

    if(child instanceof RefinementExpression &&
      child.source instanceof ValueExpression) {
      valueExpression = child.source
    }
    else if(child instanceof ValueExpression)
      valueExpression = child

    var hasContext = 'contextType' in resolvedType
      , expectedIndex = hasContext

    var isArg = valueExpression && 'arg' + index === valueExpression.name
    return isArg
  })

  return result
}

MatchSpecification.prototype.solve = function(cachedSearchPath) {

  function comment() {
    if(cachedSearchPath) return // Dont log when trying the cache
    tap.comment.apply(tap, arguments)
  }

  if(!this.childSpecs.length) {
    comment('No child specs supplied for ' + this.name)
    return null
  }

  var canSolve = true
  for(var cs = 0; cs < this.childSpecs.length; cs++) {

    if(this.childSpecs[cs].isConstructor) {
      comment(
        'Cannot match over constructor', this.childSpecs[cs], 'in', this.name)
      canSolve = false
    }

    if(!this.childSpecs[cs].solution) {
      comment('Missing solution for', this.childSpecs[cs], 'in', this.name)
      canSolve = false
    }
  }

  if(!canSolve) return null

  if(!this.fnEx) {
    var genericFnType = this.calculateType()
      , fnType = typeUtil.instantiateTypeParameters(genericFnType)
      , argTypes = genericFnType.getInputTypes()
      , unionArgTypes = util.arrayOfType(argTypes, UnionType)
      , scenarioTypes = util.pluck(unionArgTypes, 'children')

    this.fnEx = new FunctionExpression(this.name, fnType)
    addMatchArgExpressions.call(this, argTypes, 0, [], this.fnEx, 0)
  }

  var matchArgs = util.arrayOfType(this.expressions, MatchArgumentExpression)
  if(!matchArgs.length) {
    comment('Nothing to match for', this.name)
    comment('This can occur if no arguments are union types')
    return null
  }

  return Specification.prototype.solve.call(this, cachedSearchPath, this.fnEx)
}

function addMatchArgExpressions(
  argTypes, argIndex, refinedTypes, parent, childIndex) {

  // argTypes are the types of all the input arguments
  // argIndex is the index of the current argument
  // refinedTypes is refinements known at the matchArgExpr's place in the AST
  // parent and childIndex are used to place the matchArgExpr in the AST:
  //   parent is the expression that is the parent in the AST we want to make
  //   childIndex is the child index of the matchArgExpression in the parent

  if(argIndex >= argTypes.length) return 0

  var argType = argTypes[argIndex]
  if(!(argType instanceof UnionType)) {
    var nextRefinement = refinedTypes.concat([argType])
    return addMatchArgExpressions.call(this,
      argTypes, argIndex + 1, nextRefinement, parent, childIndex)
  }

  var refinement = refineReturnType(this, refinedTypes)
    , childRefinements = []

  // TODO shouldnt need to call refineReturnType twice
  // it is being called at the parent and again at the child
  for(var c = 0; c < argType.children.length; c++) {
    var childType = argType.children[c]
      , refinedArgTypes = refinedTypes.concat([childType])
      , childRefinement = refineReturnType(this, refinedArgTypes)
    childRefinements.push(childRefinement)
  }

  var childReturnTypes = util.pluck(childRefinements, 'refinedReturnType')
  var matchArgumentExpression = new MatchArgumentExpression(
    // childIndex is used to define the MatchArgumentExpression
    argType, childReturnTypes, argIndex, childIndex,
    parent, refinement.refinedReturnType)

  if(refinement.matchingSpecs.length === childRefinements.length) {

    childRefinements.forEach(function(cr) {
      if(cr.matchingSpecs.length !== 1)
        throw new Error('Expect single matchingSpecs at branch')
    })

    // Assign a child spec to each branch of the match expression:
    matchArgumentExpression.constrainChild(function(self, child, index) {

      // Do nothing for the argument
      if(!index) return true

      var childRefinementAtBranch = childRefinements[index - 1]

      //if(childRefinementAtBranch.matchingSpecs.length !== 1)
      //  throw new Error('Expect single matchingSpecs at branch')

      if(!(child instanceof SpecificationCallExpression))
        return false

      var result =
        childRefinementAtBranch.matchingSpecs[0].name === child.specName
      return result
    })

  } else {

    matchArgumentExpression.constrainChild(function(self, child, index) {

      // Do nothing for the argument
      if(!index) return true

      // This is a match with other matches as its children
      var result = child instanceof MatchArgumentExpression
      return result
    })
  }

  var added = 1
  for(var cr = 0; cr < childRefinements.length; cr++) {
    var childRefinement = childRefinements[cr]
    // Generate matches over the next input in line
    var childAdded = addMatchArgExpressions.call(
      this, argTypes, argIndex + 1, childRefinement.refinedArgTypes,
      matchArgumentExpression, cr)
    if(!childAdded && childRefinement.matchingSpecs.length > 1) {
      throw new Error(
        'Found multiple specs in "' + this.name +
        '" taking parameters: ' + refinedArgTypes.join(', '))
    }
    added += childAdded
  }

  // This needs to appear after we call addMatchArgExpressions on the children
  // otherwise we will not add constraints to the expression that's added
  // to the building block list.
  Specification.prototype.use.call(this, matchArgumentExpression)

  return added
}

// TODO fix naming
// shouldnt call this refinement
// shouldnt return `filtered` specs - maybe matched specs
function refineReturnType(matchSpec, refinedArgTypes) {

  // refinedArgTypes is a list of refined argument types
  //   at this point in the AST.
  // We want to get the specs that can handle these argument types.
  // We return the specs and their combined return type.

  // Get the specs that can handle the refinedArgTypes
  var matchingSpecs = matchSpec.childSpecs.filter(specMatchesArgTypes)

  if(refinedArgTypes && !matchingSpecs.length)
    throw new Error( // TODO improve this explanation
      'Unable to find spec taking: ' + refinedArgTypes.join(', '))

  var specTypes = matchingSpecs.map(function(spec) {
    return spec.getType().returnType
  })

  // This is the return type of the specs
  var union = typeUtil.addTypes(specTypes)

  if(union === typePlaceholder)
    throw new Error('Failed to combine specTypes')

  return {
    refinedArgTypes: refinedArgTypes,
    matchingSpecs: matchingSpecs,
    refinedReturnType: union
  }

  function specMatchesArgTypes(spec) {
    //var genericSpecType = spec.getType()
    //  , specType = typeUtil.instantiateTypeParameters(genericSpecType)
    var specType = spec.getType()
      , argLength = specType.arg.children.length
      , hasContext = 'contextType' in specType
      , inputLength = hasContext ? argLength + 1 : argLength
    for(var a = 0; a < refinedArgTypes.length; a++) {
      var typeFilters = {}
      var argTypeAtIndex = hasContext && !a ?
        specType.contextType :
        specType.arg.children[hasContext ? a - 1 : a]
      var containsType = refinedArgTypes[a].containsType(
        argTypeAtIndex, typeFilters)
      if(!containsType) return false
    }
    return true
  }
}

MatchSpecification.prototype.calculateType = function() {
  var returnType = this.calculateReturnType()
    , argType = this.calculateArgType()
    , contextType = this.calculateContextType()
    , result = new FunctionType(argType, returnType, this.name)
  if(contextType) result.takesContext(contextType)
  return result
}

MatchSpecification.prototype.calculateArgType = function() {
  var conditions = util.pluck(this.scenarios, 'condition')
    , argLength = this.calculateArgLength(conditions)
    , argTypes = []
  for(var i = 0; i < argLength; i++)
    argTypes.push(this.calculateArgTypeAtIndex(i))
  return new ArgumentsTupleType(argTypes)
}

MatchSpecification.prototype.calculateArgTypeAtIndex = function(index) {

  if(!this.childSpecs.length)
    return nativeTypes.undefinedType

  var childSpecTypes = this.childSpecs.map(function(childSpec) {
    return childSpec.getType().arg.children[index]
  })
 
  var union = typeUtil.addTypes(childSpecTypes)

  return typeUtil.resolveType(union)
}

MatchSpecification.prototype.calculateContextType = function() { 

  var childSpecTypes = this.childSpecs.map(function(childSpec) {
    return childSpec.getType().contextType
  }).filter(util.identity)

  if(!childSpecTypes.length)
    return null

  var union = typeUtil.addTypes(childSpecTypes)

  return typeUtil.resolveType(union)
}

MatchSpecification.prototype.calculateReturnType = function() {

  var childSpecTypes = this.childSpecs.map(function(childSpec) {
    return childSpec.getType().returnType
  })

  if(!childSpecTypes.length)
    return nativeTypes.undefinedType

  var union = typeUtil.addTypes(childSpecTypes)

  return typeUtil.resolveType(union)
}

module.exports = MatchSpecification
