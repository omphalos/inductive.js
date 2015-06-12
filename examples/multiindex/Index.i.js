'use strict'

require('../../lib/inductive.js').globals()

require('./BinaryTree.i.js')  

function nameSelector(address) {
  return address.name
}

var elementType = typeParameter('element')

var selectorType = functionType(
  takes(elementType),
  returns(String))

var addressType = recordType(
  takes(Number, 'id'),
  takes(String, 'name'))

var optionalString = unionType(String, undefined)

var Index = specifyConstructor('Index',

  takes(String),
  takes(selectorType),
  takes(optionalString),

  returnsRecordThat(
    takes(String, 'name'),
    takes(selectorType, 'selector'),
    takes(String, 'idProperty'),
    takes(mapType.of(elementType), 'keyMap'),
    takes(mapType.of(elementType), 'idMap')),

  given('addresses', nameSelector, 'uuid',
    shouldReturn({
      idMap: {},
      idProperty: 'uuid',
      keyMap: {},
      name: 'addresses',
      selector: nameSelector
    })),

  given('addresses', nameSelector, undefined,
    shouldReturn({
      idMap: {},
      idProperty: 'id',
      keyMap: {},
      name: 'addresses',
      selector: nameSelector
    })),

  use(
    matches(),
    value('id'),
    value({}, mapType.of(elementType))))

var addressIndex = Index.instantiate({
  name: 'addresses',
  selector: nameSelector
})

specify('addIndex',

  takesContext(Index),
  takes(elementType),

  returns(Index),

  given(context(addressIndex), { name: 'abc', id: 0 },
    shouldReturn(addressIndex)))

saveAll()

