var inductive = require('../../../lib/inductive.js')
  , shouldReturn = inductive.shouldReturn
  , specify = inductive.specify
  , use = inductive.use
  , given = inductive.given
  , value = inductive.value
  , requires = inductive.requires
  , as = inductive.as
  , takes = inductive.takes
  , context = inductive.context
  , returns = inductive.returns
  , express = inductive.express
  , assign = inductive.assign
  , specifyConstructor = inductive.specifyConstructor
  , givenNoArgs = inductive.givenNoArgs
  , members = inductive.members
  , protoMember = inductive.protoMember
  , inherit = inductive.inherit

var childSiblingComponent = require('./childSiblingComponent.i.js')

var nativeSubtract = express('nativeSubtract',
  takes(Number),
  takes(Number),
  returns(Number),
  as('nativeChild(@Number, @Number)'),
  requires('esprima'),
  requires('./nativeChild.js'))

var xFn = specify('xFn',
  givenNoArgs(
    shouldReturn(555)),
  use(value(555)))

var x = assign('x', xFn)

var Human = specifyConstructor('Human',
  given('abe', 'lincoln',
    shouldReturn({ first: 'abe', last: 'lincoln' })))

var fullName = specify('fullName',
  givenNoArgs(
    context(Human.instantiate({ first: 'abe', last: 'lincoln' })),
    shouldReturn('abe lincoln')),
  use('String+',
    value(' '),
    members()))

protoMember(Human, fullName)

specifyConstructor('President',
  inherit(Human, 'first', 'last'),
  given('abe', 'lincoln', 10,
    shouldReturn({ first: 'abe', last: 'lincoln', pay: 10 })))

specify('callNativeSubtract',
  given(10, 3, shouldReturn(7)),
  use(nativeSubtract))

specify('moduloMinusOne',
  given(10, 3, shouldReturn(0)),
  given(11, 3, shouldReturn(1)),
  use(childSiblingComponent.modulo, '-1'))

module.exports = x
