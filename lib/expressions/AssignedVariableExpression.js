var Expression = require('./Expression.js')

function AssignedVariableExpression(assignmentName, assignmentSpecReturnType) {
  var self = this
  Expression.call(self, assignmentName)
  self.returns(assignmentSpecReturnType)
}
AssignedVariableExpression.prototype = Object.create(Expression.prototype)
AssignedVariableExpression.prototype.constructor = AssignedVariableExpression

AssignedVariableExpression.prototype.toCode = function(children, varCt, term) {
  if(!term) return this.name
  var mockName = JSON.stringify(this.name)
  // Ensure that Specifications are mocked:
  return 'mocksContainer.scenarioMocks[' + mockName + '].value'
}

AssignedVariableExpression.prototype.resolveType = function() {
  var resolved = Expression.prototype.resolveType.apply(this, arguments)
  return resolved
}

AssignedVariableExpression.prototype.filterType = function() {
  var resolved = Expression.prototype.filterType.apply(this, arguments)
  return resolved
}

module.exports = AssignedVariableExpression
