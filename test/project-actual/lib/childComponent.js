var esprima = require('esprima');
var nativeChild = require('./nativeChild.js');
var modulo = require('./childSiblingComponent.js').modulo;

function xFn() {
  return 555;
}

var x = xFn();

function Human(arg0, arg1) {
  this['first'] = arg0;
  this['last'] = arg1;
}

function fullName() {
  var arg0 = this;
  return arg0['first'] + ' ' + arg0['last'];
}

Human.prototype.fullName = fullName;

function President(arg0, arg1, arg2) {
  Human.call(this, arg0, arg1);
  this['pay'] = arg2;
}
President.prototype = Object.create(Human.prototype);
President.prototype.constructor = President;

function callNativeSubtract(arg0, arg1) {
  return nativeChild(arg0, arg1);
}

function moduloMinusOne(arg0, arg1) {
  return modulo(arg0, arg1 - 1);
}

module.exports = x;