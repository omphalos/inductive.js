function getElement0(arg0) {
  return arg0[0];
}

function sliceUpTo(arg0, arg1) {
  return arg0.slice(0, arg1);
}

function safeSliceUpTo(arg0, arg1) {
  return sliceUpTo(arg0, arg1 < 0 ? 0 : arg1);
}

// Failed first