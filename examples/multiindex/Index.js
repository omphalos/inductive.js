function Index(arg0, arg1, arg2) {
  this['idMap'] = {};
  this['idProperty'] = function () {
    var refinement3 = arg2;
    if (refinement3 === undefined)
      return 'id';
    if (typeof refinement3 === 'string')
      return refinement3;
    throw new Error('Unexpected type: ' + refinement3);
  }();
  this['keyMap'] = {};
  this['name'] = arg0;
  this['selector'] = arg1;
}