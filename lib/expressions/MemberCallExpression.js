var Expression = require('./Expression.js')
  , ObjectCreateExpression = require('./ObjectCreateExpression.js')

function MemberCallExpression(recType, prop) {
  if(prop.type.contextType && !prop.type.contextType.containsType(recType, {})) {
    throw new Error(
      'Cannot create a call member expression on property ' + prop.name +
      ' because it must be applied against a ' + prop.type.contextType +
      ' but it belongs to a ' + recType)
  }
  var self = this
  Expression.call(self, '[' + JSON.stringify(prop.name) + ']()')
  self.takes(recType, '@record')
  self.returns(prop.type.returnType)

  var template = '(@record[' + JSON.stringify(prop.name) + ']('
  prop.type.getArgTypes().forEach(function(argType, index) {
    self.takes(argType, '@' + index)
    if(index) template += ', '
    template += '@' + index
  })
  template += '))'
  self.as(template)
  self.constrainChild(function(self, child) {
    // Optimization:
    // Don't get the MemberCall of a new record.
    return !(child instanceof ObjectCreateExpression)
  })
}
MemberCallExpression.prototype = Object.create(Expression.prototype)
MemberCallExpression.prototype.constructor = MemberCallExpression

module.exports = MemberCallExpression

