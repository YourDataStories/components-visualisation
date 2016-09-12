angular.module('yds').service('CountrySelectionService', function($rootScope, $timeout) {
    var countries = [];
    var yearRange = [];
    var selectedViewType = {};
    var notifySelectionChangeLock = false;
    var notifyYearChangeLock = false;
    var notifyViewTypeChangeLock = false;

    var subscribeSelectionChanges = function(scope, callback) {
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

    /**
     * Function used to subscribe to be notified about changes in the selected view type
     * @param scope
     * @param callback
     * @returns {*}
     */
    var subscribeViewTypeChanges = function(scope, callback) {
        var unregister = $rootScope.$on('country-selection-service-view-type-change', callback);
        scope.$on('$destroy', unregister);

        return unregister;
    };

    /**
     * Emit event to notify about a view type change
     */
    var notifyViewTypeChange = function() {
        if (!notifyViewTypeChangeLock) {
            notifyViewTypeChangeLock = true;

            $timeout(function() {
                $rootScope.$emit('country-selection-service-view-type-change');

                notifyViewTypeChangeLock = false;
            }, 150);
        }
    };

    /**
     * Emit event to notify about a country selection change
     */
    var notifyCountrySelectionChange = function() {
        if (!notifySelectionChangeLock) {
            notifySelectionChangeLock = true;

            $timeout(function() {
                $rootScope.$emit('country-selection-service-change');

                notifySelectionChangeLock = false;
            }, 150);
        }
    };

    /**
     * Emit event to notify about a year range change
     */
    var notifySubscribersYearChange = function() {
        if (!notifyYearChangeLock) {
            notifyYearChangeLock = true;

            $timeout(function() {
                $rootScope.$emit('country-selection-service-year-range-change');

                notifyYearChangeLock = false;
            }, 150);
        }
    };

    /**
     * Set new selected countries
     * @param newCountries
     */
    var setCountries = function(newCountries) {
        if (!_.isEqual(countries, newCountries)) {
            countries = newCountries;

            notifyCountrySelectionChange();
        }
    };

    /**
     * Get selected countries
     * @returns {Array}
     */
    var getCountries = function() {
        return countries;
    };

    /**
     * Clear selected countries
     */
    var clearCountries = function() {
        if (!_.isEmpty(countries)) {
            countries = [];

            notifyCountrySelectionChange();
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

    /**
     * Returns the minimum year of the range or null if range is empty
     * @returns {*}
     */
    var getMinYear = function() {
        return _.isEmpty(yearRange) ? null : _.min(yearRange);
    };

    /**
     * Returns the maximum year of the range or null if range is empty
     * @returns {*}
     */
    var getMaxYear = function() {
        return _.isEmpty(yearRange) ? null : _.max(yearRange);
    };

    /**
     * Returns the selected view type
     * @returns {{}}
     */
    var getViewType = function() {
        return selectedViewType;
    };

    /**
     * Sets the selected view type
     * @param viewType
     */
    var setViewType = function(viewType) {
        if (!_.isEqual(selectedViewType, viewType)) {
            selectedViewType = viewType;

            notifyViewTypeChange();
        }
    };

    return {
        subscribeSelectionChanges: subscribeSelectionChanges,
        subscribeYearChanges: subscribeToYearChanges,
        subscribeViewTypeChanges: subscribeViewTypeChanges,
        setCountries: setCountries,
        getCountries: getCountries,
        clearCountries: clearCountries,
        setYearRange: setYearRange,
        getYearRange: getYearRange,
        getMinYear: getMinYear,
        getMaxYear: getMaxYear,
        setViewType: setViewType,
        getViewType: getViewType
    };
});
