Array.prototype.distinct = function(transformFn) {
    var distinctSet = [],
        distinctProperty = {};
    for (var i = 0, l = this.length; i < l; ++i) {
        var value = this[i],
            property = transformFn(value);

        if (distinctProperty.hasOwnProperty(property)) {
            continue;
        }
        distinctSet.push(value);
        distinctProperty[property] = 1;
    }
    return distinctSet;
};