//Bayes Theorem
//P(A|B) = P(B|A) * P(A) / P(B)

LABELS = ["Assignment", "Project", "Exam", "Label"];
DATA = [
    ["Good", "A", "High", "Pass"],
    ["Good", "B", "High", "Pass"],
    ["Bad", "B", "Low", "Fail"],
    ["Bad", "C", "High", "Fail"],
    ["Good", "C", "Low", "Fail"],
    ["Good", "C", "High", "Pass"],
    ["Bad", "B", "High", "Pass"],
    ["Good", "A", "Low", "Pass"],
    ["Bad", "A", "Low", "Fail"],
    ["Good", "B", "Low", "Pass"]
];

var ClassStore = function() {
    this.classes = [];
    this.classCounts = {};
};

ClassStore.prototype.add = function(value, cls) {
    this.updateCounts(value);
};

ClassStore.prototype.get = function() {
    return this.classCounts;
};

ClassStore.prototype.updateCounts = function(value) {
    if (this.classCounts.hasOwnProperty(value))
        this.classCounts[value]++;
    else
        this.classCounts[value] = 1;
};

ClassStore.prototype.getTotal = function() {
    var sum = 0;
    for (var key in this.classCounts)
        sum += this.classCounts[key];
    return sum;
}

var classStore = new ClassStore();

var AttributeStore = function() {
    this.attributes = [];
    this.attributeCounts = {};
};

AttributeStore.prototype.add = function(value, label, cls, type) {
    var newAttribute = new Attribute(value, label, cls, type);
    this.attributes.push(newAttribute);
    this.updateCounts(newAttribute);
};

AttributeStore.prototype.get = function(value, label, cls, type) {
    return this.attributeCounts;
};

AttributeStore.prototype.updateCounts = function(attribute) {
    if (!this.attributeCounts.hasOwnProperty(attribute.label))
        this.attributeCounts[attribute.label] = {};

    var currentLabel = this.attributeCounts[attribute.label];

    if (!currentLabel.hasOwnProperty(attribute.value))
        currentLabel[attribute.value] = {};

    if (currentLabel[attribute.value].hasOwnProperty(attribute.class))
        currentLabel[attribute.value][attribute.class]++;
    else
        currentLabel[attribute.value][attribute.class] = 1;
};

// AttributeStore.prototype.getTotal = function(value, label) {
//     var sum = 0;
//     var attributeByValue = this.attributeCounts[label][value];
//     debugger
//     for (var cls in attributeByValue)
//         sum += attributeByValue[cls];

//     return sum;
// };

AttributeStore.prototype.getTotalForClass = function(value, label, cls) {
    return this.attributeCounts[label][value][cls];
};

attributeStore = new AttributeStore();

var Attribute = function(value, label, cls, type) {
    this.value = value;
    this.label = label;
    this.class = cls;
    this.type = type || "string" // string, number or boolean
};


// var getAttributesForLabel = function(data, label) {
//     return data.filter(function(item) {
//         return item.label == label;
//     })
// };

// var getAttributeValueRange = function(data, label) {
//     return getAttributesForLabel(data, label)
//         .distinct(function(item) {
//             return item.value;
//         });
// };

// var getValueRange = function(data) {
//     return data.distinct(function(item) {
//         return item.value;
//     }).map(function(item) {
//         return item.value;
//     });
// };

// var getAttributesByValue = function(data, value) {
//     return data.filter(function(item) {
//         return item.value == value;
//     });
// }

// var getAttributeValueCounts = function(data, label) {
//     var values = {};
//     var attributeValues = getAttributesForLabel(data, label);

//     attributeValues.forEach(function(attribute) {
//         if (!values.hasOwnProperty(attribute.value))
//             values[attribute.value] = {};

//         if (values[attribute.value].hasOwnProperty(attribute.class))
//             values[attribute.value][attribute.class]++;
//         else
//             values[attribute.value][attribute.class] = 1;

//         if (values[attribute.value].hasOwnProperty("total"))
//             values[attribute.value]["total"]++;
//         else
//             values[attribute.value]["total"] = 1;
//     });

//     values.total = attributeValues.length;

//     return values;
// };


// var getAttributeValueCount = function(data, value) {
//     return data.filter(function(item) {
//         return item.value == value;
//     }).length;
// };


var Bayes = function() {
    this.attributeCounts = {};
    // this.attributes = [];
    this.classCounts = {};
    this.labels = [];
    // this.classes = [];
};
Bayes.prototype.conditionalProbability = function() {

};

Bayes.prototype.probability = function() {

};

Bayes.prototype.train = function(data, newLabels, classIndex) {
    var attributes = this.attibuteCounts,
        classes = this.classCounts;
    this.labels = newLabels;
    var classLabel = newLabels[classIndex];

    data.forEach(function(row) {
        var classValue = row[classIndex];
        for (var i = 0; i < row.length; i++) {
            if (i != classIndex)
                attributeStore.add(row[i], newLabels[i], classValue);
            else
                classStore.add(row[i], classValue);
        };
    });

    return this;
};

Bayes.prototype.classify = function(row) {
    var probabilities = [];
    var labels = this.labels;
    var classCounts = classStore.get();
    var attributeCounts = attributeStore.get();
    Object.keys(classCounts)
        .forEach(function(clsKey) {
            var newProbability = {
                label: clsKey,
                probability: 0
            };

            var classSum = classCounts[clsKey];
            var currentClassProbability = classSum / classStore.getTotal();
            console.log(currentClassProbability);

            var attributeProbabilities = [];
            for (var i = 0; i < row.length; i++) {
                var value = row[i],
                    label = labels[i],
                    attributeSumByClass = attributeStore.getTotalForClass(value, label, clsKey);

                console.log(attributeSumByClass, "/", classSum)
                if (classSum && attributeSumByClass)
                    attributeProbabilities.push(attributeSumByClass / classSum);
                else
                    attributeProbabilities.push(0)
            }

            newProbability.probability = currentClassProbability * attributeProbabilities.reduce(function(a, b) {
                return a * b;
            });
            probabilities.push(newProbability);
        });

    return probabilities.sort(function(a, b) {
        return b.probability - a.probability;
    })[0];

    // var attributes = this.attributes;
    // var labels = this.labels;

    // var N = attributes.length;

    // var attributeLabels = Object.keys(this.labels);

    // attributeLabels.forEach(function(currentLabel) {
    //     probabilities[currentLabel] = [];
    //     var currentProbabilities = probabilities[currentLabel],
    //         currentLabelAttributes = getAttributesForLabel(attributes, currentLabel),
    //         currentAttributeValueRange = getValueRange(currentLabelAttributes);

    //     var currentLabelTotalProbability = getAttributeValueCount(this.attributes, currentLabel) / N;
    //     currentProbabilities.push(currentLabelTotalProbability);

    //     var otherAttributeLabels = attributeLabels.filter(function(l) {
    //         return l != currentLabel;
    //     });

    //     otherAttributeLabels.forEach(function(otherLabel) {
    //         var otherAttributes = getAttributesForLabel(attributes, otherLabel);
    //         getValueRange(otherAttributes).forEach(function(aValue) {
    //             currentAttributeValueRange.forEach(function(cAttr) {
    //                 var cAttrs = getAttributesByValue(currentLabelAttributes, cAttr);
    //                 var aValueAttrs = get
    //                 var currentLabelProbability = getAttributeValueCount(attributes.filter(function() {
    //                     return
    //                 }), )
    //                 currentProbabilities.push()
    //             });
    //         })
    //     });


    // });
}

B = new Bayes();
TEST = function() {
    var tree = B.train(DATA, LABELS, 3);
    return tree.classify(["Bad", "A", "High"]);
}
