'use strict'


var inductive = require('../lib/inductive.js')
  , given = inductive.given
  , shouldReturn = inductive.shouldReturn
  , DeferredApiCall = inductive.model.DeferredApiCall
  , Specification = inductive.model.Specification
  , use = inductive.use
  , solve = inductive.solve

var add = declare('add',
  given(1, 2, shouldReturn(3)),
  use('Number+'))

var square = declare('square',
  given(3, shouldReturn(9)),
  use('*'))

var hypotenuse = declare('hypotenuse',
  given(3,  4, shouldReturn(5)),
  given(5, 12, shouldReturn(13)),
  given(7, 24, shouldReturn(25)),
  given(8, 15, shouldReturn(17)),
  use(add, square, 'Math.sqrt'))

var hypotenuseSquared = declare('hypotenuseSquared',
  given(3, 4, shouldReturn(25)),
  use(hypotenuse, square))

// Log dependencies
var specs = [add, square, hypotenuse, hypotenuseSquared]
specs.forEach(function(spec) {
  spec.specificationBuildingBlocks.forEach(function(dep) {
    console.log('# ' + spec.name + ' depends on ' + dep.name)
  })
})

console.log()

// Solve each spec
specs.forEach(function(spec) {
  solve(spec)
  console.log('# ' + spec.name + ' took ' + spec.solution.duration + 'ms')
})

// Emit code
specs.forEach(function(spec) {
  console.log()
  console.log(spec.solution.code)
})

function declare(name) {
  return DeferredApiCall.callChildren(arguments, function() {
    return new Specification(name || '')
  })
}
