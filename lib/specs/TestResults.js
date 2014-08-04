'use strict'

var clock = require('./clock.js')
  , ctorUtil = require('../ctorUtil.js')
  , util = require('../util.js')
  , tap = require('../tap.js')

function TestResults(spec, testContext, scens, fn, mocksContainers, noThrow) {

  clock.reset()
  this.fn = fn
  this.specification = spec
  var isCtor = spec.isConstructor
  spec.beforeAllCallback.apply(testContext)

  this.results = scens.map(function(scenario) {

    if(mocksContainers) {
      mocksContainers.forEach(function(mc) {
        mc.scenarioMocks = scenario.mocks
      })
      Object.keys(scenario.mocks).forEach(function(key) {
        scenario.mocks[key].prepare()
      })
    }
    var error, threw, afterErr, threwAfter, afterEachErr, threwAfterEach
      , actual
      , args = scenario.getArgs()

    try {
      spec.beforeEachCallback.apply(testContext)
      scenario.beforeCallback.apply(testContext)
      actual = fn ? fn.apply(scenario.thisArg || null, args) : null
      threw = false
    } catch(err) {
      error = err
      threw = true
    } finally {
      try {
        scenario.afterCallback.apply(testContext)
      } catch(err) {
        threwAfter = true
        afterErr = err
        error = error || err
        threw = true
      }
      try {
        spec.afterEachCallback.apply(testContext)
      } catch(err) {
        threwAfterEach = true
        afterEachErr = err
        error = error || err
        threw = true
      }
    }
    return scenario.expectations.map(function(exp) {
      var rethrow =
        threw && !noThrow &&
        error !== 'termination guarantee' &&
        !('throwFn' in exp)
      if(rethrow) {
        if(args.length)
          tap.comment(
            'Error thrown when called with ' + getArgString(scenario))
        else tap.comment('Error thrown')
        throw error
      }
      // if(!mocksContainers && exp.mockVerification) return null
      var ok = fn && error !== 'termination guarantee' && 
        (!mocksContainers || !exp.mockVerification || exp.verifyMock()) &&
        (!exp.verifiesCount || exp.verifyCallCount()) && (
        (threw && exp.returnFn) ? false :
        (threw && exp.throwFn) ? exp.throwFn(error) :
        (!threw && exp.throwFn) ? false :
        (!threw && exp.returnFn) ? exp.returnFn(actual) : true)

      return {
        ok: ok,
        actual: fn ? actual : undefined,
        expectation: exp,
        scenario: scenario,
        error: threw ? error : null,
        afterErr: threwAfter ? afterErr : null,
        afterEachErr: threwAfterEach ? afterEachErr : null,
        aborted: error === 'termination guarantee'
      }
    }).filter(util.identity)
  }).reduce(function(a, b) {
    return a.concat(b)
  })
  this.failures = this.results.filter(function(r) { return !r.ok })
  spec.afterAllCallback.apply(testContext)
}
module.exports = TestResults

TestResults.prototype.passed = function() {
  return util.pluck(this.results, 'ok').reduce(function(x, y) {
    return x && y
  }, true)
}

function getArgString(scenario) {
  var conditionStr = scenario.condition.length ?
    scenario.condition.map(util.toFriendlyInlineString).join(', ') : ''
  var bindStr = !scenario.thisArg ? '' :
    '.bind(' + util.toFriendlyInlineString(scenario.thisArg) + ')'
  return bindStr + '(' + conditionStr + ')'
}

TestResults.prototype.toString = function(tapIndex, cached) {
  var specification = this.specification
  if(tapIndex === undefined) tapIndex = 1
  return this.results.map(function(t) {
    var conditionStr = t.scenario.condition.length ?
      t.scenario.condition.map(util.toFriendlyInlineString).join(', ') : ''
    var bindStr = !t.scenario.thisArg ? '' :
      '.bind(' + util.toFriendlyInlineString(t.scenario.thisArg) + ')'
    var result = (tapIndex ? '' : '# ') +
      (t.ok ? 'ok ' : 'not ok ') +
      (tapIndex ? ((tapIndex ++) + ' - ') : '') +
      (specification.isConstructor ? 'new ' : '') +
      specification.name + getArgString(t.scenario) + ' ' +
      t.expectation.description
    if(cached) result += ' (cached)'
    if(!t.ok && t.actual !== undefined)
      result += '# actual: ' + util.toFriendlyInlineString(t.actual)
    return result
  }).join('\n')
}
