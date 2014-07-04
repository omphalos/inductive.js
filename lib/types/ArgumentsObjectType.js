var ParameterizedType = require('./ParameterizedType.js')
  , TypeParameter = require('./TypeParameter.js')

function ArgumentsObjectType() {
  ParameterizedType.call(this, [new TypeParameter('a')], 'Arguments')
  this.defaultTo(function() {
    return (function() { return arguments })()
  })
}
ArgumentsObjectType.prototype = Object.create(ParameterizedType.prototype)
ArgumentsObjectType.prototype.constructor = ArgumentsObjectType

ArgumentsObjectType.prototype.isArgumentsObjectType = true

ArgumentsObjectType.prototype.habitationTemplate =[
  '(function(candidate) {',
  '  return candidate instanceof Object && ' + 
    '"callee" in candidate && "length" in candidate && ',
    'candidate.constructor.name === "Object"',
  '})(@candidate)'
].join('\n')

module.exports = ArgumentsObjectType
