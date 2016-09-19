angular.module('yds').service('DashboardService', function($rootScope, $timeout) {
    var countries = {};
    var yearRange = {};
    var selectedViewType = {};
    var notifySelectionChangeLock = false;
    var notifyYearChangeLock = false;
    var notifyViewTypeChangeLock = false;

    // Mapping for which view type's selected countries go to which API parameter.
    // For example selected countries for view type "aidactivity.beneficiary.countries.all"
    // will be sent to the server in a parameter called "countries"
    var apiOptionsMap = {
        countries: "aidactivity.beneficiary.countries.all",
        benefactors: "aidactivity.benefactor.countries.all"
    };

    /**
     * Function that returns the api options mappings
     * @returns {{countries: string, benefactors: string}}
     */
    var getApiOptionsMapping = function() {
        return apiOptionsMap;
    };

    var subscribeSelectionChanges = function(scope, callback) {
        var unregister = $rootScope.$on('dashboard-service-change', callback);
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
        var unregister = $rootScope.$on('dashboard-service-year-range-change', callback);
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
        var unregister = $rootScope.$on('dashboard-service-view-type-change', callback);
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
                $rootScope.$emit('dashboard-service-view-type-change');

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
                $rootScope.$emit('dashboard-service-change');

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
                $rootScope.$emit('dashboard-service-year-range-change');

                notifyYearChangeLock = false;
            }, 150);
        }
    };

    /**
     * Set new selected countries for the given type
     * @param type          Type to set countries for
     * @param newCountries  Countries to set
     */
    var setCountries = function(type, newCountries) {
        if (_.isUndefined(countries[type]) || !_.isEqual(countries[type], newCountries)) {
            countries[type] = newCountries;

            notifyCountrySelectionChange();
        }
    };

    /**
     * Get selected countries for a given type
     * @param type  Type to get countries for
     * @returns {*}
     */
    var getCountries = function(type) {
        return countries[type];
    };

    /**
     * Clear selected countries for a given type
     * @param type
     */
    var clearCountries = function(type) {
        if (!_.isEmpty(countries[type])) {
            countries[type] = [];

            notifyCountrySelectionChange();
        }
    };

    /**
     * Set a new year range
     * @param dashboardId   ID to set year range for
     * @param minYear       Minimum year
     * @param maxYear       Maximum year
     */
    var setYearRange = function(dashboardId, minYear, maxYear) {
        var newRange = [minYear, maxYear];
        if (!_.isEqual(newRange, yearRange[dashboardId])) {
            yearRange[dashboardId] = newRange;

            notifySubscribersYearChange();
        }
    };

    /**
     * Get the saved year range
     * @param dashboardId
     * @returns {Array}
     */
    var getYearRange = function(dashboardId) {
        return yearRange[dashboardId];
    };

    /**
     * Returns the minimum year of the range or null if range is empty
     * @param dashboardId
     * @returns {*}
     */
    var getMinYear = function(dashboardId) {
        return _.isEmpty(yearRange[dashboardId]) ? null : _.min(yearRange[dashboardId]);
    };

    /**
     * Returns the maximum year of the range or null if range is empty
     * @param dashboardId
     * @returns {*}
     */
    var getMaxYear = function(dashboardId) {
        return _.isEmpty(yearRange[dashboardId]) ? null : _.max(yearRange[dashboardId]);
    };

    /**
     * Returns the selected view type
     * @param dashboardId
     * @returns {{}}
     */
    var getViewType = function(dashboardId) {
        return selectedViewType[dashboardId];
    };

    /**
     * Sets the selected view type
     * @param dashboardID   Dashboard ID
     * @param viewType      View type object
     */
    var setViewType = function(dashboardID, viewType) {
        if (!_.isEqual(selectedViewType[dashboardID], viewType)) {
            selectedViewType[dashboardID] = viewType;

            notifyViewTypeChange();
        }
    };

    return {
        getApiOptionsMapping: getApiOptionsMapping,
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
        getViewType: getViewType,
    };
});
