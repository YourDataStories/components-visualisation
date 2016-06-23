angular.module('yds').service('queryBuilderService', function() {
    var qbRules = {};

    var setRules = function(newRules) {
        qbRules = newRules;
    };

    var getRules = function() {
        return qbRules;
    };

    return {
        setRules: setRules,
        getRules: getRules
    };
});