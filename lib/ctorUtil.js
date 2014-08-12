'use strict'

var ctorUtil = {}
  , ids = {}
  , cache = {}
  , tap = require('./tap.js')

ctorUtil.getUniqueName = function(ctor) {
  if(!ctor || !ctor.isConstructor)
    throw new Error('Must be a ctor: ' + ctor)
  return ctor.id ? (ctor.name + '^' + ctor.id) : ctor.name
}

ctorUtil.getSpecification = function(obj) {
  if(!obj || !obj.constructor) return null
  var candidates = cache[obj.constructor.name]
  for(var c = 0; c < candidates.length; c++)
    if(candidates[c].fn === obj.constructor)
      return candidates[c]
  tap.comment('ctorUtil cache:',
    Object.keys(cache), obj, obj.constructor)
  throw new Error('Cannot find ctor ' + obj.constructor.name)
}

ctorUtil.register = function(obj) {
  if(!cache[obj.name])
    cache[obj.name] = [obj]
  else cache[obj.name].push(obj)

  var id = ids[obj.name] || 0
  ids[obj.name] = id + 1
  return id
}

ctorUtil.unregister = function(name) {
  delete cache[name]
  delete ids[name]
}

ctorUtil.getObjectSignatureFromArray = function(names, ctor) {
  if(!ctor || !ctor.isConstructor) {
    tap.comment(ctor)
    throw new Error('ctor should be a constructor')
  }
  var keys = names.map(function(name) { return name + ':' + name.length })
    , ctorName = ctorUtil.getUniqueName(ctor)
  if(!keys.length) return ctorName
  return ctorName + ' ' + keys.sort().join(', ')
}

module.exports = ctorUtil
