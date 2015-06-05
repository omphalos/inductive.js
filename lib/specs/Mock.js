'use strict'

var typeUtil = require('../types/typeUtil.js')
  , util = require('../util.js')
  , DeferredApiCall = require('../DeferredApiCall.js')
  , Expectation = require('./Expectation.js')
  , IsolateExpression = require('../expressions/IsolateExpression.js')

function Mock(scenario, target) {
  if(!target.isSpecification && !(target instanceof IsolateExpression))
    throw new Error('Expect Specification or IsolateExpression for target')
  this.scenario = scenario
  this.verifications = []
  this.target = target
  this.callback(function() {
    var targetType = target.isSpecification ?
      target.getType().returnType :
      target.type
    var defaultMockFn = target.defaultMockFn
    if(defaultMockFn) return defaultMockFn.apply(this, arguments)
    if(!targetType.getDefault)
      throw new Error('No default provided for type ' + targetType)
    return targetType.getDefault.bind(targetType).apply(this, arguments)
  })
}

Object.defineProperty(Mock.prototype, 'specification', {
  get: function() { return this.scenario.specification }
})

Mock.prototype.getExpressionName = function() {
  if(this.target.isSpecification && this.target.isConstructor)
    return 'new ' + this.target.name
  if(this.target.isSpecification)
    return this.target.name + '.call'
  if(this.target instanceof IsolateExpression)
    return this.target.name
  throw new Error('Invalid target: ' + this.target)
}

Mock.prototype.callback = function(mockFn) {
  var self = this
  this.fn = function mockFnWrapper() {
    self.calls.push({ this: this, arguments: arguments })
    var targetType = self.target.isSpecification ?
      self.target.getType().returnType :
      self.target.type
    var result = mockFn.apply(this, arguments)
      , typeFilters = {}
    // Validate the object type:
    typeUtil.jsObjToType(result, targetType, typeFilters)
    // TODO think about validating parameters in typeFilters
    // if(Object.keys(typeFilters).length)
    //   throw new Error('Type parameters not allowed in mock callback: ' +
    //      Object.keys(typeFilters).join(', '))
    return result
  }
}

Mock.prototype.prepare = function() {
  this.calls = []
  this.verifiedCallIndex = 0
}

Mock.prototype.verifyNotCalled = function() {
  var exp = new Expectation()
  exp.as('should not call ' + this.target.name)
  exp.verifiesCount = true
  exp.callCountVerification = { mock: this, count: 0 }
  this.scenario.expectations.push(exp)
}

Mock.prototype.verify = function(fn) {
  var self = this
  DeferredApiCall.callChildren(arguments, function(fn) {

    // Set up total count expectation.
    var countExpectation = self.scenario.expectations.filter(function(e) {
      return e.callCountVerification && e.callCountVerification.mock === self
    })[0]
    if(countExpectation) {
      countExpectation.callCountVerification.count++
    } else {
      countExpectation = new Expectation()
      countExpectation.verifiesCount = true
      countExpectation.callCountVerification = {
        mock: self,
        count: 1
      }
      self.scenario.expectations.push(countExpectation)
    }
    countExpectation.description = 'should call ' + self.target.name + ' ' +
      countExpectation.callCountVerification.count + ' time(s)'

    // Set up callback expectation.
    var expectationDescription = 'should call ' + self.target.name
    if(arguments.length !== 1 || !(fn instanceof Function)) {
      var args = [].slice.apply(arguments)
      var argTypes = self.target.isSpecification ?
        self.target.getType().getArgTypes() :
        util.pluck(self.target.args, 'type')
      var typesToCheck = argTypes.slice()

      if(args.length > typesToCheck.length)
        throw new Error(
          'Wrong number of arguments supplied for verification of ' +
          self.target.name)

      var argCheckTypeFilters = {}
      typesToCheck.forEach(function(argType, index) {
        if(index >= args.length) return
        // Validate the object type:
        typeUtil.jsObjToType(args[index], argType, argCheckTypeFilters)
      })

      fn = function() {
        for(var a = 0; a < args.length; a++)
          if(!util.equals(args[a], arguments[a]))
            return false
        return true
      }

      if(args.length === 1)
        expectationDescription += ' with ' +
          util.toFriendlyInlineString(args[0])
      else if(args.length) {
        expectationDescription += ' with: ' +
          args.map(util.toFriendlyInlineString).join(', ')
      }
    }

    var expectation = new Expectation()
    expectation.as(expectationDescription)
    expectation.mockVerification = { mock: self, fn: fn }
    self.scenario.expectations.push(expectation)
    return self
  })
}

Mock.prototype.as = function() {
  this.scenario.as.apply(this.scenario, arguments)
}

module.exports = Mock
