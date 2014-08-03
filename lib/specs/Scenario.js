'use strict'

var typePlaceholder = require('../types/typePlaceholder.js')
  , util = require('../util.js')
  , typeUtil = require('../types/typeUtil.js')
  , Expectation = require('./Expectation.js')
  , nativeTypes = require('../types/nativeTypes.js')
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
  self.returnType = typePlaceholder
  self.mocks = {}
  self.beforeCallback = function() {}
  self.afterCallback = function() {}
  self.shouldReturn = function() {
    self.specification.shouldReturn.apply(self, arguments)
  }
  var signs = Object.keys(util.comparands)
  signs.forEach(function(sign) {
    var comparand = util.comparands[sign]
    self.shouldReturn[sign] = function(boundary) {
      var boundaryString = util.toFriendlyInlineString(boundary)
        , desc = sign + ' ' + boundaryString
        , recs = self.specification.recordTypesBySignature
        , type = typeUtil.jsObjToType(boundary, recs)
        , expectation = new Expectation(type)
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
      , recs = self.specification.recordTypesBySignature
      , expectation = new Expectation(nativeTypes.numberType)
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

Scenario.prototype.givenContext = function(thisArg) {
  this.thisArg = thisArg
}

Scenario.prototype.mock = function(target, value) {
  var self = this
  return DeferredApiCall.callChildren(arguments, function(target, value) {
    if(!target.isSpecification &&
      !(target instanceof Assignment)) {
      target = util.single(self.specification.resolveBuildingBlock(target))
    }
    if(self.mocks[target.name])
      return self.mocks[target.name]
    var mock
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

Scenario.prototype.inferArgType = function(argIndex) {
  var result = typeUtil.jsObjToType(
    this.condition[argIndex],
    this.specification.recordTypesBySignature)
  return result
}

Scenario.prototype.inferContextType = function() {
  return 'thisArg' in this ? typeUtil.jsObjToType(
    this.thisArg, this.specification.recordTypesBySignature) :
    null
}

Scenario.prototype.inferReturnType = function() {

  var self = this
    , recs = self.specification.recordTypesBySignature

  var call = Function.prototype.call
    , expectationTypes = util.pluck(this.expectations, 'type')
    , returnType = this.returnType
    , seedType = this.seedType ? [this.seedType] : []
    , typesToUnite = [returnType].concat(expectationTypes).concat(seedType)
    , union = typeUtil.addTypes(typesToUnite)

  return union
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

module.exports = Scenario
