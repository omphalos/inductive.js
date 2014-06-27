inductive.js
============

Inductive.js is an experimental implementation of [inductive programming](http://en.wikipedia.org/wiki/Inductive_programming) for JavaScript.  You give it a program specification, and it autogenerates a JavaScript program for you.

Example:

    specify('myFunc',
      given(2, shouldReturn(4)),
      given(3, shouldReturn(9)),
      use('*'))

Inductive.js will output:

    function myFunc(arg0) {
      return (arg0 * arg0)
    }

If we change the specification:

    specify('myFunc',
      given(2, shouldReturn(8)),
      given(3, shouldReturn(27)),
      use('*'))

Inductive.js outputs a new program:

    function myFunc(arg0) {
      return (arg0 * (arg0 * arg0))
    }

Features
========

Here are some of the things supported by inductive.js:

* Support for objects, prototypes, constructors, hashtables, try/catch/finally, arrays, functions (including higher-order functions), recursion and more.

* Arbitary impure operations including console.log, AJAX, file I/O, DOM manipulation, and setTimeout -- using an API that resembles mocks or spies from standard testing frameworks.

* Straightforward interop between generated code and regular JavaScript.

* Strong typing guarantees that protect against all sorts of errors -- including null-reference-style errors such as "Object Y has no method 'x'".

* Composition, letting you chain specifications together to construct programs of any size.

Benefits
========

Programming with inductive.js provides many benefits:

* You write and maintain only one version of your code, as opposed to updating two copies (your code and your tests) whenever you make a change.

* Inductive.js has a strong type system and checks these types at test-time.  Strong typing guarantees are much stronger than the guarantees that you get with normal unit tests ([reference](http://evanfarrer.blogspot.com/2012/06/unit-testing-isnt-enough-you-need.html)).

* Inductive.js lets you program at a higher level.  Normally, coding consists of  selecting JavaScript primitives and figuring out how to glue them together.  With inductive.js, you focus on selecting the building blocks and it figures out the rest.

Quick Start
===========

First:

    npm install inductive.js

Then inside a file called example.i.js:

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

Build the program with node:

    node example.i.js

You can now run the auto-generated program:

    node example.js

How it Works
============

You give inductive.js constraints in the form of input/output pairs.  Additionally, you give it a list of building blocks with the `use` statement.  Inductive.js infers the type of your function from the input/outputs you provide, and looks at the types of primitives supplied in the `use` statement.  Then, it performs a brute-force search across all possible correctly-typed abstract syntax trees using the specified building blocks, and returns the shortest one that passes the all tests.

Status
======

This project is bleeding edge.  Proper documentation and examples are coming soon.  In the meantime, the test suite contains extensive examples of the functionality.  Additionally, buildingBlocks.js contains the default list of building blocks and examples for declaring your own.

License
=======

MIT
