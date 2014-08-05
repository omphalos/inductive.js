'use strict'

var util = {}
  , tap = require('./tap.js')
  , esprima = require('esprima')
  , escodegen = require('escodegen')

// Lists
util.arrayToList = function(array) {
  var list = null
  array.forEach(function(el) { list = { head: el, tail: list } })
  return list
}

util.listCount = function(list) {
  if(!list) return 0
  if(!list.tail) return 1
  return 1 + util.listCount(list.tail)
}

util.listAddKeyValue = function(list, key, value) {
  return { head: { key: key, value: value }, tail: list }
}

util.listLast = function(list) {
  if(!list) return null
  if(!list.tail) return list.head
  return util.listLast(list.tail)
}

util.listIndexOf = function(list, element) {
  if(!list) return -1
  if(list.head === element) return 0
  return 1 + util.listIndexOf(list.tail, element)
}

util.listFindValue = function(list, key) {
  if(!list) return null
  if(list.head.key === key) return list.head.value
  return util.listFindValue(list.tail, key)
}

util.listFindLastValue = function(list, key) {
  if(!list) return null
  return util.listFindLastValue(list.tail, key) || list.head.value
}

util.listRemoveFirst = function(list, el) {
  return !list ? null :
    list.head === el ? list.tail :
    { head: list.head, tail: util.listRemoveFirst(list.tail, el) }
}

util.listReverse = function listReverse(list, acc) {
  acc = acc || null
  return !list
    ? acc
    : listReverse(list.tail, { head: list.head, tail: acc }, list.tail)
}

util.listFilter = function(list, predicate) {
  if(!list) return null
  if(!predicate(list.head)) return util.listFilter(list.tail, predicate)
  return { head: list.head, tail: util.listFilter(list.tail, predicate) }
}

// Arrays
util.pluck = function(array, property) {
  return array.map(function(el) { return el[property] })
}

util.unique = function(arr) {
  var result = []
  arr.forEach(function(el) {
    if(result.indexOf(el) >= 0) return
    result.push(el)
  })
  return result
}

util.remove = function(arr, el) {
  var index = arr.indexOf(el)
  if(index < 0) return false
  arr.splice(index, 1)
  return true
}

util.without = function(arr, el) {
  var index = arr.indexOf(el)
  return index < 0 ? arr : arr.slice(0, index).concat(arr.slice(index + 1))
}

util.groupBy = function(array, fn) {
  var result = {}
  array.forEach(function(el) {
    var key = fn(el)
      , group = result[key]
    if(!group) return (result[key] = [el])
    group.push(el)
  })
  return result
}

util.arrayOfType = function(arr, T) {
  return arr.filter(function(el) { return el instanceof T })
}

util.arrayNotOfType = function(arr, T) {
  return arr.filter(function(el) { return !(el instanceof T) })
}

util.single = function(array) {
  if(!array.length) return null
  for(var i = 1; i < array.length; i++)
    if(array[i] !== array[0]) return null
  return array[0]
}

util.flatten = function(arrays) {
  var result = []
  arrays.forEach(function(a) { result = result.concat(a) })
  return result
}

// Objects
util.copy = function(source) {
  var target = {}
  if(!source) return target
  Object.keys(source).forEach(function(k) { target[k] = source[k] })
  return target
}

util.values = function(obj) {
  return Object.keys(obj).map(function(k) { return obj[k] })
}

util.objectGraphForEach = function(obj, fn, traversed) {
  if(!obj || typeof obj !== 'object') return
  traversed = traversed || []
  if(traversed.indexOf(obj) >= 0) return
  fn(obj)
  Object.keys(obj).forEach(function(key) {
    util.objectGraphForEach(obj[key], fn, traversed)
  })
}

util.mixin = function(target, source) {
  Object.keys(source).forEach(function(key) { target[key] = source[key] })
  return target
}

util.inherit = function(target, source) {
  return util.mixin({ __proto__: source }, target)
}

// Files
util.getFileStack = function() {
  var original = Error.prepareStackTrace
    , originalLimit = Error.stackTraceLimit
  Error.prepareStackTrace = function (_, stack) { return stack }
  Error.stackTraceLimit = 100
  var result = new Error().stack.
    map(function(f) { return f.getFileName() }).
    filter(function(f) { return f !== 'module.js' && f !== __filename})
  Error.prepareStackTrace = original
  Error.stackTraceLimit = originalLimit
  return result
}

util.tryGetCallingFile = function() {
  var stack = util.getFileStack()
  var ijsFiles = stack.filter(function(f) {
    return util.getOutputFileFrom(f)
  })
  if(!ijsFiles.length && stack.indexOf('repl') >= 0)
    return 'repl'
  return ijsFiles[0]
}

util.getCallingFile = function() {
  var result = util.tryGetCallingFile()
  if(!result) throw new Error('Could not find a file with an .i.js extension.')
  return result
}

util.getOutputFileFrom = function(file) {
  if(file === 'repl') return 'repl-session.js'
  var index = file.lastIndexOf('.i.js')
  return index >= 0 && index === file.length - '.i.js'.length ?
    file.substring(0, file.length - '.i.js'.length) + '.js' :
    null
}

util.getOutputFile = function() {
  return util.getOutputFileFrom(util.getCallingFile())
}

// Misc
util.identity = function(x) { return x }

util.comparands = {
  '>': function(x, y) { return x > y },
  '<': function(x, y) { return x < y },
  '>=': function(x, y) { return x >= y },
  '<=': function(x, y) { return x <= y },
  '===': function(x, y) { return x === y },
  '!==': function(x, y) { return x !== y }
}

util.stringRepeat = function(str, times) {
  if(times <= 0) return ''
  return new Array(times + 1).join(str)
}

util.equals = function(x, y, traversedX, traversedY) {
  traversedX = traversedX || []
  traversedY = traversedY || []
  if(x === y) return true
  if(!!x !== !!y) return false
  if(x instanceof Array && y instanceof Array) {
    if(x.length !== y.length) return false
    return x.reduce(function(prev, current, index) {
      return prev && util.equals(x[index], y[index], traversedX, traversedY)
    }, true)
  }
  if(x instanceof Date && y instanceof Date) return +x === +y
  if(x instanceof Object && y instanceof Object) {
    if(x.constructor.name !== y.constructor.name) return false
    var xTraversal = traversedX.indexOf(x)
      , yTraversal = traversedY.indexOf(y)
      , xNames = Object.keys(x).sort()
      , yNames = Object.keys(y).sort()
      , xValues = xNames.map(function(key) { return x[key] })
      , yValues = yNames.map(function(key) { return y[key] })
    if(xTraversal !== yTraversal) return false
    if(xTraversal >= 0) return true
    traversedX.push(x)
    traversedY.push(y)
    if(!util.equals(xNames, yNames, traversedX, traversedY)) return false
    if(!util.equals(xValues, yValues, traversedX, traversedY)) return false
    return true
  }
  if(x && x.equals) return x.equals(y)
  return false
}

util.prettify = function(code, options) {
  try {
    if(code.indexOf('\n') < 0 && code.indexOf('//') === 0) {
      // Workaround for issue with one-line comments and escodegen.
      return code
    }
    var ast = esprima.parse(code, {
      tokens: true,
      attachComment: true,
      range: true
    })
    escodegen.attachComments(ast, ast.comments, ast.tokens)
    return escodegen.generate(ast, options)
  } catch(err) {
    tap.comment(code)
    tap.comment(err.stack)
    throw new Error('Unable to prettify code')
  }
}

util.valueToCode = function(value) {
  if(value === null) return 'null'
  if(value === undefined) return 'undefined'
  if(typeof value === 'boolean') return value.toString()
  if(typeof value === 'number') return value.toString()
  return JSON.stringify(value)
}

util.toFriendlyInlineString = function(x) {
  if(x instanceof Function) return x.toString().replace(/\n/g, ' ')
  if(typeof x === 'string') return JSON.stringify(x)
  if(!(x instanceof Object)) return '' + x
  if('name' in x) return x.name
  if(Object.hasOwnProperty(x, 'toString')) return x.toString()
  var traversed = []
  var stringified = JSON.stringify(x, function(key, value) {
    if(String.prototype.toString(value) === '[object Object]') {
      var traversedIndex = traversed.indexOf(value)
      if(traversedIndex >= 0) return '<Circular@' + traversedIndex + '>'
      traversed.push(value)
    }
    return value
  }, ' ').
  replace(/\"([^(\")"]+)\":/g,"$1:").
  replace(/\n/g, ' ')
  while(stringified.indexOf('  ') >= 0)
    stringified = stringified.replace(/  /g, ' ')
  return stringified
}

util.findObjectPath = function(parent, target) {
  var exps = util.getExports(parent)
  for(var e = 0; e < exps.length; e++)
    if(exps[e].value === target)
      return exps[e].path
  return undefined
}

util.getExports = function(obj, traversed) {
  if(!(obj instanceof Object)) return []
  traversed = traversed || []
  if(traversed.indexOf(obj) >= 0) return []
  traversed.push(obj)
  if(obj.isSpecification || obj.isAssignment)
    return [{ path: null, value: obj }]
  var results = []
  Object.keys(obj).forEach(function(key) {
    var prop = obj[key]
    if(!prop) return
    util.getExports(prop, traversed).forEach(function(exp) {
      results.push({ path: [key].concat(exp.path || []), value: exp.value })
    })
  })
  return results
}

util.cartesianProduct = function(lhs, rhs) {
  if(arguments.length < 1) return []
  if(arguments.length === 1) return lhs

  // Simple cartesian product product of two arrays:
  if(arguments.length === 2) {
    var result = []
    for(var x = 0; x < lhs.length; x++)
      for(var y = 0; y < rhs.length; y++)
        result.push([lhs[x], rhs[y]])
    return result
  }

  // Recursively get the product of the first two arguments:
  var firstTwoProduct = cartesianProduct(lhs, rhs)
  // Recursively combine with the rest of the arguments:
  var argsWithFirstTwoProduct =
    [firstTwoProduct].concat([].slice.call(arguments, 2))
  return cartesianProduct.
    apply(null, argsWithFirstTwoProduct).
    map(function flatten(array) {
      if(!(array instanceof Array)) return [array]
      var result = []
      for(var i = 0; i < array.length; i++)
        result.push.apply(result, flatten(array[i]));
      return result
    })
}

module.exports = util
