'use strict'

var Type = require('./Type.js')
  , ctorUtil = require('../ctorUtil.js')
  , objectConstructor = require('../NativeConstructor.js').objectConstructor
  , NativeConstructor = require('../NativeConstructor.js').NativeConstructor
  , isAncestorOf = require('../NativeConstructor.js').isAncestorOf
  , util = require('../util.js')
  , RecordProperty = require('./RecordProperty.js')
  , globalOptions = require('../globalOptions.js')
  , tap = require('../tap.js')

function RecordType(ctor) {
  if(ctor && !ctor.isConstructor) {
    throw new Error('ctor should be a constructor: ' + ctor)
  }
  var self = this
  self.children = []
  self.ctor = ctor || objectConstructor
  self.sortProperties()
  var hasCallee, hasLength
}
RecordType.prototype = Object.create(Type.prototype)
RecordType.prototype.constructor = RecordType

function validateProperties(rec) {
  var hasCallee, hasLength
  for(var c = 0; c < rec.children.length; c++) {
    hasCallee = hasCallee || rec.children[c].name === 'callee'
    hasLength = hasLength || rec.children[c].name === 'length'
  }
  if(hasCallee && hasLength && rec.ctor === objectConstructor)
    throw new Error(
      'Records with properties named callee and length are invalid because ' +
      'they are ambiguous with arguments objects when used in unions.')
}

var objectHabitationTemplate = [
  '(function(candidate) {',
  '  return candidate instanceof Object && ' + 
    '(!("callee" in candidate) || !("length" in candidate)) && ',
    'candidate.constructor.name === "Object"',
  '})(@candidate)'
].join('\n')
Object.defineProperty(RecordType.prototype, 'habitationTemplate', {
  get: function() {
    return this.ctor.name === 'Object' ?
      objectHabitationTemplate :
      '@candidate instanceof ' + this.ctor.name
  }
})

RecordType.prototype.instantiate = function() {
  return this.ctor.instantiate.apply(this.ctor, arguments)
}

RecordType.prototype.defaultTo = function() {
  throw new Error(this + ' does not support custom defaults')
}

RecordType.prototype.getDefault = function() {
  var result = Object.create(this.ctor.fn.prototype)
  this.children.forEach(function(c) {
    result[c.name] = c.type.getDefault()
  })
  return result
}

RecordType.prototype.toShortString = function(traversed) {
  return this.ctor === objectConstructor ?
    this.toLongString(traversed) : ctorUtil.getUniqueName(this.ctor)
}

RecordType.prototype.toLongString = function(traversed) {
  var children = this.children
  traversed = traversed || []
  var traversalIndex = traversed.indexOf(this)
    , isTraversed = traversalIndex >= 0
  if(isTraversed) return '<Circular$' + traversalIndex + '>'
  traversed.push(this)
  var childStrs = children.map(function(c) { return c.toString(traversed) })
    , childStr = childStrs.join(', ')
    , ctorName = ctorUtil.getUniqueName(this.ctor)
  var result = ['{', ctorName, childStr, '}'].
    filter(util.identity).
    join(' ')
  if(result.indexOf('  ') >= 0)
    throw new Error('Failed to get string for record')
  return result
}

RecordType.prototype.toString = function(traversed) {
  if(!globalOptions.recordTypeDetail) return this.toShortString(traversed)
  return this.toLongString(traversed)
}

RecordType.prototype.forConstructor = function(ctor, base, factoryFn) {
  if(this.ctor !== objectConstructor)
    throw new Error('Constructor already assigned')
  if(!ctor || !ctor.isConstructor) {
    ctor = new NativeConstructor(ctor, base, factoryFn)
    if(ctor.recordType)
      throw new Error('Record already set for constructor')
    ctor.recordType = this
  } else {
    if(ctor.recordType)
      throw new Error('Record already set for constructor')
    ctor.recordType = this
    if(arguments.length > 1)
      throw new Error('Too many arguments supplied for non-native constructor')
  }
  this.ctor = ctor
}

RecordType.prototype.hasTypeParameter = function(traversed) {
  if(!traversed) traversed = [this]
  else if(traversed.indexOf(this) >= 0) return false
  else traversed.push(this)
  return this.children.reduce(function(prev, current) {
    return prev || current.type.hasTypeParameter(traversed)
  }, false)
}

RecordType.prototype.filterType = function(typeFilters, recs) {
  if(!typeFilters || !Object.keys(typeFilters).length) return this
  if(recs) {
    for(var r = 0; r < recs.length; r++)
      if(recs[r].self === this)
        return recs[r].filteredType
  } else recs = []

  var rec = new RecordType(this.ctor)

  recs.push({ self: this, filteredType: rec })
  rec.children = this.children.map(function(child) {
    var childType = child.type.filterType(typeFilters, recs)
    return new RecordProperty(rec, childType, child.name)
  })

  return rec
}

RecordType.prototype.getSignature = function() {
  return ctorUtil.getObjectSignatureFromArray(
    util.pluck(this.children, 'name'), this.ctor)
}

RecordType.prototype.getPropertyNames = function() {
  return util.pluck(this.children, 'name')
}

RecordType.prototype.getChildTypes = function() {
  return this.children.map(function(c) {
    return c.type
  }).filter(util.identity)
}

RecordType.prototype.containsType = function(instance, typeFilters, recs) {
  var self = this
  if(!(instance instanceof RecordType)) return null
  if(this.ctor !== instance.ctor) {
    if(this.ctor !== objectConstructor)
      return isAncestorOf(this, instance)
    return null
  }

  if(self.children.length !== instance.children.length) return null
  for(var i = 0; i < self.children.length; i++)
    if(self.children[i].name !== instance.children[i].name)
      return null

  // Prevent recursive checks
  if(recs) {
    for(var i = 0; i < recs.length; i++) {
      var rec = recs[i]
      if(rec.self === self && rec.instance === instance)
        return true
    }
  } else recs = []

  recs.push({ self: self, instance: instance })
  var result = self.children.reduce(function(prev, current, index) {
    if(!prev) return false
    var ownChild = self.children[index]
      , instanceChild = instance.children[index]
    var contains = ownChild.type &&
      ownChild.type.containsType(instanceChild.type, typeFilters, recs)
    return contains
  }, true)
  return result
}

RecordType.prototype.sortProperties = function() {
  this.children.sort(function(x, y) {
    return (
      x.name < y.name ? -1 :
      x.name > y.name ?  1 :
      0)
  })
}

RecordType.prototype.takesResolved = function(type, name) {
  if(!name) throw new Error('name is required')
  this.validateType(type)
  var property = new RecordProperty(this, type, name)
  this.children.push(property)
  this.sortProperties()
  validateProperties(this)
}

RecordType.prototype.validateInstance = function(obj, typeFilters) {
  if(!obj || !(obj instanceof Object)) return this.failInstance(obj)
  var keys = Object.keys(obj)
  if(!this.ctor.constructsInstance(obj)) return this.failInstance(obj)
  // This check ensures that inheritance works:
  if(obj.constructor !== Object) return []
  if(keys.length !== this.children.length)
    return this.failInstance(obj, 'Expect ' + this.children.length + ' keys')
  for(var c = 0; c < this.children.length; c++) {
    var child = this.children[c]
    if(!(child.name in obj))
      return this.failInstance(obj, 'Missing ' + child.name)
    var childError = child.type.validateInstance(obj[child.name], typeFilters)
    if(childError.length) return this.failInstance(obj, childError)
  }
  return true
}

module.exports = RecordType
