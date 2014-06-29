var ctorUtil = require('../ctorUtil.js')
  , Type = require('./Type.js')
  , typePlaceholder = require('./typePlaceholder.js')
  , nativeTypes = require('./nativeTypes.js')
  , RecordType = require('./RecordType.js')
  , util = require('../util.js')
  , ParameterizedType = require('./ParameterizedType.js')
  , UnionType = require('./UnionType.js')
  , DeferredApiCall = require('../DeferredApiCall.js')
  , FunctionType = require('./FunctionType.js')
  , functionTypings = []
  , objectsMarkedAsMaps = []
  , tap = require('../tap.js')
  , typeUtil = {}

typeUtil.asFunctionOfType = function() {
  var markedFnObj
  var fnType = DeferredApiCall.callChildren(arguments, function(fnObj) {
    markedFnObj = fnObj
    var fnType = new FunctionType()
    functionTypings.push({ fn: fnObj, type: fnType })
    return fnType
  })
  return markedFnObj
}

typeUtil.asMap = function(obj) {
  objectsMarkedAsMaps.push(obj)
  return obj
}

typeUtil.addTypes = function(types) {
  var result = types.
    reduce(function(prev, curr) {
      if(!curr)
        throw new Error('Cannot unite falselike types: ' + types.join('; '))
      if(prev === typePlaceholder) return curr
      if(curr === typePlaceholder) return prev
      var prevMatch = prev.containsType(curr, {})
        , currMatch = curr.containsType(prev, {})
      if(prevMatch && currMatch) return prev
      if(prevMatch) return prev
      if(currMatch) return curr
      if(prev.isSmallTypeFor(curr)) return prev
      if(curr.isSmallTypeFor(prev)) return curr
      if(prev instanceof ParameterizedType &&
        curr instanceof ParameterizedType &&
        prev.parent === curr.parent) {
        var result = new ParameterizedType(prev.children.map(function(_, i) {
          return typeUtil.addTypes([prev.children[i], curr.children[i]])
        }), prev.parent)
        return result
      }
      if(prev instanceof UnionType && curr instanceof UnionType)
        return prev.children.reduce(function(c, p) { return c.add(p) }, curr)
      else if(prev instanceof UnionType)
        return prev.add(curr)
      else if(curr instanceof UnionType)
        return curr.add(prev)
      else return new UnionType([prev, curr])
    }, typePlaceholder)
  return result
}

typeUtil.jsObjToRecordType = function(root, recordTypesBySignature) {

  if(!recordTypesBySignature)
    throw new Error('Missing recordTypesBySignature')

  util.objectGraphForEach(root, function(obj) {
    if(objectsMarkedAsMaps.indexOf(obj) >= 0) return

    // Set member names.
    var propNames = Object.keys(obj).sort()
      , ctor = ctorUtil.getSpecification(obj)

    // Constructors are used to resolve record types:
    var record = new RecordType(propNames, ctor)
      , signature = record.getSignature()

    // Set member types.
    propNames.forEach(function(propName, index) {
      var propType = typeUtil.jsObjToType(
        obj[propName], recordTypesBySignature)
      record.children[index].type = propType
    })

    if(recordTypesBySignature[signature]) {
      typeUtil.uniteRecords(
        recordTypesBySignature[signature], record, recordTypesBySignature)
    } else recordTypesBySignature[signature] = record
  })

  var rootProps = Object.keys(root)
    , rootCtor = ctorUtil.getSpecification(root)
    , signature = ctorUtil.getObjectSignatureFromArray(rootProps, rootCtor)
    , result = recordTypesBySignature[signature]

  if(!result) {
    tap.comment(
      'Failed to get record type for object', root,
      'with signature', signature)
    throw new Error('Failed to get record type for object')
  }
  return result
}

typeUtil.jsObjToType = function(obj, recordTypesBySignature) {
  if(!recordTypesBySignature)
    throw new Error('Missing recordTypesBySignature')
  if(typeof obj === 'boolean') return nativeTypes.booleanType
  if(typeof obj === 'number') return nativeTypes.numberType
  if(typeof obj === 'string') { return nativeTypes.stringType }
  if(obj === null) return nativeTypes.nullType
  if(obj === undefined) return nativeTypes.undefinedType
  if(obj instanceof Function) {
    for(var ft = functionTypings.length - 1; ft >= 0; ft--)
      if(functionTypings[ft].fn === obj)
        return typeUtil.resolveType(
          functionTypings[ft].type, recordTypesBySignature)
    tap.comment(obj)
    throw new Error("Must specify a function's type by calling fn().")
  }
  if(obj instanceof Array) {
    if(!obj.length) return nativeTypes.arrayType
    var elementType = obj.slice(1).reduce(function(prev, curr) {
      return typeUtil.addTypes([
        prev, typeUtil.jsObjToType(curr, recordTypesBySignature)
      ])
    }, typeUtil.jsObjToType(obj[0], recordTypesBySignature))
    return nativeTypes.arrayType.filterType({ a: elementType })
  }
  if(obj.isSpecification)
    // return obj.getType()
    return typeUtil.resolveType(obj.getType(), recordTypesBySignature)
  if(obj instanceof Object) {
    var isMap = objectsMarkedAsMaps.indexOf(obj) >= 0
    return isMap ?
      typeUtil.jsObjToMapType(obj, recordTypesBySignature) :
      typeUtil.jsObjToRecordType(obj, recordTypesBySignature)
  }
  throw new Error('type conversion not implemented for ' + obj)
}

typeUtil.jsObjToMapType = function(obj, recordTypesBySignature) {
  var vals = util.values(obj)
  if(!vals.length) return nativeTypes.mapType
  var typeOfValue = typeUtil.addTypes(vals.map(function(val) {
    return typeUtil.jsObjToType(val, recordTypesBySignature)
  }))
  return nativeTypes.mapType.filterType({ a: typeOfValue })
}

typeUtil.resolveType = function(type, recordTypesBySignature) {
  if(!recordTypesBySignature)
    throw new Error('missing recordTypesBySignature')

  // Get native resolution:
  var nativeResolution
  if(type instanceof Type) nativeResolution = type.resolveType([])
  else if(type === typePlaceholder) nativeResolution = typePlaceholder
  else if(type === Number) nativeResolution =  nativeTypes.numberType
  else if(type === Boolean) nativeResolution =  nativeTypes.booleanType
  else if(type === Date) nativeResolution =  nativeTypes.dateType
  else if(type === null) nativeResolution =  nativeTypes.nullType
  else if(type === undefined) nativeResolution =  nativeTypes.undefinedType
  else if(type === Error) nativeResolution =  nativeTypes.errorType
  else if(type === Array) nativeResolution =  nativeTypes.arrayType
  else if(type === String) nativeResolution =  nativeTypes.stringType
  else if(type.isSpecification) nativeResolution = type.getType().returnType
  else {
    tap.inspect('Unable to resolve type', type)
    throw new Error('Unable to resolve type: ' + type)
  }

  var recordTypes = typeUtil.getRecordTypes(nativeResolution)
  if(!recordTypes.length) return nativeResolution

  // Group records by signature:
  var grouped = util.groupBy(recordTypes, function(x) {
    return x.getSignature()
  })
  var signatures = Object.keys(grouped)
  signatures.forEach(function(signature) {
    var group = grouped[signature]
    if(recordTypesBySignature[signature]) return
    var value = group[0].createEmptyType()
    recordTypesBySignature[signature] = value
  })

  // Canonicalize the record
  var canonicalized = nativeResolution.canonicalize(recordTypesBySignature)
  signatures.forEach(function(signature) {
    var existing = recordTypesBySignature[signature]
      , group = grouped[signature]
    group.forEach(function(element) {
      var withCanonicalizedChildren =
        element.canonicalizeChildren(recordTypesBySignature)
      typeUtil.uniteRecords(
        existing, withCanonicalizedChildren, recordTypesBySignature)
    })
  })

  // Validate:
  var resolvedRecordTypes = typeUtil.getRecordTypes(canonicalized)
  resolvedRecordTypes.forEach(function(rr) {
    var sig = rr.getSignature()
    if(recordTypesBySignature[sig] !== rr)
      throw new Error('Found uncanonicalized record for ' + sig)
  })
  return canonicalized
}

typeUtil.getRecordTypes = function(target) {
  if(target === typePlaceholder) return []
  return [target].concat(target.getDescendants()).filter(function(t) {
    return t instanceof RecordType
  })
}

typeUtil.uniteRecords = function(source, target, recordTypesBySignature) {
  source.children.forEach(function(child, index) {
    var targetType = target.children[index].type
    child.type = typeUtil.addTypes([child.type, targetType])
  })
}

module.exports = typeUtil