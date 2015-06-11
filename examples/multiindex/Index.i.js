'use strict'

require('../../lib/inductive.js').globals()

function nameSelector(address) {
  return address.name
}

var element = typeParameter('element')

var selectorType = functionType(
  takes(element),
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
    takes(mapType.of(element), 'keyMap'),
    takes(mapType.of(element), 'idMap')),

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
    value({}, mapType.of(element))))
/*
specify('addIndex',

  takesContext(Index),
  takes(typeParameter('a')),

  returns(Index),

  given(Index.of(String, addressType).instantiate({
    name: 'addresses',
    selector: nameSelector
  }), returns(Index.of(addressType))))
*/
// protoMember(Index, add)

saveAll()

