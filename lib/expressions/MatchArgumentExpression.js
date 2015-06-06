'use strict'

var UnionType = require('../types/UnionType.js')
  , Expression = require('./Expression.js')
  , MatchExpression = require('./MatchExpression.js')

function MatchArgumentExpression(
  // TODO better organize the order of these arguments
  argType, types, argIndex, childIndex, parent, returnType) {

  var self = this
  Expression.call(self, 'matchArg')
  self.takes(argType, '@candidate')
  types.forEach(function(c, index) {
    self.takes(types[index], '@' + index)
  })
  self.returns(returnType)
  this.argIndex = argIndex
  this.tag = 'arg' + this.argIndex
  this.throwConstraintFailures()

  var self = this
  var isParentMatch = parent instanceof MatchArgumentExpression

  parent.constrainChild(function(filteredParent, child, index) {

    // When the parent is the root FunctionExpression:
    if(!(parent instanceof MatchArgumentExpression)) {
      // The child should be *this* MatchArgumentExpression.
      return child.isDerivedFrom(self)
    }

    // When this is a nested MatchArgumentExpression:
    if(index === 0) // No need to check the parent's arg term.
      return true

    // Ignore checks for other expressions in the parent:
    if(!child.isDerivedFrom(self))
      return true

    // If the expression is this child, ensure it appears at the right location
    // (offset by -1 to account for parent's arg term)
    return index - 1 === childIndex
  })

  this.constrainChild(function(filteredSelf, child, index) {
    // Constrain the first child to be the specific arg
    var result = index || child.template === ('arg' + argIndex)
    return result
  })

  this.constrainParent(function(filteredSelf, candidateParent) {
    // Ensure that parent is the candidateParent (or a filtered version of it)
    var result =
      (parent === candidateParent) ||
      (candidateParent instanceof MatchArgumentExpression &&
        candidateParent.argIndex === parent.argIndex)
    return result
  })
}
MatchArgumentExpression.prototype = Object.create(MatchExpression.prototype)
MatchArgumentExpression.prototype.constructor = MatchArgumentExpression

MatchArgumentExpression.prototype.filterType = function() {
  var filtered = MatchExpression.prototype.filterType.apply(this, arguments)
  filtered.argIndex = this.argIndex
  return filtered
}

module.exports = MatchArgumentExpression
