'use strict'

var Expression = require('./Expression.js')

function FunctionExpression(name, functionType) {
  Expression.call(this, name)
  // Let's say we have a functionType Number -> String.
  // The template will look like: return @String
  // Therefore the expression "takes" String:
  this.takes(functionType.returnType)
  // It returns a (Number -> String):
  this.returns(functionType)
  this.contextType = !!functionType.contextType
  if(this.contextType) this.binds(functionType.contextType)
  this.binds.apply(this, functionType.arg.getChildTypes())
}
FunctionExpression.prototype = Object.create(Expression.prototype)
FunctionExpression.prototype.constructor = FunctionExpression

FunctionExpression.prototype.filterType = function() {
  var result = Expression.prototype.filterType.apply(this, arguments)
  result.contextType = this.contextType
  return result
}

FunctionExpression.prototype.toCode = function(children, varCount, term) {

  var self = this
    , child = children[0]
    , bindLength = self.bindingTypes.length - (self.contextType ? 1 : 0)
    , params = self.bindingTypes.slice(0, bindLength)
    , contextOffset = self.contextType ? 1 : 0
    , selfCode = ''
    , body
    , args = params.map(function(a, i) {
      return 'arg' + (i + varCount + contextOffset)
    })

  var childCode = child.expr.toCode(
    child.children, child.varCount, term)

  if(self.contextType) {
    // TODO the context variable index should be lower than the arguments
    selfCode = 'var arg' + varCount + ' = this\n'
  }

  if(term) body =
    '  try {\n' +
    '    if(termCheck ++> ' + term + ') throw "termination guarantee"\n' +
    (selfCode ? '    ' + selfCode : '') +
    '    return ' + childCode + '\n' +
    '  } finally {\n' +
    '    termCheck--\n' +
    '  }'
  else body =
    (selfCode ? '  ' + selfCode : '') +
    '  return ' + childCode + '\n'

  return (
    'function ' + self.name + '(' + args.join(', ') + ') {\n' +
    body +
    '}')
}

module.exports = FunctionExpression
