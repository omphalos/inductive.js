var Type = require('./Type.js')
  , ArgumentsType = require('./ArgumentsType.js')

function Generic(name) {
  this.name = name
}
Generic.prototype = Object.create(Type.prototype)
Generic.prototype.constructor = Generic

Generic.prototype.toString = function() { return "'" + this.name }

Generic.prototype.filterType = function(typeFilters) {
  if(typeFilters && this.name in typeFilters) {
    this.validateType(typeFilters[this.name])
    return typeFilters[this.name]
  }
  return this
}

Generic.prototype.isGeneric = function() {
  return true
}

Generic.prototype.defaultTo = function() {
  throw new Error(this + ' does not support custom defaults')
}

Generic.prototype.containsType = function(instance, typeFilters, recs) {
  if(instance instanceof ArgumentsType) return false // Sanity check
  var typeFilter = typeFilters[this.name]
  if(typeFilter) {
    // The 'instance' can have multiple references to the same generic.
    // This could look like: templateType(new Generic('a'), new Generic('a'), 'T');
    // This check treats each new Generic('a') as equivalent.
    if(typeFilter instanceof Generic && instance instanceof Generic) {
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

Generic.prototype.canonicalize = function() { return this }

Generic.prototype.unwrapSmallTypes = function() { return this }

Generic.prototype.resolveType = function() { return this }

module.exports = Generic
