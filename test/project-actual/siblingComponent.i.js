var inductive = require('../../lib/inductive.js')
  , assign = inductive.assign
  , shouldReturn = inductive.shouldReturn
  , specify = inductive.specify
  , use = inductive.use
  , given = inductive.given
  , givenNoArgs = inductive.givenNoArgs
  , mock = inductive.mock
  , value = inductive.value

var chainedDependency = require('./chainedDependency.i.js')
  , hundred = chainedDependency.hundred
  , subtract = chainedDependency.subtract

var sum = specify('sum',
  given(1, 2, shouldReturn(3)),
  use('Number+'))

var subtract5 = specify('subtract5',
  given(11, shouldReturn(6)),
  use(subtract, value(5)))

var ninetyFive = specify('ninetyFive',
  givenNoArgs(shouldReturn(95), mock(hundred, 100)),
  use(hundred, subtract5))

var hundredAlias = assign('hundredAlias', hundred)

exports.sum = sum
exports.subtract5 = subtract5
exports.hundredAlias = hundredAlias
