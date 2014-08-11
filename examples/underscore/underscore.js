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
    if (refinement2 instanceof Object)
      return function () {
        var refinement11 = arg1;
        if (typeof refinement11 === 'number')
          return safeSliceUpTo([].slice.apply(refinement2), refinement11);
        if (refinement11 === undefined)
          return getElement0([].slice.apply(refinement2));
        throw new Error('Unexpected type: ' + refinement11);
      }();
    if (refinement2 instanceof Array)
      return function () {
        var refinement11 = arg1;
        if (typeof refinement11 === 'number')
          return refinement2;
        if (refinement11 === undefined)
          return refinement11;
        throw new Error('Unexpected type: ' + refinement11);
      }();
    if (refinement2 === null)
      return function () {
        var refinement11 = arg1;
        if (typeof refinement11 === 'number')
          return undefined;
        if (refinement11 === undefined)
          return refinement11;
        throw new Error('Unexpected type: ' + refinement11);
      }();
    throw new Error('Unexpected type: ' + refinement2);
  }();
}