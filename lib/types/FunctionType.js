'use strict'

var Type = require('./Type.js')
  , undefinedType = require('./primitiveNativeTypes.js').undefinedType
  , ArgumentsTupleType = require('./ArgumentsTupleType.js')
  , UnionType = require('./UnionType.js')
  , functionTypings = []

function FunctionType() {
  var args = [].slice.apply(arguments)
  this.name = typeof args[args.length - 1] === 'string' && args.pop() || 'fn'
  this.returnType = args.length ? args.pop() : undefinedType
  this.validateType(this.returnType)
  this.arg = args.length === 1 && args[0] instanceof ArgumentsTupleType ?
    args[0] : new ArgumentsTupleType(args)
  this.validateType(this.arg)
  this.habitationTemplate = 'typeof @candidate === "function"'
}
FunctionType.prototype = Object.create(Type.prototype)
FunctionType.prototype.constructor = FunctionType

FunctionType.prototype.takesResolved = function(type) {
  this.validateType(type)
  this.arg.children.push(type)
}

FunctionType.prototype.returnsResolved = function(type) {
  this.validateType(type)
  this.returnType = type
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

FunctionType.prototype.getInputTypes = function() {
  var inputTypes = this.arg.children.slice()
  if('contextType' in this) inputTypes.unshift(this.contextType)
  return inputTypes
}

FunctionType.prototype.getChildTypes = function() {
  var result = [this.returnType]
  if('contextType' in this) result.push(this.contextType)
  result.push(this.arg)
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
  // `this` and `instance` are inverted for parameters for contravariance:
  return instance.arg.containsType(this.arg, typeFilters, recs) &&
    (!!this.contextType) === (!!instance.contextType) &&
    (!instance.contextType || instance.contextType.containsType(
      this.contextType, typeFilters, recs)) &&
    this.returnType.containsType(instance.returnType, typeFilters, recs)
}

FunctionType.prototype.copy = function() {
  var result = new FunctionType(this.arg.copy(), this.returnType, this.name)
  if('contextType' in this) result.contextType = this.contextType
  return result
}

FunctionType.prototype.getArgTypes = function() {
  return this.arg.children
}

FunctionType.prototype.filterType = function(typeFilters, recs) {
  if(!typeFilters || !Object.keys(typeFilters).length) return this
  recs = recs || []
  var argFiltered = this.arg.filterType(typeFilters, recs)
    , returnTypeFiltered = this.returnType.filterType(typeFilters, recs)
  var result = new FunctionType(argFiltered, returnTypeFiltered, this.name)
  if(this.contextType)
    result.contextType = this.contextType.filterType(typeFilters, recs)
  return result
}

FunctionType.prototype.validateInstance = function(instance, typeFilters) {
  if(instance instanceof Function) return []
  return this.failInstance(instance)
}

Object.defineProperty(FunctionType.prototype, 'children', {
  get: function() { return [this.arg, this.returnType] }
})

module.exports = FunctionType
