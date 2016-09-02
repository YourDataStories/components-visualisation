angular.module('yds').service('CountrySelectionService', function($rootScope) {
    var countries = [];
    var yearRange = [];

    var subscribe = function(scope, callback) {
        var unregister = $rootScope.$on('country-selection-service-change', callback);
        scope.$on('$destroy', unregister);

        return unregister;
    };

    /**
     * Function used to subscribe to be notified about changes in the year range
     * @param scope
     * @param callback
     * @returns {*}
     */
    var subscribeToYearChanges = function(scope, callback) {
        var unregister = $rootScope.$on('country-selection-service-year-range-change', callback);
        scope.$on('$destroy', unregister);

        return unregister;
    };

    var notifySubscribers = function() {
        $rootScope.$emit('country-selection-service-change');
    };

    /**
     * Emit event to notify about a year range change
     */
    var notifySubscribersYearChange = function() {
        $rootScope.$emit('country-selection-service-year-range-change');
    };

    var setCountries = function(newCountries) {
        if (!_.isEqual(countries, newCountries)) {
            countries = newCountries;

            notifySubscribers();
        }
    };

    var getCountries = function() {
        return countries;
    };

    var clearCountries = function() {
        if (!_.isEmpty(countries)) {
            countries = [];

            notifySubscribers();
        }
    };

    /**
     * Set a new year range
     * @param minYear   Minimum year
     * @param maxYear   Maximum year
     */
    var setYearRange = function(minYear, maxYear) {
        var newRange = [minYear, maxYear];
        if (!_.isEqual(newRange, yearRange)) {
            yearRange = newRange;

            notifySubscribersYearChange();
        }
    };

    /**
     * Get the saved year range
     * @returns {Array}
     */
    var getYearRange = function() {
        return yearRange;
    };

    return {
        subscribe: subscribe,
        subscribeToYearChanges: subscribeToYearChanges,
        setCountries: setCountries,
        getCountries: getCountries,
        clearCountries: clearCountries,
        setYearRange: setYearRange,
        getYearRange: getYearRange
    };
});
