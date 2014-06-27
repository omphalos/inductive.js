var MatchExpression = require('./MatchExpression.js')

function MatchArgumentExpression(types, argIndex, isParentRoot, matchParent) {
  MatchExpression.call(this, types)
  this.argIndex = argIndex
  this.throwConstraintFailures()

  var that = this
  matchParent.constrainChild(function(self, child, index) {
    var result = (!!isParentRoot) === (!!index) ||
      that.containsType(child, {})
    return result
  })

  this.constrainChild(function(self, child, index) {
    var result = index || child.template === ('arg' + argIndex)
    return result
  })

  this.constrainParent(function(self, parent) {
    var result =
      (isParentRoot && parent === matchParent) ||
      (!isParentRoot && parent instanceof MatchArgumentExpression &&
        parent.argIndex === argIndex - 1)
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

MatchArgumentExpression.prototype.filterType = function() {
  var filtered =
    MatchExpression.prototype.filterType.apply(this, arguments)
  filtered.argIndex = this.argIndex
  return filtered
}

MatchArgumentExpression.prototype.toString = function() {
  var base = MatchExpression.prototype.toString.apply(this, arguments)
  return base + ' #arg' + this.argIndex
}

module.exports = MatchArgumentExpression
