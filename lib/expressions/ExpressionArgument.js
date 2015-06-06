'use strict'

var typeUtil = require('../types/typeUtil.js')

function ExpressionArgument(expression, type, templateAlias) {
  Object.defineProperty(this, 'expression', { value: expression })
  this.type = type
  this.templateAlias = templateAlias || '@' + type.toShortString()
}

ExpressionArgument.prototype.filterType = function(typeFilters) {
  var filteredType = this.type.filterType(typeFilters)
  return new ExpressionArgument(
    this.expression,
    filteredType,
    this.templateAlias)
}

module.exports = ExpressionArgument
