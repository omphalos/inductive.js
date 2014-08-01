'use strict'

var Type = require('./Type.js')
  , ArgumentsType = require('./ArgumentsType.js')

function TypeParameter(name) {
  this.name = name
}
TypeParameter.prototype = Object.create(Type.prototype)
TypeParameter.prototype.constructor = TypeParameter

TypeParameter.prototype.isTypeParameter = true

TypeParameter.prototype.toString = function() { return "'" + this.name }

TypeParameter.prototype.tryFilterType = function(typeFilters) {
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
  if(instance instanceof ArgumentsType) return false // Sanity check
  var typeFilter = typeFilters[this.name]
  if(typeFilter) {
    // The 'instance' can have multiple references to the same typeParameter.
    // This could look like: parameterizedType(new TypeParameter('a'), new TypeParameter('a'), 'T');
    // This check treats each new TypeParameter('a') as equivalent.
    if(typeFilter instanceof TypeParameter && instance instanceof TypeParameter) {
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

TypeParameter.prototype.canonicalize = function() { return this }

TypeParameter.prototype.unwrapSmallTypes = function() { return this }

TypeParameter.prototype.resolveType = function() { return this }

module.exports = TypeParameter
