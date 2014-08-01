'use strict'

var Expression = require('./Expression.js')

function ObjectCreateExpression(recordType) {
  var self = this
  Expression.call(self, 'record')
  var ctorName = recordType.ctor.name
    , space = recordType.children.length ? ' ' : ''
    , template = 'Object.create(' + ctorName + '.prototype, {' + space
  recordType.children.forEach(function(prop, index) {
    self.takes(prop.type, '@' + index)
    if(index) template += ', '
    template += '"' + prop.name + '": ' +
      '{ value: @' + index + ', enumerable: true }'
  })
  template += space + '})'
  self.returns(recordType)
  self.as(template)
}
ObjectCreateExpression.prototype = Object.create(Expression.prototype)
ObjectCreateExpression.prototype.constructor = ObjectCreateExpression

module.exports = ObjectCreateExpression
