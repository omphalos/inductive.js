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

var inductive = require('../lib/inductive.js').globals()
var util = require('../lib/util.js')
var s = specify('matchAndDouble1',
  given(1, 10, shouldReturn(11)),
  given(1, 'x', shouldReturn(null)),
  given('x', 1, shouldReturn(null)),
  given('a', 'b', shouldReturn('ab')),
  use('Number+', 'String+', value(null), matchArguments()))

// TODO handle `this`
// TODO handle middle undefined argument

var argTypes = s.inferFunctionType().arg.children.map(function(c, index) {
  return { index: index, argType: c }
})
var unionArgTypes = argTypes.filter(function(a) {
  return a.argType instanceof inductive.model.UnionType
})
var scenarioTypes = unionArgTypes.map(function(a) {
  return a.argType.children
})

// Need to perform manual match on the first argument
// After that, can match other items in the combo
// Should I shoehorn match expressions into this, or generalize refinement?

/*

match arg0 : (Number|String)
| Number ->
  match arg1 : (Number|String)
  | Number -> Number+(arg0, arg1)
  | String -> null
| String ->
  | Number -> null
  | String -> String+(arg0, arg1)

==============

match arg0 : (Number|String)
| Number -> Number+(arg0, arg0)
| String -> String+(arg0, arg0)

create
  MatchExpression returns (Number|String)
  takes arg0
  when returns Number, takes Number
  when returns String, takes String

*/

// TODO handle return types for partial argument signatures

util.cartesianProduct.apply(null, scenarioTypes).forEach(function(combo) {

  console.log()
  console.log('combo')

  var refinedTypeSignature = []
    , unionIndex = 0
  argTypes.forEach(function(at, index) {
    if(at.argType instanceof inductive.model.UnionType)
      refinedTypeSignature.push(combo[unionIndex++])
    else refinedTypeSignature.push(at.argType)
  })
  var unionArgIndex = 0
  argTypes.forEach(function(at) {
    if(!(at.argType instanceof inductive.model.UnionType)) return
    var unionArgType = unionArgTypes[unionArgIndex++]
      , returnTypeAtIndex = s.inferReturnType(refinedTypeSignature)
    console.log('  match arg' + at.index + ' returns ' + returnType)
    console.log('    takes arg' + at.index + ' : ' +  unionArgType)
    console.log('    when returns ' + returnType + ' takes ' + returnType)
  })
})

return
require('./testTypes.i.js')
require('./testSolves.i.js')
require('./testFiles.i.js')

