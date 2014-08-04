'use strict'

var Expression = require('./Expression.js')
  , UnionType = require('../types/UnionType.js')
  , TypeParameter = require('../types/TypeParameter.js')

function MatchExpression(types, returnType) {
  types.forEach(function(t) {
    if(!t.habitationTemplate)
      throw new Error(
        'Type ' + t +
        ' has no habitation template so cannot appear in a MatchExpression.')
  })
  returnType = returnType || new TypeParameter('a')
  var self = this
    , union = new UnionType(types)
  Expression.call(self, 'match')
  self.takes(union, '@candidate')
  types.forEach(function(c, index) {
    self.takes(returnType, '@' + index)
  })
  self.returns(returnType)
  self.constrainChild(function(self, child, childIndex) {
    // Optimization for match: don't match on match or union expression.
    var result = childIndex || (
      !(child instanceof MatchExpression) &&
      (child.type instanceof UnionType && child.type.canMatch()))
    return result
  })
  self.silenceConstraintFailures()
}
MatchExpression.prototype = Object.create(Expression.prototype)
MatchExpression.prototype.constructor = MatchExpression

MatchExpression.prototype.valdidateHabitationTemplates = function(types) {
}

MatchExpression.prototype.toCode = function(children, varCount, term) {

  var union = children[0]
    , unionType = union.expr.type
    , matchType = children[1].expr.type.toString()
    , name = 'refinement' + varCount

  var unionExprCode = union.expr.toCode(
    union.children,
    union.varCount,
    term)

  var code =
    '(function() { /* returns ' + matchType + ' */\n' +
    '  var ' + name + ' = ' + unionExprCode + '\n'

  for(var c = 1; c < children.length; c++) {

    var child = children[c]
      , childType = unionType.children[c - 1]
      , habitationTemplate = childType.habitationTemplate
      , habitation = habitationTemplate.replace('@candidate', name)

    var childCode = child.expr.toCode(
      child.children,
      child.varCount,
      term)

    code += '  if(' + habitation + ') return ' + childCode + '\n'
  }

  code += '  throw new Error("Unexpected type: " + ' + name + ')\n'
  code += '})()'

  return code
}

module.exports = MatchExpression
