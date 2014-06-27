var inductive = require('../../../lib/inductive.js')
  , express = inductive.express
  , returns = inductive.returns
  , forConstructor = inductive.forConstructor
  , recordType = inductive.recordType
  , as = inductive.as
  , requires = inductive.requires
  , takes = inductive.takes
  , nativeChild = require('./nativeChild.js')
  , NativeCtor = require('./NativeCtor.js')

var expressionForNativeChild = express('nativeChild',
  takes(Number),
  takes(Number),
  returns(Number),
  as('nativeChild(@Number, @Number)'),
  requires('./nativeChild.js'))

var recordForNativeCtor = recordType(
  takes(Number, 'x'),
  takes(String, 'y'),
  forConstructor(NativeCtor))

var newNativeCtor = express('new NativeCtor',
  takes(Number),
  returns(recordForNativeCtor),
  as('new NativeCtor(@Number)'),
  requires('./NativeCtor.js'))

exports.expressionForNativeChild = expressionForNativeChild
exports.newNativeCtor = newNativeCtor
exports.recordForNativeCtor = recordForNativeCtor
