inductive.js
============

Inductive.js is an experimental implementation of [inductive programming](http://en.wikipedia.org/wiki/Inductive_programming) for JavaScript.  It takes a program specification, and it autogenerates a JavaScript program that matches the spec.

Example:

    specify('myFunc',
      given(2, shouldReturn(4)),
      given(3, shouldReturn(9)),
      use('*'))

Inductive.js auto-generates the program that passes these tests:

    function myFunc(arg0) {
      return (arg0 * arg0)
    }

If we change the spec:

    specify('myFunc',
      given(2, shouldReturn(8)), // 4 changed to 8
      given(3, shouldReturn(27)), // 9 changed to 27
      use('*'))

Inductive.js auto-generates a new program that passes the new spec:

    function myFunc(arg0) {
      return (arg0 * (arg0 * arg0))
    }

Features
========

Here are some of the things supported by inductive.js:

* Composition, letting you chain specifications together to construct programs of any size.

* Support for arbitary impure operations including console.log, AJAX, file I/O, DOM manipulation, and setTimeout -- using an API that resembles mocks or spies from standard testing frameworks.

* Strong typing guarantees.

* Straightforward interop with regular JavaScript.

Benefits
========

Programming with inductive.js provides many benefits:

* It lets you write and maintain only one version of your code, as opposed to updating two copies (code and tests) whenever you make a change.

* Inductive.js has a strong type system and checks these types at solve-time, which provides [stronger](http://evanfarrer.blogspot.com/2012/06/unit-testing-isnt-enough-you-need.html) guarantees than unit testing alone.

* Inductive.js lets you program at a higher level.  Writing code consists of  selecting JavaScript primitives and gluing them together.  With inductive.js, you can focus on selecting the building blocks and it figures out the rest.

Quick Start
===========

First:

    npm install inductive.js

Then inside a file called example.i.js:

    // Hoist the DSL into the global namespace:
    require('inductive.js').globals()

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

You give inductive.js constraints in the form of input/output pairs.  Additionally, you give it a list of building blocks with the `use` statement.  Inductive.js infers the type of your function from the input/outputs you provide, and looks at the types of primitives supplied in the `use` statement.  Then, it performs a brute-force search across all possible correctly-typed abstract syntax trees using the specified building blocks, and returns the shortest one that passes all the tests.

Status
======

This project is bleeding edge.  Proper documentation and examples are coming soon.  In the meantime, the test suite contains extensive examples of the functionality.  Additionally, buildingBlocks.js contains the default list of building blocks and examples for declaring your own.

License
=======

MIT
