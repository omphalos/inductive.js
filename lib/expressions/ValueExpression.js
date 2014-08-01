'use strict'

var Expression = require('./Expression.js')

function ValueExpression() {
  Expression.apply(this, arguments)
}
ValueExpression.prototype = Object.create(Expression.prototype)
ValueExpression.prototype.constructor = ValueExpression

module.exports = ValueExpression
