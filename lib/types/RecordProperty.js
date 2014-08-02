'use strict'

function RecordProperty(recordType, propertyType, propertyName) {
  if(!propertyName) throw new Error('Property name is required')
  this.recordType = recordType
  this.type = propertyType
  this.name = propertyName
}

RecordProperty.prototype.toString = function(traversed) {
  return this.name + ': ' + this.type.toString(traversed)
}

module.exports = RecordProperty
