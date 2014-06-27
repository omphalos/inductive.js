var inductive = require('../../../lib/inductive.js')
  , shouldReturn = inductive.shouldReturn
  , specify = inductive.specify
  , use = inductive.use
  , given = inductive.given
  , value = inductive.value

var modulo = specify('modulo',
  given(10, 3, shouldReturn(1)), use('%'))

module.exports.modulo = modulo
