function EachAssignmentMock(specification, target, value) {
  Object.defineProperty(this, 'specification', { value: specification })
  this.target = target
  this.value = value
}

EachAssignmentMock.prototype.addToScenario = function(scenario) {
  var mock = scenario.mock(this.target, this.value)
  mock.value = this.value
}

module.exports = EachAssignmentMock
