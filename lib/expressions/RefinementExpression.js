'use strict'

var ValueExpression = require('./ValueExpression.js')

function RefinementExpression() {
  ValueExpression.apply(this, arguments)
}
RefinementExpression.prototype = Object.create(ValueExpression.prototype)
RefinementExpression.prototype.constructor = RefinementExpression

RefinementExpression.prototype.filterType = function() {
  var result = ValueExpression.prototype.filterType.apply(this, arguments)
  result.source = this.source
  return result
}

RefinementExpression.prototype.toString = function() {
  var base = ValueExpression.prototype.toString.apply(this, arguments)
  if(this.source && this.source.name) {
    base += ' #' + this.source.name
  }
  return base
}

module.exports = RefinementExpression
