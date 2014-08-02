'use strict'

function Requirement(name, alias, isRelative, filename, object, objectPath) {
  this.name = name
  this.alias = alias || name
  this.isRelative = isRelative
  this.filename = filename
  this.object = object
  this.objectPath = objectPath
}

Requirement.prototype.equals = function(req) {
  var keys = Object.keys(this)
  for(var k = 0; k < keys.length; k++)
    if(this[k] !== req[k])
      return false
  return true
}

module.exports = Requirement
