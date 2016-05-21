require('../../lib/inductive.js').globals()

// globalOptions.uniqueTypeDetail = true

fileOptions.testsToRun = ['UnderscoreCtor', '_']

var getElement0 = specify('getElement0',

  takes(Array),
  takes(undefined),
  returns(
    unionType(
      undefined,
      typeParameter('a'))),

  given([1, 2, 3], undefined, shouldReturn(1)),
  given([], undefined, shouldReturn(undefined)),

  use('Array.element', value(0)))

var getArgument0 = specify('getArgument0',

  takes(argumentsArrayType),
  takes(undefined),
  returns(
    unionType(
      undefined,
      typeParameter('a'))),

  given(asArguments([1, 2, 3]), undefined, shouldReturn(1)),
  given(asArguments([]), undefined, shouldReturn(undefined)),

  use('Array.fromArguments', getElement0))

var sliceUpTo = specify('sliceUpTo',

  takes(Array),
  takes(Number),
  returns(Array),

  given([1, 2, 3], 2, shouldReturn([1, 2])),

  use('Array.slice2', value(0)))

var safeSliceUpTo = specify('safeSliceUpTo',

  takes(Array),
  takes(Number),
  returns(Array),

  given([1, 2, 3], -1, shouldReturn([])),
  given([1, 2, 3, 4, 5, 6, 7, 8], -1, shouldReturn([])),
  given([1, 2, 3], 1, shouldReturn([1])),
  given([1, 2, 3], 2, shouldReturn([1, 2])),
  given([1, 2, 3], 3, shouldReturn([1, 2, 3])),
  given([1, 2], 2, shouldReturn([1, 2])),
  given([1, 2, 3], 4, shouldReturn([1, 2, 3])),

  use(sliceUpTo, '?:', 'Number<', value(0)))

var safeSliceArgumentsUpTo = specify('safeSliceArgumentsUpTo',

  takes(argumentsArrayType),
  takes(Number),
  returns(Array),

  given(asArguments([1, 2, 3]), 2, shouldReturn([1, 2])),

  use('Array.fromArguments', safeSliceUpTo))

var first = specifyMatch('first',

  setOptions({
    maxAstNodes: 30
  }),

  specify('nullAndUndefinedToUndefined',
    given(null, undefined, shouldReturn(undefined))),

  specify('nullAndNumberToUndefined',
    given(null, 3, shouldReturn(undefined)),
    use(value(undefined))),

  safeSliceUpTo,
  safeSliceArgumentsUpTo,
  getElement0,
  getArgument0)

/*
  given(null, undefined, shouldReturn(undefined)),
  given(null, 3, shouldReturn(undefined)),
  given([1, 2, 3], -1, shouldReturn([])),
  given([1, 2, 3], 5, shouldReturn([1, 2, 3])),
  given([1, 2, 3], 2, shouldReturn([1, 2])),
  given(asArguments([1, 2, 3]), -1, shouldReturn([])),
  given(asArguments([1, 2, 3]), 5, shouldReturn([1, 2, 3])),
  given(asArguments([1, 2, 3]), 2, shouldReturn([1, 2])),
  given(asArguments([]), undefined, shouldReturn(undefined)),
  given(asArguments([1, 2, 3]), undefined, shouldReturn(1)),
  given([], undefined, shouldReturn(undefined)),
  given([1, 2, 3], undefined, shouldReturn(1)),

  use(
    'Array.fromArguments',
    matchArguments(),
    getElement0,
    safeSliceUpTo,
    value(undefined)),
  ignore(argumentsArrayType, Number))*/

var wrappedType = unionType(
  undefined,
  Array,
  argumentsArrayType,
  typeParameter('a'))

var UnderscoreCtor = specifyConstructor('UnderscoreCtor',
  takes(wrappedType),
  returnsRecordThat(takes(wrappedType, '_wrapped')),
  given(undefined, shouldReturn({ _wrapped: undefined })),
  given([1, 2, 3], shouldReturn({ _wrapped: [1, 2, 3] })),
  given(asArguments([1, 2, 3]),
    shouldReturn({ _wrapped: asArguments([1, 2, 3]) })),
  given(asArguments([]), shouldReturn({ _wrapped: asArguments([]) })),
  given('abc', shouldReturn({ _wrapped: 'abc' })),
  given([], shouldReturn({ _wrapped: [] })))

var _ = specify('_',
  setOptions({ verbosity: verbosityLevels.expression }),
  takes(unionType(undefined, Array, argumentsArrayType)),
  returns(UnderscoreCtor),
  given(undefined,
    shouldReturn(UnderscoreCtor.instantiate({ _wrapped: undefined }))),
  given([], shouldReturn(UnderscoreCtor.instantiate({ _wrapped: [] }))),
  given([1, 2, 3],
    shouldReturn(UnderscoreCtor.instantiate({ _wrapped: [1, 2, 3] }))),
  given(asArguments([]),
    shouldReturn(UnderscoreCtor.instantiate({ _wrapped: asArguments([]) }))),
  given(asArguments([1, 2, 3]),
    shouldReturn(
      UnderscoreCtor.instantiate({ _wrapped: asArguments([1, 2, 3]) }))),
  use(UnderscoreCtor))

var _first = specify('_first',

  setOptions({ verbosity: verbosityLevels.candidate }),

  takesContext(UnderscoreCtor),
  takes(Number),
  returns(unionType(UnderscoreCtor, typeParameter('a'))),

  given(
    context(UnderscoreCtor.instantiate({ _wrapped: asArguments([1]) })), 1,
    shouldReturn(UnderscoreCtor.instantiate({ _wrapped: [1] }))),

  given(
    context(UnderscoreCtor.instantiate({ _wrapped: undefined })), 1,
    shouldReturn(UnderscoreCtor.instantiate({ _wrapped: undefined }))),

  given(
    context(UnderscoreCtor.instantiate({ _wrapped: [] })), 1,
    shouldReturn(UnderscoreCtor.instantiate({ _wrapped: [] }))),

  given(
    context(UnderscoreCtor.instantiate({ _wrapped: [1, 2, 3] })), 1,
    shouldReturn(UnderscoreCtor.instantiate({ _wrapped: [1] }))),

  use(first, UnderscoreCtor))

protoMember(UnderscoreCtor, _first, 'first')

// TODO support both declarations
module.exports = _
exports.first = first

saveAll()

