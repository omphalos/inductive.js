var Type = require('./Type.js')
  , util = require('../util.js')

function ArgumentsType(types) {
  for(var t = 0; t < types.length; t++)
    this.validateType(types[t])
  this.children = [].slice.apply(types)
}
ArgumentsType.prototype = Object.create(Type.prototype)
ArgumentsType.prototype.constructor = ArgumentsType

ArgumentsType.prototype.defaultTo = function() {
  throw new Error(this + ' does not support custom defaults')
}

ArgumentsType.prototype.toString = function(traversed) {
  return '(' + this.children.map(function(c) {
    return c.toString(traversed || [])
  }).join(', ') + ')'
}

ArgumentsType.prototype.hasTypeParameter = function(traversed) {
  return this.children.reduce(function(prev, current) {
    return prev || current.hasTypeParameter(traversed)
  }, false)
}

ArgumentsType.prototype.takes = function(type) {
  var typeUtil = require('./typeUtil.js')
  this.takesResolved(typeUtil.resolveType(type, {}))
}

ArgumentsType.prototype.takesResolved = function(type) {
  this.children.push(type)
}

ArgumentsType.prototype.containsType = function(instance, typeFilters, recs) {
  if(!(instance instanceof ArgumentsType)) return null
  recs = recs || []
  var self = this
  return self.children.length === instance.children.length &&
    self.children.reduce(function(prev, current, index) {
      return prev && self.children[index].containsType(
        instance.children[index], typeFilters)
    }, true)
}

ArgumentsType.prototype.copy = function() {
  return new ArgumentsType(this.children.slice())
}

ArgumentsType.prototype.tryFilterType = function(typeFilters, recs) {
  if(!typeFilters || !Object.keys(typeFilters).length) return this
  recs = recs || []
  var failed = false
  var filteredChildren = this.children.map(function(c) {
    var result = c.tryFilterType(typeFilters, recs)
    failed = failed || !result
    return result
  })
  if(failed) return null
  return new ArgumentsType(filteredChildren)
}

ArgumentsType.prototype.canonicalize = function(recordTypesBySignature) {
  return new ArgumentsType(this.children.map(function(c) {
    return c.canonicalize(recordTypesBySignature)
  }))
}

ArgumentsType.prototype.resolveType = function(resolved) {
  var result = Object.create(ArgumentsType.prototype)
  resolved.push({ unresolved: this, resolved: result })
  ArgumentsType.call(result, this.children.map(function(c) {
    return c.resolveTypeFrom(resolved)
  }))
  return result
}

ArgumentsType.prototype.unwrapSmallTypes = function(resolved) {
  return new ArgumentsType(this.children.map(function(c) {
    return c.unwrapSmallTypes(resolved)
  }))
}

module.exports = ArgumentsType
