'use strict'

var inductive = require('./inductive.js')
  , AmbiguousBuildingBlockUsage = require('./AmbiguousBuildingBlockUsage.js')
  , DeferredApiCall = inductive.model.DeferredApiCall
  , arrayType = inductive.arrayType
  , as = inductive.as
  , constrainChild = inductive.constrainChild
  , defaultMock = inductive.defaultMock
  , errorType = inductive.errorType
  , express = inductive.express
  , expressValue = inductive.expressValue
  , functionType = inductive.functionType
  , typeParameter = inductive.typeParameter
  , isolate = inductive.isolate
  , mapType = inductive.mapType
  , argumentsObjectType = inductive.argumentsObjectType
  , returns = inductive.returns
  , takes = inductive.takes
  , unionType = inductive.unionType
  , uniqueType = inductive.uniqueType
  , buildingBlocks = {}
  , Expression = inductive.model.Expression
  , RecordType = inductive.model.RecordType
  , IsolateExpression = inductive.model.IsolateExpression

function register(expression) {
  Object.defineProperty(buildingBlocks, expression.name, {
    enumerable: true,
    value: expression
  })
}

;['abs', 'sqrt',
  'acos', 'asin', 'atan', 'cos', 'sin', 'tan',
  'round', 'ceil', 'floor',
  'log', 'exp'
].forEach(function(fn) {
  register(express('Math.' + fn,
    takes(Number),
    returns(Number),
    as('Math.' + fn + '(@Number)')))
})

;['min', 'max'].forEach(function(fn) {
  register(express('Math.' + fn,
    takes(arrayType.of(Number), '@array'),
    returns(Number),
    as('Math.' + fn + '.apply(null, @array)')))
})

;['atan2', 'pow'].forEach(function(fn) {
  register(express('Math.' + fn,
    takes(Number),
    takes(Number),
    returns(Number),
    as('Math.' + fn + '(@Number, @Number)')))
})

;['*', '-', '/', '%', '&', '|', '^', '<<', '>>', '>>>'].forEach(function(op) {
  register(express(op,
    takes(Number),
    takes(Number),
    returns(Number),
    as('(@Number ' + op +  ' @Number)')))
})

;['&&', '||'].forEach(function(op) {
  register(express(op,
    takes(Boolean),
    takes(Boolean),
    returns(Boolean),
    as('(@Boolean ' + op +  ' @Boolean)')))
})

;['<', '<=', '>', '>='].forEach(function(op) {

  register(new AmbiguousBuildingBlockUsage(op,
    'Number' + op,
    'String' + op))

  ;[Number, String].forEach(function(type) {
    register(express(type.name + op,
      takes(type, '@lhs'),
      takes(type, '@rhs'),
      returns(Boolean),
      as('(@lhs ' + op +  ' @rhs)')))
  })
})

register(express('+1',
  takes(Number),
  returns(Number),
  as('(@Number + 1)')))

register(express('-1',
  takes(Number),
  returns(Number),
  as('(@Number - 1)')))

register(express('~',
  takes(Number),
  returns(Number),
  as('(~@Number)')))

register(express('!',
  takes(Boolean),
  returns(Boolean),
  as('(!@Boolean)')))

register(express('*-1',
  takes(Number),
  returns(Number),
  as("(@Number * -1)")))

register(express('1/',
  takes(Number),
  returns(Number),
  as("(1 / @Number)")))

register(express('typeof',
  takes(typeParameter('a')),
  returns(String),
  as("(typeof @'a)")))

register(express('isFinite',
  takes(Number),
  returns(Boolean),
  as("isFinite(@Number)")))

register(express('isNaN',
  takes(Number),
  returns(Boolean),
  as("isNaN(@Number)")))

register(new AmbiguousBuildingBlockUsage('parseInt',
  'parseBinary',
  'parseOctal',
  'parseDecimal',
  'parseHexadecimal'))

;[{ name: 'Binary', value: 2 },
  { name: 'Octal', value: 8 },
  { name: 'Decimal', value: 10 },
  { name: 'Hexadecimal', value: 16 }
].forEach(function(conversion) {
  register(express('parse' + conversion.name,
    takes(String),
    returns(Number),
    as("parseInt(@Number, " + conversion.value + ")")))
})

register(express('parseFloat',
  takes(String),
  returns(Number),
  as("parseFloat(@Number)")))

;['encodeURI',
  'decodeURI',
  'encodeURIComponent',
  'decodeURIComponent'].forEach(function(fn) {
  register(express(fn,
    takes(String),
    returns(String),
    as(fn + "(@String)")))
})

register(express('toString',
  takes(typeParameter('a')),
  returns(String),
  as("Object.prototype.toString(@'a)")))

register(express('toLocaleString',
  takes(typeParameter('a')),
  returns(String),
  as("Object.prototype.toLocaleString(@'a)")))

register(express('Number',
  takes(typeParameter('a')),
  returns(Number),
  as("Number(@'a)")))

register(new AmbiguousBuildingBlockUsage('===',
  'Number===',
  'Boolean===',
  'String===',
  'Map===',
  'Array===',
  'Record==='))

register(new AmbiguousBuildingBlockUsage('!==',
  'Number!==',
  'Boolean!==',
  'String!==',
  'Map!==',
  'Array!==',
  'Record!=='))

;['===', '!=='].forEach(function(op) {

  ;[Number, Boolean, String].forEach(function(type) {
    [op + type.name].forEach(function(alias) {
      register(express(alias,
        takes(type),
        takes(type),
        returns(Boolean),
        as('(@' + type.name + ' ' + op + ' @' + type.name + ')')))
    })
  })

  register(express('Array' + op,
    takes(arrayType, '@lhs'),
    takes(arrayType, '@rhs'),
    returns(Boolean),
    as('(@lhs ' + op + ' @rhs)')))

  register(express('Map' + op,
    takes(mapType, '@lhs'),
    takes(mapType, '@rhs'),
    returns(Boolean),
    as('(@lhs ' + op + ' @rhs)')))

  register(express('Record' + op,
    takes(mapType, '@lhs'),
    takes(mapType, '@rhs'),
    returns(Boolean),
    as('(@lhs ' + op + ' @rhs)'),
    constrainChild(function(self, child, index) {
      return child.type instanceof RecordType
    })))
})

register(new AmbiguousBuildingBlockUsage('+', 'Number+', 'String+'))

;[Number, String].forEach(function(type) {
  ;[type.name + '+'].forEach(function(alias) {
    register(express(alias,
      takes(type),
      takes(type),
      returns(type),
      as('(@' + type.name + ' + @' + type.name + ')')))
  })
})

register(express('new Error',
  takes(String),
  returns(errorType),
  as('new Error(@String)')))

register(express('String.length',
  takes(String),
  returns(Number),
  as('@String.length')))

register(express('void',
  takes(typeParameter('a')),
  returns(undefined),
  as("(void @'a)")))

register(express('?:',
  takes(Boolean),
  takes(typeParameter('a')),
  takes(typeParameter('a')),
  returns(typeParameter('a')),
  as(function() {/*
    @Boolean ?
      @'a :
      @'a
  */})))

register(express(',',
  takes(typeParameter('a')),
  takes(typeParameter('b')),
  returns(typeParameter('b')),
  as("(@'a, @'b)")))

// Error functions:
function ThrowExpression() {
  Expression.apply(this, arguments)
  this.constrainParent(function(self, parent) {
    return !(parent instanceof ThrowExpression)
  })
}
ThrowExpression.prototype = Object.create(Expression.prototype)
ThrowExpression.prototype.constructor = ThrowExpression
function throwExpression() {
  return DeferredApiCall.callChildren(arguments, function(name) {
    return new ThrowExpression(name)
  })
}

register(throwExpression('throw',
  takes(String),
  returns(typeParameter('b')),
  as("(function thrower() { throw new Error(@String) })()")))

register(throwExpression('throwError',
  takes(Error),
  returns(typeParameter('b')),
  as("(function thrower() { throw @Error })()")))

register(throwExpression('throwA',
  takes(typeParameter('a')),
  returns(typeParameter('b')),
  as("(function thrower() { throw @'a })()")))

register(express('tryCatchFinally',
  takes(typeParameter('a')),
  takes(
    functionType(
      takes(Error),
      returns(typeParameter('a'))),
    '@catchFn'),
  takes(
    functionType(
      returns(typeParameter('b'))),
    '@finallyFn'),
  returns(typeParameter('a')),
  as(function() { /*
    (function() {
      try {
        return @'a
      } catch(err) {
        if(typeof err !== 'object' || !(err instanceof Error))
          err = new Error(err)
        return (@catchFn)(err)
      } finally {
        (@finallyFn)()
      }
    })()
  */ })))

register(express('tryFinally',
  takes(typeParameter('a')),
  takes(
    functionType(
      returns(typeParameter('b'))),
    '@finallyFn'),
  returns(typeParameter('a')),
  as(function() { /*
    (function() {
      try {
        return @'a
      } finally {
        (@finallyFn)()
      }
    })()
  */ })))

register(express('tryCatch',
  takes(typeParameter('a')),
  takes(
    functionType(
      takes(Error),
      returns(typeParameter('a'))), '@catchFn'),
  returns(typeParameter('a')),
  as(function() { /*
    (function() {
      try {
        return @'a
      } catch(err) {
        if(typeof err !== 'object' || !(err instanceof Error))
          err = new Error(err)
        return (@catchFn)(err)
      }
    })()
  */ })))

// Map functions:
register(express('ArrayToMap',
  takes(arrayType),
  takes(
    functionType(
      takes(typeParameter('a')), 
      returns(String), 'keyFn')),
  returns(mapType),
  as(function() {/*
    (function map() {
      var result = {}
      @Array<'a>.forEach(function(arg) {
        result[(@'a -> String)(arg)] = arg
      })
      return result
    })()
  */})))

register(express('RecordToMap',
  takes(typeParameter('b')),
  constrainChild(function(self, child, index) {
    return child.type instanceof RecordType
  }),
  returns(mapType),
  as("@'b")))

register(express('in',
  takes(mapType, '@map'),
  takes(String),
  returns(Boolean),
  as('(@String in @map)')))

register(express('Map.keys',
  takes(mapType),
  returns(arrayType.of(String)),
  as("Object.keys(@Map<'a>)")))

register(express('Map.values',
  takes(mapType),
  returns(arrayType),
  as(function() {/*
    (function(arg) {
      return Object.keys(arg).map(function(argKey) {
        return arg[argKey]
      })
    })(@Map<'a>)
  */})))

// Map functions
register(express('Map.get',
  takes(mapType),
  takes(String),
  returns(unionType(undefined, typeParameter('a'))),
  as("@Map<'a>[@String]")))

register(express('OptionMap.get',
  takes(
    mapType.filterType(
      { a: unionType(typeParameter('a'), undefined) })),
  takes(String),
  returns(unionType(typeParameter('a'), undefined)),
  as("@Map<('a | undefined)>[@String]")))

register(express('Map.set',
  takes(mapType),
  takes(String),
  takes(typeParameter('a')),
  returns(mapType),
  as(function() { /*
    (function() {
      var result = {}
        , map = @Map<'a>
        , setKey = @String
      Object.keys(map).forEach(function(key) {
        result[key] = key === setKey ? @'a : map[key]
      })
      return result
    })()
  */ })))

register(express('Map.remove',
  takes(mapType),
  takes(String),
  returns(mapType),
  as(function() { /*
    (function() {
      var result = {}
        , map = @Map<'a>
      Object.keys(map).forEach(function(key) {
        if(key !== @String) result[key] = map[key]
      })
      return result
    })()
  */ })))

// Array functions:
register(express('Array.map',
  takes(arrayType),
  takes(
    functionType(
      takes(typeParameter('a')),
      returns(typeParameter('b')), 'mapFn')),
  returns(arrayType.filterType({ a: typeParameter('b') })),
  as("@Array<'a>.map(@'a -> 'b)")))

register(express('Array.filter',
  takes(arrayType),
  takes(
    functionType(
      takes(typeParameter('a')),
      returns(Boolean))),
  returns(arrayType),
  as("@Array<'a>.filter(@'a -> Boolean)")))

register(express('Array.push',
  takes(arrayType),
  takes(typeParameter('a')),
  returns(arrayType),
  as("@Array<'a>.concat([@'a])")))

register(express('Array.pop',
  takes(arrayType),
  returns(arrayType),
  as(function() { /*
    (function() {
      var array = @Array<'a>
      return array.slice(0, array.length - 1)
    })()
  */ })))

register(new AmbiguousBuildingBlockUsage('Array.slice',
  'Array.slice1',
  'Array.slice2'))

register(express('Array.slice1',
  takes(arrayType),
  takes(Number),
  returns(arrayType),
  as("@Array<'a>.slice(@Number)")))

register(express('Array.slice2',
  takes(arrayType),
  takes(Number),
  takes(Number),
  returns(arrayType),
  as("@Array<'a>.slice(@Number, @Number)")))

register(express('Array.shift',
  takes(arrayType),
  returns(arrayType),
  as("@Array<'a>.slice(1)")))

register(express('Array.fill',
  takes(arrayType),
  takes(typeParameter('a')),
  returns(arrayType),
  as("@Array<'a>.slice().fill(@'a)")))

register(new AmbiguousBuildingBlockUsage('Array.sort',
  'Array.sort0',
  'Array.sort1'))

register(express('Array.sort0',
  takes(arrayType),
  returns(arrayType),
  as("@Array<'a>.slice().sort()")))

register(express('Array.sort1',
  takes(arrayType),
  takes(
    functionType(
      takes(typeParameter('a')),
      takes(typeParameter('b')),
      returns(Number)), '@fn'),
  returns(arrayType),
  as("@Array<'a>.slice().sort(@fn)")))

register(new AmbiguousBuildingBlockUsage('Array.join',
  'Array.join0',
  'Array.join1'))

register(express('Array.indexOf',
  takes(arrayType),
  takes(typeParameter('a')),
  returns(Number),
  as("@Array<'a>.indexOf(@'a)")))

register(express('Array.lastIndexOf',
  takes(arrayType),
  takes(typeParameter('a')),
  returns(Number),
  as("@Array<'a>.lastIndexOf(@'a)")))

register(express('Array.join0',
  takes(arrayType),
  returns(String),
  as("@Array<'a>.join()")))

register(express('Array.join1',
  takes(arrayType),
  takes(String),
  returns(String),
  as("@Array<'a>.join(@String)")))

register(new AmbiguousBuildingBlockUsage('Array.splice',
  'Array.splice2',
  'Array.splice3'))

register(express('Array.splice2',
  takes(arrayType),
  takes(Number),
  takes(Number),
  returns(arrayType),
  as("@Array<'a>.slice().splice(@Number, @Number)")))

register(express('Array.splice3',
  takes(arrayType, '@array'),
  takes(Number),
  takes(Number),
  takes(arrayType, '@els'),
  returns(arrayType),
  as(
    "Array.prototype.splice.apply(@array, [@Number, @Number].concat(@els))")))

register(express('Array.reverse',
  takes(arrayType),
  returns(arrayType),
  as("@Array<'a>.slice().reverse()")))

register(express('Array.unshift',
  takes(arrayType),
  takes(typeParameter('a')),
  returns(arrayType),
  as("([@'a].concat(@Array<'a>))")))

register(express('Array.concat',
  takes(arrayType),
  takes(arrayType),
  returns(arrayType),
  as("@Array<'a>.concat(@Array<'a>)")))

register(new AmbiguousBuildingBlockUsage(
  'Array.reduce',
  'Array.tryReduce2',
  'Array.reduce2',
  'Array.reduce3',
  'Array.reduce4'))

register(express('Array.fromArguments',
  takes(argumentsObjectType, '@arguments'),
  returns(arrayType),
  as('([].slice.apply(@arguments))')))

register(express('Array.tryReduce2',
  takes(arrayType),
  takes(
    functionType(
      takes(typeParameter('a')),
      takes(typeParameter('a')),
      returns(typeParameter('a')))),
  returns(typeParameter('a')),
  as(function() { /*
    (function(array) {
      return array.length ? array.reduce(@('a, 'a) -> 'a) : 0
    })(@Array<'a>)
  */ })))

register(express('Array.reduce2',
  takes(arrayType),
  takes(functionType(
    takes(typeParameter('a')),
    takes(typeParameter('a')),
    returns(typeParameter('a')))),
  returns(typeParameter('a')),
  as("@Array<'a>.reduce(@('a, 'a) -> 'a)")))

register(express('Array.reduce3',
  takes(arrayType),
  takes(functionType(
    takes(typeParameter('a')),
    takes(typeParameter('a')),
    takes(Number),
    returns(typeParameter('a')))),
  returns(typeParameter('a')),
  as("@Array<'a>.reduce(@('a, 'a, Number) -> 'a)")))

register(express('Array.reduce4',
  takes(arrayType),
  takes(functionType(
    takes(typeParameter('a')),
    takes(typeParameter('a')),
    takes(Number),
    takes(arrayType),
    returns(typeParameter('a')))),
  returns(typeParameter('a')),
  as("@Array<'a>.reduce(@('a, 'a, Number, Array<'a>) -> 'a)")))

register(express('Array.element',
  takes(Array),
  takes(Number),
  returns(
    unionType(
      undefined,
      typeParameter('a'))),
  as("@Array<'a>[@Number]")))

register(express('range',
  takes(Number),
  returns(arrayType.of(Number)),
  as(function() { /*
    (function() {
      var array = new Array(@Number)
      for(var x = 0; x < array.length; x++) array[x] = x
      return array
    })()
  */ })))

register(express('rangeOffset',
  takes(Number),
  takes(Number),
  returns(arrayType.of(Number)),
  as(function() { /*
    (function() {
      var array = new Array(@Number)
        , offset = @Number
      for(var x = 0; x < array.length; x++)
        array[x] = x + offset
      return array
    })()
  */ })))

register(express('Array.length',
  takes(arrayType),
  returns(Number),
  as("@Array<'a>.length")))

// Date
register(express('StringToDate',
  takes(String),
  returns(Date),
  as('new Date(@String)')))

register(express('Date.parse',
  takes(String),
  returns(Number),
  as('Date.parse(@String)')))

var dateStrFns = [
  'DateString', 'toISOString', 'toJSON', 'toLocaleDateString',
  'toLocaleString', 'toLocaleTimeString', 'toString', 'toTimeString',
  'toUTCString'
]
dateStrFns.forEach(function(fn) {
  register(express('Date.' + fn,
    takes(Date),
    returns(String),
    as('@Date.' + fn + '()')))
})

for(var n = 1; n <= 7; n++) {
  var newDateExpr = express('new Date' + n, returns(Date))
    , utcExpr = express('Date.UTC' + n, returns(Number))
    , dateArgs = []
  for(var num = 0; num < n; num++) {
    newDateExpr.takes(Number)
    utcExpr.takes(Number)
    dateArgs.push('@Number')
  }
  newDateExpr.as('new Date(' + dateArgs.join(', ') + ')')
  register(newDateExpr)
  utcExpr.as('Date.UTC(' + dateArgs.join(', ') + ')')
  register(utcExpr)
}

var utcableGetters = [
  'Date', 'Day', 'FullYear', 'Hours', 'Milliseconds', 'Minutes',
  'Month', 'Seconds'
]
;['Time', 'TimezoneOffset'].
  concat(utcableGetters).
  concat(utcableGetters.map(function(fn) { return 'UTC' + fn })).
  forEach(function(fn) {
    register(express('Date.get' + fn,
      takes(Date),
      returns(Number),
      as('@Date.get' + fn + '()')))
  })

var utcableSetters = [
  'Date', 'FullYear', 'Hours', 'Milliseconds', 'Minutes',
  'Month', 'Seconds'
]
;['Time'].
  concat(utcableSetters).
  concat(utcableSetters.map(function(fn) { return 'UTC' + fn })).
  forEach(function(fn) {
    register(express('Date.set' + fn,
      takes(Date),
      takes(Number),
      returns(Date),
      as([
        '(function() {',
        '  var d = new Date(@Date.getTime());',
        '  d.set' + fn + '(@Number);',
        '  return d;',
        '})()'
      ].join('\n'))))
  })

// RegExp
register(express('RegExp.test',
  takes(RegExp),
  takes(String),
  returns(Boolean),
  as('@RegExp.test(@String)')))

register(express('RegExp.toString',
  takes(RegExp),
  returns(String),
  as('@RegExp.toString()')))

// String
register(express('String.match',
  takes(String),
  takes(RegExp),
  returns(
    unionType(
      null,
      arrayType.of(String))),
  as('@String.match(@RegExp)')))

;['slice', 'substr', 'substring'].forEach(function(fn) {
  register(new AmbiguousBuildingBlockUsage('String.' + fn,
    'String.' + fn + '1',
    'String.' + fn + '2'))

  register(express('String.' + fn + '1',
    takes(String),
    takes(Number),
    returns(String),
    as('@String.' + fn + '(@Number)')))

  register(express('String.' + fn + '2',
    takes(String),
    takes(Number),
    takes(Number),
    returns(String),
    as('@String.' + fn + '(@Number, @Number)')))
})

register(express('String.split',
  takes(String),
  takes(String),
  returns(String),
  as('@String.split(@String)')))

;['indexOf', 'lastIndexOf'].forEach(function(fn) {
  register(new AmbiguousBuildingBlockUsage('String.' + fn,
    'String.' + fn + '1',
    'String.' + fn + '2'))

  register(express('String.' + fn + '1',
    takes(String),
    takes(String),
    returns(Number),
    as('@String.' + fn + '(@String)')))

  register(express('String.' + fn + '2',
    takes(String),
    takes(String),
    takes(Number),
    returns(Number),
    as('@String.' + fn + '(@String, @Number)')))
})

;['toLowerCase', 'toUpperCase',
  'toLowerLocaleCase', 'toUpperLocaleCase',
  'trim'
].forEach(function(fn) {
  register(express('String.' + fn,
    takes(String),
    returns(String),
    as('@String.' + fn + '()')))
})

register(express('String.replace',
  takes(String),
  takes(String),
  takes(String),
  returns(String),
  as('@String.replace(@String, @String)')))

register(express('String.concat',
  takes(String),
  takes(String),
  returns(String),
  as('@String.concat(@String)')))

register(express('String.charAt',
  takes(String),
  takes(Number),
  returns(String),
  as('@String.charAt(@Number)')))

register(express('String.charCodeAt',
  takes(String),
  takes(Number),
  returns(Number),
  as('@String.charCodeAt(@Number)')))

register(express('String.fromCharCode',
  takes(arrayType.of(Number), '@array'),
  returns(String),
  as('String.fromCharCode.apply(String, @array)')))

// Isolates
function ConsoleLogExpression() {
  IsolateExpression.apply(this, arguments)
  this.constrainParent(function(self, parent, index) {
    return !(parent instanceof ConsoleLogExpression)
  })
}
ConsoleLogExpression.prototype = Object.create(IsolateExpression.prototype)
ConsoleLogExpression.prototype.constructor = ConsoleLogExpression
function consoleLogExpression() {
  return DeferredApiCall.callChildren(arguments, function(name) {
    return new ConsoleLogExpression(name)
  })
}

;[{ type: typeParameter('a'), name: 'console.log' },
  { type: String, name: 'console.logString' }
].forEach(function(fn) {
  register(consoleLogExpression(fn.name,
    takes(fn.type, '@arg'),
    returns(undefined),
    as('console.log(@arg)')))
})

register(isolate('new Date',
  as('new Date()'),
  defaultMock(function() { return inductive.clock.get() }),
  returns(Date)))

module.exports = buildingBlocks
