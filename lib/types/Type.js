function Type(name) {
  this.name = name
}

Type.prototype.isSmallTypeFor = function(candidate) {
  return false
}

Type.prototype.defaultTo = function(value) {
  if(value instanceof Function)
    this.getDefault = value
  else this.getDefault = function() { return value }
}

Type.prototype.equals = function(other) {
  return this === other || 
    (this.containsType(other, {}) && other.containsType(this, {}))
}

Type.prototype.toShortString = function() {
  return this.toString.apply(this, arguments)
}

Type.prototype.toString = function() { return this.name }

Type.prototype.containsType = function(instance) {
  return this === instance
}

Type.prototype.filterType = function(typeFilters) { return this }

Type.prototype.hasTypeParameter = function() { return false }

Type.prototype.resolveType = function() { return this }

Type.prototype.resolveTypeFrom = function(resolved) {
  for(var r = 0; r < resolved.length; r++)
    if(resolved[r].unresolved === this)
      return resolved[r].resolved
  return this.resolveType(resolved)
}

Type.prototype.getChildTypes = function() {
  return this.children
}

Type.prototype.pushDescendants = function(buffer) {
  if(!this.getChildTypes()) return buffer
  this.getChildTypes().forEach(function(c) {
    if(buffer.indexOf(c) >= 0) return buffer
    buffer.push(c)
    c.pushDescendants(buffer)
  })
  return buffer
}

Type.prototype.canonicalize = function() { return this }

Type.prototype.getDescendants = function() {
  var buffer = []
  this.pushDescendants(buffer)
  return buffer
}

Type.prototype.unwrapSmallTypes = function(resolved) {
  return this
}

Type.prototype.validateType = function(arg) {
  if(!(arg instanceof Type))
    throw new Error('arg should be a Type: ' + arg)
}

module.exports = Type

