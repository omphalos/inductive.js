'use strict'

var tap = require('../tap.js')
  , evalUtil = require('../evalUtil.js')
  , util = require('../util.js')
  , TypeParameter = require('./TypeParameter.js')

function Type(name) {
  this.name = name
  this.typeParameters = []
}

Type.prototype.typeParameter = function(name) {
  return new TypeParameter(name, this)
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

Type.prototype.getChildTypes = function() {
  return this.children
}

Type.prototype.pushDescendants = function(buffer) {
  if(!this.getChildTypes()) return buffer
  this.getChildTypes().forEach(function(c) {
    if(buffer.indexOf(c) >= 0) return
    buffer.push(c)
    c.pushDescendants(buffer)
  })
  return buffer
}

Type.prototype.getDescendants = function() {
  var buffer = []
  this.pushDescendants(buffer)
  return buffer
}

Type.prototype.validateType = function(arg) {
  if(!(arg instanceof Type) && !(arg instanceof TypeParameter))
    throw new Error('arg should be a Type or TypeParameter: ' + arg)
}

Type.prototype.validateInstance = function(obj, typeFilters) {
  return util.failInstance(obj)
}

/*
function ParameterizedType(typeParameters, parent, ctor) {
  if(ctor && !ctor.isConstructor)
    throw new Error('ctor should be a ConstructorSpecification')
  this.parent = parent
  this.typeParameters = typeParameters
  for(var c = 0;  c < this.typeParameters.length; c++)
    this.validateType(this.typeParameters[c])
  this.ctor = ctor || objectConstructor
  this.habitationTemplate = '@candidate instanceof ' + this.ctor.name
}
ParameterizedType.prototype = Object.create(Type.prototype)
ParameterizedType.prototype.constructor = ParameterizedType

ParameterizedType.prototype.toString = function(traversed) {
  return this.parent + '<' + this.typeParameters.map(function(c) {
    return c.toString(traversed || [])
  }).join(', ') + '>'
}

ParameterizedType.prototype.hasTypeParameter = function(traversed) {
  return this.typeParameters.reduce(function(prev, current) {
    return prev || current.hasTypeParameter(traversed)
  }, false)
}

ParameterizedType.prototype.containsType = function(type, typeFilters, recs) {
  if(!(type instanceof ParameterizedType)) return false
  var self = this
  return self.ctor === type.ctor &&
    self.parent === type.parent &&
    self.typeParameters.length === type.typeParameters.length &&
    self.typeParameters.reduce(function(prev, current, index) {
      return prev && self.typeParameters[index].containsType(
        type.typeParameters[index], typeFilters, recs)
    }, true)
}

ParameterizedType.prototype.filterType = function(typeFilters, recs) {
  if(!typeFilters || !Object.keys(typeFilters).length) return this
  recs = recs || []
  var copy = Object.create(Object.getPrototypeOf(this))
  var filteredParams = this.typeParameters.map(function(c) {
    return c.filterType(typeFilters, recs)
  })
  ParameterizedType.call(copy,
    filteredParams,
    this.parent,
    this.ctor)
  if(this.hasOwnProperty('getDefault'))
    copy.getDefault = this.getDefault
  copy.habitationTemplate = this.habitationTemplate
  return copy
}

ParameterizedType.prototype.getChildTypes = function() {
  return this.typeParameters
}
*/

module.exports = Type

