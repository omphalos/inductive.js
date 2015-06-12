'use strict'

var Type = require('./Type.js')
  , Expression = require('../expressions/Expression.js')
  , util = require('../util.js')

function SmallType(name, wrappedType) {
  Type.call(this, name)
  this.wrappedType = wrappedType
  this.validateType(this.wrappedType)
  Object.defineProperty(this, 'convertFrom', {
    get: function() {
      var expr = new Expression(this.wrappedType + ' to ' + this.name)
      expr.takes(this, '@this')
      expr.returns(this.wrappedType)
      expr.as('@this')
      return expr
    }
  })
  Object.defineProperty(this, 'convertTo', {
    get: function() {
      var expr = new Expression(this.name + ' to ' + this.wrappedType)
      expr.takes(this.wrappedType, '@wrappedType')
      expr.returns(this)
      expr.as('@wrappedType')
      return expr
    }
  })
}
SmallType.prototype = Object.create(Type.prototype)
SmallType.prototype.constructor = Type

SmallType.prototype.getDefault = function() {
  return this.wrappedType.getDefault()
}

SmallType.prototype.hasTypeParameter = function() {
  return this.wrappedType.hasTypeParameter()
}

SmallType.prototype.getChildTypes = function() {
  return [this.wrappedType]
}

SmallType.prototype.validateInstance = function(obj, typeFilters) {
  var childError = this.wrappedType.validateInstance(obj, typeFilters)
  if(childError.length) return util.failInstance(obj, childError)
  return []
}

SmallType.prototype.isSmallTypeFor = function(type) { 
  return this.wrappedType.equals(type)
}

SmallType.prototype.filterType = function(typeFilters, recs) {
  if(!typeFilters || !Object.keys(typeFilters).length) return this
  recs = recs || []
  var wrapped = this.wrappedType.filterType(typeFilters, recs)
    , result = new SmallType(this.name, wrapped)
  return result
}

SmallType.prototype.containsType = function(instance, typeFilters, recs) {
  recs = recs || []
  if(instance instanceof SmallType)
    return this.name == instance.name &&
      this.wrappedType.containsType(instance.wrappedType, typeFilters, recs)
  return null
}

Object.defineProperty(SmallType.prototype, 'habitationTemplate', {
  get: function() { return this.wrappedType.habitationTemplate },
  enumerable: true
})

module.exports = SmallType
