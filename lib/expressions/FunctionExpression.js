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
  this.binds.apply(this, functionType.arg.getChildTypes())
  this.contextType = !!functionType.contextType
  if(this.contextType) this.binds(functionType.contextType)
}
FunctionExpression.prototype = Object.create(Expression.prototype)
FunctionExpression.prototype.constructor = FunctionExpression

FunctionExpression.prototype.seed = function(seedCode) {
  if(typeof seedCode !== 'string')
    throw new Error(
      'seedCode should be an String: ' + seedCode)
  this.seedCode = seedCode
  // When seeding, add the accumulator variable to scope:
  this.binds(this.type.returnType)
}

FunctionExpression.prototype.resolveType = function() {
  var result = Expression.prototype.resolveType.apply(this, arguments)
  result.contextType = this.contextType
  return result
}

FunctionExpression.prototype.tryFilterType = function() {
  var result = Expression.prototype.tryFilterType.apply(this, arguments)
  if(!result) return null
  result.contextType = this.contextType
  return result
}

FunctionExpression.prototype.toCode = function(children, varCount, term) {

  var self = this
    , child = children[0]
    , bindLength = self.bindingTypes.length - (self.contextType ? 1 : 0)
    , params = self.bindingTypes.slice(0, bindLength)
    , args = params.map(function(a, i) { return 'arg' + (i + varCount) })
    , seedCode = ''
    , selfCode = ''
    , body

  var childCode = child.expr.toCode(
    child.children, child.varCount, term)

  if(self.seedCode) {
    var last = args[args.length - 1]
    seedCode = last + ' = ' + last + ' || (' + self.seedCode + ')\n'
  }

  if(self.contextType) {
    selfCode = 'var arg' + (varCount + params.length) + ' = this\n'
  }

  if(term) body =
    '  try {\n' +
    '    if(termCheck ++> ' + term + ') throw "termination guarantee"\n' +
    (selfCode ? '    ' + selfCode : '') +
    (seedCode ? '    ' + seedCode : '') +
    '    return ' + childCode + '\n' +
    '  } finally {\n' +
    '    termCheck--\n' +
    '  }'
  else body =
    (selfCode ? '  ' + selfCode : '') +
    (seedCode ? '  ' + seedCode : '') +
    '  return ' + childCode + '\n'

  return (
    'function ' + self.name + '(' + args.join(', ') + ') {\n' +
    body +
    '}')
}

module.exports = FunctionExpression
