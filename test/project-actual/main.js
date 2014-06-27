var x = require('./lib/childComponent.js');
var sum = require('./siblingComponent.js').sum;
var subtract5 = require('./siblingComponent.js').subtract5;
var nativeChild = require('./lib/nativeChild.js');
var NativeCtor = require('./lib/NativeCtor.js');
var hundredAlias = require('./siblingComponent.js').hundredAlias;

function hello() {
  return console.log('hello');
}

function getX() {
  return x;
}

function squareRootSum(arg0, arg1) {
  return Math.sqrt(sum.call(null, arg1, arg0));
}

function squareXMinus5(arg0) {
  return subtract5.call(null, arg0) * subtract5.call(null, arg0);
}

function nativeSubtracter(arg0, arg1) {
  return nativeChild(arg0, arg1);
}

function nativeCtorFactory(arg0) {
  return new NativeCtor(arg0);
}

function referenceAliasedAssignment() {
  return hundredAlias;
}

function ioDef() {
  return console.log(2);
}

var ioDefResult = ioDef();

hello();

exports.hello = hello;