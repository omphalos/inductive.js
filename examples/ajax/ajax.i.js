require('../../lib/inductive.js').globals()

var Deferred = recordType(forConstructor('Deferred'))

var jQueryGetString = isolate('$.getString',
  takes(String, '@url'),
  takes(
    functionType(
      takes(String),
      returns(undefined)),
    '@fn'),
  returns(Deferred),
  as('$.get(@url, @fn)'))

run(

  specify('logJson',

    returns(Deferred),

    givenNoArgs(

      mock(jQueryGetString,
        callback(function callItBack(url, callbackFn) {
          callbackFn('contents')
          return Deferred.instantiate()
        }),
        verify('data.json')),

      mock('console.logString',
        verify('contents'))),

    givenNoArgs(

      mock(jQueryGetString,
        callback(function noCallback() {
          return Deferred.instantiate()
        }),
        verify('data.json')),

      mock('console.logString',
        verifyNotCalled())),

    use(
      jQueryGetString,
      'console.logString',
      functionExpressions(),
      value('data.json'))))

saveAll()
