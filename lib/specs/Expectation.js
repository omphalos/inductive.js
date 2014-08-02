'use strict'

var typePlaceholder = require('../types/typePlaceholder.js')

function Expectation(type) {
  this.description = ''
  this.type = type || typePlaceholder
}

Expectation.prototype.as = function(desc) {
  this.description = desc
}

Expectation.prototype.verifyCallCount = function() {
  var verification = this.callCountVerification
    , actualCalls = verification.mock.calls.length
    , expectedCalls = verification.count
  return actualCalls === expectedCalls
}

Expectation.prototype.verifyMock = function() {
  var verification = this.mockVerification
    , call = verification.mock.calls[verification.mock.verifiedCallIndex++]
  if(!call) return false
  var result = verification.fn.apply(call.this, call.arguments)
  return result
}

module.exports = Expectation
