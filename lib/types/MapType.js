'use strict'

var ParameterizedType = require('./ParameterizedType.js')
  , TypeParameter = require('./TypeParameter.js')
  , util = require('../util.js')

function MapType(typeParams) {
  typeParams = typeParams || [new TypeParameter('a')]
  if(typeParams.length !== 1)
    throw new Error('Wrong number of type params passed to MapType')
  ParameterizedType.call(this, typeParams, 'Map')
  this.defaultTo(function() { return {} })
}

MapType.prototype = Object.create(ParameterizedType.prototype)

MapType.prototype.validateInstance = function(obj, typeFilters) {
  if(!obj) return util.failInstance(obj)
  if(!(obj instanceof Object)) return util.failInstance(obj)
  if(Object.getPrototypeOf(obj) !== Object.prototype)
    return util.failInstance(obj)
  var childType = this.typeParameters[0]
    , keys = Object.keys(obj)
  for(var i = 0; i < keys.length; i++) {
    var childError = childType.validateInstance(obj[keys[i]], typeFilters)
    if(childError.length) return util.failInstance(obj, childError)
  }
  return []
}

module.exports = MapType
