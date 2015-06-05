'use strict'

var tap = require('../tap.js')
  , evalUtil = require('../evalUtil.js')
  , util = require('../util.js')
  , markedObjects = []

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

Type.prototype.tryFilterType = function(typeFilters) { return this }

Type.prototype.filterType = function(typeFilters) {
  var result = this.tryFilterType(typeFilters)
  if(!result) {
    Object.keys(typeFilters).forEach(function(key, index) {
      if(!index) tap.comment('typeFilters:')
      tap.comment('  ' + key + ': ' + typeFilters[key])
    })
    throw new Error('Failed to filter type ' + this)
  }
  return result
}

Type.prototype.hasTypeParameter = function() { return false }

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

Type.prototype.getDescendants = function() {
  var buffer = []
  this.pushDescendants(buffer)
  return buffer
}

Type.prototype.validateType = function(arg) {
  if(!(arg instanceof Type))
    throw new Error('arg should be a Type: ' + arg)
}

/*
Type.prototype.instantiate = function(value) {
  if(!this.allowInstantiation(value))
    throw new Error(value + ' cannot be an instance of ' + this)
  if(value && !(value instanceof Object)) return value
  for(var m = 0; m < markedObjects.length; m++) {
    var markedObject = markedObjects[m]
    if(markedObject.obj !== value) continue
    if(!markedObject.type.equals(this))
      throw new Error(value + ' already instantiated as ' + markedObject.type)
    return value
  }
  markedObjects.push({ type: this, obj: value })
  return value
}
*/

Type.prototype.getInstanceError = function(obj, typeFilters) {
  return this.failInstance(obj)
}

Type.prototype.failInstance = function(obj, extraInfo) {
  var message = 'Cannot instantiate ' +
    util.toFriendlyInlineString(obj) + ' in ' + this
  if(typeof extraInfo === 'string') message = extraInfo + '.  ' + message
  return extraInfo instanceof Array ? extraInfo.concat([message]) : [message]
}

module.exports = Type

