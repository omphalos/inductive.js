'use strict'

var util = require('./util.js')
  , path = require('path')

var defaultOptions = {
  cacheFilename:
    path.dirname(require.main ? require.main.filename : process.cwd()) +
    path.sep + '.inductive.cache.json',
  escodegen: {
    format: {
      indent: { style: '  ' },
      // semicolons: false // Inconsistently implemented in escodgen :(
    }
  },
  loadCache: true,
  maxAstNodes: 20,
  recordTypeDetail: false,
  searchPath: null,
  shouldRunTest: function(name) {
    return !this.testsToRun || this.testsToRun.indexOf(name) >= 0
  },
  stopOnFailure: false,
  termCheck: 10,
  testsToRun: null,
  throwCacheErrors: false,
  timeout: 2000,
  verbosity: 0
}

module.exports = util.extend({}, defaultOptions)