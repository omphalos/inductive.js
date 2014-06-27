var nativeTypes = {}
  , primitiveNativeTypes = require('./primitiveNativeTypes.js')
  , Type = require('./Type.js')
  , RecordType = require('./RecordType.js')
  , TemplateType = require('./TemplateType.js')
  , Generic =require('./Generic.js')
  , arrayConstructor = require('../NativeConstructor.js').arrayConstructor

Object.keys(primitiveNativeTypes).forEach(function(key) {
  nativeTypes[key] = primitiveNativeTypes[key]
})

var dateType = nativeTypes.dateType = new RecordType([])
dateType.forConstructor(Date, null, function() {
  return new Date(0)
})

var errorType = nativeTypes.errorType = new RecordType([])
errorType.forConstructor(Error)

var arrayType = nativeTypes.arrayType = new TemplateType(
  [new Generic('a')], 'Array', arrayConstructor)
arrayType.defaultTo(function() { return [] })

var mapType = nativeTypes.mapType = new TemplateType([new Generic('a')], 'Map')
mapType.defaultTo(function() { return {} })

module.exports = nativeTypes