'use strict'

var ParameterizedType = require('./ParameterizedType.js')
  , TypeParameter = require('./TypeParameter.js')
  , Type = require('./Type.js')

function ArgumentsArrayType(typeParams) {
  typeParams = typeParams || [new TypeParameter('a')]
  if(typeParams.length !== 1)
    throw new Error(
      'Wrong number of type params passed to ArgumentsArrayType')
  ParameterizedType.call(this, typeParams, 'Arguments')
  this.habitationTemplate = [
    '(function(candidate) {',
    '  return candidate instanceof Object && ' + 
      '"callee" in candidate && "length" in candidate && ',
      'candidate.constructor === Object',
    '})(@candidate)'
  ].join('\n')
}

ArgumentsArrayType.prototype = Object.create(ParameterizedType.prototype)

ArgumentsArrayType.prototype.validateInstance = function(obj, typeFilters) {
  if(!obj) return this.failInstance(obj)
  if(!(obj instanceof Object)) return this.failInstance(obj)
  if(!('callee' in obj)) return this.failInstance(obj)
  if(!('length' in obj)) return this.failInstance(obj)
  if(obj.constructor !== Object) return this.failInstance(obj)
  var childType = this.typeParameters[0]
  for(var i = 0; i < obj.length; i++) {
    var childError = childType.validateInstance(obj[i], typeFilters)
    if(childError.length)
      return this.failInstance(obj, childError)
  }
  return []
}

module.exports = ArgumentsArrayType
