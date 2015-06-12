'use strict'

require('../../lib/inductive.js').globals()

specify('add',

  given('k', 'v', null,
    shouldReturn({ left: null, right: null, key: 'k', value: 'v' })),

  given('k', 'v', null,
    shouldReturn({ left: null, right: null, key: 'k', value: 'v' })),

  given('k', 'v', { left: null, right: null, key: 'j', value: 'v' },
    shouldReturn({
      left: { left: null, right: null, key: 'j', value: 'v' },
      right: null,
      key: 'k',
      value: 'v'
    })))

specify('remove',

  given('k', 'v', { left: null, right: null, key: 'k', value: 'v' },
    shouldReturn(null)))

specify('find',

  given('k', 'v', { left: null, right: null, key: 'k', value: 'v' },
    shouldReturn({ left: null, right: null, key: 'k', value: 'v' })))

return
var BinaryTree = specifyConstructor('BinaryTree',

  takes(OptionalValue),
  takes(OptionalValue),
  takes(Value),
  takes(Comparer),

  returnsRecordThat(
    takes(OptionalValue, 'left'),
    takes(OptionalValue, 'right'),
    takes(Value, 'value'),
    takes(Comparer, 'comparer')),

  given(null, null, 3, compare,
    shouldReturn({
      left: null,
      right: null,
      value: 3,
      comparer: compare
    })))


