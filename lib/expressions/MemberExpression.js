'use strict'

var Expression = require('./Expression.js')
  , ObjectCreateExpression = require('./ObjectCreateExpression.js')
  , MemberUpdateExpression = require('./MemberUpdateExpression.js')

function MemberExpression(prop) {
  Expression.call(this, '[' + JSON.stringify(prop.name) + ']')
  this.takes(prop.recordType, '@record')
  this.returns(prop.type)
  this.as('@record[' + JSON.stringify(prop.name) + ']')
  this.constrainChild(function(self, child) {
    // Optimization:
    // Don't get the member of a new record.
    return !(child instanceof ObjectCreateExpression) &&
      !(child instanceof MemberUpdateExpression)
  })
}
MemberExpression.prototype = Object.create(Expression.prototype)
MemberExpression.prototype.constructor = MemberExpression

module.exports = MemberExpression