'use strict'

var Type = require('./Type.js')
  , primitiveNativeTypes = {}
  , util = require('../util.js')

var undefinedType = primitiveNativeTypes.undefinedType = new Type('undefined')
undefinedType.defaultTo(undefined)
undefinedType.habitationTemplate = '@candidate === undefined'
undefinedType.validateInstance = function(obj, typeFilters) {
  return obj === undefined ? [] : util.failInstance(obj)
}

var numberType = primitiveNativeTypes.numberType = new Type('Number')
numberType.defaultTo(0)
numberType.habitationTemplate = 'typeof @candidate === "number"'
numberType.validateInstance = function(obj, typeFilters) {
  return typeof obj === 'number' ? [] : util.failInstance(obj)
}

var booleanType = primitiveNativeTypes.booleanType = new Type('Boolean')
booleanType.defaultTo(false)
booleanType.habitationTemplate = 'typeof @candidate === "boolean"'
booleanType.validateInstance = function(obj, typeFilters) {
  return typeof obj === 'boolean' ? [] : util.failInstance(obj)
}

var stringType = primitiveNativeTypes.stringType = new Type('String')
stringType.defaultTo('')
stringType.habitationTemplate = 'typeof @candidate === "string"'
stringType.validateInstance = function(obj, typeFilters) {
  return typeof obj === 'string' ? [] : util.failInstance(obj)
}

var nullType = primitiveNativeTypes.nullType = new Type('null')
nullType.defaultTo(null)
nullType.habitationTemplate = '@candidate === null'
nullType.validateInstance = function(obj, typeFilters) {
  return obj === null ? [] : util.failInstance(obj)
}

module.exports = primitiveNativeTypes
