Release History
===============

## 0.0.1

* Initial release

## 0.1.0

* Remove `when`
* Add `takes` and `returns` to `specify`.
* Add `returnsRecordThat` to `specifyConstructor`.
* Add `specifyMatch` and remove `matchArguments`.
* Validate api methods are not undefined.
* Remove `values` - just use `value`.
* Improve record strings.
* Support records with same property keys but different types.

## 0.2.0

* Rename `ArgumentsType` to `ArgumentsTupleType`.
* Rename `ArgumentsObjectType` to `ArgumentsArrayType`.
* Rename `tryFilterType` to `filterType`.
* Remove `Expression.prototype.copy`.
* Remove `typePlaceholder`.
* Rename `getInstanceError` to `validateInstance`.
* Remove `RecordType.prototype.isEmpty`.
* Remove `takes` and `takesResolved` from `UnionType`.
* Remove `UnionType.prototype.add`.
* Validate to prevent primitive objects (such as `new Number(3)`).

Versioning
==========

My intention is to use
[semantic versioning](http://semver.org/)
for releases.
For all experimental (0.y.x) releases,
I am bumping the second number (y) for backwards incompatible changes.
