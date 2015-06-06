'use strict'

var Type = require('./Type.js')
  , util = require('../util.js')

function ArgumentsTupleType(types) {
  for(var t = 0; t < types.length; t++)
    this.validateType(types[t])
  this.children = [].slice.apply(types)
}
ArgumentsTupleType.prototype = Object.create(Type.prototype)
ArgumentsTupleType.prototype.constructor = ArgumentsTupleType

ArgumentsTupleType.prototype.defaultTo = function() {
  throw new Error(this + ' does not support custom defaults')
}

ArgumentsTupleType.prototype.toString = function(traversed) {
  return '(' + this.children.map(function(c) {
    return c.toString(traversed || [])
  }).join(', ') + ')'
}

ArgumentsTupleType.prototype.hasTypeParameter = function(traversed) {
  return this.children.reduce(function(prev, current) {
    return prev || current.hasTypeParameter(traversed)
  }, false)
}

ArgumentsTupleType.prototype.containsType = function(instance, typeFilters, recs) {
  if(!(instance instanceof ArgumentsTupleType)) return null
  recs = recs || []
  var self = this
  return self.children.length === instance.children.length &&
    self.children.reduce(function(prev, current, index) {
      return prev && self.children[index].containsType(
        instance.children[index], typeFilters)
    }, true)
}

ArgumentsTupleType.prototype.copy = function() {
  return new ArgumentsTupleType(this.children.slice())
}

ArgumentsTupleType.prototype.filterType = function(typeFilters, recs) {
  if(!typeFilters || !Object.keys(typeFilters).length) return this
  recs = recs || []
  var filteredChildren = this.children.map(function(c) {
    var result = c.filterType(typeFilters, recs)
    return result
  })
  return new ArgumentsTupleType(filteredChildren)
}

module.exports = ArgumentsTupleType
