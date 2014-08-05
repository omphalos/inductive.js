'use strict'

console.log('\x1B[2J') // clear screen

var fs = require('fs')
  , inductive = require('../lib/inductive.js')
  , globalOptions = inductive.globalOptions

globalOptions.maxAstNodes = 20
globalOptions.recordTypeDetail = false
Error.stackTraceLimit = 15

var cacheFile = __dirname + '/.inductive.cache.json'
if(fs.existsSync(cacheFile)) fs.unlinkSync(cacheFile)
require('./testTypes.i.js')
require('./testSolves.i.js')
require('./testFiles.i.js')

