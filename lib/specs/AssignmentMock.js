'use strict'

var typeUtil = require('../types/typeUtil.js')
  , Assignment = require('./Assignment.js')
  , tap = require('../tap.js')

function AssignmentMock(scenario, target, value) {
  Object.defineProperty(this, 'scenario', scenario)
  this.verifications = []
  this.target = target
  if(!(target instanceof Assignment))
    throw new Error('Invalid target of AssignmentMock ' + target)
  this.value = value
  var expectedType = target.spec.getType().returnType
    , typeFilters = {}
  // Validate the type
  typeUtil.jsObjToType(value, expectedType, typeFilters)
  // TODO think about validating the typeFilters:
  // if(Object.keys(typeFilters).length)
  //   throw new Error('Type parameters not allowed in assignment mock: ' +
  //     Object.keys(typeFilters).join(', '))
}

Object.defineProperty(AssignmentMock.prototype, 'specification', {
  get: function() { return this.scenario.specification }
})

AssignmentMock.prototype.getExpressionName = function() {
  return this.target.name
}

AssignmentMock.prototype.prepare = function() {
}

AssignmentMock.prototype.as = function() {
  this.scenario.as.apply(this.scenario, arguments)
}

module.exports = AssignmentMock
