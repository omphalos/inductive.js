var tap = {}
  , counter = 0
  , failures = 0
  , start = new Date()

tap.comment = function() {
  console.log('# ' +
    [].slice.apply(arguments).join(' ').split('\n').join('\n# '))
}

tap.inspect = function() {
  console.log.apply(console, ['#'].concat([].slice.apply(arguments)))
}

tap.logTest = function(testResult, cached) {
  console.log(testResult.toString(counter + 1, cached))
  failures += testResult.failures.length
  counter += testResult.results.length
}

tap.log = function(ok) {
  var rest = [].slice.call(arguments, 1).join(' ')
  if(!ok) failures++
  console.log((ok ? 'ok ' : 'not ok ') + (++counter) + ' - ' + rest)
}

tap.summarize = function() {
  end = +new Date()
  diff = (end - start) / 1000
  if(failures)
    this.log(false, failures, 'failure(s), ', diff, 'seconds')
  else this.log(true, 'all tests passed in', diff, 'seconds')
  console.log('1..' + counter)
}

module.exports = tap