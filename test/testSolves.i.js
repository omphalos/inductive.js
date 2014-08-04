'use strict'

var inductive = require('../lib/inductive.js')
  , fileOptions = inductive.fileOptions
  , type = inductive.type
  , typeParameter = inductive.typeParameter
  , tap = inductive.tap
  , takes = inductive.takes
  , forConstructor = inductive.forConstructor
  , smallType = inductive.smallType
  , shouldReturn = inductive.shouldReturn
  , given = inductive.given
  , specify = inductive.specify
  , use = inductive.use
  , values = inductive.values
  , setOptions = inductive.setOptions
  , matches = inductive.matches
  , match = inductive.match
  , matchArguments = inductive.matchArguments
  , objectCreates = inductive.objectCreates
  , givenNoArgs = inductive.givenNoArgs
  , specifyConstructor = inductive.specifyConstructor
  , shouldSatisfy = inductive.shouldSatisfy
  , members = inductive.members
  , member = inductive.member
  , objectCreate = inductive.objectCreate
  , memberUpdate = inductive.memberUpdate
  , functionExpressions = inductive.functionExpressions
  , returns = inductive.returns
  , functionExpression = inductive.functionExpression
  , asMap = inductive.asMap
  , ignore = inductive.ignore
  , value = inductive.value
  , as = inductive.as
  , express = inductive.express
  , asFunctionOfType = inductive.asFunctionOfType
  , calls = inductive.calls
  , call = inductive.call
  , memberCalls = inductive.memberCalls
  , memberCall = inductive.memberCall
  , recursion = inductive.recursion
  , accumulator = inductive.accumulator
  , beforeAll = inductive.beforeAll
  , before = inductive.before
  , after = inductive.after
  , afterAll = inductive.afterAll
  , beforeEach = inductive.beforeEach
  , afterEach = inductive.afterEach
  , shouldThrow = inductive.shouldThrow
  , shouldNotThrow = inductive.shouldNotThrow
  , shouldNotReturn = inductive.shouldNotReturn
  , shouldNotSatisfy = inductive.shouldNotSatisfy
  , callback = inductive.callback
  , verify = inductive.verify
  , mock = inductive.mock
  , clock = inductive.clock
  , mockEach = inductive.mockEach
  , isolate = inductive.isolate
  , verifyNotCalled = inductive.verifyNotCalled
  , inherit = inductive.inherit
  , givenContext = inductive.givenContext
  , takesContext = inductive.takesContext
  , assign = inductive.assign
  , recordType = inductive.recordType
  , functionType = inductive.functionType
  , unionType = inductive.unionType
  , arrayType = inductive.arrayType
  , requires = inductive.requires
  , globalOptions = inductive.globalOptions

fileOptions.searchPath = null
fileOptions.stopOnFailure = true
fileOptions.termCheck = 10
fileOptions.throwCacheErrors = true
fileOptions.timeout = 0
fileOptions.verbosity = 0
fileOptions.testsToRun = null

var farenheit = smallType('farenheit', Number)
  , celsius = smallType('celsius', Number)

// Arguments
specify('fst',
  given(3,  4, shouldReturn(3)),
  given(5, 12, shouldReturn(5)))

specify('snd',
  given(3,  4, shouldReturn(4)),
  given(5, 12, shouldReturn(12)))

// Operators
specify('square',
  given(3, shouldReturn(9)),
  given(5, shouldReturn(25)),
  use('*'))

specify('voider',
  given(3, shouldReturn(undefined)),
  use('void'))

specify('isOdd',
  given(2, shouldReturn(false)),
  given(3, shouldReturn(true)),
  given(4, shouldReturn(false)),
  given(5, shouldReturn(true)),
  use('%', '===Number', values(1, 2)))

specify('isXGreaterThanYSquared',
  given(1, 0, shouldReturn(true)),
  given(2, 3, shouldReturn(false)),
  given(2, 1, shouldReturn(true)),
  given(9, 3, shouldReturn(false)),
  given(10, 3, shouldReturn(true)),
  use('*', 'Number>'))

specify('isPositiveOrOdd',
  given(-5, shouldReturn(true)),
  given(-4, shouldReturn(false)),
  given(-3, shouldReturn(true)),
  given(-2, shouldReturn(false)),
  given(-1, shouldReturn(true)),
  given(0, shouldReturn(false)),
  given(1, shouldReturn(true)),
  given(2, shouldReturn(true)),
  given(3, shouldReturn(true)),
  given(4, shouldReturn(true)),
  use('%', 'Number>', '||', values(0, 2)))

specify('cond',
  given(true, 1, 2, shouldReturn(1)),
  given(false, 1, 2, shouldReturn(2)),
  use('?:'))

specify('dynamicEquals',
  given(1, 1, true, true, shouldReturn(true)),
  given(1, 1, false, false, shouldReturn(true)),
  given(0, 1, false, false, shouldReturn(false)),
  given(1, 1, true, false, shouldReturn(false)),
  use('===Number', '===Boolean', '&&'))

// Unions
specify('returnUnion',
  given(1, shouldReturn(1)),
  given('str', shouldReturn('str')))

specify('getArraylength',
  given([1, 'two', 3, 'four'], shouldReturn(4)),
  use('Array.length'))

specify('matchAndDouble',
  given(1, shouldReturn(2)),
  given('a', shouldReturn('aa')),
  use('Number+', 'String+',
    matches()))

specify('matchExplicitAndDouble',
  given(1, shouldReturn(2)),
  given('a', shouldReturn('aa')),
  use('Number+', 'String+',
    match(Number, String)))

// String ... -> takes String | undefined
// Number ... -> takes Number | null

// String, String -> takes undefined
// String, Number -> takes String

// Number, Number -> takes null
// Number, String -> takes Number
/*
  match String | Number #arg0
  | String ->
    match String | Number #arg1
    | String -> undefined
    | Number -> String
  | Number ->
    match String | Number #arg1
    | String -> Number
    | Number -> null




  match arg0 returns String | Number | undefined | null
    takes arg0(String | Number)
    | String takes String | undefined
    | Number takes Number | null

  match arg1 returns String | undefined
    takes arg1(String | Number)
    | String takes undefined
    | undefined takes String

  match arg1 returns Number | null
    takes arg1(String | Number)
    | String takes Number
    | Number takes null

  ***

  match : (String | Number | undefined | null)
    takes ((String | Number),
    (String | undefined),
    (Number | null)) #arg0

  match : (String | undefined)
    takes ((String | Number),
    String,
    undefined) #arg1

  match : (Number | null)
    takes ((String | Number),
    Number,
    null) #arg1
*/
specify('matchArgs',
  given(2, 5, shouldReturn(null)),
  given(2, 'x', shouldReturn(2)),
  given('a', 'b', shouldReturn(undefined)),
  given('x', 1, shouldReturn('x')),
  use(values(null, undefined), matchArguments()))

specify('matchArgsAndAdd',
  given(2, 5, shouldReturn(7)),
  given(2, 'x', shouldReturn(null)),
  given('a', 'b', shouldReturn('ab')),
  given('x', 1, shouldReturn(null)),
  use('Number+', 'String+', value(null), matchArguments()))

specify('matchArgAndDouble',
  given(1, shouldReturn(2)),
  given('a', shouldReturn('aa')),
  use('Number+', 'String+', matchArguments()))

// Records
specify('pair',
  given(1, shouldReturn({ a: 1, b: 1 })),
  use(objectCreates()))

var testConstructor = specifyConstructor('Test',
  givenNoArgs(shouldReturn({})))

specify('nonObjectConstructor',
  given(1,
    shouldReturn(testConstructor.instantiate()),
    shouldSatisfy(function(x) { return x.constructor.name === 'Test' })),
  use(testConstructor))

specify('memberAccess',
  given({ name: 'test' }, shouldReturn('test')),
  use(members()))

specify('memberAccessExplicit',
  given({ name: 'test' }, shouldReturn('test')),
  use(member('name')))

specify('memberAccessExplicitType',
  given({ name: 'test' }, shouldReturn('test')),
  use(member('name', recordType('name'))))

specify('recordConstructor',
  given('test', shouldReturn({ name: 'test' })),
  use(objectCreates()))

specify('nestedRecordConstructorUseAfter',
  given('test', shouldReturn({ name: { name: 'test' } })),
  use(objectCreate('name')))

specify('nestedRecordConstructorUseBefore',
  use(objectCreate('name')),
  given('test', shouldReturn({ name: { name: 'test' } })))

specify('recordMatchExplicit',
  given({ name: 'abc' }, shouldReturn('abc')),
  given(null, shouldReturn(null)),
  use(
    member('name'),
    match(recordType('name'), null)))

specify('recordUpdate',
  given({ first: 'grover', last: 'cleveland', age: 100 },
    shouldReturn({ first: 'grover', last: 'super', age: 110 })),
  use(memberUpdate('last', 'age'), values('super', 110)))

specify('recordUpdateExplicitType',
  given({ first: 'grover', last: 'cleveland', age: 100 },
    shouldReturn({ first: 'grover', last: 'super', age: 110 })),
  use(
    memberUpdate('last', 'age', recordType('first', 'last', 'age')),
    values('super', 110)))

// Arrays
specify('arrayLength',
  given([1, 2, 3], shouldReturn(3)),
  given([1], shouldReturn(1)),
  use('Array.length'))

specify('arrayFilterEven',
  given([1, 2, 3, 4, 5, 6], shouldReturn([2, 4, 6])),
  use('Array.filter', '%', '===Number',
    values(2, 0),
    functionExpressions()))

specify('arrayMapSquare',
  given([1, 2, 3], shouldReturn([1, 4, 9])),
  use('Array.map', '*', functionExpressions()))

specify('arrayMapStringToNumber',
  given(['1', '22', '333'], shouldReturn([1, 2, 3])),
  use('Array.map', 'String.length', functionExpressions()))

specify('arrayMapSquareExplicitFunction',
  given([1, 2, 3], shouldReturn([1, 4, 9])),
  use(
    'Array.map',
    '*',
    functionExpression(
      takes(Number),
      returns(Number))))

specify('arraySum',
  given([1, 2, 3, 4], shouldReturn(10)),
  use('Array.reduce2', 'Number+', functionExpressions()))

// Maps
specify('basicMapAccess',
  given(asMap({ a: 1 }), 'a', shouldReturn(1)),
  given(asMap({ a: 1 }), 'missing', shouldReturn(undefined)),
  use('Map.get'))

specify('inMap',
  given(asMap({ a: 1 }), 'a', shouldReturn(true)),
  given(asMap({ a: 1 }), 'b', shouldReturn(false)),
  use('in'))

specify('unionMapAccess',
  given(asMap({ a: 1 }), 'a', shouldReturn(1)),
  given(asMap({ b: 'str' }), 'b', shouldReturn('str')),
  given(asMap({ a: 1 }), 'missing', shouldReturn(undefined)),
  use('Map.get'))

specify('unionWithUndefinedMapAccess',
  given(asMap({ a: 1 }), 'a', shouldReturn(1)),
  given(asMap({ b: undefined }), 'b', shouldReturn(undefined)),
  given(asMap({ a: 1 }), 'missing', shouldReturn(undefined)),
  use('OptionMap.get'))

specify('complexUnionWithUndefinedMapAccess',
  given(asMap({ a: 1 }), 'a', shouldReturn(1)),
  given(asMap({ b: 'str' }), 'b', shouldReturn('str')),
  given(asMap({ c: undefined }), 'c', shouldReturn(undefined)),
  given(asMap({ a: 1 }), 'missing', shouldReturn(undefined)),
  use('OptionMap.get'))

specify('keyLength',
  given(asMap({ a: 1, b: 1, c: 1 }), shouldReturn(3)),
  use('Array.length', 'Map.values'))

specify('constructMapFromArray',
  given([
    { key: 'a' },
    { key: 'b' }
  ], shouldReturn(asMap({ a: 'a', b: 'b' }))),
  use('ArrayToMap', 'Array.map', members(), functionExpressions()))

specify('constructMapFromArrayAndIgnore',
  given([
    { key: 'a' },
    { key: 'b' }
  ], shouldReturn(asMap({ a: 'a', b: 'b' }))),
  use('ArrayToMap', 'Array.map',
    member('key'),
    functionExpression(
      takes(recordType('key')),
      returns(String)),
    functionExpression(
      takes(String),
      returns(String))),
  ignore(
    functionType(
      takes(recordType('key')),
      returns(recordType('key')))))

specify('constructMapFromRecord',
  given({ key: 'a' },
    shouldReturn(asMap({ key: 'a' }))),
  use('RecordToMap'))

// Function types

var adder = specify('adder',
  given(3, 4, shouldReturn(7)),
  use('Number+'))

var multiplier = specify('multiplier',
  given(3, 4, shouldReturn(12)),
  use('*'))

var doubleIt = specify('doubleIt',
  given(1, shouldReturn(2)),
  use('Number+'))

specify('thunkSpec',
  givenNoArgs(shouldReturn(4)),
  use(value(4)))

specify('thunkCall',
  givenNoArgs(shouldReturn(4)),
  use(
    express('thunk',
      takes(functionType(returns(Number)), '@fn'),
      returns(Number),
      as("(function() { var arg = @fn(); return arg * arg; })()")),
    value(2),
    functionExpressions()))

specify('thunkCallWithExplicitFunction',
  givenNoArgs(shouldReturn(4)),
  use(
    express('thunk',
      takes(functionType(returns(Number)), '@fn'),
      returns(Number),
      as("(function() { var arg = @fn(); return arg * arg; })()")),
    value(2),
    functionExpression(returns(Number))))

specify('caller',
  given(2,
    asFunctionOfType(
      takes(Number),
      returns(Number),
      function double(x) { return x * 2 }),
    shouldReturn(8)),
  use(calls()))

specify('callerExplicit',
  given(2,
    asFunctionOfType(
      takes(Number),
      returns(Number),
      function double(x) {
        return x * 2
      }),
    shouldReturn(8)),
  use(call(takes(Number), returns(Number))))

var return4 = specify('return4',
  givenNoArgs(shouldReturn(4)),
  use(value(4)))

specify('specThunkCaller',
  given(return4, shouldReturn(4)),
  use(calls()))

specify('specReturner',
  given(return4,
    shouldReturn(return4)))

specify('specThunkCallerExplicit',
  given(return4, shouldReturn(4)),
  use(call(returns(Number))))

specify('specArgCaller',
  given(2, doubleIt, shouldReturn(8)),
  use(calls()))

specify('specArgCallerExplicit',
  given(2, doubleIt, shouldReturn(8)),
  use(call(takes(Number), returns(Number))))

specify('memberCaller',
  given({
    a: 1,
    b: 2,
    c: asFunctionOfType(returns(Number), function() {
      return this.a + this.b
    })
  }, shouldReturn(3)),
  use(memberCalls()))

specify('memberCallerExplicit',
  given({
    a: 1,
    b: 2,
    c: asFunctionOfType(returns(Number), function() {
      return this.a + this.b
    })
  }, shouldReturn(3)),
  use(memberCall('c')))

specify('memberCallerExplicitType',
  given({
    a: 1,
    b: 2,
    c: asFunctionOfType(returns(Number), function() {
      return this.a + this.b
    })
  }, shouldReturn(3)),
  use(memberCall('c', recordType('a', 'b', 'c'))))

var callOverOne = specify('callOverOne',
  given(0, doubleIt, shouldReturn(1)),
  given(1, doubleIt, shouldReturn(1)),
  given(2, doubleIt, shouldReturn(4)),
  given(3, doubleIt, shouldReturn(6)),
  use('?:', 'Number>=',
    value(1),
    calls()))

specify('factorialWithExplicitFunction',
  given(1, shouldReturn(1)),
  given(2, shouldReturn(2)),
  given(3, shouldReturn(6)),
  given(4, shouldReturn(24)),
  use('*', '-1',
    callOverOne,
    functionExpression(
      takes(Number),
      returns(Number)),
    recursion()))

specify('factorial',
  given(1, shouldReturn(1)),
  given(2, shouldReturn(2)),
  given(3, shouldReturn(6)),
  given(4, shouldReturn(24)),
  use('*', '-1',
    callOverOne,
    functionExpressions(),
    recursion()))

var chainSpecs = specify('chainSpecs',
  given(3, shouldReturn(36)),
  use('*', doubleIt))

specify('deepChainSpecs',
  given(3, shouldReturn(37)),
  use('+1', chainSpecs))

specify('listReverseWithArgMatch',
  given(
    null,
    null,
    shouldReturn(null)),
  given(
    null,
    { head: 2, tail: { head: 1, tail: null } },
    shouldReturn({ head: 2, tail: { head: 1, tail: null } })),
  given(
    { head: 1, tail: null },
    { head: 2, tail: null },
    shouldReturn({ head: 2, tail: { head: 1, tail: null } })),
  given(
    { head: 1, tail: null },
    null,
    shouldReturn({ head: 1, tail: null })),
  given(
    { head: 1, tail: { head: 2, tail: null } },
    null,
    shouldReturn({ head: 2, tail: { head: 1, tail: null } })),
  use(
    matchArguments(),
    members(),
    objectCreates()))

specify('listReverse',
  given(null, shouldReturn(null)),
  given({ head: 1, tail: null }, shouldReturn({ head: 1, tail: null })),
  given({ head: 1, tail: { head: 2, tail: null } },
    shouldReturn({ head: 2, tail: { head: 1, tail: null } })),
  use(
    accumulator(null),
    matches(),
    members(),
    objectCreates()))

specify('lifecycle',
  beforeAll(function() { this.str = '1' }),
  beforeEach(function() { this.str += '2' }),
  given(1, shouldReturn(1),
    before(function() { this.str += '3' }),
    after(function() { this.str += '4' })),
  given(2, shouldReturn(4),
    before(function() { this.str += '5' }),
    after(function() { this.str += '6' })),
  afterEach(function() { this.str += '7' }),
  afterAll(function() {
    var ok = this.str === '123472567'
    tap.log(ok, 'call before/after functions in order:', this.str)
  }),
  use('*'))

specify('satisfaction',
  returns(Number),
  given(1, shouldSatisfy(function(x) { return x === 2 })),
  given(3, shouldSatisfy('double 3 should be 6', function(x) {
    return x === 6
  })),
  use('Number+'))

specify('curry2',
  returns(functionType(takes(Number), returns(Number))),
  given(adder, 1, shouldSatisfy(function(c) { return c(3) === 4 })),
  use(
    functionExpression(
      takes(Number),
      returns(Number)),
    call(takes(Number), takes(Number), returns(Number))))

// Error handling
specify('createError',
  given('abc', shouldReturn(new Error('abc'))),
  use('new Error'))

specify('shouldThrow',
  returns(Number),
  given(1, shouldThrow(function(err) { return err.message === '123' })),
  use('throw', value('123')))

// Boundary checking for scenario specs
specify('returnUndefined',
  givenNoArgs(shouldReturn()),
  use(value(undefined)))

// Comparands
specify('returnGreaterThan',
  given(2, shouldReturn['>'](3)),
  use('Number+'))

// Inverse comparands
specify('returnNotLessThan',
  given(2, shouldNotReturn['<'](3)),
  use('Number+'))

// Approximation
specify('returnApprox',
  given(2.1, shouldReturn['~='](2)),
  given(2.1, shouldNotReturn['~='](2.11, 2)),
  given(2.133, shouldReturn['~='](2.1, 1)))

// Inversion
specify('returnNot',
  given(3,
    shouldNotReturn(3),
    shouldNotReturn(6)),
  use('Number+'))

specify('satisfyNot',
  returns(Number),
  given(3, shouldNotSatisfy(function(x) { return x < 6 })),
  use('Number+'))

specify('throwNot',
  returns(Number),
  given(1,
    shouldNotThrow(function(err) { return err.message === '555' }),
    as('not throw 555')),
  use('throw', value('123')))

// TypeParameter functions
specify('genericFn',
  takes(typeParameter('a')),
  returns(recordType(
    takes(typeParameter('a'), 'lhs'),
    takes(typeParameter('a'), 'rhs'))),
  given(1, shouldReturn({ lhs: 1, rhs: 1 })),
  use(objectCreates()))

specify('conditionalSlice',
  takes(Array),
  takes(Boolean),
  returns(Array),
  given([1, 2, 3], true, shouldReturn([1, 2, 3])),
  given([1, 2, 3], false, shouldReturn([])),
  use('?:', value([])))

specify('mockConsoleLog',
  givenNoArgs(
    shouldReturn(),
    mock('console.log',
      callback(function(arg) { console.log('# mocked', arg) }),
      verify('# hello'))),
  use('console.log', value('# hello')))

specify('mockUndefined',
  givenNoArgs(
    mock('console.log',
      verify('# hello'))),
  use('console.log', value('# hello')))

specify('mockLogTwice',
  givenNoArgs(
    shouldReturn(),
    mock('console.log',
      verify('# hello', as('log hello')),
      verify('# goodbye', as('log goodbye')))),
  use('console.log', ',',
    value('# hello'),
    value('# goodbye')))

specify('mockGetTime',
  givenNoArgs(
    before(function() { clock.set(new Date(123)) }),
    mock('new Date'),
    shouldReturn(new Date(123))),
  use('new Date'))

specify('mockGetTimeWithMockEach',
  mockEach('new Date',
    callback(function() { return new Date(123) })),
  givenNoArgs(shouldReturn(new Date(123))),
  givenNoArgs(shouldReturn(new Date(555)),
    mock('new Date', callback(function() { return new Date(555) }))),
  givenNoArgs(shouldReturn(new Date(123)),
    mock('new Date', verify(function() { return true }))),
  use('new Date'))

;(function mockAjaxTest() {

  var Deferred = recordType(forConstructor('Deferred'))

  var jQueryGetString = isolate('$.getString',
    takes(String, '@url'),
    takes(functionType(takes(String), returns(undefined)), '@fn'),
    returns(Deferred),
    as('$.get(@url, @fn)'))

  return specify('mockAjaxGet',
    returns(Deferred),
    given('url/of/resource/to/get',
      mock(jQueryGetString,
        callback(function callItBack(url, callbackFn) {
          callbackFn('contents')
          return Deferred.instantiate()
        }),
        verify('url/of/resource/to/get')),
      mock('console.logString',
        verify('contents'))),
    given('url/of/resource/to/get',
      mock(jQueryGetString,
        callback(function noCallback() {
          return Deferred.instantiate()
        }),
        verify('url/of/resource/to/get')),
      mock('console.logString',
        verifyNotCalled())),
    use(jQueryGetString, 'console.logString', functionExpressions()))
})()

;(function mockButtonClick() {

  var eventType = type('event')

  var onClick = isolate('onClick',
    takes(String),
    takes(functionType(takes(eventType), returns(undefined)), '@fn'),
    returns(undefined),
    as('$(@String).on("click", @fn)'))

  return specify('mockButtonClick',
    givenNoArgs(
      shouldReturn(undefined),
      mock(onClick,
        verify('#btn'),
        callback(function(id, fn) { fn() })),
      mock('console.logString',
        verify('click'))),
    use('console.logString',
      onClick,
      functionExpressions(),
      values('#btn', 'click')))
})()

;(function mockAddCssClass() {

  var jQueryAddClass = isolate('jQueryAddClass',
    takes(String),
    takes(String),
    returns(undefined),
    as('$(@String).addClass(@String)'))

  return specify('mockAddCssClass',
    given('#el', 'hilite',
      shouldReturn(undefined),
      mock(jQueryAddClass, verify('#el', 'hilite'))),
    use(jQueryAddClass))
})()

;(function mockLogFileContentsTest() {

  var readFileCallback = type('readFileCallback')
    , bufferType = recordType(forConstructor('Buffer'))

  var readFileCallbackFn = express('readFileCallbackFn',
    takes(
      functionType(
        takes(unionType(Error, bufferType)),
        returns(undefined)),
      '@fn'),
    returns(readFileCallback),
    as('function(error, contents) { (@fn)(error || contents) }'))

  var readFile = isolate('readFile',
    takes(String),
    takes(readFileCallback, '@callback'),
    returns(undefined),
    as('require("fs").readFile(@String, @callback)'))

  var bufferToString = express('bufferToString',
    takes(bufferType, '@Buffer'),
    returns(String),
    as('@Buffer.toString()'))

  return specify('mockLogFileContents',
    given('file-ok',
      shouldReturn(undefined),
      mock(readFile,
        callback(function(file, cont) {
          clock.setTimeout(function() {
            cont(null, new Buffer('contents'))
          })
        }),
        verify(function(file) { return file === 'file-ok' })),
      mock('console.logString',
        verify(function(arg) { return arg === 'contents' }))),
    given('file-error',
      shouldThrow('error'),
      mock(readFile,
        callback(function(file, callback) {
          clock.setTimeout(function() { callback(new Error('error')) })
        })),
      mock('console.logString',
        verifyNotCalled())),
    afterEach(clock.processEvents.bind(clock)),
    use('throwError', 'console.logString',
      readFile, readFileCallbackFn, bufferToString,
      matches(),
      functionExpressions()))
})()

specify('mockSpecs',
  given(3, shouldReturn(6)),
  given(4,
    mock(doubleIt,
      callback(function(x) { return 100 }),
      verify(function(arg) { return arg === 4 })),
    shouldReturn(100)),
  use(doubleIt))

var mockBase = specifyConstructor('mockBase',
  given(1, 2,
    mock('console.log', verify(2)),
    shouldReturn({ a: 1 })),
  use('console.log', ','))

specifyConstructor('mockChild',
  inherit(mockBase),
  given(1, 2,
    mock('console.log', verify(2)),
    shouldReturn({ a: 1, b: 2 })))

var specifyThis = specify('specifyThis',
  given(2,
    givenContext({ a: 1 }),
    shouldReturn(3)),
  use('Number+', members()))

specify('callThisSpec',
  given(2, { a: 1 }, shouldReturn(3)),
  use(specifyThis))

specify('mockThisSpec',
  given({ a: 1 }, 2, shouldReturn(3)),
  given({ a: 1 }, 2,
    shouldReturn(100),
    mock(specifyThis,
      callback(function() { return 100 }),
      verify(function(val) {
        return this && this.a === 1 && val === 2
      }))),
  use(specifyThis))

specify('callParamOnlyThisSpec',
  given(2, { a: 1 }, specifyThis, shouldReturn(3)),
  use(calls()))

specify('thisMatchArgAndDouble',
  given(4, givenContext({ a: 1 }), shouldReturn(5)),
  given('a', givenContext({ a: 1 }), shouldReturn(1)),
  use('Number+', matchArguments(), members()))

specify('memberThisCaller',
  given({
    a: 1,
    b: 2,
    c: asFunctionOfType(
      takesContext(recordType('a', 'b', 'c')),
      returns(Number),
      function() {
        return this.a + this.b
      })
  }, shouldReturn(3)),
  use(calls(), member('c')))

specify('memberThisCallerExplicit',
  given({
    a: 1,
    b: 2,
    c: asFunctionOfType(
      takesContext(recordType('a', 'b', 'c')),
      returns(Number),
      function() {
        return this.a + this.b
      })
  }, shouldReturn(3)),
  use(
    call(
      takesContext(recordType('a', 'b', 'c')),
      returns(Number)),
    member('c')))

specify('arrayFilterEvenThis',
  givenNoArgs(givenContext([1, 2, 3, 4, 5, 6]), shouldReturn([2, 4, 6])),
  use('Array.filter', '%', '===Number',
    values(2, 0),
    functionExpressions()))

specify('arrayFilterEvenThisExplicit',
  givenNoArgs(givenContext([1, 2, 3, 4, 5, 6]), shouldReturn([2, 4, 6])),
  use('%', '===Number',
    express('Array.filterThis',
      takes(arrayType.of(Number), '@array'),
      takes(
        functionType(
          takes(Number),
          returns(Boolean),
          takesContext(arrayType.of(Number))),
        '@fn'),
      returns(arrayType.of(Number)),
      as('@array.filter(@fn)')),
    values(2, 0),
    functionExpression(
      takesContext(arrayType.of(Number)),
      takes(Number),
      returns(Boolean))))

var fourSpec = specify('fourFn',
  givenNoArgs(shouldReturn(4)),
  use(value(4)))

var four = assign('four', fourSpec)

var mockAssignment = specify('mockAssignment',
  givenNoArgs(mock(four, 8), shouldReturn(8)),
  use(four))

specify('mockEachAssignment',
  mockEach(four, 8),
  givenNoArgs(shouldReturn(8)),
  use(four))

specify('mockChainSpecFromAssignment',
  givenNoArgs(
    shouldReturn(8),
    mock(mockAssignment, 8)),
  use(mockAssignment))

var anotherFour = assign('anotherFour', four)

specify('mockChainAssignmentFromAssignment',
  givenNoArgs(
    shouldReturn(6),
    mock(anotherFour, 6)),
  use(anotherFour))

var double2 = specify('double2',
  givenNoArgs(shouldReturn(4)),
  use(doubleIt, value(2)))

specify('mockDouble2Log',
  givenNoArgs(
    shouldReturn(4),
    mock('console.log', verify(2))),
  use(doubleIt, 'console.log', ',', value(2)))

var Person = specifyConstructor('Person',
  given('john', 'smith',
    shouldReturn({ first: 'john', last: 'smith' })))

var Employee = specifyConstructor('Employee',
  inherit(Person, 'first', 'last'),
  given('john', 'smith', 10,
    shouldReturn({ first: 'john', last: 'smith', pay: 10 })))

specify('fullName',
  givenNoArgs(
    givenContext(Person.instantiate({ first: 'john', last: 'smith' })),
    shouldReturn('john smith')),
  use('String+', members(), value(' ')))

specifyConstructor('FullyNamedPerson',
  given(Person.instantiate({ first: 'john', last: 'smith' }),
    shouldReturn({ fullName: 'john smith' })),
  use('String+', member('first'), member('last'), value(' ')))

specify('newPerson',
  given('george', 'washington',
    shouldReturn(Person.instantiate({
      first: 'george',
      last: 'washington'
    }))),
  use(Person))

specify('mockPersonWithCallback',
  given('george', 'washington',
    shouldReturn(Person.instantiate({ first: 'g', last: 'w' })),
    mock(Person,
      callback(function() {
        return Person.instantiate({ first: 'g', last: 'w' })
      }))),
  use(Person))

specify('mockPersonWithSpec',
  given('george', 'washington',
    shouldReturn(Person.instantiate({ first: '', last: '' })),
    mock(Person)),
  use(Person))

specify('mockPerson',
  given('george', 'washington',
    shouldReturn(Person.instantiate({ first: '', last: '' })),
    mock(Person)),
  use(Person))

specify('simpleInheritance',
  returns(Person),
  given('g', 'w', 2,
    shouldReturn(Employee.instantiate({ first: 'g', last: 'w', pay: 2 }))),
  use(Employee))

var mockConsoleLogNumber = specify('mockConsoleLogNumber',
  given(3, mock('console.log', verify(3))),
  use('console.log'))

specify('mockChain',
  given(20,
    mock('console.log',
      verify(40))),
  use(mockConsoleLogNumber, 'Number+'))

specify('rangeSpec',
  given(1, shouldReturn(1)),
  given(2, shouldReturn(3)),
  given(3, shouldReturn(6)),
  given(4, shouldReturn(10)),
  use('range', 'Array.reduce2', 'Number+', functionExpressions()))

specify('rangeOffsetSpec',
  given(1, shouldReturn(1)),
  given(2, shouldReturn(1024)),
  given(3, shouldReturn(59049)),
  given(4, shouldReturn(1048576)),
  use('rangeOffset', 'Array.tryReduce2', '*',
    value(10), functionExpressions()))

// Native constructor interop
specify('nativeFnCtorInstantiated',
  given(
    recordType(
      takes(String, 'message'),
      forConstructor((function NativeCtorTestFn() { }))).
      instantiate({ message: 'abc' }),
    shouldReturn('abc')),
  use(members()))

;(function() {
  function CtorFn() { }
  var ctor = recordType(
    takes(String, 'message'),
    forConstructor(CtorFn))
  return specify('nativeFnCtorNew',
    given(Object.create(CtorFn.prototype, {
      message: { value: 'abc', enumerable: true }
    }), shouldReturn('abc')),
    use(members()))
})()

specify('nativeStringCtor',
  given(
    recordType(
      takes(String, 'message'),
      forConstructor('NativeCtorTestString')).
      instantiate({ message: 'abc' }),
    shouldReturn('abc')),
  use(members()))

specify('nativeExpressionWithRequirementsCaller',
  given(1, 2, shouldReturn(-1)),
  use(express('nativeSubtract',
    takes(Number),
    takes(Number),
    returns(Number),
    requires('./nativeInterop.js'),
    as('nativeInterop.subtract(@Number, @Number)'))))

;(function() {
  var nativeInterop = require('./nativeInterop.js')
    , InteropPerson = nativeInterop.InteropPerson

  var recordForInteropPerson = recordType(
    takes(Number, 'age'),
    forConstructor(InteropPerson))

  var newInteropPerson = express('nativeConstruct',
    takes(Number),
    returns(recordForInteropPerson),
    requires('./nativeInterop.js'),
    as('new nativeInterop.InteropPerson(@Number)'))

  return specify('nativeConstructorWithRequirementsCaller',
    given(100,
      shouldReturn(recordForInteropPerson.instantiate({ age: 100 }))),
    use(newInteropPerson))
})()

var celsiusNumberToFarenheitNumber = specify('celsiusNumberToFarenheitNumber',
  given(100, shouldReturn(212)),
  given(0, shouldReturn(32)),
  use('*', 'Number+', values(9 / 5, 32)))

specify('celsiusToFarenheit',
  takes(celsius),
  returns(farenheit),
  given(100, shouldReturn(212)),
  given(0, shouldReturn(32)),
  use(
    celsiusNumberToFarenheitNumber,
    celsius.convertFrom,
    farenheit.convertTo))

var farenheitNumberToCelsiusNumber = specify('farenheitNumberToCelsiusNumber',
  given(212, shouldReturn(100)),
  given(32, shouldReturn(0)),
  use('*', '-', values(5 / 9, 32)))

specify('farenheitToCelsius',
  takes(farenheit),
  returns(celsius),
  given(212, shouldReturn(100)),
  given(32, shouldReturn(0)),
  use(
    farenheitNumberToCelsiusNumber,
    farenheit.convertFrom,
    celsius.convertTo))

specify('getCelsiusConstant',
  returns(celsius),
  givenNoArgs(shouldReturn(33)),
  use(
    express('celsius33',
      returns(celsius),
      as('33'))))

;(function() {
  // Test recursive object graph with small types.
  var recGraphType = recordType()
  recGraphType.takes(farenheit, 'head')
  recGraphType.takes(unionType(null, recGraphType), 'tail')
  return specify('recursiveTemperatureRecord',
    takes(recGraphType),
    returns(farenheit),
    given({ head: 1, tail: null }, shouldReturn(1)),
    given({ head: 1, tail: { head: 2, tail: null } }, shouldReturn(1)),
    use(member('head')))
})()

var recordCompat1 = specify('recordCompat1',
  givenNoArgs(
    shouldReturn({ a: 1 })),
  use(
    objectCreates(),
    value(1)))

specify('recordCompat2',
  givenNoArgs(
    shouldReturn({ a: 1 })),
  use(recordCompat1))

/* (this fails correctly)
specify('recordCompat3',
  givenNoArgs(
    shouldReturn({ a: 'x' })),
  use(recordCompat1, value('x')))
*/

specify('argumentsAsArray',
  returns(Array),
  given((function() { return arguments })(1, 2, 3),
    shouldReturn([1, 2])),
  use('Array.slice2', 'Array.fromArguments', values(0, 2)))

specify('hypotenuse',
  given(3,  4, shouldReturn(5)),
  given(5, 12, shouldReturn(13)),
  given(7, 24, shouldReturn(25)),
  given(8, 15, shouldReturn(17)),
  use('*', 'Number+', 'Math.sqrt'))

tap.log(globalOptions.maxAstNodes === 20, 'globalOptions.maxAstNodes === 20')
