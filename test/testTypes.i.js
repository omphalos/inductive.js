'use strict'

var inductive = require('../lib/inductive.js')
  , typeUtil = require('../lib/types/typeUtil.js')
  , tap = inductive.tap
  , functionType = inductive.functionType
  , takes = inductive.takes
  , returns = inductive.returns
  , argumentsType = inductive.argumentsType
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

function testTypeContains(expect, x, y) {
  var recs = {}
  x = typeUtil.resolveType(x, {})
  y = typeUtil.resolveType(y, {})
  var matches = x.containsType(y, {})
  tap.log(
    !!expect === !!matches,
    x.toString(),
    expect ? '>=' : '>/=', 
    y.toString())
}

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
testTypeContains(true, argumentsType(a, b), argumentsType(a, b))
testTypeContains(false, argumentsType(a, b), argumentsType(a, c))
testTypeContains(false, argumentsType(a, b), argumentsType(a, b, b))
testTypeContains(true, argumentsType(pa, pb), argumentsType(pc, pc))
testTypeContains(true, unionType(a, b), unionType(a, b))
testTypeContains(false, unionType(a, b), unionType(a, c))
testTypeContains(false, unionType(a, b), unionType(a, b, c))
testTypeContains(false, unionType(a, b), argumentsType(a, b))
testTypeContains(false, argumentsType(a, b), unionType(a, b))
testTypeContains(true, parameterizedType(pa, 'a'), parameterizedType(pa, 'a'))
testTypeContains(false,
  parameterizedType(pa, 'a'),
  parameterizedType(pa, pb, 'a'))
testTypeContains(false, parameterizedType(pa, 'a'), parameterizedType(pa, 'b'))
testTypeContains(true,
  argumentsType(pa, pb, pc),
  argumentsType(pd, pe, pf))
testTypeContains(true,
  argumentsType(pa, pa, pb),
  argumentsType(pc, pc, pd))
testTypeContains(false,
  argumentsType(pa, pb, pb),
  argumentsType(pc, pc, pd))
testTypeContains(false,
  argumentsType(pa, a, pb),
  argumentsType(pc, pd, pe))
testTypeContains(true,
  argumentsType(pc, pd, pe),
  argumentsType(pa, a, pb))
testTypeContains(true,
  argumentsType(pa, pa, pb),
  argumentsType(pa, pa, pc))
testTypeContains(false,
  argumentsType(pa, pb, pb),
  argumentsType(pa, pa, pb))
testTypeContains(true,
  argumentsType(typeParameter('a'), typeParameter('a'), typeParameter('b')),
  argumentsType(typeParameter('a'), typeParameter('a'), typeParameter('c')))
testTypeContains(false,
  argumentsType(typeParameter('a'), typeParameter('b'), typeParameter('b')),
  argumentsType(typeParameter('a'), typeParameter('a'), typeParameter('b')))
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
testTypeContains(true,
  functionType(takes(pa), returns(String)),
  functionType(takes(Number), returns(String)))

//////////////////////////////////////////
// Test unions containing other unions. //
//////////////////////////////////////////

function testUnionContains(expected, genericUnion, typeFilters) {
  expected = typeUtil.resolveType(expected, {})
  genericUnion = typeUtil.resolveType(genericUnion, {})
  Object.keys(typeFilters).forEach(function(key) {
    typeFilters[key] = typeUtil.resolveType(typeFilters[key], {})
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

////////////////////////
// Test adding types. //
////////////////////////

function testUnion() {

  function resolve(x) { return typeUtil.resolveType(x, {}) }

  var args = [].slice.apply(arguments).map(resolve)
    , inferArgs = args.slice(1)
    , recs = {}
    , types = inferArgs.map(function(it) {
      return typeUtil.addTypes([it], recs)
    })
  var argString = '(' + types.join(' | ') + ')'
    , expectation = typeUtil.addTypes([args[0]], recs)
    , actual = typeUtil.addTypes(types, recs)
    , equals = expectation.equals(actual)

  tap.log(
    equals,
    argString + ' === ' + expectation,
    equals ? '' : '# actual: ' + actual.toString())
}

testUnion(unionType(Number, Boolean), Number, Boolean)
testUnion(Number, Number)
testUnion(Number, Number, Number)
testUnion(pa, Number, pa)
testUnion(unionType(Number, Boolean, String), Number, Boolean, String)
testUnion(argumentsType(Number, Boolean),
  argumentsType(Number, Boolean),
  argumentsType(Number, Boolean))
testUnion(unionType(Boolean, String, Number),
  Number,
  unionType(Boolean, String))
testUnion(unionType(Number, Boolean, String),
  unionType(Number, Boolean),
  unionType(Boolean, String))
testUnion(unionType(Number, Boolean),
  unionType(Number, Boolean),
  unionType(Number, Boolean))

function disallowUnion(lhs, rhs) {
  var recs = {}
  lhs = typeUtil.resolveType(lhs, recs)
  rhs = typeUtil.resolveType(rhs, recs)
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

var superType = recordType(forConstructor('Super'))
  , subType = recordType(forConstructor('Sub', superType.ctor))
disallowUnion(superType, subType)
disallowUnion(
  functionType(takes(Number), returns(Number)),
  functionType(takes(String), returns(Boolean)))
