'use strict'

var Expression = require('./Expression.js')

function CallExpression(functionType, functionName) {
  var self = this
  Expression.call(self, 'call')
  var template
  if(functionName)
    template = functionName + '.call('
  else {
    self.takes(functionType, '@fn')
    template = '@fn.call('
  }
  if(functionType.contextType) {
    self.takes(functionType.contextType, '@this')
    template += '@this'
  } else template += 'null'
  functionType.getArgTypes().forEach(function(argType, index) {
    self.takes(argType, '@' + index)
    template += ', @' + index
  })
  template += ')'
  self.as(template)
  self.returns(functionType.returnType)
}
CallExpression.prototype = Object.create(Expression.prototype)
CallExpression.prototype.constructor = CallExpression

module.exports = CallExpression
