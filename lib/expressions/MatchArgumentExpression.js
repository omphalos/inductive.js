'use strict'

var MatchExpression = require('./MatchExpression.js')

function MatchArgumentExpression(
  types, argIndex, childIndex, parent, returnType, fnReturnType) {

  MatchExpression.call(this, types, returnType)
  this.returns(fnReturnType)
  this.argIndex = argIndex
  this.throwConstraintFailures()

  var self = this
  parent.constrainChild(function(filteredParent, child, index) {
    // When the parent is the root FunctionExpression:
    if(!(parent instanceof MatchArgumentExpression)) {
      // The child should be *this* MatchArgumentExpression.
      return child instanceof MatchArgumentExpression &&
        child.argIndex === argIndex
    }

    // When this is a nested MatchArgumentExpression:
    if(index === 0) // No need to add a check for the parent's arg term.
      return true

    // Ignore checks for other branches of the parent's MatchArgumentExpression
    if(index - 1 !== childIndex) return true

    // Ensure that the child at the specified index is *this* expression
    return child instanceof MatchArgumentExpression &&
      child.argIndex === argIndex
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

MatchArgumentExpression.prototype.resolveType = function() {
  var resolved =
    MatchExpression.prototype.resolveType.apply(this, arguments)
  resolved.argIndex = this.argIndex
  return resolved
}

MatchArgumentExpression.prototype.tryFilterType = function() {
  var filtered = MatchExpression.prototype.tryFilterType.apply(this, arguments)
  if(!filtered) return null
  filtered.argIndex = this.argIndex
  return filtered
}

MatchArgumentExpression.prototype.toString = function() {
  var base = MatchExpression.prototype.toString.apply(this, arguments)
  return base + ' #arg' + this.argIndex
}

module.exports = MatchArgumentExpression
