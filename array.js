Array.prototype.distinct = function(transformFn) {
    var distinctSet = [],
        distinctProperty = {};
    for (var i = 0, l = this.length; i < l; ++i) {
        var value = this[i];
        if (transformFn)
            property = transformFn(value);
        else
            property = value;

        if (distinctProperty.hasOwnProperty(property)) {
            continue;
        }
        distinctSet.push(value);
        distinctProperty[property] = 1;
    }
    return distinctSet;
};

Array.prototype.clone = function() {
    return this.slice(0);
};

Array.prototype.first = function(transformFn) {
    if (transformFn) {
        for (var i = 0; i < this.length; i++) {
            if (transformFn(this[i]))
                return this[i];
        }
    } else
        return this.length ? this[0] : null;
};

Array.prototype.any = function(transformFn) {
    if (transformFn) {
        for (var i = 0; i < this.length; i++) {
            if (transformFn(this[i]))
                return true;
        }
    } else
        return this.length > 0;

    return false;
};

Array.prototype.except = function(arr) {
    var newArray = this.clone();
    var itemsToRemove = (arr instanceof Array) ? arr : arguments;

    for (var i = 0; i < itemsToRemove.length; i++) {
        var index = newArray.indexOf(itemsToRemove[i]);
        if (index > -1) {
            newArray.splice(index, 1);
        }
    }

    return newArray;
};

Array.prototype.max = function(transformFn) {
    if (transformFn) {
        var transformed = this.map(transformFn),
            maxValue = Math.max.apply(Math, transformed),
            index = transformed.indexOf(maxValue);
        return this[index];
    } else
        return Math.max.apply(Math, this);
};

Array.prototype.min = function(transformFn) {
    if (transformFn) {
        var transformed = this.map(transformFn),
            maxValue = Math.max.apply(Math, transformed),
            index = transformed.indexOf(maxValue);
        return this[index];
    } else
        return Math.min.apply(Math, this);
};

Array.prototype.mode = function(transformFn) {
    var values = transformFn ? this.map(transformFn) : this,
        counts = {};

    if (values.length == 0)
        return null;
    var modeMap = {};
    var maxEl = values[0],
        maxCount = 1;
    for (var i = 0; i < values.length; i++) {
        var el = values[i];
        if (modeMap[el] == null)
            modeMap[el] = 1;
        else
            modeMap[el]++;
        if (modeMap[el] > maxCount) {
            maxEl = el;
            maxCount = modeMap[el];
        }
    }
    return maxEl;
};
