'use strict'

var Expression = require('./Expression.js')

function IsolateExpression(name) {
  ;['"', "'", '\\'].forEach(function(illegalChar) {
    if(name.indexOf(illegalChar) >= 0)
      throw new Error('Names with ' + illegalChar +
        ' in them are not allowed in expressions: ' + name)
  })
  Expression.call(this, name)
}
IsolateExpression.prototype = Object.create(Expression.prototype)
IsolateExpression.prototype.constructor = IsolateExpression

IsolateExpression.prototype.defaultMock = function(fn) {
  this.defaultMockFn = fn
}

IsolateExpression.prototype.toCode = function(children, varCount, term) {

  if(!term) return Expression.prototype.toCode.apply(this, arguments)

  var self = this
    , code = 'mocksContainer.scenarioMocks["' + self.name + '"].fn.call(null'

  self.args.forEach(function(arg, argIndex) {

    var child = children[argIndex]

    var childCode = child.expr.toCode(
      child.children,
      child.varCount,
      term)

    code += ', ' + childCode
  })

  return code + ')'
}

module.exports = IsolateExpression
