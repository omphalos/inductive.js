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

var setHtml = isolate('setHtml',
  takes(String, '@selector'),
  takes(String, '@html'),
  returns(undefined),
  as("void $(@selector).html(@html)"))

var setBodyHtml = specify('setBodyHtml',
  given('new html',
    mock(setHtml,
      verify('body', 'new html'))),
  use(value('body'), setHtml))

run(

  specify('main',

    returns(Deferred),

    givenNoArgs(

      mock(jQueryGetString,
        callback(function callItBack(url, callbackFn) {
          callbackFn('contents')
          return Deferred.instantiate()
        }),
        verify('data.txt')),

      mock(setBodyHtml,
        verify('contents'))),

    use(
      jQueryGetString,
      setBodyHtml,
      functionExpressions(),
      value('data.txt'))))

saveAll()
