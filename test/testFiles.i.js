var fs = require('fs')
  , typeUtil = require('../lib/types/typeUtil.js')
  , fileContext = require('../lib/fileContext.js')
  , ctorUtil = require('../lib/ctorUtil.js')
  , tap = require('../lib/tap.js')
  , inductive = require('../lib/inductive.js')
  , saveAll = inductive.saveAll

deleteFileSync(__dirname + '/.inductive.cache.json')
testFileGeneration(false, function() {
  testFileGeneration(true, tap.summarize.bind(tap))
})

function testFileGeneration(cached, cont) {

  // Ensure the target folder is clean.
  var files = [
    'main',
    'lib/childComponent',
    'lib/childSiblingComponent',
    'siblingComponent',
    'chainedDependency'
  ]

  // Forces reload.
  fileContext.reset() // TODO use fileContext
  // Workaround for the fact that creating
  // a constructor twice creates another one
  ctorUtil.unregister('Human')
  ctorUtil.unregister('President')
  var cacheKeys = fileContext.getCacheKeys()
  if(cached && !cacheKeys.length)
    throw new Error('Cache expected but no keys loaded')

  files.forEach(function(f) {
    delete require.cache[__dirname + '/project-actual/' + f + '.i.js']
    deleteFileSync(__dirname + '/project-actual/' + f + '.js')
  })

  // Generate files.
  require('./project-actual/main.i.js')

  saveAll(function() {
    // Validate the files.
    files.forEach(function(f) {
      f += '.js'
      var actualFile = fs.readFileSync(__dirname + '/project-actual/' + f)
        , expectedFile = fs.readFileSync(__dirname + '/project-expected/' + f)
        , cacheTag = cached ? '[cached] ' : ''
      tap.log(actualFile.toString() === expectedFile.toString(),
        cacheTag + 'should generate ' + f + ' correctly')
    })

    cont()
  })
}

function deleteFileSync(f) {
  if(fs.existsSync(f)) fs.unlinkSync(f)
}
