var typeUtil = require('../types/typeUtil.js')

function ExpressionArgument(expression, type, templateAlias) {
  Object.defineProperty(this, 'expression', { value: expression })
  this.type = type
  this.templateAlias = templateAlias || '@' + type.toShortString()
}

ExpressionArgument.prototype.filterType = function(typeFilters) {
  var filtered = new ExpressionArgument(
    this.expression,
    this.type.filterType(typeFilters),
    this.templateAlias)
  return filtered
}

ExpressionArgument.prototype.resolveType = function(recordTypesBySignature) {
  var resolved = new ExpressionArgument(
    this.expression,
    typeUtil.resolveType(this.type, recordTypesBySignature),
    this.templateAlias)
  return resolved
}

module.exports = ExpressionArgument
