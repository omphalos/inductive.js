var Type = require('./Type.js')
  , primitiveNativeTypes = {}

var undefinedType = primitiveNativeTypes.undefinedType = new Type('undefined')
undefinedType.defaultTo(undefined)
undefinedType.habitationTemplate = '@candidate === undefined'

var numberType = primitiveNativeTypes.numberType = new Type('Number')
numberType.defaultTo(0)
numberType.habitationTemplate = 'typeof @candidate === "number"'

var booleanType = primitiveNativeTypes.booleanType = new Type('Boolean')
booleanType.defaultTo(false)
booleanType.habitationTemplate = 'typeof @candidate === "boolean"'

var stringType = primitiveNativeTypes.stringType = new Type('String')
stringType.defaultTo('')
stringType.habitationTemplate = 'typeof @candidate === "string"'

var nullType = primitiveNativeTypes.nullType = new Type('null')
nullType.defaultTo(null)
nullType.habitationTemplate = '@candidate === null'

module.exports = primitiveNativeTypes