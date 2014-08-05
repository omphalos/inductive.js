'use strict'

var typeUtil = require('../types/typeUtil.js')

function ExpressionArgument(expression, type, templateAlias) {
  Object.defineProperty(this, 'expression', { value: expression })
  this.type = type
  this.templateAlias = templateAlias || '@' + type.toShortString()
}

ExpressionArgument.prototype.tryFilterType = function(typeFilters) {
  var filteredType = this.type.tryFilterType(typeFilters)
  if(!filteredType) return null
  return new ExpressionArgument(
    this.expression,
    filteredType,
    this.templateAlias)
}

ExpressionArgument.prototype.resolveType = function(recordTypesBySignature) {
  var resolved = new ExpressionArgument(
    this.expression,
    typeUtil.resolveType(this.type, recordTypesBySignature),
    this.templateAlias)
  return resolved
}

module.exports = ExpressionArgument
