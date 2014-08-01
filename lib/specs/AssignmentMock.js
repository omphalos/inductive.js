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
  var specResolvedType = typeUtil.jsObjToType(
    value, target.spec.recordTypesBySignature)
  if(!target.spec.getType().returnType.containsType(specResolvedType)) {
    tap.comment('Failed to resolve assignment')
    tap.comment('  Expected type: ' + target.spec.getType().returnType)
    tap.comment('  Actual type: ' + specResolvedType)
    throw new Error('Wrong type passed to assignment mock: ' + specResolvedType)
  }
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
