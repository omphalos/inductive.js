var util = require('./util.js')
  , apiMethods = require('./apiMethods.js')

function DeferredApiCall(path, args) {
  this.path = path
  this.args = [].slice.apply(args)
}

DeferredApiCall.callChildren = function(args, fn) {
  var argArray = [].slice.apply(args)
    , apiCallArgs = util.arrayOfType(argArray, DeferredApiCall)
    , nonApiArgs = util.arrayNotOfType(argArray, DeferredApiCall)
  var result = fn.apply(null, nonApiArgs)
  for(var a = 0; a < apiCallArgs.length; a++) {
    var apiCall = apiCallArgs[a]
      , path = apiCall.path.slice()
      , obj = result
      , parent
    do {
      parent = obj
      var fragment = path.shift()
      if(!obj[fragment]) {
        var validCalls = Object.keys(obj).filter(function(key) {
          return apiMethods.indexOf(key) >= 0
        })
        throw new Error(obj.constructor.name + ' does not support "' +
          fragment + '".  Valid ' + obj.constructor.name + ' calls are: ' +
          validCalls.join(', ') + '.')
      }
      obj = obj[fragment]
    } while(path.length)
    obj.apply(parent, apiCall.args)
  }
  return result
}

module.exports = DeferredApiCall
