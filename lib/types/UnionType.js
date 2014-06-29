var Type = require('./Type.js')
  , TypeParameter = require('./TypeParameter.js')
  , util = require('../util.js')

function UnionType(types) {
  var recs = {}
  for(var t = 0; t < types.length; t++)
    this.validateType(types[t])
  this.children = types.sort(function(x, y) {
    return !x || !y ? 0 :
      x.habitationTemplate === y.habitationTemplate ? 0 :
      !x.habitationTemplate && y.habitationTemplate ? -1 :
      x.habitationTemplate && !y.habitationTemplate ? 1 :
      x.habitationTemplate < y.habitationTemplate ? 1 : -1
  })
  if(this.getError()) throw new Error(this.getError() + ' ' + this)
}
UnionType.prototype = Object.create(Type.prototype)
UnionType.prototype.constructor = UnionType

UnionType.prototype.defaultTo = function() {
  throw new Error(this + ' does not support custom defaults')
}

UnionType.prototype.getError = function() {
  var uniqueTemplates = []
    , hasGeneric = false
    , hasObjectType = false
  if(this.children.length < 2)
    return 'Unions must have at least two children.'
  for(var c = 0; c < this.children.length; c++) {
    var child = this.children[c]
    if(!(child instanceof Type))
      return // Wait until resolution to test this
    if(child instanceof UnionType)
      return 'Union should not be composed of other unions.'
    if(child.ctor) {
      for(var d = 0; d < this.children.length; d++) {
        if(c === d) continue
        var other = this.children[d]
        if(!(other instanceof Type)) continue
        if(!this.children[d].ctor) continue
        if(child.ctor === this.children[d].ctor)
          return 'Objects with the same constructor ' +
            'cannot be in the same union.'
        if(child.isAncestorOf(this.children[d]))
          return 'Ancestors and descendants cannot be in the same union.'
      }
    }
    if(child instanceof TypeParameter) {
      if(hasGeneric) return 'Only one typeParameter parameter allowed per union.'
      hasGeneric = true
    } else if(!child.habitationTemplate) {
      return 'Child has no habitation template so cannot appear in a union.'
    }
    if(uniqueTemplates.indexOf(child.habitationTemplate || '') >= 0) {
      return 'Types can only appear once per union.'
    }
    uniqueTemplates.push(child.habitationTemplate || '')
  }
  return null
}

UnionType.prototype.canMatch = function() {
  return this.children.reduce(function(prev, curr) {
    return prev && !(curr instanceof TypeParameter)
  }, true)
}

UnionType.prototype.toString = function(traversed) {
  return '(' + this.children.map(function(c) {
    return c ? c.toString(traversed || []) : c
  }).join(' | ') + ')'
}

UnionType.prototype.hasTypeParameter = function(traversed) {
  return this.children.reduce(function(prev, current) {
    return prev || current.hasTypeParameter(traversed)
  }, false)
}

UnionType.prototype.takes = function(type) {
  this.validateType(type)
  this.children.push(type)
  if(this.getError()) throw new Error(this.getError() + ' ' + type)
}

UnionType.prototype.takesResolved = function(type) {
  var typeUtil = require('./typeUtil.js')
  this.takes(typeUtil.resolveType(type))
}

UnionType.prototype.containsType = function(instance, typeFilters, recs) {
  if(!(instance instanceof UnionType)) {
    for(var c = 0; c < this.children.length; c++)
      if(this.children[c].containsType(instance, typeFilters, recs))
        return true
    return false
  }
  recs = recs || []
  if(this.children.length > instance.children.length) return false
  var consumed = [] // Helps let union containsType check ignore order.
    , typeParameter = null
  for(var s = 0; s < this.children.length; s++) {
    if(this.children[s] instanceof TypeParameter) {
      if(typeParameter)
        throw new Error('Only one typeParameter argument allowed per union.')
      typeParameter = this.children[s]
    }
  }
  if(this.children.length < instance.children.length && !typeParameter)
    return false
  for(var s = 0; s < this.children.length; s++) {
    if(this.children[s] === typeParameter) continue
    var hasMatch = false
    for(var i = 0; i < instance.children.length; i++) {
      if(consumed.indexOf(i) >= 0) continue
      var instanceChild = instance.children[i]
      if(this.children[s].containsType(instanceChild, typeFilters, recs)) {
        consumed.push(i)
        hasMatch = true
        break
      }
    }
    if(!hasMatch) return false
  }
  if(consumed.length < instance.children.length) {
    var filteredElements = []
    for(var i = 0; i < instance.children.length; i++) {
      if(consumed.indexOf(i) < 0) {
        filteredElements.push(instance.children[i])
      }
    }
    typeFilters[typeParameter.name] = filteredElements.length > 1 ?
      new UnionType(filteredElements) :
      filteredElements[0]
  }
  var filteredType = this.filterType(typeFilters)
  if(filteredType.getError()) return false
  return true
}

UnionType.prototype.filterType = function(typeFilters, recs) {
  if(
    !typeFilters ||
    !Object.keys(typeFilters).length ||
    !this.hasTypeParameter()) return this
  recs = recs || []
  var filteredChildren = []
  function add(item) {
    for(var s = 0; s < filteredChildren.length; s++) {
      var copy = util.copy(typeFilters)
      if(filteredChildren[s].containsType(item, copy))
        return
    }
    filteredChildren.push(item)
  }
  this.children.forEach(function(c) {
    var filtered = c.filterType(typeFilters, recs)
    if(filtered instanceof UnionType) {
      filtered.children.forEach(function(s) {
        add(s)
      })
    } else add(filtered)
  })
  if(filteredChildren.length === 1)
    return filteredChildren[0]
  return new UnionType(filteredChildren)
}

UnionType.prototype.copy = function() {
  var copy = Object.create(UnionType.prototype)
  copy.children = this.children.slice()
  return copy
}

UnionType.prototype.add = function(type) {
  this.validateType(type)
  for(var c = 0; c < this.children.length; c++)
    if(this.children[c].containsType(type, {}) ||
      this.children[c].isSmallTypeFor(type)) {
      return this
    }
  for(var c = 0; c < this.children.length; c++)
    if(type.containsType(this.children[c], {}) ||
      type.isSmallTypeFor(this.children[c])) {
      var copy = this.copy()
      copy.children[c] = type
      return copy
    }
  var applied = new UnionType(this.children.concat([type]))
  return applied
}

UnionType.prototype.canonicalize = function(recordTypesBySignature) {
  return new UnionType(this.children.map(function(c) {
    return c.canonicalize(recordTypesBySignature)
  }))
}

UnionType.prototype.unwrapSmallTypes = function(resolved) {
  return new UnionType(this.children.map(function(c) {
    return c.unwrapSmallTypes(resolved)
  }))
}

UnionType.prototype.resolveType = function(resolved) {
  var result = Object.create(UnionType.prototype)
  resolved.push({ unresolved: this, resolved: result })
  UnionType.call(result, this.children.map(function(c) {
    return c.resolveTypeFrom(resolved)
  }))
  return result
}

UnionType.prototype.getDefault = function() {
  var self = this
  return function() {
    for(var c = 0; c < self.children.length; c++)
      if('default' in c)
        return c.default
    throw new Error('No default specified for any type in ' + this)
  }
}

module.exports = UnionType
