function getElement0(arg0) {
  return arg0[0];
}

function sliceUpTo(arg0, arg1) {
  return arg0.slice(0, arg1);
}

function safeSliceUpTo(arg0, arg1) {
  return sliceUpTo(arg0, arg1 < 0 ? 0 : arg1);
}

function first(arg0, arg1) {
  return function () {
    var refinement2 = arg0;
    if (function (candidate) {
        return candidate instanceof Object && 'callee' in candidate && 'length' in candidate && candidate.constructor.name === 'Object';
      }(refinement2))
      return function () {
        var refinement11 = arg1;
        if (refinement11 === undefined)
          return getElement0([].slice.apply(refinement2));
        if (typeof refinement11 === 'number')
          return safeSliceUpTo([].slice.apply(refinement2), refinement11);
        throw new Error('Unexpected type: ' + refinement11);
      }();
    if (refinement2 === null)
      return function () {
        var refinement11 = arg1;
        if (refinement11 === undefined)
          return undefined;
        if (typeof refinement11 === 'number')
          return undefined;
        throw new Error('Unexpected type: ' + refinement11);
      }();
    if (refinement2 instanceof Array)
      return function () {
        var refinement11 = arg1;
        if (refinement11 === undefined)
          return getElement0(refinement2);
        if (typeof refinement11 === 'number')
          return safeSliceUpTo(refinement2, refinement11);
        throw new Error('Unexpected type: ' + refinement11);
      }();
    throw new Error('Unexpected type: ' + refinement2);
  }();
}

function UnderscoreCtor(arg0) {
  this['_wrapped'] = arg0;
}

function _(arg0) {
  return new UnderscoreCtor(arg0);
}

// Failed _first

UnderscoreCtor.prototype.first = _first;