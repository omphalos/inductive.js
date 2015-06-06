'use strict'

var ctorUtil = require('../ctorUtil.js')
  , Type = require('./Type.js')
  , nativeTypes = require('./nativeTypes.js')
  , RecordType = require('./RecordType.js')
  , UniqueType = require('./UniqueType.js')
  , util = require('../util.js')
  , ParameterizedType = require('./ParameterizedType.js')
  , UnionType = require('./UnionType.js')
  , DeferredApiCall = require('../DeferredApiCall.js')
  , FunctionType = require('./FunctionType.js')
  , tap = require('../tap.js')
  , typeUtil = {}

typeUtil.asArguments = function(arr) {
  return (function() { return arguments }).apply(null, arr)
}

typeUtil.distinctTypes = function(types) {
  var distinct = []
  types.forEach(function(type) {
    if(!(type instanceof Type)) {
      tap.comment('Non-type:', type)
      throw new Error('typeUtil.addTypes called without a Type: ' + type)
    }
    for(var d = 0; d < distinct.length; d++)
      if(distinct[d].equals(type)) return
    distinct.push(type)
  })
  return distinct
}

function asItemOfType(itemLabel, markedObjCollection, typeFactory) {
  return function() {
    var markedObj
    DeferredApiCall.callChildren(arguments, function(obj) {
      markedObj = obj
      var newEntry = { type: typeFactory() }
      newEntry[itemLabel] = obj
      markedObjCollection.push(newEntry)
      return newEntry.type
    })
    return markedObj
  }
}

typeUtil.addTypes = function(types) {
  if(!types.length) throw new Error('No types to add')
  var flattened = util.flatten(types.map(function(t) {
    return t instanceof UnionType ? t.children : [t]
  }))
  var distinctTypes = typeUtil.distinctTypes(flattened)
  if(distinctTypes.length === 1) return distinctTypes[0]
  return new UnionType(distinctTypes)
}

typeUtil.jsObjToRecordType = function(obj, traversed) {
  traversed = traversed || []
  var existingIndex = traversed.indexOf(obj)
  if(existingIndex >= 0) return traversed
  var propNames = Object.keys(obj).sort()
    , ctor = ctorUtil.getSpecification(obj)
    , recordType = new RecordType(ctor)
  traversed.push(recordType)
  propNames.forEach(function(propName) {
    var propType = typeUtil.jsObjToType(obj[propName], null, null, traversed)
    recordType.takesResolved(propType, propName)
  })
  return recordType
}

typeUtil.jsObjToType = function(obj, specifiedType, typeFilters, recs) {
  recs = recs || []
  // TODO turn these `if` statements into an injectable array
  if(specifiedType) {
    if(!typeFilters) throw new Error('Missing typeFilters')
    var specError = specifiedType.getInstanceError(obj, typeFilters)
    if(specError.length) {
      tap.comment(
        'Object of unexpected type:', util.toFriendlyInlineString(obj))
      specError.forEach(function(error) { tap.comment('  ' + error) })
      tap.comment('typeFilters (' + Object.keys(typeFilters).length + ')')
      Object.keys(typeFilters).forEach(function(key) {
        tap.comment('  ' + key + ': ' + typeFilters[key])
      })
      var messageType = specifiedType
      if(specifiedType.isTypeParameter && typeFilters[specifiedType.name])
        messageType = typeFilters[specifiedType.name]
      throw new Error('Expected object of type ' + messageType)
    }
    return specifiedType
  }

  if(typeof obj === 'boolean') return nativeTypes.booleanType
  if(typeof obj === 'number') return nativeTypes.numberType
  if(typeof obj === 'string') return nativeTypes.stringType
  if(obj === null) return nativeTypes.nullType
  if(obj === undefined) return nativeTypes.undefinedType
  if(obj instanceof Function)
    throw new Error(
      "Must specify a function's type using takes, takesContext, and returns")
  if(obj instanceof Array) {
    if(!obj.length) return nativeTypes.arrayType
    var distinct = typeUtil.distinctTypes(obj.map(function(el) {
      return typeUtil.jsObjToType(el, null, null, recs)
    }))
    if(distinct.length > 1) {
      tap.comment('Unable to infer type of array: [' + obj.join(', ') + ']')
      tap.comment('Array has multiple types: [' + distinct.join(', ') + ']')
      tap.comment(
        'Try specifying the array as a parameterized array' +
        ' or as array of unions')
      throw new Error('Unable to infer type of array')
    }
    return nativeTypes.arrayType.filterType({ a: distinct[0] })
  }
  if(obj.isSpecification)
    // return obj.getType()
    return typeUtil.resolveType(obj.getType())
  if(obj instanceof Object) {
    if(obj instanceof Number)
      throw new Error('Number objects are not supported')
    if(obj instanceof String)
      throw new Error('String objects are not supported')
    if(obj instanceof Boolean)
      throw new Error('Boolean objects are not supported')
    var isArgumentsArrayObject =
      'callee' in obj &&
      'length' in obj &&
      obj.constructor.name === 'Object'
    if(isArgumentsArrayObject) {
      if(!obj.length) return nativeTypes.argumentsArrayType
      var argElements = [].slice.call(obj)
      var distinct = typeUtil.distinctTypes(argElements.map(function(el) {
        return typeUtil.jsObjToType(el, null, null, recs)
      }))
      if(distinct.length > 1) {
        tap.comment('Unable to infer type of arguments: ['
          + argElements.join(', ') + ']')
        tap.comment('Arguments array has multiple types: [' +
          distinct.join(', ') + ']')
        tap.comment(
          'Try specifying the arguments array as' +
          ' a parameterized arguments type ' +
          ' or as an arguments array of unions')
        throw new Error('Unable to infer type of array')
      }
      return nativeTypes.argumentsArrayType.filterType({ a: distinct[0] })
    }
    return typeUtil.jsObjToRecordType(obj)
  }
  throw new Error('type conversion not implemented for ' + obj)
}

typeUtil.typeFiltersToString = function(typeFilters) {
  var keyValues = Object.keys(typeFilters).map(function(key) {
    return "'" + key + ': ' + typeFilters[key]
  }).join(', ')
  if(!keyValues) return '{}'
  return '{ ' + keyValues + ' }'
}

typeUtil.instantiateTypeParameters = function(type) {
  var typeFilters = {}
  type.getDescendants().forEach(function(d) {
    if(d.isTypeParameter)
      typeFilters[d.name] = new UniqueType(d.name)
  })
  return type.filterType(typeFilters)
}

/////////////////////
// Type resolution //
/////////////////////

FunctionType.prototype.takes = function(type) {
  this.takesResolved(typeUtil.resolveType(type))
}

FunctionType.prototype.returns = function(type) {
  this.returnsResolved(typeUtil.resolveType(type))
}

FunctionType.prototype.takesContext = function(contextType) {
  this.takesContextResolved(typeUtil.resolveType(contextType))
}

ParameterizedType.prototype.of = function() {
  return this.ofResolved.apply(this, [].map.call(arguments, function(a) {
    return typeUtil.resolveType(a)
  }))
}

RecordType.prototype.takes = function(type, name) {
  this.takesResolved(typeUtil.resolveType(type), name)
}

typeUtil.resolveType = function(type) {
  if(type instanceof Type) return type
  if(type === Number) return nativeTypes.numberType
  if(type === Boolean) return nativeTypes.booleanType
  if(type === Date) return nativeTypes.dateType
  if(type === RegExp) return nativeTypes.regExpType
  if(type === null) return nativeTypes.nullType
  if(type === undefined) return nativeTypes.undefinedType
  if(type === Error) return nativeTypes.errorType
  if(type === Array) return nativeTypes.arrayType
  if(type === String) return nativeTypes.stringType
  if(type.isSpecification) return type.getType().returnType
  tap.inspect('Unable to resolve type', type)
  throw new Error('Unable to resolve type: ' + type)
}

module.exports = typeUtil