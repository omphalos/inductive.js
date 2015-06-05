'use strict'

var util = require('../util.js')
  , ctorUtil = require('../ctorUtil.js')
  , typeUtil = require('../types/typeUtil.js')
  , ValueExpression = require('../expressions/ValueExpression.js')
  , MatchExpression = require('../expressions/MatchExpression.js')
  , objectConstructor = require('../NativeConstructor.js').objectConstructor
  , RecordType = require('../types/RecordType.js')
  , DeferredApiCall = require('../DeferredApiCall.js')
  , FunctionType = require('../types/FunctionType.js')
  , FunctionExpression = require('../expressions/FunctionExpression.js')
  , CallExpression = require('../expressions/CallExpression.js')

function BuildingBlockUsage(specification) {
  Object.defineProperty(this, 'specification', { value: specification })
}

BuildingBlockUsage.prototype.value = function(val, type) {
  var spec = this.specification
    , code = util.valueToCode(val)
    , valExpression = new ValueExpression(code)
    , typeFilters = {}
  var returnType = typeUtil.jsObjToType(val, type, typeFilters)
  if(Object.keys(typeFilters).length)
    throw new Error('Type parameters not allowed in value: ' +
      Object.keys(typeFilters).join(', '))

  valExpression.as(code)
  valExpression.returns(returnType)
  spec.expressions = spec.expressions.concat(valExpression)
}

BuildingBlockUsage.prototype.functionExpression = function() {
  var fnType = DeferredApiCall.callChildren(arguments, function() {
    if(arguments.length) throw new Error('Invalid arguments')
    return new FunctionType()
  })
  this.specification.use(new FunctionExpression('fn', fnType))
}

BuildingBlockUsage.prototype.recursion = function() {
  this.specification.recursion = true
}

;['functionExpressions', 'calls', 'matches',
  'objectCreates', 'members', 'memberCalls'
].forEach(function(wildcard) {
    BuildingBlockUsage.prototype[wildcard] = function() {
      if(arguments.length)
        throw new Error(wildcard + " doesn't support arguments")
      this.specification.wildcardBuildingBlocks[wildcard] = true
    }
  })

BuildingBlockUsage.prototype.call = function() {
  var fnType = DeferredApiCall.callChildren(arguments, function() {
    if(arguments.length) throw new Error('Invalid arguments')
    return new FunctionType()
  })
  var callEx = new CallExpression(fnType)
  this.specification.use(callEx)
}

BuildingBlockUsage.prototype.match = function() {
  var types = [].slice.apply(arguments).map(typeUtil.resolveType)
    , matchExpression = new MatchExpression(types)
  this.specification.use(matchExpression)
}

BuildingBlockUsage.prototype.member = function(memberName, recordType) {
  this.specification.memberBuildingBlocks.push({
    name: memberName,
    record: recordType || null
  })
}

BuildingBlockUsage.prototype.memberUpdate = function() {
  var args = [].slice.apply(arguments)
    , last = args[args.length - 1]
  this.specification.memberUpdateBuildingBlocks.push(
    last instanceof RecordType ?
      {
        names: args.slice(0, args.length - 1),
        record: last
      } :
      { names: args })
}

BuildingBlockUsage.prototype.memberCall = function(memberName, recordType) {
  this.specification.memberCallBuildingBlocks.push({
    name: memberName,
    record: recordType || null
  })
}

BuildingBlockUsage.prototype.objectCreate = function() {
  var props = [].slice.apply(arguments)
  var signature = ctorUtil.getObjectSignatureFromArray(
    props,
    objectConstructor)
  this.specification.objectCreateBuildingBlocks.push(signature)
}

module.exports = BuildingBlockUsage
