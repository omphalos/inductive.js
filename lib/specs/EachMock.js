'use strict'

var Assignment = require('./Assignment.js')

function EachMock(specification, target) {
  Object.defineProperty(this, 'specification', { value: specification })
  if(target instanceof Assignment)
    throw new Error('Cannot call EachMock with an assignment')
  this.target = target
}

EachMock.prototype.callback = function(fn) {
  this.fn = fn
}

EachMock.prototype.addToScenario = function(scenario) {
  var mock = scenario.mock(this.target)
  if(this.fn) mock.callback(this.fn)
}

module.exports = EachMock
