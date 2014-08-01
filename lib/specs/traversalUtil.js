'use strict'

var util = require('../util.js')
  , AstNode = require('./AstNode.js')
  , traversalUtil = {}

traversalUtil.toString = function(traversal) {
  return traversalUtil.toAst(traversal).toString()
}

traversalUtil.toAst = function(traversal) {
  var current = util.listReverse(traversal)
    , map = {}
    , head = current.head
    , expr = head.expr
    , varCount = head.varCount
    , root = new AstNode(null, null, expr, varCount)
  map[current.head.id] = root
  while(current = current.tail) {
    if(current.head.expr) {
      var child = new AstNode(
        current.head.id,
        current.head.parentId,
        current.head.expr,
        current.head.varCount)
      map[current.head.id] = child
      map[current.head.parentId].children.push(child)
    }
    if(current.head.comment !== undefined)
      map[current.head.parentId].comments.push(current.head.comment)
  }
  return root
}

module.exports = traversalUtil