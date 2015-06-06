'use strict'

var Type = require('./Type.js')
  , ArgumentsTupleType = require('./ArgumentsTupleType.js')
  , id = 0

function TypeParameter(name) {
  if(!isNaN(+name))
    throw new Error('TypeParameter name cannot be numeric: ' + name)
  this.name = name || (id++).toString()
}
TypeParameter.prototype = Object.create(Type.prototype)
TypeParameter.prototype.constructor = TypeParameter

TypeParameter.prototype.isTypeParameter = true

TypeParameter.prototype.toString = function() { return "'" + this.name }

TypeParameter.prototype.filterType = function(typeFilters) {
  if(typeFilters && this.name in typeFilters) {
    this.validateType(typeFilters[this.name])
    return typeFilters[this.name]
  }
  return this
}

TypeParameter.prototype.hasTypeParameter = function() {
  return true
}

TypeParameter.prototype.defaultTo = function() {
  throw new Error(this + ' does not support custom defaults')
}

TypeParameter.prototype.containsType = function(instance, typeFilters, recs) {
  if(instance instanceof ArgumentsTupleType) return false // Sanity check
  var typeFilter = typeFilters[this.name]
  if(typeFilter) {
    // The 'instance' can have multiple references to the same typeParameter.
    // This could look like:
    //   parameterizedType(new TypeParameter('a'), new TypeParameter('a'), 'T')
    // This check treats each new TypeParameter('a') as equivalent.
    if(
      typeFilter instanceof TypeParameter &&
      instance instanceof TypeParameter) {
      // The types are equivalent if they both have the same name.
      // If they do not have the same name, we do not go to an equals check.
      // Equals checks will always be true for two Generics.
      // We don't want to allow ('a, 'b) to be filtered as ('a, 'a).
      return typeFilter.name === instance.name
    }
    if(typeFilter.equals(instance)) return true
    return false
  }
  typeFilters[this.name] = instance
  return true
}

TypeParameter.prototype.getInstanceError = function(instance, typeFilters) {
  var typeUtil = require('./typeUtil.js')
  // TODO: fix skipping recordObjectsOfType in this jsObjToType call.
  // Note: we don't pass an expected type here.
  var instanceType = typeUtil.jsObjToType(instance)
  if(instanceType instanceof ArgumentsTupleType)
    return this.failInstance(instance) // Sanity check
  var typeFilter = typeFilters[this.name]
  if(typeFilter) {
    // The 'instance' can have multiple references to the same typeParameter.
    // This could look like:
    //   parameterizedType(new TypeParameter('a'), new TypeParameter('a'), 'X')
    // This check treats each new TypeParameter('a') as equivalent.
    var childTypeFilters = {}
    var childError = typeFilter.getInstanceError(instance, childTypeFilters)
    if(Object.keys(childTypeFilters).length) // This should never happen
      throw new Error('Object instances should not be generic: ' + typeFilter)
    if(childError.length) return this.failInstance(instance, childError)
    return []
  }
  typeFilters[this.name] = instanceType
  return []
}

module.exports = TypeParameter
