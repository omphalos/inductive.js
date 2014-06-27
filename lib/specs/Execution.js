var fileContext = require('../fileContext.js')
  , tap = require('../tap.js')

function Execution(spec) {
  this.spec = spec
  this.name = 'run ' + this.spec.name
  var contents = fileContext.getFileContents()
  var specType = this.spec.getType()
  if(specType.arg.children.length)
    throw new Error(
      'Cannot run a Specification that takes arguments: ' + this.name)
  if(specType.contextType)
    throw new Error(
      'Cannot run a Specification that takes "this": ' + this.name)
  if(!fileContext.getFileOptions().shouldRunTest(this.name)) {
    contents.blocks.push('// Skipped ' + this.name)
    return
  }
  tap.log(this.spec.solution, this.name)
  if(this.spec.solution)
    contents.blocks.push(this.spec.name + '()')
  else contents.blocks.push('// Failed ' + this.name)
}

module.exports = Execution
