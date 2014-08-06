// Load the DSL:
require('./lib/inductive.js').globals()

// Specify our program:
run(
  specify('helloWorld',
    givenNoArgs(
      mock('console.log',
        verify('hello world'))),
    use(
      'console.log',
      value('hello world'))))

// Generate the .js file:
saveAll()
