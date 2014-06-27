var inductive = require('../../lib/inductive.js')
  , shouldReturn = inductive.shouldReturn
  , specify = inductive.specify
  , use = inductive.use
  , given = inductive.given
  , assign = inductive.assign
  , givenNoArgs = inductive.givenNoArgs
  , value = inductive.value

var subtract = specify('subtract',
  given(5, 3, shouldReturn(2)),
  use('-'))

var calcHundred = specify('calcHundred',
  givenNoArgs(shouldReturn(100)),
  use(subtract, value(150), value(50)))

var hundred = assign('hundred', calcHundred)

exports.subtract = subtract
exports.hundred = hundred
