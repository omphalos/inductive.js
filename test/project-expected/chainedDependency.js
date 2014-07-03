function subtract(arg0, arg1) {
  return arg0 - arg1;
}

function calcHundred() {
  return subtract(150, 50);
}

var hundred = calcHundred();

exports.subtract = subtract;
exports.hundred = hundred;