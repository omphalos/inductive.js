'use strict'

var FunctionType = require('../types/FunctionType.js')

function ScenarioSignature(spec) {
  this.spec = spec
  this.fnType = new FunctionType()
  this.calls = {}
}

;['takes', 'returns', 'takesContext'].forEach(function(fn) {
  ScenarioSignature.prototype[fn] = function() {
    this.hasSpecified[fn] = true
    return this.fnType[fn].apply(this.fnType, arguments)
  }
})

;['given', 'givenNoArgs'].forEach(function(fn) {
  ScenarioSignature.prototype[fn] = function() {
    var result = spec[fn].apply(spec, arguments)
    result.signature = this
    result.validateSignature()
    return result
  }
})

module.exports = ScenarioSignature
