'use strict'

var Type = require('./Type.js')
  , primitiveNativeTypes = {}

var undefinedType = primitiveNativeTypes.undefinedType = new Type('undefined')
undefinedType.defaultTo(undefined)
undefinedType.habitationTemplate = '@candidate === undefined'
undefinedType.validateInstance = function(obj, typeFilters) {
  return obj === undefined ? [] : this.failInstance(obj)
}

var numberType = primitiveNativeTypes.numberType = new Type('Number')
numberType.defaultTo(0)
numberType.habitationTemplate = 'typeof @candidate === "number"'
numberType.validateInstance = function(obj, typeFilters) {
  return typeof obj === 'number' ? [] : this.failInstance(obj)
}

var booleanType = primitiveNativeTypes.booleanType = new Type('Boolean')
booleanType.defaultTo(false)
booleanType.habitationTemplate = 'typeof @candidate === "boolean"'
booleanType.validateInstance = function(obj, typeFilters) {
  return typeof obj === 'boolean' ? [] : this.failInstance(obj)
}

var stringType = primitiveNativeTypes.stringType = new Type('String')
stringType.defaultTo('')
stringType.habitationTemplate = 'typeof @candidate === "string"'
stringType.validateInstance = function(obj, typeFilters) {
  return typeof obj === 'string' ? [] : this.failInstance(obj)
}

var nullType = primitiveNativeTypes.nullType = new Type('null')
nullType.defaultTo(null)
nullType.habitationTemplate = '@candidate === null'
nullType.validateInstance = function(obj, typeFilters) {
  return obj === null ? [] : this.failInstance(obj)
}

module.exports = primitiveNativeTypes
