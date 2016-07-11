angular.module('yds').service('queryBuilderService', function() {
    var qbRules = {};
    var noFilters = {};  // Shows if there are no filters for this query builder

    var setRules = function(id, newRules) {
        qbRules[id] = newRules;
    };

    var getRules = function(id) {
        return qbRules[id];
    };

    var setNoFilters = function(id, filters) {
        noFilters[id] = filters;
    };

    var hasNoFilters = function(id) {
        return noFilters[id];
    };

    return {
        setRules: setRules,
        getRules: getRules,
        setNoFilters: setNoFilters,
        hasNoFilters: hasNoFilters
    };
});