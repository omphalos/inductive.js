'use strict'

var util = require('./util.js')
  , Requirement = require('./Requirement.js')

function FileContents(sourceFile) {
  this.sourceFile = sourceFile
  this.names = {}
  this.blocks = []
  this.requirements = []
}

FileContents.prototype.addName = function(name, obj) {
  if(!name) throw new Error('Missing name')
  if(!obj) throw new Error('Missing obj')
  var existing = this.names[name]
    , isRepl = util.getCallingFile() === 'repl'
  if(existing && existing !== obj && !isRepl) {
    var alreadDefined = 
      !(existing instanceof Requirement) ||
      !(obj instanceof Requirement) ||
      !existing.equals(obj)
    if(alreadDefined)
      throw new Error(name + ' is already specified')
    return
  }
  this.names[name] = obj
}

FileContents.prototype.addRequirements = function(reqs) {
  var self = this
  reqs.forEach(function(r) {
    self.addName(r.alias, r)
    self.requirements.push(r)
  })
}

module.exports = FileContents
