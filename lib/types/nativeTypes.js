'use strict'

var nativeTypes = {}
  , primitiveNativeTypes = require('./primitiveNativeTypes.js')
  , Type = require('./Type.js')
  , RecordType = require('./RecordType.js')
  , ParameterizedType = require('./ParameterizedType.js')
  , ArrayType = require('./ArrayType.js')
  , MapType = require('./MapType.js')
  , ArgumentsArrayType = require('./ArgumentsArrayType.js')
  , TypeParameter = require('./TypeParameter.js')

Object.keys(primitiveNativeTypes).forEach(function(key) {
  nativeTypes[key] = primitiveNativeTypes[key]
})

var dateType = nativeTypes.dateType = new RecordType()
dateType.forConstructor(Date, null, function() {
  return new Date(0)
})

var regExpType = nativeTypes.regExpType = new RecordType()
regExpType.forConstructor(RegExp, null)

var errorType = nativeTypes.errorType = new RecordType()
errorType.forConstructor(Error)

var arrayType = nativeTypes.arrayType = new ArrayType()

var mapType = nativeTypes.mapType = new MapType()

var argumentsArrayType = nativeTypes.argumentsArrayType =
  new ArgumentsArrayType()

module.exports = nativeTypes
