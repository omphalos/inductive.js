module.exports = {
  type: 'placeholder',
  toString: function() { return '?' },
  pushDescendants: function(buffer) { return buffer },
  canonicalize: function() { return this },
  unwrapSmallTypes: function() { return this },
  containsType: function(other) { return other === this },
  resolveTypeFrom: function() { return this }
}