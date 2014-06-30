var inductive = require('./inductive.js').globals()
  , argv = process.argv.slice(2)
  , helps = ['help', '-help', '--help', '-h', '--h', '/?', '/help']
  , wantsHelp = false

for(var a = 0; a < argv.length; a++)
  if(helps.indexOf(argv[a]) >= 0)
    wantsHelp = true

if(!argv.length || wantsHelp)
  return console.log('Usage: inductivejs <filename>')

argv.forEach(function(a) {
  console.log('# Loading', a)
  require(a)
})

inductive.saveAll(function(err) { if(err) throw er })
