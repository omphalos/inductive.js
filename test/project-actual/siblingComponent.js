var subtract = require('./chainedDependency.js').subtract;
var hundred = require('./chainedDependency.js').hundred;

function sum(arg0, arg1) {
  return arg1 + arg0;
}

function subtract5(arg0) {
  return subtract.call(null, arg0, 5);
}

function ninetyFive() {
  return subtract5.call(null, hundred);
}

var hundredAlias = hundred;

exports.sum = sum;
exports.subtract5 = subtract5;
exports.hundredAlias = hundredAlias;