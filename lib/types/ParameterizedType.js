'use strict'

var Type = require('./Type.js')
  , ctorUtil = require('../ctorUtil.js')
  , objectConstructor = require('../NativeConstructor.js').objectConstructor
  , TypeParameter = require('./TypeParameter.js')
  , util = require('../util.js')

function ParameterizedType(children, parent, ctor) {
  if(ctor && !ctor.isConstructor)
    throw new Error('ctor should be a ConstructorSpecification')
  this.parent = parent
  this.children = children
  for(var c = 0;  c < this.children.length; c++)
    this.validateType(this.children[c])
  this.ctor = ctor || objectConstructor
  this.habitationTemplate = '@candidate instanceof ' + this.ctor.name
}
ParameterizedType.prototype = Object.create(Type.prototype)
ParameterizedType.prototype.constructor = ParameterizedType

ParameterizedType.prototype.toString = function(traversed) {
  return this.parent + '<' + this.children.map(function(c) {
    return c.toString(traversed || [])
  }).join(', ') + '>'
}

ParameterizedType.prototype.hasTypeParameter = function(traversed) {
  return this.children.reduce(function(prev, current) {
    return prev || current.hasTypeParameter(traversed)
  }, false)
}

ParameterizedType.prototype.of = function() {
  var recordTypesBySignature = {}
    , typeUtil = require('./typeUtil.js')
  var args = [].map.call(arguments, function(a) {
    return typeUtil.resolveType(a, recordTypesBySignature)
  })
  var descendants = this.getDescendants()
  var generics = descendants.filter(function(d) {
    return d instanceof TypeParameter
  })
  var byName = util.groupBy(generics, function(g) { return g.name })
    , names = Object.keys(byName)
    , filters = {}
  if(args.length > names.length)
    throw new Error('Too many types in filter.')
  args.forEach(function(arg, index) {
    filters[names[index]] = arg
  })
  return this.filterType(filters)
}

ParameterizedType.prototype.containsType = function(instance, typeFilters, recs) {
  if(!(instance instanceof ParameterizedType)) return false
  var self = this
  return self.ctor === instance.ctor &&
    self.parent === instance.parent &&
    self.children.length === instance.children.length &&
    self.children.reduce(function(prev, current, index) {
      return prev && self.children[index].containsType(
        instance.children[index], typeFilters, recs)
    }, true)
}

ParameterizedType.prototype.tryFilterType = function(typeFilters, recs) {
  if(!typeFilters || !Object.keys(typeFilters).length) return this
  recs = recs || []
  var copy = Object.create(Object.getPrototypeOf(this))
    , failed = false
  var filteredChildren = this.children.map(function(c) {
    var result = c.tryFilterType(typeFilters, recs)
    failed = failed || !result
    return result
  })
  if(failed) return null
  ParameterizedType.call(copy,
    filteredChildren,
    this.parent,
    this.ctor)
  if(this.hasOwnProperty('getDefault'))
    copy.getDefault = this.getDefault
  copy.habitationTemplate = this.habitationTemplate
  return copy
}

ParameterizedType.prototype.resolveType = function(resolved) {
  var result = Object.create(ParameterizedType.prototype)
  resolved.push({ unresolved: this, resolved: result })
  ParameterizedType.call(result,
    this.children.map(function(c) {
      return c.resolveTypeFrom(resolved)
    }),
    this.parent,
    this.ctor)
  if(this.hasOwnProperty('getDefault'))
    result.getDefault = this.getDefault
  result.habitationTemplate = this.habitationTemplate
  return result
}

ParameterizedType.prototype.canonicalize = function(recordTypesBySignature) {
  var resolved = Object.create(Object.getPrototypeOf(this))
  ParameterizedType.call(resolved,
    this.children.map(function(c) {
      return c.canonicalize(recordTypesBySignature)
    }),
    this.parent,
    this.ctor)
  if(this.hasOwnProperty('getDefault'))
    resolved.getDefault = this.getDefault
  resolved.habitationTemplate = this.habitationTemplate
  return resolved
}

ParameterizedType.prototype.unwrapSmallTypes = function(resolved) {
  var result = Object.create(Object.getPrototypeOf(this))
  ParameterizedType.call(result,
    this.children.map(function(c) {
      return c.unwrapSmallTypes(resolved)
    }),
    this.parent,
    this.ctor)
  if(this.hasOwnProperty('getDefault'))
    result.getDefault = this.getDefault
  result.habitationTemplate = this.habitationTemplate
  return result
}

module.exports = ParameterizedType
