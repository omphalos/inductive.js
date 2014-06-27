var Type = require('./Type.js')
  , uniqueTypeID = 0

function UniqueType(id) {
  this.id = id || ++uniqueTypeID
}
UniqueType.prototype = Object.create(Type.prototype)
UniqueType.prototype.constructor = Type

UniqueType.prototype.containsType = function(instance, typeFilters, recs) {
  return instance instanceof UniqueType && instance.id === this.id
}

module.exports = UniqueType
