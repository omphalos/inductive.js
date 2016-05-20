'use strict'


var inductive = require('../lib/inductive.js')
  , given = inductive.given
  , shouldReturn = inductive.shouldReturn
  , DeferredApiCall = inductive.model.DeferredApiCall
  , Specification = inductive.model.Specification
  , use = inductive.use

var add = declare('add',
  given(1, 2, shouldReturn(3)),
  use('Number+'))

var square = declare('square',
  given(3, shouldReturn(9)),
  use('*'))

var hypotenuse = declare('hypotenuse',
  given(3, 4, shouldReturn(5)),
  use(add, square))

var hypotenuseSquared = declare('hypotenuseSquared',
  given(3, 4, shouldReturn(25)),
  use(hypotenuse, square))

var deps = getSpecDependencies([add, square, hypotenuse, hypotenuseSquared])

function declare(name) {
  return DeferredApiCall.callChildren(arguments, function() {
    return new Specification(name || '')
  })
}

function getSpecDependencies(specs) {
  var deps = {}
  specs.forEach(function(spec) {
    spec.specificationBuildingBlocks.forEach(function(dep) {
      console.log(spec.name + ' has ' + dep.name)
    })
  })
}
