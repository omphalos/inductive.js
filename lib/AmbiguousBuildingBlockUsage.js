function AmbiguousBuildingBlockUsage(name) {
  this.name = name
  this.alternatives = [].slice.call(arguments, 1)
  if(this.alternatives.length < 2)
    throw new Error(
      'AmbiguousBuildingBlockUsage requires at least two alternatives.')
}

AmbiguousBuildingBlockUsage.prototype.toString = function() {
  return 'The expression, "' + this.name + '"' +
    ' is ambiguous.  Instead use: ' +
    this.alternatives.join(', ')
}

module.exports = AmbiguousBuildingBlockUsage
