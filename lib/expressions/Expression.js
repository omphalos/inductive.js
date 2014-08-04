'use strict'

var typeUtil = require('../types/typeUtil.js')
  , ExpressionArgument = require('./ExpressionArgument.js')
  , util = require('../util.js')
  , fsPath = require('path')
  , Requirement = require('../Requirement.js')
  , Type = require('../types/Type.js')

function Expression(name) {
  this.name = name
  this.type = null
  this.args = []
  this.template = null
  this.requirements = []
  // Binding types are the types of variables added to scope.
  // This is essentially just used for variable filtering
  // in FunctionExpressions.
  this.bindingTypes = []
  this.protoExpression = null
}

Expression.prototype.requires = function(name, alias) {
  var outputFile = util.getOutputFile()
    , callingFile = util.getCallingFile()
  alias = alias || fsPath.basename(name, fsPath.extname(name))
  var Module = module.constructor
  Module._load(callingFile)
  var mod = Module._cache[callingFile]
    , isRelative = name[0] === '.' || name[0] === '/'
    , filename = Module._resolveFilename(name, mod)
    , obj = mod.require(name)
    , req = new Requirement(name, alias, isRelative, filename, obj, '')
  this.requirements.push(req)
}

Expression.prototype.binds = function() {
  this.bindingTypes = this.bindingTypes.concat([].slice.apply(arguments))
}

Expression.prototype.resolveType = function(recordTypesBySignature) {
  var resolved = Object.create(Object.getPrototypeOf(this))
  Expression.call(resolved, this.name)
  resolved.args = this.args.map(function(a) {
    return a.resolveType(recordTypesBySignature)
  })
  resolved.type = typeUtil.resolveType(this.type, recordTypesBySignature)
  resolved.template = this.template
  resolved.parentConstraint = this.parentConstraint
  resolved.childConstraint = this.childConstraint
  resolved.bindingTypes = this.bindingTypes.map(function(t) {
    return typeUtil.resolveType(t, recordTypesBySignature)
  })
  resolved.seedCode = this.seedCode
  resolved.constraintsFailSilently = this.constraintsFailSilently
  resolved.defaultMockFn = this.defaultMockFn
  resolved.requirements = this.requirements.slice()
  resolved.protoExpression = this
  return resolved
}

Expression.prototype.silenceConstraintFailures = function() {
  this.constraintsFailSilently = true
}

Expression.prototype.throwConstraintFailures = function() {
  this.constraintsFailSilently = false
}

Expression.prototype.curry = function(child, childIndexPredicate) {
  var self = this
  this.constrainChild(function(filteredParent, filteredChild, index) {
    var result = !childIndexPredicate(index) || (
      self.containsType(filteredParent, {}) &&
      child.containsType(filteredChild, {}))
    return result
  })
  child.constrainParent(function(filteredChild, filteredParent) {
    var result =
      self.containsType(filteredParent, {}) &&
      child.containsType(filteredChild, {})
    return result
  })
}

Expression.prototype.constrainParent = function(newConstraint) {
  if(this.parentConstraint) {
    var prevConstraint = this.parentConstraint
    this.parentConstraint = function(self, parent, index) {
      return prevConstraint(self, parent, index) &&
        newConstraint(self, parent, index)
    }
  } else this.parentConstraint = newConstraint
}

Expression.prototype.constrainChild = function(newConstraint) {
  if(this.childConstraint) {
    var prevConstraint = this.childConstraint
    this.childConstraint = function(self, child, index) {
      return prevConstraint(self, child, index) &&
        newConstraint(self, child, index)
    }
  } else this.childConstraint = newConstraint
}

Expression.prototype.allowParent = function(parent, index) {
  return (
    !this.parentConstraint || this.parentConstraint(this, parent, index))
}

Expression.prototype.allowChild = function(child, index) {
  return (
    !this.childConstraint || this.childConstraint(this, child, index))
}

Expression.prototype.hasGenericArgs = function() {
  return this.args.reduce(function(prev, next) { 
    return prev || next.type.hasTypeParameter()
  }, false)
}

Expression.prototype.hasTypeParameter = function() {
  return this.type.hasTypeParameter() || this.hasGenericArgs()
}

Expression.prototype.isDerivedFrom = function(expr) {
  return this === expr || (
    this.protoExpression && (
      this.protoExpression === expr ||
      this.protoExpression.isDerivedFrom(expr)))
}

Expression.prototype.copy = function() {
  return this.tryFilterType({})
}

Expression.prototype.tryFilterType = function(typeFilters) {
  if(Object.keys(typeFilters).length === 0) return this
  var filtered = Object.create(Object.getPrototypeOf(this))
  Expression.call(filtered, this.name)
  var failed = false
  filtered.args = this.args.map(function(a) {
    var result = a.tryFilterType(typeFilters)
    failed = failed || !result
    return result
  })
  filtered.type = this.type.tryFilterType(typeFilters)
  if(!filtered.type) return null
  filtered.template = this.template
  filtered.parentConstraint = this.parentConstraint
  filtered.childConstraint = this.childConstraint
  filtered.bindingTypes = this.bindingTypes.map(function(t) {
    var result = t.tryFilterType(typeFilters)
    failed = failed || !result
    return result
  })
  filtered.seedCode = this.seedCode
  filtered.constraintsFailSilently = this.constraintsFailSilently
  filtered.defaultMockFn = this.defaultMockFn
  filtered.requirements = this.requirements.slice()
  filtered.protoExpression = this
  return failed ? null : filtered
}

Expression.prototype.validateType = function(arg) {
  if(!(arg instanceof Type))
    throw new Error('arg should be a Type: ' + arg)
}

Expression.prototype.toString = function() {
  var str = this.name + ' : ' + this.type.toString()
  var result = this.args.length ?
    str + ' takes ' + '(' + util.pluck(this.args, 'type').join(', ') + ')' :
    str
  return result
}

Expression.prototype.takesResolved = function(type, templateAlias) {
  this.validateType(type)
  var argument = new ExpressionArgument(this, type, templateAlias)
  this.args.push(argument)
  return argument
}

Expression.prototype.takes = function(type, templateAlias) {
  this.takesResolved(typeUtil.resolveType(type, {}), templateAlias)
}

Expression.prototype.as = function(template) {
  if(!(template instanceof Function)) {
    this.template = template
    return
  }
  var fnStr = template.toString()
    , start = fnStr.indexOf('/*')
    , end = fnStr.lastIndexOf('*/')
    , fnTemplate = fnStr.substring(start + 2, end - 1)
    , lines = fnTemplate.split('\n')
    , clean = lines.filter(function(l) { return l.trim().length })
  var indents = clean.map(function(line) {
    var i;
    for(i = 0; i < line.length && line[i] === ' '; i++);
    return line.substring(0, i)
  })
  var lengths = indents.map(function(indent) { return indent.length })
    , min = Math.min.apply(null, lengths)
    , unindented = clean.map(function(l) { return l.substring(min) })
  this.template = unindented.join('\n')
  return
}

Expression.prototype.returnsResolved = function(type) {
  this.validateType(type)
  this.type = type
}

Expression.prototype.returns = function(type) {
  this.returnsResolved(typeUtil.resolveType(type, {}))
}

Expression.prototype.toCode = function(children, varCount, term) {

  var self = this
    , code = self.template
  
  if(!code) throw new Error('Missing template for expression ' + self.name)
  self.args.forEach(function(arg, argIndex) {

    var templateAlias = self.args[argIndex].templateAlias
      , child = children[argIndex]

      var childCode = child.expr.toCode(
        child.children,
        child.varCount,
        term)

    var before = code
    code = code.replace(templateAlias, childCode)
    if(before === code)
      throw new Error('Template variable ' + templateAlias +
        ' not found in ' + self.template)
  })

  return code
}

module.exports = Expression
