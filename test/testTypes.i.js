'use strict'

var inductive = require('../lib/inductive.js')
  , typeUtil = require('../lib/types/typeUtil.js')
  , tap = inductive.tap
  , functionType = inductive.functionType
  , takes = inductive.takes
  , returns = inductive.returns
  , argumentsTupleType = inductive.argumentsTupleType
  , parameterizedType = inductive.parameterizedType
  , mapType = inductive.mapType
  , arrayType = inductive.arrayType
  , nullType = inductive.nullType
  , undefinedType = inductive.undefinedType
  , forConstructor = inductive.forConstructor
  , type = inductive.type
  , typeParameter = inductive.typeParameter
  , recordType = inductive.recordType
  , unionType = inductive.unionType
  , argumentsArrayType = inductive.argumentsArrayType
  , smallType = inductive.smallType

/////////////////////////////////
// Test typeParameter subset checks. //
/////////////////////////////////

var a = type('A')
  , b = type('B')
  , c = type('C')

a.habitationTemplate = 'a'
b.habitationTemplate = 'b'
c.habitationTemplate = 'c'

var pa = typeParameter('a')
  , pb = typeParameter('b')
  , pc = typeParameter('c')
  , pd = typeParameter('d')
  , pe = typeParameter('e')
  , pf = typeParameter('f')
  , genericTree = recordType()
  , numberTree = recordType()
genericTree.takes(typeParameter('a'), 'value')
genericTree.takes(unionType(genericTree, null), 'lhs')
genericTree.takes(unionType(genericTree, null), 'rhs')
numberTree.takes(Number, 'value')
numberTree.takes(unionType(numberTree, null), 'lhs')
numberTree.takes(unionType(numberTree, null), 'rhs')

/* testTypeContains(true,
  unionType(argumentsArrayType, arrayType),
  unionType(argumentsArrayType.of(Number), arrayType)) */
testTypeContains(true, pa, a)
testTypeContains(false, a, pa)
testTypeContains(true, a, a)
testTypeContains(false, a, b)
testTypeContains(true, pa, pb)
testTypeContains(true,
  functionType(takes(a), returns(b)),
  functionType(takes(a), returns(b)))
testTypeContains(false,
  functionType(takes(a), returns(b)),
  functionType(takes(a), returns(a)))
testTypeContains(true, argumentsTupleType(a, b), argumentsTupleType(a, b))
testTypeContains(false, argumentsTupleType(a, b), argumentsTupleType(a, c))
testTypeContains(false, argumentsTupleType(a, b), argumentsTupleType(a, b, b))
testTypeContains(true, argumentsTupleType(pa, pb), argumentsTupleType(pc, pc))
testTypeContains(true, unionType(a, b), unionType(a, b))
testTypeContains(false, unionType(a, b), unionType(a, c))
testTypeContains(false, unionType(a, b), unionType(a, b, c))
testTypeContains(false, unionType(a, b), argumentsTupleType(a, b))
testTypeContains(false, argumentsTupleType(a, b), unionType(a, b))
testTypeContains(true, parameterizedType(pa, 'a'), parameterizedType(pa, 'a'))
testTypeContains(false,
  parameterizedType(pa, 'a'),
  parameterizedType(pa, pb, 'a'))
testTypeContains(false, parameterizedType(pa, 'a'), parameterizedType(pa, 'b'))
testTypeContains(true,
  argumentsTupleType(pa, pb, pc),
  argumentsTupleType(pd, pe, pf))
testTypeContains(true,
  argumentsTupleType(pa, pa, pb),
  argumentsTupleType(pc, pc, pd))
testTypeContains(false,
  argumentsTupleType(pa, pb, pb),
  argumentsTupleType(pc, pc, pd))
testTypeContains(false,
  argumentsTupleType(pa, a, pb),
  argumentsTupleType(pc, pd, pe))
testTypeContains(true,
  argumentsTupleType(pc, pd, pe),
  argumentsTupleType(pa, a, pb))
testTypeContains(true,
  argumentsTupleType(pa, pa, pb),
  argumentsTupleType(pa, pa, pc))
testTypeContains(false,
  argumentsTupleType(pa, pb, pb),
  argumentsTupleType(pa, pa, pb))
testTypeContains(true,
  argumentsTupleType(typeParameter('a'), typeParameter('a'), typeParameter('b')),
  argumentsTupleType(typeParameter('a'), typeParameter('a'), typeParameter('c')))
testTypeContains(false,
  argumentsTupleType(typeParameter('a'), typeParameter('b'), typeParameter('b')),
  argumentsTupleType(typeParameter('a'), typeParameter('a'), typeParameter('b')))
testTypeContains(true, parameterizedType(pb, 'a'), parameterizedType(c, 'a'))
testTypeContains(true,
  recordType(takes(Number, 'a')),
  recordType(takes(Number, 'a')))
testTypeContains(true,
  recordType(takes(Number, 'a')),
  recordType(takes(Number, 'a')))
testTypeContains(false,
  recordType(takes(Number, 'a')),
  recordType(takes(Number, 'b')))
testTypeContains(false,
  recordType(takes(Number, 'a')),
  recordType(takes(String, 'a')))
testTypeContains(true, genericTree, numberTree)
testTypeContains(false, numberTree, genericTree)
testTypeContains(true,
  mapType.of(Number),
  mapType.of(Number))
testTypeContains(true, mapType, mapType.of(Number))
testTypeContains(true, arrayType, arrayType.of(Number))
testTypeContains(true, pa, arrayType)
testTypeContains(true,
  functionType(takes(Number), returns(String)),
  functionType(takes(Number), returns(String)))
// Covariance
testTypeContains(true,
  functionType(takes(Number), returns(pa)),
  functionType(takes(Number), returns(String)))
testTypeContains(false,
  functionType(takes(Number), returns(String)),
  functionType(takes(Number), returns(pa)))
// Contravariance
testTypeContains(false,
  functionType(takes(pa), returns(String)),
  functionType(takes(Number), returns(String)))
testTypeContains(true,
  functionType(takes(Number), returns(String)),
  functionType(takes(pa), returns(String)))

function testTypeContains(expect, x, y) {
  var recs = {}
  x = typeUtil.resolveType(x)
  y = typeUtil.resolveType(y)
  var matches = x.containsType(y, {})
  tap.log(
    !!expect === !!matches,
    x.toString(),
    expect ? '>=' : '>/=', 
    y.toString())
}

// Recursive record strings
var infinite = recordType(takes(Number, 'current'))
infinite.takes(infinite, 'next')
var infiniteString = '{ Object current: Number, next: <Circular$0> }'
tap.log(
  infinite.toString() === infiniteString,
  'Expect infinite type to be ' + infiniteString)

//////////////////////////////////////////
// Test unions containing other unions. //
//////////////////////////////////////////

testUnionContains(
  unionType(Number, typeParameter('a')),
  unionType(Number, typeParameter('a')), {})
testUnionContains(unionType(undefinedType, Number, String),
  unionType(undefinedType, typeParameter('a')),
  { a: unionType(Number, String) })
testUnionContains(unionType(undefinedType, String),
  unionType(undefinedType, typeParameter('a')),
  { a: unionType(undefinedType, String) })
testUnionContains(undefinedType,
  unionType(undefinedType, typeParameter('a')),
  { a: undefinedType })

function testUnionContains(expected, genericUnion, typeFilters) {
  expected = typeUtil.resolveType(expected)
  genericUnion = typeUtil.resolveType(genericUnion)
  Object.keys(typeFilters).forEach(function(key) {
    typeFilters[key] = typeUtil.resolveType(typeFilters[key])
  })
  var filteredType = genericUnion.filterType(typeFilters)
    , filterObj = {}
  Object.keys(typeFilters).forEach(function(key) {
    filterObj[key] = typeFilters[key].toString()
  })

  tap.log(
    genericUnion.containsType(expected, typeFilters),
    genericUnion.toString(),
    '+',
    JSON.stringify(filterObj),
    'contains type',
    expected.toString())

  tap.log(
    expected.equals(filteredType),
    genericUnion.toString(),
    '+',
    JSON.stringify(filterObj),
    '=>',
    expected)
}

var superType = recordType(forConstructor('Super'))
  , subType = recordType(forConstructor('Sub', superType.ctor))
disallowUnion(superType, subType)
disallowUnion(
  functionType(takes(Number), returns(Number)),
  functionType(takes(String), returns(Boolean)))

function disallowUnion(lhs, rhs) {
  lhs = typeUtil.resolveType(lhs)
  rhs = typeUtil.resolveType(rhs)
  try {
    unionType(lhs, rhs)
    tap.log(false,
      'should not unite', '(' + lhs.toString() + ')',
      'with', '(' + rhs.toString() + ')')
  } catch(err) {
    if(err.message.indexOf('Found non-ctor in inheritance chain') >= 0)
      throw err
    tap.log(true,
      'should not unite', '(' + lhs.toString() + ')',
      'with', '(' + rhs.toString() + ')')
  }
}

var allowInstantiation = verifyInstantiation.bind(null, true)
  , disallowInstantiation = verifyInstantiation.bind(null, false)

// primitives
allowInstantiation(String, 'abc')
disallowInstantiation(String, 3)
allowInstantiation(Number, 3)
disallowInstantiation(Number, null)
allowInstantiation(Boolean, true)
disallowInstantiation(Boolean, 'x')
allowInstantiation(null, null)
disallowInstantiation(null, undefined)
allowInstantiation(undefined, undefined)
disallowInstantiation(undefined, null)

// native objects
allowInstantiation(Date, new Date())
disallowInstantiation(Date, 'x')
allowInstantiation(Error, new Error())
disallowInstantiation(Error, new Date())
allowInstantiation(RegExp, /a/)
disallowInstantiation(RegExp, 3)

// parameterized native objects
allowInstantiation(argumentsArrayType, typeUtil.asArguments([1, 2, 3]))
disallowInstantiation(argumentsArrayType, [1, 2, 3])
allowInstantiation(Array, [1, 2, 3])
disallowInstantiation(Array, {})
allowInstantiation(arrayType.of(String), [])
allowInstantiation(arrayType.of(String), ['a', 'b'])
disallowInstantiation(arrayType.of(String), [1, 2])
allowInstantiation(mapType, { a: 1 })
disallowInstantiation(mapType, [1, 2, 3])
allowInstantiation(mapType, { a: 'x' })
disallowInstantiation(mapType, null)
allowInstantiation(mapType.of(String), { a: 'x' })
allowInstantiation(mapType.of(undefined), { a: undefined })
disallowInstantiation(mapType.of(Number), { a: 'x' })

// unions
allowInstantiation(unionType(String, Number), 'x')
disallowInstantiation(unionType(Number, undefined), 'x')

// union parameters
allowInstantiation(arrayType.of(unionType(String, Number)), ['a', 1])
disallowInstantiation(arrayType.of(unionType(String, Number)), ['a', null])

// functions
allowInstantiation(functionType(takes(String), returns(Number)), function() {})
disallowInstantiation(functionType(takes(String), returns(Number)), undefined)

// records
var numStrRecord = recordType(takes(Number, 'a'), takes(String, 'b'))
allowInstantiation(numStrRecord, { a: 1, b: 'x' })
disallowInstantiation(numStrRecord, { a: 1, b: 3 })

// small types
allowInstantiation(smallType('Celsius', Number), 3)
disallowInstantiation(smallType('Celsius', Number), 'x')

// type parameters
allowInstantiation(unionType(typeParameter('a'), Number), 3)
allowInstantiation(unionType(typeParameter('a'), Number), 'x')

var aabRecord = recordType(
  takes(typeParameter('a'), 'a0'),
  takes(typeParameter('a'), 'a1'),
  takes(typeParameter('b'), 'b0'))
allowInstantiation(aabRecord, { a0: 1, a1: 2, b0: 'x' })
disallowInstantiation(aabRecord, { a0: 1, a1: 'x', b0: 'x' })

function verifyInstantiation(expected, type, obj) {
  var resolvedType = typeUtil.resolveType(type)
    , typeFilters = {}
    , errors = resolvedType.validateInstance(obj, typeFilters)
    , allows = !errors.length
    , verb = expected ? 'allow' : 'disallow'
    , ok = expected === allows
  tap.log(ok,
    'should ' + verb +
    ' instantiation of ' + JSON.stringify(obj) +
    ' in ' + resolvedType)
  if(ok) return
  errors.forEach(function(err) { tap.comment('  ' + err) })
  var typeFilterKeys = Object.keys(typeFilters)
  tap.comment('typeFilters (' + typeFilterKeys.length + ')')
  typeFilterKeys.forEach(function(key) {
    tap.comment('  ' + key + ': ' + typeFilters[key])
  })
}
