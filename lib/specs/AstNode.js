var util = require('../util.js')

function AstNode(id, parentId, expr, varCount) {
  this.id = id
  this.parentId = parentId
  this.expr = expr
  this.varCount = varCount
  this.children = []
  this.comments = []
}

AstNode.prototype.toString = function(indent) {
  indent = indent || 0
  var corner = indent > 0 ? '\u231e ' : ''
    , indentStr = indent > 0 ? util.stringRepeat(' ', indent * 2 - 2) : ''
  var comments = this.comments.map(function(c) {
    return indentStr + '  # ' + c
  })
  return [indentStr + corner + this.expr.toString()].
    concat(this.children.map(function(c) {
      return c.toString(indent + 1)
    })).
    join('\n')
}

module.exports = AstNode
