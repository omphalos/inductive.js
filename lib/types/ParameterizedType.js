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
  var typeUtil = require('./typeUtil.js')
  var args = [].map.call(arguments, function(a) {
    return typeUtil.resolveType(a)
  })
  return this.ofResolved.apply(this, args)
}

ParameterizedType.prototype.ofResolved = function() {
  var args = [].slice.call(arguments)
  args.forEach(this.validateType.bind(this))
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

ParameterizedType.prototype.filterType = function(typeFilters, recs) {
  if(!typeFilters || !Object.keys(typeFilters).length) return this
  recs = recs || []
  var copy = Object.create(Object.getPrototypeOf(this))
  var filteredChildren = this.children.map(function(c) {
    return c.filterType(typeFilters, recs)
  })
  ParameterizedType.call(copy,
    filteredChildren,
    this.parent,
    this.ctor)
  if(this.hasOwnProperty('getDefault'))
    copy.getDefault = this.getDefault
  copy.habitationTemplate = this.habitationTemplate
  return copy
}

module.exports = ParameterizedType
