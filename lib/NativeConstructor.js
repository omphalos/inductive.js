var ctorUtil = require('./ctorUtil.js')

function NativeConstructor(fn, base, factoryFn) {
  var self = this
  self.isConstructor = true
  self.fn = typeof fn === 'string' ?
    eval('(function ' + fn + '() {})') : fn
  self.name = self.fn.name
  self.id = ctorUtil.register(self)
  if(base) {
    if(!base.isConstructor)
      throw new Error('base should be a constructor: ' + base)
    self.base = base
  } else self.base = exports.objectConstructor
  self.factoryFn = factoryFn || function() {
    return Object.create(self.fn.prototype)
  }
}

NativeConstructor.prototype.toString = function() {
  return this.name
}

NativeConstructor.prototype.instantiate = function(obj) {
  if(!this.recordType)
    throw new Error('No record type specified for ' + this)
  var result = this.factoryFn()
  this.recordType.children.forEach(function(child) {
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

exports.NativeConstructor = NativeConstructor
exports.objectConstructor = new NativeConstructor(Object)
exports.arrayConstructor = new NativeConstructor(Array)
