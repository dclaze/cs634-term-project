var NODE_TYPES = {
    REAL: "real",
    CATEGORICAL: "categorical",
    VALUE: "value",
    LEAF: "leaf"
}

var MatrixUtils = {
    aboveThreshold: function(data, classes, columnIndex, threshold) {
        var matchingAttributeValues = [];
        var matchingClasses = [];
        for (var rowIndex = 0; rowIndex < data.length; rowIndex++) {
            if (parseFloat(data[rowIndex][columnIndex]) > threshold) {
                matchingAttributeValues.push(data[rowIndex]);
                matchingClasses.push(classes[rowIndex]);
            }
        }

        return {
            values: matchingAttributeValues,
            classes: matchingClasses
        };
    },

    belowEqualThreshold: function(data, classes, columnIndex, threshold) {
        var matchingAttributeValues = [];
        var matchingClasses = [];
        for (var rowIndex = 0; rowIndex < data.length; rowIndex++) {
            if (parseFloat(data[rowIndex][columnIndex]) <= threshold) {
                matchingAttributeValues.push(data[rowIndex]);
                matchingClasses.push(classes[rowIndex]);
            }
        }
        return {
            values: matchingAttributeValues,
            classes: matchingClasses
        };
    },

    byValue: function(data, classes, columnIndex, value) {
        var matchingAttributeValues = [];
        var matchingClasses = [];
        for (var rowIndex = 0; rowIndex < data.length; rowIndex++) {
            if (data[rowIndex][columnIndex] == value) {
                matchingAttributeValues.push(data[rowIndex]);
                matchingClasses.push(classes[rowIndex]);
            }
        }
        return {
            values: matchingAttributeValues,
            classes: matchingClasses
        };
    },

    getColumn: function(d, colIdx) {
        var col = [];
        for (var i = 0; i < d.length; i++)
            col.push(d[i][colIdx]);
        return col;
    },
};


var Node = function(name, values, type) {
    this.id = UUID.new();
    this.name = name;
    this.labelIndex = 0;
    this.values = values;
    this.children = [];
    // type?
};

var DecisionTree = function() {
    this.tree = null;
    this.mostCommonClas = null;
};
DecisionTree.prototype.train = function(data, classes, labels, types) {
    this.mostCommonClass = classes.mode();
    this.originalLabels = labels.slice(0);
    this.tree = this.buildTree(data, classes, labels, types);
};

DecisionTree.prototype.classify = function(row) {
    var rootNode = this.tree;

    while (rootNode.type != NODE_TYPES.LEAF) {
        var childNode;
        if (rootNode.type == NODE_TYPES.REAL) {
            var value = parseFloat(row[rootNode.id]);
            if (value <= rootNode.threshold)
                childNode = rootNode.values[1];
            else
                childNode = rootNode.values[0];
        } else {
            var value = row[rootNode.id];
            childNode = rootNode.values.first(function(x) {
                return x.name == value
            });
        }
        if (typeof childNode === 'undefined') {
            return this.mostCommonClass;
        }
        rootNode = childNode.child;
    }
    return rootNode.value;
}
DecisionTree.prototype.getLabelIndex = function(label) {
    return this.originalLabels.indexOf(label);
};

DecisionTree.prototype.isLeaf = function(classes) {
    return classes == 1;
};
DecisionTree.prototype.noLabel = function(labels) {
    return labels.length == 0
};

DecisionTree.prototype.getEndNode = function(type, value) {
    return {
        type: type || NODE_TYPES.LEAF,
        value: value
    }
};

DecisionTree.prototype.getAttributeNode = function(name, id, values, type, threshold) {
    return {
        name: name,
        id: id,
        type: type,
        threshold: threshold || 0,
        values: values
    };
};

DecisionTree.prototype.getChildNode = function(name, type) {
    return {
        name: name,
        type: type
    }
}

DecisionTree.prototype.buildTree = function(data, classes, labels, types) {
    var node;
    if (classes.length == 0) return this.getEndNode(NODE_TYPES.LEAF, this.mostCommonClass);
    if (this.isLeaf(classes)) return this.getEndNode(NODE_TYPES.LEAF, classes[0]);
    if (this.noLabel(labels)) return this.getEndNode(NODE_TYPES.LEAF, classes.mode());

    var bestFeatureData = this.maximizeGain(data, classes, labels, types);
    var bestFeatureLabel = bestFeatureData.attributeName;
    var remainingLabels = labels.except(bestFeatureLabel);

    if (types[bestFeatureData.attributeIndex] == NODE_TYPES.REAL) {
        node = this.getAttributeNode(bestFeatureData.attributeName, bestFeatureData.attributeIndex, [], NODE_TYPES.REAL, bestFeatureData.threshold)

        var aboveThresholdSubset = MatrixUtils.aboveThreshold(data, classes, bestFeatureData.attributeIndex, bestFeatureData.threshold);
        var aboveThresholdNode = this.getChildNode(bestFeatureData.threshold + "", NODE_TYPES.VALUE);
        aboveThresholdNode.child = this.buildTree(aboveThresholdSubset.values, aboveThresholdSubset.classes, remainingLabels, types);
        node.values.push(aboveThresholdNode);

        var belowThresholdSubset = MatrixUtils.belowEqualThreshold(data, classes, bestFeatureData.attributeIndex, bestFeatureData.threshold);
        var belowThresholdNode = this.getChildNode(bestFeatureData.threshold + "", NODE_TYPES.VALUE);
        belowThresholdNode.child = this.buildTree(belowThresholdSubset.values, belowThresholdSubset.classes, remainingLabels, types);
        node.values.push(belowThresholdNode);
    } else {
        var nodeValueRange = MatrixUtils.getColumn(data, bestFeatureData.attributeIndex).distinct();

        node = this.getAttributeNode(bestFeatureData.attributeName, bestFeatureData.attributeIndex, [], NODE_TYPES.CATEGORICAL)

        for (var i = 0; i < nodeValueRange.length; i++) {
            var subset = MatrixUtils.byValue(data, classes, bestFeatureData.attributeIndex, nodeValueRange[i]);
            var childNode = {
                name: nodeValueRange[i],
                type: NODE_TYPES.VALUE
            };
            childNode.child = this.buildTree(subset.values, subset.classes, remainingLabels, types);
            node.values.push(childNode);
        }
    }
    return node;
};

DecisionTree.prototype.entropy = function(values) {
    var self = this;
    return values.distinct(function(item) {
        return item;
    }).map(function(x) {
        return self.probability(values, x)
    }).map(function(p) {
        return -p * Math.log2(p)
    }).reduce(function(a, b) {
        return a + b
    }, 0);
};

DecisionTree.prototype.setEntropy = function(data, classes, attributeIndex, threshold) {
    var subsetBelow = MatrixUtils.belowEqualThreshold(data, classes, attributeIndex, threshold);
    var subsetAbove = MatrixUtils.aboveThreshold(data, classes, attributeIndex, threshold);
    var setSize = data.length;
    return subsetBelow.values.length / setSize * this.entropy(subsetBelow.classes) + subsetAbove.values.length / setSize * this.entropy(subsetBelow.classes);
}

DecisionTree.prototype.probability = function(data, checkValue) {
    var valueOccurences = data.filter(function(value) {
            return value == checkValue;
        }).length,
        total = data.length;

    return valueOccurences / total;
}

DecisionTree.prototype.asBestGainData = function(index, label, gain, threshold) {
    return {
        attributeIndex: index,
        attributeName: label,
        gain: gain,
        threshold: threshold || 0
    };
};

DecisionTree.prototype.gain = function(data, classes, label, attributeType) {
    var setEntropy = this.entropy(classes);

    var attributeIndex = this.getLabelIndex(label);
    var attributeValueRange = MatrixUtils.getColumn(data, attributeIndex).distinct();

    if (attributeType == NODE_TYPES.REAL) {
        var attributeGains = [];
        for (var i = 0; i < attributeValueRange.length; i++) {
            var threshold = parseFloat(attributeValueRange[i]),
                gain = setEntropy - this.setEntropy(data, classes, attributeIndex, threshold);

            attributeGains.push(this.asBestGainData(attributeIndex, label, gain, threshold));
        }
        return attributeGains.max(function(e) {
            return e.gain;
        });
    } else {
        var setSize = data.length;
        var entropies = [];
        for (var i = 0; i < attributeValueRange.length; i++) {
            var subset = MatrixUtils.byValue(data, classes, attributeIndex, attributeValueRange[i]);
            var entropy = (subset.values.length / setSize) * this.entropy(subset.classes);
            entropies.push(entropy);
        }

        var sumOfEntropies = entropies.reduce(function(a, b) {
            return a + b
        }, 0);

        return this.asBestGainData(attributeIndex, label, setEntropy - sumOfEntropies);
    }
};

DecisionTree.prototype.maximizeGain = function(data, targets, labels, attributeTypes) {
    var max = [];
    for (var i = 0; i < labels.length; i++) {
        max.push(this.gain(data, targets, labels[i], attributeTypes[i], i));
    }
    return max.max(function(f) {
        return f.gain;
    });
}
