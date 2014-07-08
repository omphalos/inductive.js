var Type = require('./Type.js')
  , ctorUtil = require('../ctorUtil.js')
  , objectConstructor = require('../NativeConstructor.js').objectConstructor
  , NativeConstructor = require('../NativeConstructor.js').NativeConstructor
  , isAncestorOf = require('../NativeConstructor.js').isAncestorOf
  , util = require('../util.js')
  , RecordProperty = require('./RecordProperty.js')
  , typePlaceholder = require('./typePlaceholder.js')
  , globalOptions = require('../globalOptions.js')

function RecordType(propNames, ctor) {
  if(ctor && !ctor.isConstructor)
    throw new Error('ctor should be a constructor')
  var self = this
  self.children = propNames.map(function(arg) {
    return new RecordProperty(self, typePlaceholder, arg)
  })
  self.ctor = ctor || objectConstructor
  self.sortProperties()
  var hasCallee, hasLength
  for(var c = 0; c < self.children.length; c++) {
    hasCallee = hasCallee || self.children[c].name === 'callee'
    hasLength = hasLength || self.children[c].name === 'length'
  }
  if(hasCallee && hasLength)
    throw new Error(
      'Records with properties named callee and length are invalid because ' +
      'they are ambiguous with arguments objects when used in unions.')
}
RecordType.prototype = Object.create(Type.prototype)
RecordType.prototype.constructor = RecordType

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

RecordType.prototype.toShortString = function() {
  if(this.ctor !== objectConstructor)
    return ctorUtil.getUniqueName(this.ctor)
  var children = this.children
  var ctorString = this.ctor === objectConstructor ?
    '' : this.ctor.name + ' '
  return '{ ' + ctorString + this.children.map(function(c) {
    return c.name
  }).join(', ') + ' }'
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
  if(!globalOptions.recordTypeDetail) return this.toShortString()
  return this.toLongString(traversed)
}

RecordType.prototype.canonicalizeChildren = function(recsBySignature, recs) {
  if(recs) {
    for(var r = 0; r < recs.length; r++)
      if(recs[r].self === this)
        return recs[r].canonicalization
  } else recs = []
  var rec = this.createEmptyType()
  recs.push({ self: this, canonicalization: rec })
  this.children.forEach(function(child, index) {
    rec.children[index].type = child.type.canonicalize(recsBySignature)
  })
  return rec
}

RecordType.prototype.isEmpty = function() {
  return this.children.reduce(function(prev, curr) {
    return prev || curr.type === typePlaceholder
  }, false)
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

RecordType.prototype.createEmptyType = function() {
  var result = new RecordType([])
  result.children = this.children.map(function(c) {
    return new RecordProperty(result, typePlaceholder, c.name)
  })
  result.ctor = this.ctor
  return result
}

RecordType.prototype.canonicalize = function(recordTypesBySignature) {
  var signature = this.getSignature()
    , result = recordTypesBySignature[signature]
  if(!result) {
    tap.comment('recordTypesBySignature', recordTypesBySignature)
    tap.comment('signature', signature)
    throw new Error('Unable to canonicalize ' + this)
  }
  return result
}

RecordType.prototype.hasTypeParameter = function(traversed) {
  if(!traversed) traversed = [this]
  else if(traversed.indexOf(this) >= 0) return false
  else traversed.push(this)
  return this.children.reduce(function(prev, current) {
    return prev || current.type.hasTypeParameter(traversed)
  }, false)
}

RecordType.prototype.tryFilterType = function(typeFilters, recs) {
  if(!typeFilters || !Object.keys(typeFilters).length) return this
  if(recs) {
    for(var r = 0; r < recs.length; r++)
      if(recs[r].self === this)
        return recs[r].filteredType
  } else recs = []
  var rec = this.createEmptyType()
  recs.push({ self: this, filteredType: rec })
  var failed = false
  this.children.forEach(function(child, index) {
    rec.children[index].type = child.type.tryFilterType(typeFilters, recs)
    if(!rec.children[index].type) failed = true
  })
  return failed ? null : rec
}

RecordType.prototype.getSignature = function() {
  return ctorUtil.getObjectSignatureFromArray(
    util.pluck(this.children, 'name'), this.ctor)
}

RecordType.prototype.getPropertyNames = function() {
  return util.pluck(this.children, 'name')
}

RecordType.prototype.resolveType = function(resolved) {
  var result = this.createEmptyType()
  resolved.push({ unresolved: this, resolved: result })
  this.children.forEach(function(c, index) {
    result.children[index].type = c.type.resolveTypeFrom(resolved)
  })
  return result
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
    if(this.ctor !== objectConstructor) {
      var result = isAncestorOf(this, instance)
      return result
    }
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

RecordType.prototype.takes = function(type, name) {
  if(!name) throw new Error('name is required')
  var recordTypesBySignature = {}
  recordTypesBySignature[this.getSignature()] = this
  var typeUtil = require('./typeUtil.js')
    , resolved = typeUtil.resolveType(type, recordTypesBySignature)
  this.takesResolved(resolved, name)
}

RecordType.prototype.takesResolved = function(type, name) {
  this.validateType(type)
  var property = new RecordProperty(this, type, name)
  this.children.push(property)
  this.sortProperties()
}

RecordType.prototype.unwrapSmallTypes = function(resolved) {
  resolved = resolved || []
  for(var i = 0; i < resolved.length; i++)
    if(resolved[i].unresolved === this)
      return resolved[i].resolved
  var result = this.createEmptyType()
  resolved.push({ unresolved: this, resolved: result })
  this.children.forEach(function(c, index) {
    result.children[index].type = c.type.unwrapSmallTypes(resolved)
  })
  return result
}

module.exports = RecordType
