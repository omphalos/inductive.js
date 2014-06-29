var Type = require('./Type.js')
  , undefinedType = require('./primitiveNativeTypes.js').undefinedType
  , ArgumentsType = require('./ArgumentsType.js')

function FunctionType() {
  var args = [].slice.apply(arguments)
  this.name = typeof args[args.length - 1] === 'string' ? args.pop() : 'fn'
  this.returnType = args.length ? args.pop() : undefinedType
  this.validateType(this.returnType)
  this.arg = args.length === 1 && args[0] instanceof ArgumentsType ?
    args[0] : new ArgumentsType(args)
  this.validateType(this.arg)
  this.habitationTemplate = 'typeof @candidate === "function"'
}
FunctionType.prototype = Object.create(Type.prototype)
FunctionType.prototype.constructor = FunctionType

FunctionType.prototype.takes = function(type) {
  var typeUtil = require('./typeUtil.js')
  this.takesResolved(typeUtil.resolveType(type, {}))
}

FunctionType.prototype.takesResolved = function(type) {
  this.validateType(type)
  this.arg.takes(type)
}

FunctionType.prototype.returns = function(type) {
  var typeUtil = require('./typeUtil.js')
  this.returnsResolved(typeUtil.resolveType(type, {}))
}

FunctionType.prototype.returnsResolved = function(type) {
  this.validateType(type)
  this.returnType = type
}

FunctionType.prototype.takesContext = function(contextType) {
  var typeUtil = require('./typeUtil.js')
  this.takesContextResolved(typeUtil.resolveType(contextType, {}))
}

FunctionType.prototype.takesContextResolved = function(contextType) {
  this.validateType(contextType)
  this.contextType = contextType
}

FunctionType.prototype.defaultTo = function() {
  throw new Error(this + ' does not support custom defaults')
}

FunctionType.prototype.getDefault = function() {
  var self = this
  return function() {
    return self.returnType.getDefault()
  }
}

FunctionType.prototype.getChildTypes = function() {
  var result = [this.returnType, this.arg]
  if('contextType' in this) result.push(this.contextType)
  return result
}

FunctionType.prototype.hasTypeParameter = function(traversed) {
  return this.arg.hasTypeParameter(traversed) ||
    this.returnType.hasTypeParameter(traversed) ||
    (this.contextType && this.contextType.hasTypeParameter(traversed))
}

FunctionType.prototype.toString = function(traversed) {
  var bindString = this.contextType ?
    this.contextType.toString(traversed) + ' => ' : ''
  var argString = this.arg.children.length === 1 ?
    this.arg.children[0].toString(traversed || []) :
    this.arg.toString(traversed || [])
  var result = bindString + argString + ' -> ' +
    this.returnType.toString(traversed || [])
  return result
}

FunctionType.prototype.containsType = function(instance, typeFilters, recs) {
  recs = recs || []
  if(!(instance instanceof FunctionType)) return null
  return this.arg.containsType(instance.arg, typeFilters, recs) &&
    this.returnType.containsType(instance.returnType, typeFilters, recs) &&
    (!!this.contextType) === (!!instance.contextType) &&
    (!this.contextType || this.contextType.containsType(
      instance.contextType, typeFilters, recs))
}

FunctionType.prototype.copy = function() {
  var result = new FunctionType(
    this.arg.copy(),
    this.returnType,
    this.name || 'fn')
  if('contextType' in this) result.contextType = this.contextType
  return result
}

FunctionType.prototype.canonicalize = function(recordTypesBySignature) {
  var result = new FunctionType(
    this.arg.canonicalize(recordTypesBySignature),
    this.returnType.canonicalize(recordTypesBySignature),
    this.name || 'fn')
  if(this.contextType)
    result.contextType = this.contextType.canonicalize(recordTypesBySignature)
  return result
}

FunctionType.prototype.getArgTypes = function() {
  return this.arg.children
}

FunctionType.prototype.filterType = function(typeFilters, recs) {
  if(!typeFilters || !Object.keys(typeFilters).length) return this
  recs = recs || []
  var result = new FunctionType(
    this.arg.filterType(typeFilters, recs),
    this.returnType.filterType(typeFilters, recs),
    this.name || 'fn')
  if(this.contextType)
    result.contextType = this.contextType.filterType(typeFilters, recs)
  return result
}

FunctionType.prototype.resolveType = function(resolved) {
  var result = Object.create(FunctionType.prototype)
  resolved.push({ unresolved: this, resolved: result })
  FunctionType.call(result,
    this.arg.resolveTypeFrom(resolved),
    this.returnType.resolveTypeFrom(resolved),
    this.name || 'fn')
  if('contextType' in this)
    result.contextType = this.contextType.resolveTypeFrom(resolved)
  return result
}

FunctionType.prototype.unwrapSmallTypes = function(resolved) {
  var result = new FunctionType(
    this.arg.unwrapSmallTypes(resolved),
    this.returnType.unwrapSmallTypes(resolved),
    this.name || 'fn')
  if('contextType' in this)
    result.contextType = this.contextType.unwrapSmallTypes(resolved)
  return result
}

Object.defineProperty(FunctionType.prototype, 'children', {
  get: function() { return [this.arg, this.returnType] }
})

module.exports = FunctionType
