require('../../lib/inductive.js').globals()

var getElement0 = specify('getElement0',

  when(
    takes(Array),
    returns(unionType(undefined, typeParameter('a'))),

    given([1, 2, 3], shouldReturn(1)),
    given([], shouldReturn(undefined))),

  use('Array.element', values(0)))

var sliceUpTo = specify('sliceUpTo',

  when(
    takes(Array),
    takes(Number),
    returns(Array),

    given([1, 2, 3], 2, shouldReturn([1, 2]))),

  use('Array.slice2', values(0)))

var safeSliceUpTo = specify('safeSliceUpTo',

  when(
    takes(Array),
    takes(Number),
    returns(Array),

    given([1, 2, 3], -1, shouldReturn([])),
    given([1, 2, 3, 4, 5, 6, 7, 8], -1, shouldReturn([])),
    given([1, 2, 3], 1, shouldReturn([1])),
    given([1, 2, 3], 2, shouldReturn([1, 2])),
    given([1, 2, 3], 3, shouldReturn([1, 2, 3])),
    given([1, 2], 2, shouldReturn([1, 2])),
    given([1, 2, 3], 4, shouldReturn([1, 2, 3]))),

  use(sliceUpTo, '?:', 'Number<', values(0)))

var first = specify('first',

  when(
    takes(null),
    takes(undefined),
    returns(undefined),

    given(null, undefined, shouldReturn(undefined))),

  when(
    takes(null),
    takes(Number),
    returns(undefined),

    given(null, 3, shouldReturn(undefined))),

  when(
    takes(Array),
    takes(Number),
    returns(Array),

    given([1, 2, 3], -1, shouldReturn([])),
    given([1, 2, 3], 5, shouldReturn([1, 2, 3])),
    given([1, 2, 3], 2, shouldReturn([1, 2]))),

  when(
    takes(argumentsObjectType),
    takes(Number),
    returns(Array),

    given(asArguments([1, 2, 3]), -1, shouldReturn([])),
    given(asArguments([1, 2, 3]), 5, shouldReturn([1, 2, 3])),
    given(asArguments([1, 2, 3]), 2, shouldReturn([1, 2]))),

  when(
    takes(argumentsObjectType),
    takes(undefined),
    returns(
      unionType(
        undefined,
        typeParameter('a')),

    given(asArguments([]), undefined, shouldReturn(undefined))),
    given(asArguments([1, 2, 3]), undefined, shouldReturn(1))),

  when(
    takes(Array),
    takes(undefined),
    returns(
      unionType(
        undefined,
        typeParameter('a')),

    given([], undefined, shouldReturn(undefined))),
    given([1, 2, 3], undefined, shouldReturn(1))),

  setOptions({ maxAstNodes: 25 }),

  use(
    'Array.fromArguments',
    matchArguments(),
    getElement0,
    safeSliceUpTo,
    value(undefined)),
  ignore(argumentsObjectType, Number))

var UnderscoreCtor = specifyConstructor('UnderscoreCtor',
  given(undefined, shouldReturn({ _wrapped: undefined })),
  given([1, 2, 3], shouldReturn({ _wrapped: [1, 2, 3] })),
  given(asArguments([1, 2, 3]),
    shouldReturn({ _wrapped: asArguments([1, 2, 3]) })),
  given(asArguments([]), shouldReturn({ _wrapped: asArguments([]) })),
  given([], shouldReturn({ _wrapped: [] })))

var _ = specify('_',
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

  when(
    takesContext(UnderscoreCtor),
    takes(Number),
    returns(UnderscoreCtor),

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
      shouldReturn(UnderscoreCtor.instantiate({ _wrapped: [1] })))),

  use(first, UnderscoreCtor))

protoMember(UnderscoreCtor, _first, 'first')

saveAll()

