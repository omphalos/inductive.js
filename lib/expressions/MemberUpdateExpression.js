'use strict'

var Expression = require('./Expression.js')
  , ObjectCreateExpression = require('./ObjectCreateExpression.js')

function MemberUpdateExpression(recordType, members) {
  var self = this
  Expression.call(self, 'set!{ ' + members.join(', ') + ' }')
  var ctorName = recordType.ctor.name
  var template =
    '(function(original) {\n' +
    '  return Object.create(' + ctorName + '.prototype, {'
  self.takes(recordType, '@original')
  recordType.children.forEach(function(prop, index) {
    template += index ? ', ' : ' '
    if(members.indexOf(prop.name) < 0) {
      template += '"' + prop.name + '": ' +
        '{ value: original["' + prop.name + '"], enumerable: true }'
    } else {
      self.takes(prop.type, '@' + index)
      template += '"' + prop.name + '": ' +
        '{ value: @' + index + ', enumerable: true }'
    }
  })
  template +=
    ' })\n' +
    '})(@original)'
  self.returns(recordType)
  self.as(template)
  self.constrainChild(function(self, child, index) {
    // Optimization:
    // Don't update the member of a new record.
    return index || (
      !(child instanceof ObjectCreateExpression) &&
      !(child instanceof MemberUpdateExpression))
  })
}
MemberUpdateExpression.prototype = Object.create(Expression.prototype)
MemberUpdateExpression.prototype.constructor = MemberUpdateExpression

module.exports = MemberUpdateExpression
