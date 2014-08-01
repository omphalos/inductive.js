'use strict'

var CallExpression = require('./CallExpression.js')
  , MatchExpression = require('./MatchExpression.js')

function RecursiveCallExpression(functionType, functionName, functionExpr) {
  CallExpression.call(this, functionType, functionName)
  this.constrainParent(function(self, parent, childIndex) {
    // Don't put a recursive call expression at the root of the AST.
    return parent !== functionExpr && (
      childIndex || !(parent instanceof MatchExpression))
  })
}
RecursiveCallExpression.prototype = Object.create(CallExpression.prototype)
RecursiveCallExpression.prototype.constructor = RecursiveCallExpression

module.exports = RecursiveCallExpression
