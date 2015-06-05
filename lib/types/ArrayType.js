'use strict'

var ParameterizedType = require('./ParameterizedType.js')
  , arrayConstructor = require('../NativeConstructor.js').arrayConstructor
  , TypeParameter = require('./TypeParameter.js')

function ArrayType(typeParams) {
  typeParams = typeParams || [new TypeParameter('a')]
  if(typeParams.length !== 1)
    throw new Error('Wrong number of type params passed to ArrayType')
  ParameterizedType.call(this, typeParams, 'Array', arrayConstructor)
  this.defaultTo(function() { return [] })
}

ArrayType.prototype = Object.create(ParameterizedType.prototype)

ArrayType.prototype.getInstanceError = function(obj, typeFilters) {
  if(!(obj instanceof Array)) return this.failInstance(obj)
  var childType = this.children[0]
  for(var i = 0; i < obj.length; i++) {
    var childError = childType.getInstanceError(obj[i], typeFilters)
    if(childError.length) return this.failInstance(obj, childError)
  }
  return []
}

module.exports = ArrayType
