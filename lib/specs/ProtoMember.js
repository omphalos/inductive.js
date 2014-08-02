'use strict'

var fileContext = require('../fileContext.js')
  , tap = require('../tap.js')
  , ctorUtil = require('../ctorUtil.js')

function ProtoMember(ctor, spec, memberName) {
  if(!ctor || !ctor.isConstructor)
    throw new Error(ctor + ' should be a Constructor')
  this.ctor = ctor
  this.spec = spec
  this.memberName = memberName
  var contents = fileContext.getFileContents()
  contents.addName(this.name, this)
  if(fileContext.getFileOptions().shouldRunTest(this.name)) {
    tap.log(ctor.solution && spec.solution, this.name)
    contents.blocks.push(this.name + ' = ' + this.spec.name)
  } else contents.blocks.push('// Skipped ' + this.name)
}

Object.defineProperty(ProtoMember.prototype, 'name', {
  enumerable: true,
  get: function() {
    return this.ctor.name + '.prototype.' + (this.memberName || this.spec.name)
  }
})

module.exports = ProtoMember
