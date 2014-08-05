'use strict'

var nativeTypes = {}
  , primitiveNativeTypes = require('./primitiveNativeTypes.js')
  , Type = require('./Type.js')
  , RecordType = require('./RecordType.js')
  , ParameterizedType = require('./ParameterizedType.js')
  , TypeParameter =require('./TypeParameter.js')
  , arrayConstructor = require('../NativeConstructor.js').arrayConstructor

Object.keys(primitiveNativeTypes).forEach(function(key) {
  nativeTypes[key] = primitiveNativeTypes[key]
})

var dateType = nativeTypes.dateType = new RecordType([])
dateType.forConstructor(Date, null, function() {
  return new Date(0)
})

var regExpType = nativeTypes.regExpType = new RecordType([])
regExpType.forConstructor(RegExp, null)

var errorType = nativeTypes.errorType = new RecordType([])
errorType.forConstructor(Error)

var arrayType = nativeTypes.arrayType = new ParameterizedType(
  [new TypeParameter('a')], 'Array', arrayConstructor)
arrayType.defaultTo(function() { return [] })

var mapType = nativeTypes.mapType =
  new ParameterizedType([new TypeParameter('a')], 'Map')
mapType.defaultTo(function() { return {} })

var argumentsObjectType = nativeTypes.argumentsObjectType =
  new ParameterizedType([new TypeParameter('a')], 'Arguments')

Object.defineProperty(argumentsObjectType, 'habitationTemplate', {
  value: [
    '(function(candidate) {',
    '  return candidate instanceof Object && ' + 
      '"callee" in candidate && "length" in candidate && ',
      'candidate.constructor.name === "Object"',
    '})(@candidate)'
  ].join('\n')
})

module.exports = nativeTypes
