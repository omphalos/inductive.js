// Hoist the DSL into the global namespace:
require('./lib/inductive.js').globals()

// Specify our program:
var helloWorld =
  specify('helloWorld',
    givenNoArgs(
      mock('console.log',
        verify('hello world'))),
    use(
      'console.log',
      value('hello world'))))

run(helloWorld)

// Generate the .js file:
save()
