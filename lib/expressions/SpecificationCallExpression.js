'use strict'

var Expression = require('./Expression.js')

function SpecificationCallExpression(specName, specType, isSpecCtor) {
  var self = this
  self.specName = specName
  self.specType = specType
  self.isSpecCtor = isSpecCtor
  Expression.call(self, self.isSpecCtor ?
    'new ' + self.specName :
    self.specName + '.call')
  var template = '('
  if(specType.contextType) {
    self.takes(specType.contextType, '@this')
    template += '@this'
  } else if(!self.isSpecCtor)
    template += 'null'
  specType.getArgTypes().forEach(function(argType, index) {
    self.takes(argType, '@' + index)
    if(template !== '(') template += ', '
    template += '@' + index
  })
  template += ')'
  self.as(template)
  self.returns(specType.returnType)
}
SpecificationCallExpression.prototype = Object.create(Expression.prototype)
SpecificationCallExpression.prototype.constructor = SpecificationCallExpression

SpecificationCallExpression.prototype.toCode = function(children, varCt, term) {
  var code = Expression.prototype.toCode.call(this, children, varCt, term)
  if(!term) {
    if(!this.isSpecCtor && !this.specType.contextType) {
      // Hack
      var result = this.specName + '(' + code.substring('(null, '.length)
      if(result[result.length - 1] !== ')') result += ')'
      return result
    }
    return this.name + code
  }
  var argTypes = this.specType.getArgTypes()
    , thisSpecArg = this.isSpecCtor ? [] : [0]
    , specName = this.specName
  var specArgs = thisSpecArg.concat(argTypes).map(function(a, index) {
    return 'specArg' + index
  })
  var delimitedSpecArgs = specArgs.join(', ')
  if(this.isSpecCtor)
    return (
      '(function(' + delimitedSpecArgs + ') {\n' +
      '  return mocksContainer.scenarioMocks["' + specName + '"] ?\n' +
      '    mocksContainer.scenarioMocks["' + specName + '"].fn.call(null' +
          (specArgs.length ? ', ' : '') + delimitedSpecArgs + ') :\n' +
      '    new ' + specName + '(' + delimitedSpecArgs + ')\n' +
      '})') + code
  else
    return (
      '(function(' + delimitedSpecArgs + ') {\n' +
      '  return mocksContainer.scenarioMocks["' + specName + '"] ?\n' +
      '    mocksContainer.scenarioMocks["' + specName + '"].fn.call(' +
          delimitedSpecArgs + ') :\n' +
      '    ' + specName + '.call(' + delimitedSpecArgs + ')\n' +
      '})') + code
}

SpecificationCallExpression.prototype.resolveType = function() {
  var resolved = Expression.prototype.resolveType.apply(this, arguments)
  resolved.specName = this.specName
  resolved.specType = this.specType
  resolved.isSpecCtor = this.isSpecCtor
  return resolved
}

SpecificationCallExpression.prototype.tryFilterType = function() {
  var resolved = Expression.prototype.tryFilterType.apply(this, arguments)
  if(!resolved) return null
  resolved.specName = this.specName
  resolved.specType = this.specType
  resolved.isSpecCtor = this.isSpecCtor
  return resolved
}

module.exports = SpecificationCallExpression
