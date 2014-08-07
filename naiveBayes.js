//Bayes Theorem
//P(A|B) = P(B|A) * P(A) / P(B)
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
    var sum = 0,
        self = this;
    Object.keys(self.classCounts).forEach(function(key) {
        sum += self.classCounts[key];
    });

    return sum;
}

ClassStore.prototype.clear = function() {
    this.classCounts = [];
}

var classStore = new ClassStore();

var AttributeStore = function() {
    this.attributes = [];
    this.attributeCounts = {};
};

AttributeStore.prototype.clear = function() {
    this.attributes = [];
    this.attributeCounts = [];
}

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

var Bayes = function() {
    this.attributeCounts = {};
    this.classCounts = {};
    this.labels = [];
};

Bayes.prototype.train = function(data, newLabels, classIndex) {
    attributeStore.clear();
    classStore.clear();

    var attributes = this.attibuteCounts,
        classes = this.classCounts;
    this.labels = newLabels;
    var classLabel = newLabels[classIndex];

    data.forEach(function(row) {
        var classValue = row[classIndex];
        for (var i = 0; i < row.length; i++) {
            if (i != classIndex)
                attributeStore.add(row[i], newLabels[i], classValue);
            else {
                classStore.add(row[i], classValue);
            }
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

            var attributeProbabilities = [];
            for (var i = 0; i < row.length; i++) {
                var value = row[i],
                    label = labels[i],
                    attributeSumByClass = attributeStore.getTotalForClass(value, label, clsKey);

                if (classSum && attributeSumByClass)
                    attributeProbabilities.push(attributeSumByClass / classSum);
                else
                    attributeProbabilities.push(0)
            }

            newProbability.probability = currentClassProbability * attributeProbabilities.reduce(function(a, b) {
                return a * b;
            }, 0);
            probabilities.push(newProbability);
        });

    return probabilities.sort(function(a, b) {
        return b.probability - a.probability;
    })[0];
}

B = new Bayes();
TEST = function() {
    var tree = B.train(DATA, LABELS, 3);
    return tree.classify(["Bad", "A", "High"]);
}
