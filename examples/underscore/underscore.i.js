require('../../lib/inductive.js').globals()

/*
test('first', function() {
  equal(_.first([1, 2, 3]), 1, 'can pull out the first element of an array');
  equal(_([1, 2, 3]).first(), 1, 'can perform OO-style "first()"');
  deepEqual(_.first([1, 2, 3], 0), [], 'can pass an index to first');
  deepEqual(_.first([1, 2, 3], 2), [1, 2], 'can pass an index to first');
  deepEqual(_.first([1, 2, 3], 5), [1, 2, 3], 'can pass an index to first');
  var result = (function(){ return _.first(arguments); })(4, 3, 2, 1);
  equal(result, 4, 'works on an arguments object.');
  result = _.map([[1, 2, 3], [1, 2, 3]], _.first);
  deepEqual(result, [1, 1], 'works well with _.map');
  result = (function() { return _.first([1, 2, 3], 2); })();
  deepEqual(result, [1, 2]);

  equal(_.first(null), undefined, 'handles nulls');
  strictEqual(_.first([1, 2, 3], -1).length, 0);
});
*/

var getElement0 = specify('getElement0',
  takes(Array),
  returns(unionType(undefined, typeParameter('a'))),
  given([1, 2, 3], shouldReturn(1)),
  given([], shouldReturn(undefined)),
  use('Array.element', values(0)))

var sliceUpTo = specify('sliceUpTo',
  takes(Array),
  takes(Number),
  returns(Array),
  given([1, 2, 3], 2, shouldReturn([1, 2])),
  use('Array.slice2', values(0)))

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
  use(sliceUpTo, '?:', 'Number<', values(0, [])))

var first = specify('first',
  takes(unionType(null, Array, argumentsObjectType)),
  takes(unionType(Number, undefined)),
  returns(unionType(typeParameter('a'), Array, undefined)),

  setOptions({
    verbosity: 7,
    maxAstNodes: 17,
    timeout: 2000
  }),

// todo remove
// should use safeSliceUpTo for this
/*
correct matches
first : ((Arguments<#a> | Array<#a> | null), (Number | undefined)) -> (#a | Array<#a>) takes ((#a | Array<#a>))
  should be

matchArg : ('a | Array<'a>) takes ((Arguments<'a> | Array<'a> | null), ('a | Array<'a>), ('a | Array<'a>), ('a | Array<'a>)) #arg0
matchArg : ('a | Array<'a>) takes ((Number | undefined), ('a | Array<'a>), ('a | Array<'a>)) #arg1
matchArg : ('a | Array<'a>) takes ((Number | undefined), ('a | Array<'a>), ('a | Array<'a>)) #arg1
matchArg : ('a | Array<'a>) takes ((Number | undefined), ('a | Array<'a>), ('a | Array<'a>)) #arg1
*/
  given(asArguments([1, 2, 3]), 2, shouldReturn([1, 2])),

  // Handle undefined
  given(null, undefined, shouldReturn(undefined)),

  // Handle null
  given(null, 3, shouldReturn(undefined)),

  // Get first element
  given([1, 2, 3], undefined, shouldReturn(1)),
  given(asArguments([1, 2, 3]), undefined, shouldReturn(1)),

  // Pass a negative index
  given([1, 2, 3], -1, shouldReturn([])),
  given(asArguments([1, 2, 3]), -1, shouldReturn([])),

  // Pass an index
  given([1, 2, 3], 2, shouldReturn([1, 2])),
  given(asArguments([1, 2, 3]), 2, shouldReturn([1, 2])),

  // Pass an index that's too big
  given([1, 2, 3], 5, shouldReturn([1, 2, 3])),
  given(asArguments([1, 2, 3]), 5, shouldReturn([1, 2, 3])),

  use(
    'Array.fromArguments',
    matchArguments(),
    getElement0,
    safeSliceUpTo,
    value(undefined)))

/*
// _ should be wrapped
var _ = specifyConstructor('_',
  takes(unionType(null, typeParameter('a'), Array)),
  returns(
    recordType(
      takes(
        unionType(Array, typeParameter('a')),
        '_wrapped'))),
  given(null, shouldReturn({ _wrapped: null })),
  given([1, 2, 3], shouldReturn({ _wrapped: [1, 2, 3] })))

var _first = specify('_first',
  takesContext(_),
  takes(unionType(Number, undefined)),
  returns(_),
  given(undefined, givenContext(_.instantiate([1, 2, 3])),
    shouldReturn(_.instantiate(1))))

protoMember(_, _first, 'first')
*/

saveAll()

