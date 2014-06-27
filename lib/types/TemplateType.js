var Type = require('./Type.js')
  , ctorUtil = require('../ctorUtil.js')
  , objectConstructor = require('../NativeConstructor.js').objectConstructor
  , Generic = require('./Generic.js')
  , util = require('../util.js')

function TemplateType(children, parent, ctor) {
  if(ctor && !ctor.isConstructor)
    throw new Error('ctor should be a ConstructorSpecification')
  this.parent = parent
  this.children = children
  for(var c = 0;  c < this.children.length; c++)
    this.validateType(this.children[c])
  this.ctor = ctor || objectConstructor
}
TemplateType.prototype = Object.create(Type.prototype)
TemplateType.prototype.constructor = TemplateType

Object.defineProperty(TemplateType.prototype, 'habitationTemplate', {
  get: function() { return '@candidate instanceof ' + this.ctor.name }
})

TemplateType.prototype.toString = function(traversed) {
  return this.parent + '<' + this.children.map(function(c) {
    return c.toString(traversed || [])
  }).join(', ') + '>'
}

TemplateType.prototype.isGeneric = function(traversed) {
  return this.children.reduce(function(prev, current) {
    return prev || current.isGeneric(traversed)
  }, false)
}

TemplateType.prototype.of = function() {
  var recordTypesBySignature = {}
    , typeUtil = require('./typeUtil.js')
  var args = [].map.call(arguments, function(a) {
    return typeUtil.resolveType(a, recordTypesBySignature)
  })
  var descendants = this.getDescendants()
  var generics = descendants.filter(function(d) {
    return d instanceof Generic
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

TemplateType.prototype.containsType = function(instance, typeFilters, recs) {
  if(!(instance instanceof TemplateType)) return false
  var self = this
  return self.ctor === instance.ctor &&
    self.parent === instance.parent &&
    self.children.length === instance.children.length &&
    self.children.reduce(function(prev, current, index) {
      return prev && self.children[index].containsType(
        instance.children[index], typeFilters, recs)
    }, true)
}

TemplateType.prototype.filterType = function(typeFilters, recs) {
  if(!typeFilters || !Object.keys(typeFilters).length) return this
  recs = recs || []
  var copy = new TemplateType(
    this.children.map(function(c) { return c.filterType(typeFilters, recs) }),
    this.parent,
    this.ctor)
  if(this.hasOwnProperty('getDefault')) copy.getDefault = this.getDefault
  return copy
}

TemplateType.prototype.resolveType = function(resolved) {
  var result = Object.create(TemplateType.prototype)
  resolved.push({ unresolved: this, resolved: result })
  TemplateType.call(result,
    this.children.map(function(c) {
      return c.resolveTypeFrom(resolved)
    }),
    this.parent,
    this.ctor)
  if(this.hasOwnProperty('getDefault')) result.getDefault = this.getDefault
  return result
}

TemplateType.prototype.canonicalize = function(recordTypesBySignature) {
  var resolved = new TemplateType(
    this.children.map(function(c) {
      return c.canonicalize(recordTypesBySignature)
    }),
    this.parent,
    this.ctor)
  if(this.hasOwnProperty('getDefault')) resolved.getDefault = this.getDefault
  return resolved
}

TemplateType.prototype.unwrapSmallTypes = function(resolved) {
  var resolved = new TemplateType(
    this.children.map(function(c) {
      return c.unwrapSmallTypes(resolved)
    }),
    this.parent,
    this.ctor)
  if(this.hasOwnProperty('getDefault')) resolved.getDefault = this.getDefault
  return resolved
}

module.exports = TemplateType
