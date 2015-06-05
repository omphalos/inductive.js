'use strict'

var ParameterizedType = require('./ParameterizedType.js')
  , TypeParameter = require('./TypeParameter.js')
  , Type = require('./Type.js')

function ArgumentsObjectType(typeParams) {
  typeParams = typeParams || [new TypeParameter('a')]
  if(typeParams.length !== 1)
    throw new Error(
      'Wrong number of type params passed to ArgumentsObjectType')
  ParameterizedType.call(this, typeParams, 'Arguments')
  this.habitationTemplate = [
    '(function(candidate) {',
    '  return candidate instanceof Object && ' + 
      '"callee" in candidate && "length" in candidate && ',
      'candidate.constructor === Object',
    '})(@candidate)'
  ].join('\n')
}

ArgumentsObjectType.prototype = Object.create(ParameterizedType.prototype)

ArgumentsObjectType.prototype.getInstanceError = function(obj, typeFilters) {
  if(!obj) return this.failInstance(obj)
  if(!(obj instanceof Object)) return this.failInstance(obj)
  if(!('callee' in obj)) return this.failInstance(obj)
  if(!('length' in obj)) return this.failInstance(obj)
  if(obj.constructor !== Object) return this.failInstance(obj)
  var childType = this.children[0]
  for(var i = 0; i < obj.length; i++) {
    var childError = childType.getInstanceError(obj[i], typeFilters)
    if(childError.length)
      return this.failInstance(obj, childError)
  }
  return []
}

module.exports = ArgumentsObjectType
