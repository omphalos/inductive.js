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
  , generic = inductive.generic
  , isolate = inductive.isolate
  , mapType = inductive.mapType
  , returns = inductive.returns
  , takes = inductive.takes
  , unionType = inductive.unionType
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

var nullExpression =
  expressValue('null',
  returns(null),
  as('null'))

var undefinedExpression =
  expressValue('undefined',
  returns(undefined),
  as('undefined'))

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
  takes(generic('a')),
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
  takes(generic('a')),
  returns(String),
  as("Object.prototype.toString(@'a)")))

register(express('toLocaleString',
  takes(generic('a')),
  returns(String),
  as("Object.prototype.toLocaleString(@'a)")))

register(express('Number',
  takes(generic('a')),
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
  takes(generic('a')),
  returns(undefined),
  as("(void @'a)")))

register(express('?:',
  takes(Boolean),
  takes(generic('a')),
  takes(generic('a')),
  returns(generic('a')),
  as(function() {/*
    @Boolean ?
      @'a :
      @'a
  */})))

register(express(',',
  takes(generic('a')),
  takes(generic('b')),
  returns(generic('b')),
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
  returns(generic('b')),
  as("(function thrower() { throw new Error(@String) })()")))

register(throwExpression('throwError',
  takes(Error),
  returns(generic('b')),
  as("(function thrower() { throw @Error })()")))

register(throwExpression('throwA',
  takes(generic('a')),
  returns(generic('b')),
  as("(function thrower() { throw @'a })()")))

register(express('tryCatchFinally',
  takes(generic('a')),
  takes(
    functionType(
      takes(Error),
      returns(generic('a'))),
    '@catchFn'),
  takes(
    functionType(
      returns(generic('b'))),
    '@finallyFn'),
  returns(generic('a')),
  as(function() { /*
    function() {)
      try {
        return @'a
      } catch(err) {
        if(typeof err !== 'object' || !(err instanceof Error))
          err = new Error(err)
        return @catchFn(err)
      } finally {
        @finallyFn()
      }
    }()
  */ })))

register(express('tryFinally',
  takes(generic('a')),
  takes(
    functionType(
      returns(generic('b')), '@finallyFn')),
  returns(generic('a')),
  as(function() { /*
    function() {)
      try {
        return @'a
      } finally {
        @finallyFn()
      }
    }()
  */ })))

register(express('tryCatch',
  takes(generic('a')),
  takes(
    functionType(
      takes(Error),
      returns(generic('a'))), '@catchFn'),
  returns(generic('a')),
  as(function() { /*
    function() {)
      try {
        return @'a
      } catch(err) {
        if(typeof err !== 'object' || !(err instanceof Error))
          err = new Error(err)
        return @catchFn(err)
      }
    }()
  */ })))

// Map functions:
register(express('ArrayToMap',
  takes(arrayType),
  takes(
    functionType(
      takes(generic('a')), 
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
  takes(generic('b')),
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
  returns(unionType(undefined, generic('a'))),
  as("@Map<'a>[@String]")))

register(express('OptionMap.get',
  takes(
    mapType.filterType(
      { a: unionType(generic('a'), undefined) })),
  takes(String),
  returns(unionType(generic('a'), undefined)),
  as("@Map<('a | undefined)>[@String]")))

register(express('Map.set!',
  takes(mapType),
  takes(String),
  takes(generic('a')),
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

register(express('Map.remove!',
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
      takes(generic('a')),
      returns(generic('b')), 'mapFn')),
  returns(arrayType.filterType({ a: generic('b') })),
  as("@Array<'a>.map(@'a -> 'b)")))

register(express('Array.filter',
  takes(arrayType),
  takes(
    functionType(
      takes(generic('a')),
      returns(Boolean))),
  returns(arrayType),
  as("@Array<'a>.filter(@'a -> Boolean)")))

register(express('Array.push!',
  takes(arrayType),
  takes(generic('a')),
  returns(arrayType),
  as("@Array<'a>.concat([@'a])")))

register(express('Array.pop!',
  takes(arrayType),
  returns(arrayType),
  as(function() { /*
    (function() {
      var array = @Array<'a>
      return array.slice(0, array.length - 1)
    })()
  */ })))

register(express('Array.shift!',
  takes(arrayType),
  returns(arrayType),
  as("@Array<'a>.slice(1)")))

register(express('Array.fill!',
  takes(arrayType),
  takes(generic('a')),
  returns(arrayType),
  as("@Array<'a>.slice().fill(@'a)")))

register(new AmbiguousBuildingBlockUsage('Array.sort!',
  'Array.sort!0',
  'Array.sort!1'))

register(express('Array.sort!0',
  takes(arrayType),
  returns(arrayType),
  as("@Array<'a>.slice().sort()")))

register(express('Array.sort!1',
  takes(arrayType),
  takes(
    functionType(
      takes(generic('a')),
      takes(generic('b')),
      returns(Number)), '@fn'),
  returns(arrayType),
  as("@Array<'a>.slice().sort(@fn)")))

register(new AmbiguousBuildingBlockUsage('Array.join',
  'Array.join0',
  'Array.join1'))

register(express('Array.indexOf',
  takes(arrayType),
  takes(generic('a')),
  returns(Number),
  as("@Array<'a>.indexOf(@'a)")))

register(express('Array.lastIndexOf',
  takes(arrayType),
  takes(generic('a')),
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

register(new AmbiguousBuildingBlockUsage('Array.splice!',
  'Array.splice!2',
  'Array.splice!3'))

register(express('Array.splice!2',
  takes(arrayType),
  takes(Number),
  takes(Number),
  returns(arrayType),
  as("@Array<'a>.slice().splice(@Number, @Number)")))

register(express('Array.splice!3',
  takes(arrayType, '@array'),
  takes(Number),
  takes(Number),
  takes(arrayType, '@els'),
  returns(arrayType),
  as(
    "Array.prototype.splice.apply(@array, [@Number, @Number].concat(@els))")))

register(express('Array.reverse!',
  takes(arrayType),
  returns(arrayType),
  as("@Array<'a>.slice().reverse()")))

register(express('Array.unshift!',
  takes(arrayType),
  takes(generic('a')),
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

register(express('Array.tryReduce2',
  takes(arrayType),
  takes(
    functionType(
      takes(generic('a')),
      takes(generic('a')),
      returns(generic('a')))),
  returns(generic('a')),
  as(function() { /*
    (function(array) {
      return array.length ? array.reduce(@('a, 'a) -> 'a) : 0
    })(@Array<'a>)
  */ })))

register(express('Array.reduce2',
  takes(arrayType),
  takes(functionType(
    takes(generic('a')),
    takes(generic('a')),
    returns(generic('a')))),
  returns(generic('a')),
  as("@Array<'a>.reduce(@('a, 'a) -> 'a)")))

register(express('Array.reduce3',
  takes(arrayType),
  takes(functionType(
    takes(generic('a')),
    takes(generic('a')),
    takes(Number),
    returns(generic('a')))),
  returns(generic('a')),
  as("@Array<'a>.reduce(@('a, 'a, Number) -> 'a)")))

register(express('Array.reduce4',
  takes(arrayType),
  takes(functionType(
    takes(generic('a')),
    takes(generic('a')),
    takes(Number),
    takes(arrayType),
    returns(generic('a')))),
  returns(generic('a')),
  as("@Array<'a>.reduce(@('a, 'a, Number, Array<'a>) -> 'a)")))

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

;[{ type: generic('a'), name: 'console.log' },
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
