'use strict'

var FunctionExpression = require('./FunctionExpression.js')
  , RecordType = require('../types/RecordType.js')
  , objectConstructor = require('../NativeConstructor.js').objectConstructor

function ConstructorExpression(spec, functionType) {
  var self = this
    , name = spec.name
  if(functionType.contextType)
    throw new Error('Constructor ' + name + ' cannot take "this"')
  if(!(functionType.returnType instanceof RecordType))
    throw new Error(
      'Constructor  ' + name +
      ' return type must be a record, but was ' + functionType.returnType)
  FunctionExpression.call(self, name, functionType)
  self.args.length = 0
  self.spec = spec
  if(spec.base.isSpecification && spec.base.isConstructor) {
    var baseType = spec.base.getType()
    baseType.arg.children.forEach(function(child) {
      self.takes(child)
    })
    spec.baseProps.forEach(function(prop) {
      var baseObjProps = baseType.returnType.children
      for(var i = 0; i < baseObjProps.length; i++)
        if(baseObjProps[i].name === prop)
          return
      throw new Error(
        "Property " + prop + " not in base object's properties")
    })
  }
  functionType.returnType.children.forEach(function(child) {
    if(spec.baseProps && spec.baseProps.indexOf(child.name) >= 0) return
    self.takes(child.type)
  })
}
ConstructorExpression.prototype = Object.create(FunctionExpression.prototype)
ConstructorExpression.prototype.constructor = ConstructorExpression

ConstructorExpression.prototype.filterType = function() {
  var result = FunctionExpression.prototype.filterType.apply(
    this, arguments)
  result.spec = this.spec
  return result
}

ConstructorExpression.prototype.toCode = function(children, varCount, term) {
  var self = this
    , bindLength = self.bindingTypes.length - (self.contextType ? 1 : 0)
    , params = self.bindingTypes.slice(0, bindLength)
    , args = params.map(function(a, i) { return 'arg' + (i + varCount) })
    , callBaseCode = ''
    , newCheckCode = ''
    , baseArgLength = 0
    , indent = term ? '  ' : ''
  if(self.spec.base.isSpecification && self.spec.base.isConstructor) {
    callBaseCode = indent + '  ' + self.spec.base.name + '.call(this'
    self.spec.base.solution.type.arg.children.forEach(function(_, index) {
      var child = children[index]
        , code = child.expr.toCode(child.children, child.varCount, term)
      callBaseCode += ', ' + code
    })
    callBaseCode += ');\n'
    baseArgLength = self.spec.base.solution.type.arg.children.length
  }
  var childrenCode = indent + '  ' + children.filter(function(child, index) {
    return index >= baseArgLength
  }).map(function(child, index) {
    var nonBaseProps = self.type.returnType.children.filter(function(c) {
      return !self.spec.baseProps || self.spec.baseProps.indexOf(c.name) < 0
    })
    return 'this[' + JSON.stringify(nonBaseProps[index].name) + '] = ' +
      child.expr.toCode(child.children, child.varCount, term)
  }).join('\n  ' + indent)
  // Currently, recursive constructors are not supported, so
  // no termination check or seed code is needed.
  var code =
    indent + 'function ' + self.name + '(' + args.join(', ') + ') {\n' +
    newCheckCode +
    callBaseCode +
    childrenCode + '\n' +
    indent + '}\n'
  if(self.spec.base !== objectConstructor) {
    code += '\n' +
      indent + self.name + '.prototype = ' + 
        'Object.create(' + self.spec.base.name + '.prototype)\n' +
      indent + self.name + '.prototype.constructor = ' + self.name + '\n'
  }
  if(term) {
    code = '(function() {\n' +
      code +
      '  return ' + self.name + '\n' +
      '})()'
  }
  return code
}

module.exports = ConstructorExpression
