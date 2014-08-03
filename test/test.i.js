'use strict'

console.log('\x1B[2J') // clear screen

var fs = require('fs')
  , inductive = require('../lib/inductive.js')
  , globalOptions = inductive.globalOptions

globalOptions.maxAstNodes = 20
globalOptions.recordTypeDetail = true
Error.stackTraceLimit = 20

var cacheFile = __dirname + '/.inductive.cache.json'
if(fs.existsSync(cacheFile)) fs.unlinkSync(cacheFile)

/*
var inductive = require('../lib/inductive.js').globals()
var util = require('../lib/util.js')
var s = specify('matchAndDouble1',
  given(1, undefined, 10, shouldReturn(11)),
  given(1, undefined, 'x', shouldReturn(null)),
  given('x', undefined, 1, shouldReturn(null)),
  given('a', undefined, 'b', shouldReturn('ab')),
  use(value('str')))

// TODO handle `this`
// TODO handle middle undefined argument

var argTypes = s.inferFunctionType().getInputTypes()
  , unionArgTypes = util.arrayOfType(argTypes, inductive.model.UnionType)
  , scenarioTypes = util.pluck(unionArgTypes, 'children')

// Need to perform manual match on the first argument
// After that, can match other items in the combo
// TODO handle return types for partial argument signatures

function addMatchArgExpressions(parent, argIndex, refinedArgTypes, target) {
  if(argIndex > argTypes.length) return
  var argType = argTypes[argIndex]
  if(!(argType instanceof inductive.model.UnionType))
    return addMatchArgExpressions(
      parent, argIndex + 1, refinedArgTypes.concat([argType]), target)
  var argName = 'arg' + argIndex
    , returnType = s.inferReturnType(refinedArgTypes)
    , matchExpression = {}
  matchExpression.parent = parent
  matchExpression.argName = argName
  matchExpression.returnType = returnType
  matchExpression.children = []
  matchExpression.children.push(argName)
  for(var c = 0; c < argType.children.length; c++) {
    var childType = argType.children[c]
      , childRefinedArgTypes = refinedArgTypes.concat([childType])
      , childReturnType = s.inferReturnType(childRefinedArgTypes)
    matchExpression.children.push(
      'when ' + childType + ' returns/takes ' + childReturnType)
    addMatchArgExpressions(
      matchExpression, argIndex + 1, childRefinedArgTypes, target)
  }
  target.push(matchExpression)
}

var target = []
addMatchArgExpressions('', 0, [], target)

return
*/
require('./testTypes.i.js')
require('./testSolves.i.js')
require('./testFiles.i.js')

