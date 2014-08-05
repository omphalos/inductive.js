'use strict'

var util = require('./util.js')
  , globalOptions = require('./globalOptions.js')
  , tap = require('./tap.js')
  , FileContents = require('./FileContents.js')
  , fs = require('fs')
  , fsPath = require('path')
  , fileContext = {}
  , fileOptionsMap = {}
  , fileContentsMap = {}
  , caches = { sourceCache: null, outputCache: {} }

function getCache(type) {
  if(!caches[type]) {
    if(globalOptions.loadCache) {
      var cacheFilename = globalOptions.cacheFilename
      if(util.getCallingFile() === 'repl')
        caches[type] = {}
      else {
        try {
          var cacheBuffer = fs.readFileSync(cacheFilename).toString()
          caches[type] = JSON.parse(cacheBuffer.toString())
        } catch(err) {
          if(err.message.indexOf('ENOENT') === 0)
            tap.comment('No cache file loaded: ' + cacheFilename)
          else throw err
          caches[type] = {}
        }
      }
    } else {
      caches[type] = {}
    }
  }
  return caches[type]
}

function getFileCache(type) {
  var cache = getCache(type)
    , callingFile = util.getCallingFile()
    , result = cache[callingFile] || (cache[callingFile] = {})
  return result
}

fileContext.getFileContents = function(file) {
  return (
    fileContentsMap[file || util.getOutputFile()] ||
    (fileContentsMap[file || util.getOutputFile()] =
      new FileContents(util.getCallingFile())))
}

fileContext.getFileOptions = function() {
  return (
    fileOptionsMap[util.getCallingFile()] ||
    (fileOptionsMap[util.getCallingFile()] =
      util.inherit({}, globalOptions)))
}

fileContext.getCacheKeys = function() {
  return Object.keys(getCache('sourceCache'))
}

fileContext.getCachedSolutionAst = function(name) {
  var sourceCache = getFileCache('sourceCache')
  return sourceCache[name]
}

fileContext.cacheNewSolutionAst = function(name, ast) {
  var outCache = getFileCache('outputCache')
  outCache[name] = ast
}

fileContext.reset = function() {
  caches.sourceCache = null
  fileContentsMap = {}
}

fileContext.saveCache = function(cont) {
  var cacheFilename = globalOptions.cacheFilename
    , cache = caches.outputCache
    , cacheContents = JSON.stringify(cache, null, '  ')
  tap.comment('Saving cache to', cacheFilename)
  return fs.writeFile(cacheFilename, cacheContents, cont)
}

fileContext.getFiles = function() {
  return Object.keys(fileContentsMap)
}

module.exports = fileContext