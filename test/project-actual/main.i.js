var inductive = require('../../lib/inductive.js')
  , shouldReturn = inductive.shouldReturn
  , specify = inductive.specify
  , use = inductive.use
  , given = inductive.given
  , givenNoArgs = inductive.givenNoArgs
  , value = inductive.value
  , verify = inductive.verify
  , mock = inductive.mock
  , assign = inductive.assign
  , run = inductive.run

var nativeExpressions = require('./lib/nativeExpressions.i.js')
  , siblingComponent = require('./siblingComponent.i.js')
  , hundredAlias = siblingComponent.hundredAlias

var x = require('./lib/childComponent.i.js')

var hello =
  specify('hello',
    givenNoArgs(
      mock('console.log',
        verify('hello'))),
    use('console.log', value('hello')))

specify('getX',
  givenNoArgs(
    mock(x, 555),
    shouldReturn(555)),
  use(x))

specify('squareRootSum',
  given(4, 5, shouldReturn(3)),
  given(20, 5, shouldReturn(5)),
  use('Math.sqrt', siblingComponent.sum))

specify('squareXMinus5',
  given(11, shouldReturn(36)),
  use(siblingComponent.subtract5, '*'))

specify('nativeSubtracter',
  given(2, 3, shouldReturn(-1)),
  use(nativeExpressions.expressionForNativeChild))

specify('nativeCtorFactory',
  given(4,
    shouldReturn(nativeExpressions.recordForNativeCtor.instantiate({
      x: 4,
      y: 'abc'
    }))),
  use(nativeExpressions.newNativeCtor))

specify('referenceAliasedAssignment',
  givenNoArgs(
    shouldReturn(55),
    mock(hundredAlias, 55)),
  use(hundredAlias))

var ioDef =
  specify('ioDef',
    givenNoArgs(
      mock('console.log',
      verify(2))),
    use('console.log', value(2)))

assign('ioDefResult', ioDef)

run(hello)

exports.hello = hello
