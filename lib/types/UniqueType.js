'use strict'

var Type = require('./Type.js')
  , uniqueTypeID = 0
  , globalOptions = require('../globalOptions.js')

function UniqueType(sourceName, id) {
  this.name = sourceName || ''
  this.id = id || ++uniqueTypeID
}
UniqueType.prototype = Object.create(Type.prototype)
UniqueType.prototype.constructor = Type

UniqueType.prototype.containsType = function(instance, typeFilters, recs) {
  return instance instanceof UniqueType && instance.id === this.id
}

UniqueType.prototype.toString = function() {
  return '#' + this.name +
    (globalOptions.uniqueTypeDetail ? this.id : '')
}

module.exports = UniqueType
