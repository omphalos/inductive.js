'use strict'

var util = require('../util.js')
  , fileContext = require('../fileContext.js')
  , typePlaceholder = require('../types/typePlaceholder.js')
  , DeferredApiCall = require('../DeferredApiCall.js')
  , Scenario = require('./Scenario.js')
  , typeUtil = require('../types/typeUtil.js')
  , Expectation = require('./Expectation.js')
  , ArgumentsType = require('../types/ArgumentsType.js')
  , FunctionType = require('../types/FunctionType.js')
  , FunctionExpression  =require('../expressions/FunctionExpression.js')
  , Type = require('../types/Type.js')
  , Expression = require('../expressions/Expression.js')
  , UnionType = require('../types/UnionType.js')
  , RecordType = require('../types/RecordType.js')
  , verbosityLevels = require('../verbosityLevels.js')
  , IsolateExpression = require('../expressions/IsolateExpression.js')
  , Solver = require('./Solver.js')
  , traversalUtil = require('./traversalUtil.js')
  , tap = require('../tap.js')
  , TestResults = require('./TestResults.js')
  , ValueExpression = require('../expressions/ValueExpression.js')
  , Assignment = require('./Assignment.js')
  , AmbiguousBuildingBlockUsage = require('../AmbiguousBuildingBlockUsage.js')
  , ExpressionArgument = require('../expressions/ExpressionArgument.js')
  , BuildingBlockUsage = require('./BuildingBlockUsage.js')
  , MatchExpression = require('../expressions/MatchExpression.js')
  , objectConstructor = require('../NativeConstructor.js').objectConstructor
  , ObjectCreateExpression = require('../expressions/ObjectCreateExpression.js')
  , ConstructorExpression = require('../expressions/ConstructorExpression.js')
  , MemberExpression = require('../expressions/MemberExpression.js')
  , MemberUpdateExpression = require('../expressions/MemberUpdateExpression.js')
  , UnionType = require('../types/UnionType.js')
  , CallExpression = require('../expressions/CallExpression.js')
  , MemberCallExpression = require('../expressions/MemberCallExpression.js')
  , nativeTypes = require('../types/nativeTypes.js')
  , EachMock = require('./EachMock.js')
  , EachAssignmentMock = require('./EachAssignmentMock.js')
  , Requirement = require('../Requirement.js')
  , ScenarioSignature = require('./ScenarioSignature.js')
  , evalUtil = require('../evalUtil.js')

var AssignedVariableExpression = require(
  '../expressions/AssignedVariableExpression.js')

var RecursiveCallExpression = require(
  '../expressions/RecursiveCallExpression.js')

var SpecificationCallExpression = require(
  '../expressions/SpecificationCallExpression.js')

var MatchArgumentExpression = require(
  '../expressions/MatchArgumentExpression.js')

function Specification(name) {
  this.name = name || null
  this.expressions = []
  this.scenarios = []
  this.recordTypesBySignature = {}
  this.useUnions = []
  this.useMatches = []
  this.memberBuildingBlocks = []
  this.memberCallBuildingBlocks = []
  this.objectCreateBuildingBlocks = []
  this.useFunctions = []
  this.specificationBuildingBlocks = []
  this.assignmentBuildingBlocks = []
  this.memberUpdateBuildingBlocks = []
  this.ignoredTypes = []
  this.wildcardBuildingBlocks = {}
  this.sharedMocks = []
  this.callingFile = util.getCallingFile()
  this.outputFile = util.getOutputFile()
  this.isSpecification = true
  this.options = util.inherit({}, fileContext.getFileOptions())
  this.beforeEachCallback = function() {}
  this.beforeAllCallback = function() {}
  this.afterEachCallback = function() {}
  this.afterAllCallback = function() {}
}

Specification.prototype.resolveBuildingBlock = function(buildingBlock) {
  var self = this
  if(buildingBlock instanceof AmbiguousBuildingBlockUsage)
    throw new Error(buildingBlock.toString())
  if(buildingBlock instanceof ExpressionArgument)
    return self.resolveBuildingBlock(buildingBlock.expression)
  if(buildingBlock instanceof Expression)
    return [buildingBlock.resolveType(self.recordTypesBySignature)]
  if(buildingBlock instanceof Array)
    return buildingBlock.map(function(u) {
      return self.resolveBuildingBlock(u)
    })
  var buildingBlocks = require('../buildingBlocks.js')
  var nameMatches = util.
    flatten(Object.keys(buildingBlocks).
    filter(function(l) {
      return l === buildingBlock
    }).map(function(u) {
      return self.resolveBuildingBlock(buildingBlocks[u])
    }))
  if(nameMatches.length) return nameMatches
  tap.comment('Unable to resolve ' + buildingBlock, buildingBlock)
  throw new Error('Unable to resolve ' + buildingBlock)
}

Specification.prototype.getType = function() {
  return this.solution ?
    this.solution.type :
    this.inferFunctionType()
}

Specification.prototype.getChildSpecs = function() {
  var baseBuildingBlock =
      this.base && this.base.isSpecification && this.base.isConstructor ?
      [this.base] : []
  var specs = this.specificationBuildingBlocks.concat(baseBuildingBlock)
  return specs
}

Specification.prototype.instantiate = function() {
  throw new Error('Cannot instantiate a non-constructor specification ' +
    this.name)
}

Specification.prototype.setOptions = function(options) {
  this.options = util.mixin(this.options, options)
}

Specification.prototype.createScenario = function(args) {
  var scenario = new Scenario(this, args)
  this.sharedMocks.forEach(function(sm) {
    sm.addToScenario(scenario)
  })
  this.scenarios.push(scenario)
  return scenario
}

Specification.prototype.given = function() {
  var self = this
  return DeferredApiCall.callChildren(arguments, function() {
    if(!arguments.length)
      throw new Error(self.name +
        ': given must take parameters; use givenNoArgs instead')
    return self.createScenario([].slice.apply(arguments))
  })
}

Specification.prototype.givenNoArgs = function() {
  var self = this
  return DeferredApiCall.callChildren(arguments, function() {
    if(arguments.length)
      throw new Error(self.name +
        ': givenNoArgs cannot take parameters; use given instead')
    return self.createScenario([])
  })
}

Specification.prototype.when = function() {
  var self = this
  return DeferredApiCall.callChildren(arguments, function() {
    if(arguments.length) throw new Error('Invalid arguments')
    var signature = new ScenarioSignature(self)
    return signature
  })
}

Specification.prototype.defaultMock = function(fn) {
  this.defaultMockFn = fn
}

Specification.prototype.mockEach = function(target, value) {
  var self = this
  return DeferredApiCall.callChildren(arguments, function(target, value) {
    // TODO resolveType
    var mock = target instanceof Assignment ?
      new EachAssignmentMock(self, target, value) :
      new EachMock(self, target)
    self.scenarios.forEach(function(s) {
      mock.addToScenario(s)
    })
    self.sharedMocks.push(mock)
    return mock
  })
}

Specification.prototype.beforeEach = function(fn) {
  this.beforeEachCallback = fn
}

Specification.prototype.afterEach = function(fn) {
  this.afterEachCallback = fn
}

Specification.prototype.beforeAll = function(fn) {
  this.beforeAllCallback = fn
}

Specification.prototype.afterAll = function(fn) {
  this.afterAllCallback = fn
}

Specification.prototype.toCode = function() {
  return this.solution.code
}

Specification.prototype.use = function() {
  var self = this
  return DeferredApiCall.callChildren(arguments, function() {
    var args = [].slice.apply(arguments)
    args = args.filter(function(arg) {
      if(arg instanceof Assignment) {
        self.assignmentBuildingBlocks.push(arg)
        return false
      }
      if(arg instanceof Specification) {
        self.specificationBuildingBlocks.push(arg)
        return false
      }
      return true
    })
    var resolved = util.flatten(args.map(function(arg) {
      return self.resolveBuildingBlock(arg)
    }))
    self.expressions = self.expressions.concat(resolved)
    return new BuildingBlockUsage(self)
  })
}

Specification.prototype.resolveType = function(type) {
  return typeUtil.resolveType(type, this.recordTypesBySignature)
}

Specification.prototype.ignore = function() {
  var self = this
  var args = [].slice.apply(arguments).map(function(a) {
    return self.resolveType(a)
  })
  this.ignoredTypes = this.ignoredTypes.concat(args)
}

Specification.prototype.shouldReturn = function(expectedValue) {
  if(!(this instanceof Scenario))
    throw new Error('shouldReturn should be called on a scenario')
  var desc = 'should return ' + util.toFriendlyInlineString(expectedValue)
    , recs = this.specification.recordTypesBySignature
    , type = typeUtil.jsObjToType(expectedValue, recs)
    , expectation = new Expectation(type)
    , isCtor = this.specification.isConstructor
  expectation.as(desc)
  expectation.returnFn = function(actual) {
    return util.equals(
      expectedValue instanceof Specification ?
        expectedValue.solution.fn :
        expectedValue,
      actual)
  }
  this.expectations.push(expectation)
}

Specification.prototype.inferArgLength = function() {

  var self = this
    , argLength = null

  self.scenarios.forEach(function(scenario, index) {
    if(argLength !== null && scenario.condition.length != argLength)
      throw new Error(
        self.name + ' scenario ' + (index + 1) + ' has the wrong arg count')
    argLength = scenario.condition.length
  })

  return argLength || 0
}

Specification.prototype.inferArgType = function(index) {

  if(index === undefined) {
    var argLength = this.inferArgLength()
      , argTypes = []
    for(var i = 0; i < argLength; i++)
      argTypes.push(this.inferArgType(i))
    return new ArgumentsType(argTypes)
  }

  function inferArgTypeAtIndex(scenario) {
    return scenario.inferArgType(index)
  }

  var argType = typePlaceholder
    , argTypesAtEachIndex = this.scenarios.map(inferArgTypeAtIndex)
    , union = typeUtil.addTypes(argTypesAtEachIndex)
    , result = this.resolveType(union)

  return result
}

Specification.prototype.expandVars = function(variable, vars) {

  var self = this
  if(variable === undefined)
    throw new Error('variable is undefined')

  if(typeof variable === 'string')
    throw new Error('string not allowed: ' + variable)

  if(variable instanceof Type) {

    // Ensure types are traversed once:
    var alreadyAdded = vars.filter(function(v) {
      return v instanceof Type &&
        v.isSpecificationType === variable.isSpecificationType &&
        v.equals(variable)
    }).length
    if(alreadyAdded) return
    vars.push(variable)

    // Handle wildcards for function types:
    if(variable instanceof FunctionType && !variable.isSpecificationType) {
      // Handle 'calls' wildcard:
      if(self.wildcardBuildingBlocks.calls) {
        var callEx = new CallExpression(variable)
        self.expandVars(callEx, vars)
        self.expandedWildcardBuildingBlocks.calls = false
      }
      // Handle 'functionExpressions' wildcard:
      if(self.wildcardBuildingBlocks.functionExpressions) {
        //var fnEx = new FunctionExpression('fn', variable)
        //self.expandVars(fnEx, vars)
        self.expandedWildcardBuildingBlocks.functionExpressions = false
      }
    }

    // Handle wildcards for unions:
    if(variable instanceof UnionType) {
      // Handle 'matches' wildcard:
      if(self.wildcardBuildingBlocks.matches) {
        var matchExpression = new MatchExpression(variable.children)
        self.expandVars(matchExpression, vars)
        self.expandedWildcardBuildingBlocks.matches = false
      }
    }

    // Handle records:
    if(variable instanceof RecordType) {

      // Handle createObject expressions:
      var isObjectCtor = variable.ctor === objectConstructor
      if(self.wildcardBuildingBlocks.objectCreates && isObjectCtor) {
        var newExpression = new ObjectCreateExpression(variable)
        self.expandVars(newExpression, vars)
        self.expandedWildcardBuildingBlocks.objectCreates = false
      } else {
        var signature = variable.getSignature()
        self.expandedObjectCreateBuildingBlocks.slice().forEach(function(ur) {
          // Handle ObjectCreateExpression:
          if(ur !== signature) return
          var newExpression = new ObjectCreateExpression(variable)
          self.expandVars(newExpression, vars)
          util.remove(self.expandedObjectCreateBuildingBlocks, ur)
        })
      }

      // Handle MemberExpression:
      if(self.wildcardBuildingBlocks.members)
        variable.children.forEach(function(prop) {
          var memberExpression = new MemberExpression(prop)
          self.expandVars(memberExpression, vars)
          self.expandedWildcardBuildingBlocks.members = false
        })
      else
        self.expandedMemberBuildingBlocks.slice().forEach(function(um) {
          variable.children.forEach(function(prop) {
            if(um.name !== prop.name) return
            if(um.record && um.record !== variable) return
            util.remove(self.expandedMemberBuildingBlocks, um)
            var memberExpression = new MemberExpression(prop)
            self.expandVars(memberExpression, vars)
          })
        })

      // Handle MemberUpdateExpression:
      self.expandedMemberUpdateBuildingBlocks.slice().forEach(function(mu) {
        // Check if the record is correct:
        if(mu.record && mu.record !== variable) 
          return tap.comment('record mismatch')
        // Check if every update member is in the record:
        var propNames = util.pluck(variable.children, 'name')
        var allPresent = mu.names.filter(function(updateMemberName) {
          return propNames.indexOf(updateMemberName) >= 0
        }).length === mu.names.length
        if(!allPresent) return
        util.remove(self.expandedMemberUpdateBuildingBlocks, mu)
        var memberUpdateExpression = new MemberUpdateExpression(
          variable, mu.names)
        self.expandVars(memberUpdateExpression, vars)
      })

      // Handle MemberCallExpression:
      if(self.wildcardBuildingBlocks.memberCalls)
        variable.children.forEach(function(prop) {
          if(!(prop.type instanceof FunctionType)) return
          var callEx = new MemberCallExpression(variable, prop)
          self.expandVars(callEx, vars)
          self.expandedWildcardBuildingBlocks.memberCalls = false
        })
      else
        self.expandedMemberCallBuildingBlocks.slice().forEach(function(um) {
          variable.children.forEach(function(prop) {
            if(!(prop.type instanceof FunctionType)) return
            if(um.name !== prop.name) return
            if(um.record && um.record !== variable) return
            util.remove(self.expandedMemberCallBuildingBlocks, um)
            var expr = new MemberCallExpression(variable, prop)
            self.expandVars(expr, vars)
          })
        })
    }

    // Traverse descendants:
    var descendants = variable.getDescendants()
    descendants.forEach(function(d) {
      self.expandVars(d, vars)
    })

    return vars
  }

  if(variable instanceof Expression) {
    if(vars.indexOf(variable) >= 0) return
    vars.push(variable)
    variable.args.forEach(function(arg) {
      if(!arg.type) throw new Error('missing arg type')
      self.expandVars(arg.type, vars)
    })
    if(!variable.type) throw new Error('missing variable type')
    self.expandVars(variable.type, vars)
    variable.bindingTypes.forEach(function(bt) {
      self.expandVars(bt, vars)
    })
    return vars
  }

  if(variable instanceof Array) {
    variable.slice(0).forEach(function(v) {
      self.expandVars(v, vars)
    })
    return vars
  }

  if(variable === typePlaceholder)
    throw new Error('Unable to resolve record type.')

  tap.comment('Unexpected', variable)
  throw new Error('Unexpected variable of type ' + typeof variable + '.')
}

Specification.prototype.inferReturnType = function(inputFilterTypes) {

  function scenarioFilter(scenario) {
    if(!inputFilterTypes) return true
    var argLength = scenario.condition.length
      , hasContext = 'thisArg' in scenario
      , inputLength = hasContext ? argLength + 1 : argLength
    for(var a = 0; a < inputFilterTypes.length; a++) {
      var typeFilters = {}
      var inputTypeAtIndex = hasContext && a === argLength ?
        scenario.inferContextType() :
        scenario.inferArgType(a)
      var containsType = inputFilterTypes[a].containsType(
        inputTypeAtIndex, typeFilters)
      if(!containsType) return false
    }
    return true
  }

  function inferScenarioReturnType(scenario) {
    return scenario.inferReturnType()
  }

  var self = this
    , call = Function.prototype.call
    , filteredScenarios = this.scenarios.filter(scenarioFilter)

  if(inputFilterTypes && !filteredScenarios.length)
    throw new Error(
      'Unable to find scenario taking: ' + inputFilterTypes.join(', '))

  var scenarioTypes = filteredScenarios.map(inferScenarioReturnType)
    , union = typeUtil.addTypes(scenarioTypes)

  if(union === typePlaceholder)
    return nativeTypes.undefinedType

  return this.resolveType(union)
}

Specification.prototype.inferContextType = function() { 

  function inferScenarioContextType(scenario) {
    return scenario.inferContextType()
  }

  var self = this
    , scenarioTypes = this.scenarios.map(inferScenarioContextType)
    , union = typeUtil.addTypes(scenarioTypes.filter(util.identity))

  if(union === typePlaceholder)
    return null

  var result = this.resolveType(union)
  //console.log(this.name + ' result ' + result.toLongString())
  //console.log(Object.keys(this.recordTypesBySignature))
  return result
}

Specification.prototype.inferFunctionType = function() {
  var returnType = this.inferReturnType()
    , argType = this.inferArgType()
    , contextType = this.inferContextType()
    , result = new FunctionType(argType, returnType, this.name)
  if(contextType) result.takesContext(contextType)
  return result
}

Specification.prototype.test = function(fn, mocksContainers, suppressRethrow) {
  if(arguments.length < 3)
    suppressRethrow = this.determineWhetherToSuppressRethrows()
  return new TestResults(
    this, {}, this.scenarios, fn, mocksContainers, suppressRethrow)
}

Specification.prototype.logSuccess = function(cached) {
  if(!this.solution)
    throw new Error('logSuccess called on an unsolved specification: ' + this)
  tap.logTest(this.solution.test, cached)
}

Specification.prototype.logFailure = function() {
  if(this.solution)
    throw new Error('logFailure called on a solved specification: ' + this)
  tap.logTest(this.test(null, null))
}

Specification.prototype.toString = function() {
  return this.name + ' : ' + this.getType()
}

Specification.prototype.determineWhetherToSuppressRethrows = function() {
  if(this.options.allowErrors) return true
  return this.scenarios.filter(function(s) {
    return s.expectations.filter(function(e) {
      return 'throwFn' in e
    }).length
  }).length
}

function addMatchArgExpressions(
  inputTypes, parent, inputIndex, refinedTypes,
  childIndex, fnReturnType, target) {

  if(inputIndex > inputTypes.length) return

  var inputType = inputTypes[inputIndex]
  if(!(inputType instanceof UnionType)) {
    var nextRefinement = refinedTypes.concat([inputType])
    return addMatchArgExpressions.call(this,
      inputTypes, parent, inputIndex + 1, nextRefinement, childIndex,
      fnReturnType, target)
  }

  var argName = 'arg' + inputIndex
    , returnType = this.inferReturnType(refinedTypes)

  var childMatches = []
  for(var c = 0; c < inputType.children.length; c++) {
    var childType = inputType.children[c]
      , childRefinedArgTypes = refinedTypes.concat([childType])
      , childReturnType = this.inferReturnType(childRefinedArgTypes)
    childMatches.push({
      childRefinedArgTypes: childRefinedArgTypes,
      childReturnType: childReturnType
    })
  }

  var childReturnTypes = util.pluck(childMatches, 'childReturnType')
  var matchExpression =  new MatchArgumentExpression(
    inputType, childReturnTypes, inputIndex, childIndex,
    parent, returnType)
  target.push(matchExpression)

  for(var cm = 0; cm < childMatches.length; cm++) {
    var childRefinedArgTypes = childMatches[cm].childRefinedArgTypes
      , childReturnType = childMatches[cm].childReturnType
    addMatchArgExpressions.call(
      this, inputTypes, matchExpression,
      inputIndex + 1, childRefinedArgTypes, cm, childReturnType, target)
  }
}

Specification.prototype.solve = function(cachedSearchPath) {

  var self = this

  function comment() {
    if(cachedSearchPath) return // Dont log when trying the cache
    tap.comment.apply(tap, arguments)
  }

  if(!self.scenarios.length) {
    comment('No scenarios supplied for ' + self.name)
    return null
  }

  // Read fileContext:
  var options = util.inherit({}, self.options)
  if(options.searchPath instanceof Function)
    options.searchPath = util.getFunctionComment(options.searchPath)
  var searchPath = cachedSearchPath ?
    cachedSearchPath.join('\n') :
    options.searchPath

  self.solution = null
  self.solveAttempted = true

  var conditionSpecs = util.arrayOfType(
    util.flatten(
      util.pluck(self.scenarios, 'condition')),
    Specification)
  for(var cs = 0; cs < conditionSpecs.length; cs++)
    if(!conditionSpecs[cs].solution) {
      comment('Missing solution for ' + conditionSpecs[cs])
      return null
    }
  var assignmentSpecs = util.pluck(self.assignmentBuildingBlocks, 'spec')
  for(var as = 0; as < assignmentSpecs.length; as++)
    if(!assignmentSpecs[as].solution) {
      comment('Missing solution for ' + assignmentSpecs[cs])
      return null
    }
  var childSpecs = util.unique(self.getChildSpecs().concat(conditionSpecs))
  for(var sbb = 0; sbb < childSpecs.length; sbb++)
    if(!childSpecs[sbb].solution) {
      comment('Missing solution for ' + childSpecs[sbb])
      return null
    }

  self.expandedWildcardBuildingBlocks = util.copy(self.wildcardBuildingBlocks)
  self.expandedMemberCallBuildingBlocks = self.memberCallBuildingBlocks.slice()
  self.expandedMemberBuildingBlocks = self.memberBuildingBlocks.slice()
  self.expandedObjectCreateBuildingBlocks =
    self.objectCreateBuildingBlocks.slice()
  self.expandedMemberUpdateBuildingBlocks =
    self.memberUpdateBuildingBlocks.slice()

  // Resolve child types
  var canResolveAll = true
    , resolvedChildMap = {} // TODO remove?
  function resolveChildSpecType(specName, childType) {
    var childRecords = util.arrayOfType(childType.getDescendants(), RecordType)
    childRecords.forEach(function(cr) {
      var childRecordSignature = cr.getSignature()
        , ownRecord = self.recordTypesBySignature[childRecordSignature]
      if(!ownRecord) return
      if(ownRecord.toLongString() !== cr.toLongString()) {
        comment('Record mismatch for ' + cr.toShortString())
        comment('  ' + specName + ' record type: ' + cr.toLongString())
        comment('  ' + self.name + ' record type: ' + ownRecord.toLongString())
        canResolveAll = false
      }
    })
    return self.resolveType(childType)
  }
  var specExpressions = self.specificationBuildingBlocks.
    map(function(spec) {
      var resolvedType = resolveChildSpecType(spec.name, spec.getType())
      Object.defineProperty(
        resolvedChildMap,
        spec.name,
        { value: resolvedType })
      return new SpecificationCallExpression(
        spec.name,
        resolvedType,
        spec.isConstructor)
    })
  var assignedVariableExpressions = self.assignmentBuildingBlocks.
    map(function(assn) {
      var resolvedType = resolveChildSpecType(
        assn.spec.name,
        assn.spec.getType().returnType)
      Object.defineProperty(
        resolvedChildMap,
        assn.spec.name,
        { value: resolvedType })
      return new AssignedVariableExpression(assn.name, resolvedType)
    })
  if(!canResolveAll)
    return null

  // Create the root expression
  var genericFnType = self.inferFunctionType()
    , fnType = typeUtil.instantiateTypeParameters(genericFnType)
  var fnEx = self.isConstructor ?
    fnEx = new ConstructorExpression(self) :
    fnEx = new FunctionExpression(self.name, fnType)

  var recCall = []
  if(self.recursion) {
    recCall.push(new RecursiveCallExpression(fnType, self.name, fnEx))
  }
  fnType.isSpecificationType = true
  fnEx.type.isSpecificationType = true

  var numThisBound = self.scenarios.filter(function(s) {
    return s.thisArg
  }).length
  if(numThisBound && numThisBound !== self.scenarios.length) {
    comment('Scenarios inconsistently specified with context')
    return null
  }

  var matchArgExpressions = []
  if(self.useArgumentsMatch) {
    var inputTypes = genericFnType.getInputTypes()
      , unionInputTypes = util.arrayOfType(inputTypes, UnionType)
      , scenarioTypes = util.pluck(unionInputTypes, 'children')
    addMatchArgExpressions.call(this, inputTypes,
      fnEx, 0, [], 0, genericFnType.returnType, matchArgExpressions)
  }

  var scopeVars = [fnType, fnEx].
    concat(self.expressions).
    concat(matchArgExpressions).
    concat(recCall).
    concat(specExpressions).
    concat(assignedVariableExpressions)

  self.status = 'exceeded maxAstNodes'

  var expandedVars = self.expandVars(scopeVars, [])
    , expressions = util.arrayOfType(expandedVars, Expression)
    , types = util.arrayOfType(expandedVars, Type)
    , start = +(new Date())
    , c = 0
    , traversalUnused = expressions.slice()
    , solutionUnused = null

  if(options.verbosity >= verbosityLevels.scope) {
    comment()
    comment(self.name + '.solve :', fnType.toString())
    comment('  ' + types.length, 'types:')
    types.forEach(function(t) { comment('    ', t.toString()) })
    comment('  ' + expressions.length, 'expressions:')
    expressions.forEach(function(e) { comment('    ', e.toString()) })
  }

  // Gather expression requirements
  var flatExpressionRequirements =
    util.flatten(util.pluck(expressions, 'requirements'))
  var groupedExpressionRequirements =
    util.groupBy(flatExpressionRequirements, function(r) {
      return r.filename
    })
  var expressionRequirements =
    Object.keys(groupedExpressionRequirements).map(function(key) {
      return groupedExpressionRequirements[key][0]
    })
  var testReqCode = expressionRequirements.map(function(r) {
    return 'var ' + r.alias + ' = require(' + JSON.stringify(r.filename) + ')'
  }).join('\n') + '\n'

  // Gather non-expression requirements
  var foundDeps = true
  var nonExpressionRequirements = childSpecs.
    concat(self.assignmentBuildingBlocks).
    filter(function(dep) {
      return dep.callingFile !== self.callingFile
    }).map(function(dep) {
      var ijsObject = require(dep.callingFile)
        , path = util.findObjectPath(ijsObject, dep)
      if(path === undefined) {
        comment('Failed to find ' + dep + ' in exports for ' + dep.callingFile)
        foundDeps = false
      }
      var objPath = (path || []).join('.')
      return new Requirement(
        dep.name, dep.alias, true, dep.outputFile, null, objPath)
    })
  if(!foundDeps) return false

  // The main function expression shouldn't be reconstructed inside the body:
  expressions = expressions.filter(function(e) { return e !== fnEx })

  if(self.expandedWildcardBuildingBlocks.objectCreates) {
    comment('"objectCreates" wildcard specified but not used in ' + self.name)
    return null
  }
  if(self.expandedObjectCreateBuildingBlocks.length) {
    comment('"objectCreate" expression specified for absent records in "' +
      self.name + '":')
    self.expandedObjectCreateBuildingBlocks.forEach(function(r) {
      comment('  ' + r)
    })
    return null
  }

  if(self.expandedWildcardBuildingBlocks.members) {
    comment('"members" wildcard specified but not used in ' + self.name)
    return null
  }
  if(self.expandedMemberBuildingBlocks.length) {
    comment(
      'Members specified for absent records in "' + self.name + '":')
    self.expandedMemberBuildingBlocks.forEach(function(r) {
      comment('  ' + r.name + ' ' + (r.record || ''))
    })
    return null
  }

  if(self.expandedWildcardBuildingBlocks.memberCalls) {
    comment('"memberCalls" wildcard specified but not used in ' +
      self.name)
    return null
  }
  if(self.expandedMemberCallBuildingBlocks.length) {
    comment(
      '"memberCall" specified for absent records in "' + self.name + '":')
    self.expandedMemberCallBuildingBlocks.forEach(function(r) {
      comment('  ' + r + ' ' + (r.record || ''))
    })
    return null
  }

  if(self.expandedMemberUpdateBuildingBlocks.length) {
    comment(
      '"memberUpdate" specified for absent records in "' + self.name + '":')
    self.expandedMemberUpdateBuildingBlocks.forEach(function(r) {
      comment('  ' + r.names.join(', ') + ' ' + (r.record || ''))
    })
    return null
  }

  if(self.expandedWildcardBuildingBlocks.calls) {
    comment('"calls" wildcard specified but not used in ' +
      self.name)
    return null
  }

  if(self.expandedWildcardBuildingBlocks.functionExpressions) {
    comment('"functionExpressions" wildcard specified but not used in ' +
      self.name)
    return null
  }

  if(self.expandedWildcardBuildingBlocks.matches) {
    comment('"matches" wildcard specified but not used in ' +
      self.name)
    return null
  }

  // Create collections that we will add to as we travers
  var sandboxedSpecCode = []
    , mocksContainer = { scenarioMocks: {} }
    , mocksContainers = [mocksContainer]

  // Validation
  var nameValidation = {}
    , namesAreValid = true
  function validateName(obj) {
    var existing = nameValidation[obj.name]
    if(!existing) {
      nameValidation[obj.name] = obj
      return
    }
    if(nameValidation[obj.name] === obj)
      return
    comment('Name appears twice: ' + obj.name)
    namesAreValid = false
  }

  // Validate mocks & traverse children
  var allMocks = util.
    flatten(util.pluck(self.scenarios, 'mocks').
    map(util.values))
  var mockValidations = {}
  allMocks.forEach(function(m) {
    mockValidations[m.getExpressionName()] = false
  })

  var areDependenciesValid = true
  function validateIsolateExpressions(exprs) {
    util.arrayOfType(exprs, IsolateExpression).forEach(function(ie) {
      if(!(ie.name in mockValidations)) {
        comment('Unable to find mock for isolate expression ' + ie)
        areDependenciesValid = false
        return
      }
      mockValidations[ie.name] = true
    })
  }
  function validateAssignments(assns) {
    assns.forEach(function(a) {
      validateName(a)
      if(!(a.name in mockValidations)) {
        comment('Unable to find mock for assignment ' + a)
        areDependenciesValid  = false
        return
      }
      // resolvedChildMap[a.name]
      mockValidations[a.name] = true
    })
  }
  function validateSubspecs(subspecs) {
    subspecs.forEach(function(ss) {
      ;[].push.apply(mocksContainers, ss.solution.mocksContainers)
      validateName(ss)
      sandboxedSpecCode +=
        'var ' + ss.name + ' = (function() {\n' +
        '  var termCheck = 0\n' +
        '  return ' + ss.solution.fn.toString() + '\n' +
        '}())\n\n'
      var mockName = ss.isConstructor ?
        'new ' + ss.name : ss.name + '.call'
      if(mockName in mockValidations) {
        mockValidations[mockName] = true
        // resolvedChildMap[a.name]
        return
      }
      validateIsolateExpressions(ss.solution.expressions)
      validateAssignments(ss.assignmentBuildingBlocks)
      validateSubspecs(ss.getChildSpecs())
    })
  }

  validateIsolateExpressions(expressions)
  validateAssignments(self.assignmentBuildingBlocks)
  validateSubspecs(childSpecs)
  var areMocksValid = true
  Object.keys(mockValidations).forEach(function(name) {
    if(!mockValidations[name]) {
      areMocksValid = false
      comment('Unable to find target of mock: ' + name)
    }
  })
  if(!namesAreValid || !areDependenciesValid)
    return null

  // Assemble code:
  var getCodeToTest = function(body) {
    return testReqCode + sandboxedSpecCode + [
      ';(function() {',
      '  var termCheck = 0',
      '  return ' + body,
      '})()'
    ].join('\n')
  }

  // Determine whether to suppress rethrows during traversal
  var suppressRethrow = self.determineWhetherToSuppressRethrows()

  // Timeout check:
  function isTimedOut() {
    return options.timeout && +(new Date()) - start > options.timeout
  }

  // Perform traversal.
  while(!self.solution && (c++ < options.maxAstNodes || !options.maxAstNodes)) {

    // Evaluate each complete traversal.
    var onTraversal = function(traversal, len, typeFilterList) {

      if(isTimedOut()) {
        self.status = 'timeout'
        return 'timeout'
      }

      if(len !== c) return null

      if(searchPath) {
        var traversalStr = traversalUtil.toString(traversal)
        if(
          searchPath.indexOf(traversalStr) < 0 &&
          traversalStr.indexOf(searchPath) < 0) {
          return null
        }
      }

      var ast = traversalUtil.toAst(traversal)

      if(options.verbosity >= verbosityLevels.candidate) {
        comment()
        comment('~ program ~')
        comment(ast.toString())
      }

      var codeToTest = getCodeToTest(ast.expr.toCode(
        ast.children,
        ast.varCount,
        options.termCheck))

      try {
        var fn = evalUtil(codeToTest, mocksContainer)
      } catch(err) {
        self.status = 'parse error'
        comment('==== code: ===')
        comment(codeToTest)
        comment('=== error: ===')
        comment(err)
        throw new Error('Unable to parse code')
      }

      try {
        var test = self.test(fn, mocksContainers, suppressRethrow)
      } catch(err) {
        if(options.verbosity < verbosityLevels.candidate)
          comment(ast.toString())
        comment()
        comment(err)
        comment(
          util.prettify(
            ast.expr.toCode(ast.children, ast.varCount, 0),
            options.escodegen))
        self.status = 'error'
        throw err
      }

      var oks = util.pluck(test.results, 'ok')
        , ok = oks.reduce(function(x, y) { return x && y })

      if(traversalUnused.length)
        traversalUnused = filterUnusedExpressions(traversalUnused, ast)

      if(!ok) {
        if(options.verbosity >= verbosityLevels.test) {
          comment(test.toString(null))
        }
        if(options.verbosity >= verbosityLevels.candidate)
          comment(
            util.prettify(
              ast.expr.toCode(ast.children, ast.varCount, 0),
              options.escodegen))
        if(options.verbosity >= verbosityLevels.candidateSandboxed)
          comment(util.prettify(codeToTest, options.escodegen))
        return null
      }

      self.status = 'solved'
      solutionUnused = filterUnusedExpressions(expressions, ast)

      var prettified = ast.expr.toCode(ast.children, ast.varCount, 0)

      if(options.verbosity >= verbosityLevels.solution) {
        comment(prettified)
      }

      if(
        options.verbosity >= verbosityLevels.solutionAst &&
        options.verbosity < verbosityLevels.candidateAst) {
        comment(ast.toString())
      }

      // Found a solution.
      // Return it.
      return {
        ast: traversalUtil.toString(traversal).split('\n'),
        expressionRequirements: expressionRequirements,
        code: prettified,
        mocksContainers: mocksContainers,
        expressions: expressions,
        fn: fn,
        test: test
      }
    }

    if(isTimedOut()) {
      self.status = 'timeout'
      break
    }

    if(options.verbosity >= verbosityLevels.astNodes)
      comment('searching AST level', c)

    var solver = new Solver(c, self.ignoredTypes,
      'functionExpressions' in self.wildcardBuildingBlocks, options)

    self.solution = solver.traverse({
      expressions: util.arrayToList(util.values(expressions)),
      types: util.arrayToList(util.values(types)),
      varCounter: 0,
      node: fnEx,
      parent: null,
      typeFilterList: null,
      parentNode: { id: 0 },
      childIndex: 0,
      len: 0,
      cont: onTraversal
    })

    if(self.solution === 'timeout')
      self.solution = null

    if(!self.solution && !solver.unexploredPaths) {
      self.status = 'unsolvable'
      break
    }

    if(self.solution)
      self.solution.type = genericFnType
  }

  if(self.solution && solutionUnused.length) {
    // Can use tap.comment instead of just comment
    // because we want these warnings to show up even if the cached
    // solution is valid.
    tap.comment('WARNING', self.name,
      'expressions specified but absent from solve:')
    solutionUnused.forEach(function(u) {
      tap.comment('  ' + u)
    })
  } else if(!self.solution && traversalUnused.length) {
    comment('WARNING', self.name, 'untraversed expressions:')
    traversalUnused.forEach(function(u) {
      comment('  ' + u)
    })
  }

  if(self.solution) {
    var contents = fileContext.getFileContents()
    contents.addName(self.name, self)
    contents.blocks.push(self.toCode())
    contents.addRequirements(expressionRequirements)
    contents.addRequirements(nonExpressionRequirements)
    fileContext.cacheNewSolutionAst(self.name, self.solution.ast)
  }

  return self.solution
}

function filterUnusedExpressions(unused, ast) {
  var self = this
  unused = unused.filter(function(ex) {
    var isValue =
      ex instanceof ValueExpression &&
      ast.expr instanceof ValueExpression
    var typeFilters = {}
      , isProtoExpressionOf = ast.expr.isDerivedFrom(ex)
      , sameTemplate = ex.template === ast.expr.template
      , used = isValue ? sameTemplate : isProtoExpressionOf
      , result = !used
    return result
  })
  return ast.children.reduce(function(prev, current) {
    return filterUnusedExpressions(prev, current)
  }, unused)
}

module.exports = Specification
