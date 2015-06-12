'use strict'

var Type = require('./Type.js')
  , util = require('../util.js')

function TypeParameter(name, owner) {
  if(!name) throw new Error('name is required')
  if(name.indexOf(':') >= 0)
    throw new Error('name cannot have a colon in it: ' + name)
  this.name = name
  this.id = owner ? name : owner + ':' + name
}

TypeParameter.prototype.isTypeParameter = true

TypeParameter.prototype.toString = function() { return this.toShortString() }

TypeParameter.prototype.toShortString = function() { return "'" + this.name }

TypeParameter.prototype.equals = function(other) {
  return this === other || 
    (this.containsType(other, {}) && other.containsType(this, {}))
}

TypeParameter.prototype.filterType = function(typeFilters) {
  if(typeFilters && this.name in typeFilters) {
    var filtered = typeFilters[this.name]
    /* if(!(filtered instanceof TypeParameter) &&
      filtered.constructor.name !== 'Type') {
      throw new Error('Expected a type or type parameter: ' + filtered)
    } */
    return filtered
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
  if(instance.constructor.name === 'ArgumentsTupleType')
    throw new Error('Unexpected containsType call to ArgumentsTupleType')
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

TypeParameter.prototype.validateInstance = function(instance, typeFilters) {
  var typeUtil = require('./typeUtil.js')
  // Note: we don't pass an expected type here.
  var instanceType = typeUtil.jsObjToType(instance)
  if(instanceType.constructor.name === 'ArgumentsTupleType')
    throw new Error('Unexpected validateInstance call for ArgumentsTupleType')
  var typeFilter = typeFilters[this.name]
  if(typeFilter) {
    // The 'instance' can have multiple references to the same typeParameter.
    // This could look like:
    //   parameterizedType(new TypeParameter('a'), new TypeParameter('a'), 'X')
    // This check treats each new TypeParameter('a') as equivalent.
    var childTypeFilters = {}
    var childError = typeFilter.validateInstance(instance, childTypeFilters)
    if(Object.keys(childTypeFilters).length) // This should never happen
      throw new Error('Object instances should not be generic: ' + typeFilter)
    if(childError.length) return util.failInstance(instance, childError)
    return []
  }
  typeFilters[this.name] = instanceType
  return []
}

TypeParameter.prototype.pushDescendants = function(buffer) {}
TypeParameter.prototype.getDescendants = function() { return [] }

module.exports = TypeParameter
