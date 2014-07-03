var subtract = require('./chainedDependency.js').subtract;
var hundred = require('./chainedDependency.js').hundred;

function sum(arg0, arg1) {
  return arg1 + arg0;
}

function subtract5(arg0) {
  return subtract(arg0, 5);
}

function ninetyFive() {
  return subtract5(hundred);
}

var hundredAlias = hundred;

exports.sum = sum;
exports.subtract5 = subtract5;
exports.hundredAlias = hundredAlias;