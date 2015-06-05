'use strict'

var ParameterizedType = require('./ParameterizedType.js')
  , TypeParameter = require('./TypeParameter.js')

function MapType(typeParams) {
  typeParams = typeParams || [new TypeParameter('a')]
  if(typeParams.length !== 1)
    throw new Error('Wrong number of type params passed to MapType')
  ParameterizedType.call(this, typeParams, 'Map')
  this.defaultTo(function() { return {} })
}

MapType.prototype = Object.create(ParameterizedType.prototype)

MapType.prototype.getInstanceError = function(obj, typeFilters) {
  if(!obj) return this.failInstance(obj)
  if(!(obj instanceof Object)) return this.failInstance(obj)
  if(Object.getPrototypeOf(obj) !== Object.prototype)
    return this.failInstance(obj)
  var childType = this.children[0]
    , keys = Object.keys(obj)
  for(var i = 0; i < keys.length; i++) {
    var childError = childType.getInstanceError(obj[keys[i]], typeFilters)
    if(childError.length) return this.failInstance(obj, childError)
  }
  return []
}

module.exports = MapType
