'use strict'

module.exports = {
  type: 'placeholder',
  toString: function() { return '?' },
  pushDescendants: function(buffer) { return buffer },
  containsType: function(other) { return other === this }
}