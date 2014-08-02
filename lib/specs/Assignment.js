'use strict'

var util = require('../util.js')
  , fileContext = require('../fileContext.js')
  , tap = require('../tap.js')
  , Requirement = require('../Requirement.js')

function Assignment(name, spec) {
  if(spec instanceof Assignment) {
    this.assignment = spec
    spec = spec.spec
  }
  if(!spec.isSpecification)
    throw new Error('Can only assign to Specifications')
  if(spec.getType().getArgTypes().length)
    throw new Error('Cannot assign to a Specification that takes arguments.')
  if(spec.isConstructor)
    throw new Error(
      'Assigning to a ConstructorSpecification is not supported')
  this.name = name
  this.outputFile = util.getOutputFile()
  this.callingFile = util.getCallingFile()
  this.spec = spec
  this.solution = false
  this.isAssignment = true
  var contents = fileContext.getFileContents()
  var specType = spec.getType()
  if(specType.getArgTypes().length)
    throw new Error('Cannot assign to a specification that takes arguments')
  if('contextType' in specType)
    throw new Error(
      'Cannot assign to a specification that takes a context')
  this.type = specType.returnType
  contents.addName(this.name, this)
  if(!fileContext.getFileOptions().shouldRunTest(name)) {
    contents.blocks.push('// Skipped ' + name)
    return
  }
  this.solution = !!spec.solution
  tap.log(this.solution, this.name)
  if(this.solution)
    contents.blocks.push(this.toCode())
  else contents.blocks.push('// Failed ' + this.name)
  // Add requirement:
  var dep = this.assignment || this.spec
  if(dep.callingFile === this.callingFile) return
  var ijsObject = require(dep.callingFile)
    , path = util.findObjectPath(ijsObject, dep)
  if(path === undefined)
    throw new Error(
      'Failed to find ' + dep + ' in exports for ' + dep.callingFile)
  var objPath = (path || []).join('.')
  contents.addRequirements([new Requirement(
    dep.name,
    dep.alias,
    true, // isRelative
    dep.outputFile,
    null, // depObject
    objPath)
  ])
}

Assignment.prototype.toCode = function() {
  return this.assignment ?
    'var ' + this.name + ' = ' + this.assignment.name :
    'var ' + this.name + ' = ' + this.spec.name + '()'
}

Assignment.prototype.toString = function() {
  return this.name
}

module.exports = Assignment
