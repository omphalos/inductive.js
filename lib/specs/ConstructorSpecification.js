var Specification = require('./Specification.js')
  , objectConstructor = require('../NativeConstructor.js').objectConstructor
  , ctorUtil = require('../ctorUtil.js')
  , RecordType = require('../types/RecordType.js')
  , RecordProperty = require('../types/RecordProperty.js')

function ConstructorSpecification(name) {
  this.isConstructor = true
  Specification.call(this, name)
  this.fn = eval('(function ' + name + '() {})')
  this.base = objectConstructor
  this.baseProps = []
  Object.defineProperty(this, 'recursion', { value: '', enumerable: true })
  this.id = ctorUtil.register(this)
}
ConstructorSpecification.prototype = Object.create(Specification.prototype)
ConstructorSpecification.prototype.constructor = ConstructorSpecification

ConstructorSpecification.prototype.inherit = function(base) {
  if(!(base instanceof ConstructorSpecification))
    throw new Error(
      'Only inheriting from a ConstructorSpecification is supported.')
  this.base = base
  // baseProps are the properties that we let the base constructor func.
  this.baseProps = [].slice.call(arguments, 1)
}

ConstructorSpecification.prototype.toString = function() {
  return 'new ' + Specification.prototype.toString.apply(this, arguments)
}

ConstructorSpecification.prototype.instantiate = function(obj) {
  var result = Object.create(this.fn.prototype)
  var returnType = this.solution ?
    this.solution.type.returnType :
    this.inferReturnType()
  returnType.children.forEach(function(child) {
    result[child.name] = obj && child.name in obj ?
      obj[child.name] :
      child.type.getDefault()
  })
  if(obj) {
    Object.keys(obj).forEach(function(key) {
      if(key in result) return
      throw new Error('Unexpected property: ' + key)
    })
  }
  return result
}

ConstructorSpecification.prototype.inferReturnType = function() {
  var returnType = Specification.prototype.inferReturnType.apply(this, arguments)
  if(!(returnType instanceof RecordType)) {
    throw new Error(
      'Unable to infer a record type for the return value of constructor ' +
      this.name)
  }
  var result = new RecordType([])
  result.children = returnType.children.map(function(c) {
    return new RecordProperty(result, c.type, c.name)
  })
  result.ctor = this
  return result
}

ConstructorSpecification.prototype.test =
  function(fn, mocksContainers, suppressRethrow) {
  var ctorFn = !fn ? fn : function() {
    var result = Object.create(fn.prototype)
    fn.apply(result, arguments)
    return result
  }
  return Specification.prototype.test.call(
    this, ctorFn, mocksContainers, suppressRethrow)
}

ConstructorSpecification.prototype.shouldReturn = function(expectedValue) {
  if(!(expectedValue instanceof Object))
    throw new Error('ConstructorSpecification only supports returning records')
  var constructedObj = new this.specification.fn()
  Object.keys(expectedValue).forEach(function(key) {
    constructedObj[key] = expectedValue[key]
  })
  return Specification.prototype.shouldReturn.call(this, constructedObj)
}

module.exports = ConstructorSpecification
