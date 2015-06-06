'use strict'

var util = require('../util.js')
  , typeUtil = require('../types/typeUtil.js')
  , Expectation = require('./Expectation.js')
  , nativeTypes = require('../types/nativeTypes.js')
  , FunctionType = require('../types/FunctionType.js')
  , ArgumentsTupleType = require('../types/ArgumentsTupleType.js')
  , DeferredApiCall = require('../DeferredApiCall.js')
  , Assignment = require('./Assignment.js')
  , Mock = require('./Mock.js')
  , AssignmentMock = require('./AssignmentMock.js')

function Scenario(specification, condition) {
  if(!specification) throw new Error('specification required')
  var self = this
  Object.defineProperty(self, 'specification', { value: specification })
  self.condition = condition
  self.expectations = []
  self.mocks = {}
  self.beforeCallback = function() {}
  self.afterCallback = function() {}
  var signs = Object.keys(util.comparands)
  signs.forEach(function(sign) {
    var comparand = util.comparands[sign]
    self.shouldReturn[sign] = function(boundary) {
      var boundaryString = util.toFriendlyInlineString(boundary)
        , desc = sign + ' ' + boundaryString
      var expectation = new Expectation(boundary)
      expectation.as(desc)
      expectation.returnFn = function(actual) {
        return comparand(actual, boundary)
      }
      self.expectations.push(expectation)
    }
  })

  self.shouldReturn['~='] = function(value, precision) {
    function round(num) {
      var power = Math.pow(10, precision)
      return Math.floor(num * power) / power
    }
    precision = precision || 0
    if(typeof value !== 'number') throw new Error('should be a Number')
    if(typeof precision !== 'number') throw new Error('should be a Number')
    if(round(value) !== value) throw new Error('Value is at wrong precision')
    var desc = '~= ' + value + ' to ' + precision + ' places'
      , expectation = new Expectation(value)
    expectation.as(desc)
    expectation.returnFn = function(actual) {
      return round(actual) === value
    }
    self.expectations.push(expectation)
  }

  // Suport shouldNotReturn, etc.
  function getNegation(replaceFn, original) {
    return function() {
      original.apply(self, arguments)
      var lastAdded = self.expectations[self.expectations.length - 1]
      lastAdded.description =
        lastAdded.description.replace('should', 'should not')
      var originalReturnFn = lastAdded[replaceFn]
      lastAdded[replaceFn] = function() {
        return !originalReturnFn.apply(this, arguments)
      }
    }
  }

  ;[[ self, 'shouldNotReturn' , 'returnFn', self.shouldReturn  ],
    [ self, 'shouldNotSatisfy', 'returnFn', self.shouldSatisfy ],
    [ self, 'shouldNotThrow'  , 'throwFn' , self.shouldThrow   ]
  ].forEach(function(args) {
    args[0][args[1]] = getNegation(args[2], args[3])
  })

  ;['~='].concat(signs).forEach(function(sign) {
    self.shouldNotReturn[sign] =
      getNegation('returnFn', self.shouldReturn[sign])
  })
}

Scenario.prototype.as = function(desc) {
  this.expectations[this.expectations.length - 1].description = desc
}

Scenario.prototype.context = function(thisArg) {
  this.thisArg = thisArg
}

Scenario.prototype.mock = function(target, value) {
  var self = this
  return DeferredApiCall.callChildren(arguments, function(target, value) {
    if(!target.isSpecification &&
      !(target instanceof Assignment)) {
      target = util.single(self.specification.resolveBuildingBlock(target))
    }
    var mock
    if(self.mocks[target.name]) {
      mock = self.mocks[target.name]
      mock.scenario = self // TODO refactor to remove this mutation
      return mock
    }
    if(target instanceof Assignment) {
      if(arguments.length !== 2)
        throw new Error('Two args expected when mocking an assignment')
      mock = new AssignmentMock(self, target, value)
    } else {
      mock = new Mock(self, target)
      if(arguments.length !== 1)
        mock.callback(function() { return value })
    }
    self.mocks[mock.target.name] = mock
    return mock
  })
}

Scenario.prototype.getArgs = function() {
  return this.condition.map(function(c) {
    if(c && c.isSpecification)
      return c.solution.fn
    return c
  })
}

Scenario.prototype.getArgString = function() {
  var conditionStr = this.condition.length ?
    this.condition.map(util.toFriendlyInlineString).join(', ') : ''
  var bindStr = !('thisArg' in this) ? '' :
    '.bind(' + util.toFriendlyInlineString(this.thisArg) + ')'
  return bindStr + '(' + conditionStr + ')'
}

Scenario.prototype.calculateTypeSignature = function() {
  var typeFilters = {}
    , self = this
  return {
    returnType: this.calculateReturnType(typeFilters),
    contextType: this.calculateContextType(typeFilters),
    argTypes: this.condition.map(function(cond, index) {
      return self.calculateArgType(index, typeFilters)
    })
  }
}

Scenario.prototype.calculateContextType = function(typeFilters) {

  if(!('thisArg' in this)) {
    if(this.specification.hasSpecified.takesContext)
      throw new Error('Expect context in scenario ' + this)
    return null
  }

  var specifiedType = this.specification.hasSpecified.takesContext ?
    this.specification.fnType.contextType : null

  var result = typeUtil.jsObjToType(this.thisArg, specifiedType, typeFilters)

  return result
}

Scenario.prototype.calculateArgType = function(argIndex, typeFilters) {
  var specifiedType =
    this.specification.fnType.arg.children.length > argIndex ?
    this.specification.fnType.arg.children[argIndex] : null
  var result = typeUtil.jsObjToType(
    this.condition[argIndex],
    specifiedType,
    typeFilters)
  return result
}

Scenario.prototype.calculateReturnType = function(typeFilters) {
  var expectationExamples = this.getReturnTypeExamples()
  var specifiedType = this.specification.hasSpecified.returns ?
    this.specification.fnType.returnType : null
  var expectationTypes = expectationExamples.map(function(example) {
    return typeUtil.jsObjToType(example, specifiedType, typeFilters)
  })
  if(specifiedType && !expectationTypes.length) return specifiedType
  var distinct = typeUtil.distinctTypes(expectationTypes)
  if(!distinct.length) return null
  if(distinct.length > 1) {
    tap.comment('Unable to infer return type of ' + this)
    tap.comment('Try specifying a union or generic type using `returns`.')
    tap.comment('Return types (' + distinct.length + ')')
    distinct.forEach(function(type) { tap.comment('  ' + type) })
    throw new Error('Scenario ' + this +
      ' has ' + distinct.length + ' return types.')
  }
  return distinct[0]
}

Scenario.prototype.getReturnTypeExamples = function() {
  return util.pluck(
    this.expectations.filter(function(e) { return e.hasExample }),
    'example')
}

Scenario.prototype.shouldSatisfy = function(description, fn) {
  if(arguments.length === 1) {
    fn = description
    description = 'should satisfy constraint'
  }
  var expectation = new Expectation()
  expectation.as(description)
  expectation.returnFn = fn
  this.expectations.push(expectation)
}

Scenario.prototype.shouldThrow = function(description, fn) {
  if(arguments.length === 1) {
    fn = description
    description = 'should throw'
  }
  var expectation = new Expectation()
  expectation.as(description)
  if(typeof fn === 'string') {
    var msg = fn
    fn = function(err) {
      return err.message === msg
    }
  }
  expectation.throwFn = fn
  this.expectations.push(expectation)
}

Scenario.prototype.before = function(fn) {
  this.beforeCallback = fn
}

Scenario.prototype.after = function(fn) {
  this.afterCallback = fn
}

Scenario.prototype.shouldReturn = function(expectedValue) {

  if(this.specification.isConstructor) {
    if(!(expectedValue instanceof Object))
      throw new Error(
        'ConstructorSpecification only supports returning records')
    var constructedObj = new this.specification.fn()
    Object.keys(expectedValue).forEach(function(key) {
      constructedObj[key] = expectedValue[key]
    })
    expectedValue = constructedObj
  }

  var desc = 'should return ' + util.toFriendlyInlineString(expectedValue)
    , expectation = new Expectation(expectedValue)
    , isCtor = this.specification.isConstructor
  expectation.as(desc)
  expectation.returnFn = function(actual) {
    return util.equals(
      expectedValue && expectedValue.isSpecification ?
        expectedValue.solution.fn :
        expectedValue,
      actual)
  }
  this.expectations.push(expectation)
}

module.exports = Scenario
