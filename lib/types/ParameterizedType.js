'use strict'

var Type = require('./Type.js')
  , ctorUtil = require('../ctorUtil.js')
  , objectConstructor = require('../NativeConstructor.js').objectConstructor
  , util = require('../util.js')

function ParameterizedType(typeParameters, parent, ctor) {
  Type.call(this)
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

module.exports = ParameterizedType
