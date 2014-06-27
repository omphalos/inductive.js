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

BuildingBlockUsage.prototype.values = function() {
  var spec = this.specification
  var valExpressions = [].slice.apply(arguments).map(function(arg) {
    var code = util.valueToCode(arg)
      , result = new ValueExpression(code)
    result.as(code)
    result.returns(typeUtil.jsObjToType(arg, spec.recordTypesBySignature))
    return result
  })
  spec.expressions = spec.expressions.concat(valExpressions)
}

BuildingBlockUsage.prototype.value = function(v) { return this.values(v) }

BuildingBlockUsage.prototype.functionExpression = function() {
  var fnType = DeferredApiCall.callChildren(arguments, function() {
    if(arguments.length) throw new Error('Invalid arguments')
    return new FunctionType()
  })
  this.specification.use(new FunctionExpression('fn', fnType))
}

BuildingBlockUsage.prototype.accumulator = function(seed) {
  this.specification.recursion = 'accumulator'
  this.specification.seedType =
    this.resolveType(seed, this.recordTypesBySignature)
  this.specification.seedCode = util.valueToCode(seed)
}

BuildingBlockUsage.prototype.recursion = function(seed) {
  this.specification.recursion = 'simple'
  delete this.specification.seedCode
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
  fnType = this.resolveType(fnType)
  var callEx = new CallExpression(fnType)
  this.specification.use(callEx)
}

BuildingBlockUsage.prototype.match = function() {
  var types = [].slice.apply(arguments).map(this.resolveType.bind(this))
    , matchExpression = new MatchExpression(types)
  this.specification.use(matchExpression)
}

BuildingBlockUsage.prototype.resolveType = function(type) {
  return this.specification.resolveType(type)
}

BuildingBlockUsage.prototype.matchArguments = function() {
  this.specification.useArgumentsMatch = true
}

BuildingBlockUsage.prototype.member = function(memberName, recordType) {
  this.specification.memberBuildingBlocks.push({
    name: memberName,
    record: recordType ? this.resolveType(recordType) : null
  })
}

BuildingBlockUsage.prototype.memberUpdate = function() {
  var args = [].slice.apply(arguments)
    , last = args[args.length - 1]
  this.specification.memberUpdateBuildingBlocks.push(
    last instanceof RecordType ?
      {
        names: args.slice(0, args.length - 1),
        record: this.resolveType(last)
      } :
      { names: args })
}

BuildingBlockUsage.prototype.memberCall = function(memberName, recordType) {
  this.specification.memberCallBuildingBlocks.push({
    name: memberName,
    record: recordType ? this.resolveType(recordType) : null
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
