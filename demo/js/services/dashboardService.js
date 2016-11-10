angular.module('yds').service('DashboardService', function($rootScope, $timeout) {
    var countries = {};
    var yearRange = {};
    var selectedViewType = {};
    var projectInfoType = "";
    var projectInfoId = "";
    var visualizationType = "";

    var notifySelectionChangeLock = false;
    var notifyYearChangeLock = false;
    var notifyViewTypeChangeLock = false;
    var notifyProjectInfoChangeLock = false;

    // Mapping for which view type's selected countries go to which API parameter.
    // For example selected countries for view type "aidactivity.beneficiary.countries.all"
    // will be sent to the server in a parameter called "countries"
    var countryListMapping = {
        aidactivity: {
            countries: "aidactivity.beneficiary.countries.all",
            benefactors: "aidactivity.benefactor.countries.all"
        },
        tradeactivity: {
            origins: "tradeactivity.hasorigin.countries.all",
            destinations: "tradeactivity.hasdestination.countries.all"
        },
        contract: {
            buyers: "contract.buyer.countries.all",
            sellers: "contract.seller.countries.all"
        }
    };

    // Mapping of dashboardIds and parameter names that the API expects the selected
    // year range to be sent at. For example for aid activities, the server expects
    // the years in a parameter called "year"
    var yearParamMapping = {
        aidactivity: "year",
        tradeactivity: "financialyear",
        contract: "year"
    };

    // View types of aggregates to show for each Dashboard section
    var aggregates = {
        aidactivity: {
            types: [
                "aidactivity.benefactor.countries.all",
                "aidactivity.beneficiary.countries.all",
                "aidactivity.beneficiary.organisations.all",
                "aidactivity.sectors.for.countries.and.period",
                "aidactivity.budget.for.countries.and.period",
                "aidactivity.spending.for.countries.and.period"
            ],
            titles: [
                "Benefactor Countries",
                "Beneficiary Countries",
                "Beneficiary Organisations",
                "Sectors",
                "Budget",
                "Spending"
            ],
            width: 2
        },
        tradeactivity: {
            types: [
                "tradeactivity.hasorigin.amount.for.countries.and.period",
                "tradeactivity.hasdestination.amount.for.countries.and.period",
                "tradeactivity.sectors.for.countries.and.period"
            ],
            titles: [
                "Amount (Origin)",
                "Amount (Destination)",
                "Sectors"
            ],
            width: 4
        },
        contract: {
            types: [
                "contract.seller.countries.all",
                "contract.buyer.countries.all"
            ],
            titles: [
                "Seller Countries",
                "Buyer Countries"
            ],
            width: 6
        }
    };

    // Parameters that will be given to the search-tabs component by the Dashboard Updater,
    // in order to initialize it with the appropriate options depending on its dashboardId
    var searchParams = {
        aidactivity: {
            concept: "AidActivity",
            urlParamPrefix: "aa-",
            requestType: "aidactivity.listitems.for.countries.and.period"
        },
        tradeactivity: {
            concept: "TradeActivity",
            urlParamPrefix: "ta-",
            requestType: "tradeactivity.listitems.for.countries.and.period"
        }
    };

    /**
     * Return the api options mappings
     * @param dashboardId
     * @returns {{countries: string, benefactors: string}}
     */
    var getApiOptionsMapping = function(dashboardId) {
        return countryListMapping[dashboardId];
    };

    /**
     * Return the year parameter mapping for the specified dashboardId
     * @param dashboardId
     * @returns {*}
     */
    var getYearParamName = function(dashboardId) {
        return yearParamMapping[dashboardId];
    };

    /**
     * Return an array with the view types of the aggregates that should be shown
     * for the specified dashboard section ID
     * @param dashboardId
     * @returns {*}
     */
    var getAggregates = function(dashboardId) {
        return aggregates[dashboardId];
    };

    /**
     * Returns the search-tabs parameters for the specified dashboardId
     * @param dashboardId
     * @returns {*}
     */
    var getSearchParams = function(dashboardId) {
        return searchParams[dashboardId];
    };

    /**
     * Create and return the extra parameters that should be sent to the API
     * with each Dashboard component request, for a specific Dashboard section
     * @param dashboardId
     * @returns {{}}
     */
    var getApiOptions = function(dashboardId) {
        var apiOptionsMap = getApiOptionsMapping(dashboardId);

        // Get min and max selected year and create the year range string for request
        var minYear = getMinYear(dashboardId);
        var maxYear = getMaxYear(dashboardId);

        var yearRange = "[" + minYear + " TO " + maxYear + "]";

        // Get name of parameter that should be used for sending year range
        var yearParam = getYearParamName(dashboardId);

        // Initialize extraParams object with year range
        var apiOptions = {};
        apiOptions[yearParam] = yearRange;

        // Get countries to send with request from DashboardService
        _.each(apiOptionsMap, function(viewType, key) {
            var countries = getCountries(viewType);
            countries = _.pluck(countries, "code").join(",");

            if (countries.length > 0) {
                apiOptions[key] = countries;
            }
        });

        return apiOptions;
    };

    var subscribeSelectionChanges = function(scope, callback) {
        var unregister = $rootScope.$on('dashboard-service-change', callback);
        scope.$on('$destroy', unregister);

        return unregister;
    };

    /**
     * Subscribe to be notified about changes in the year range
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
     * Subscribe to be notified about changes in the selected view type
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
     * Subscribe to be notified about changes in the selected project
     * @param scope
     * @param callback
     * @returns {*}
     */
    var subscribeProjectChanges = function(scope, callback) {
        var unregister = $rootScope.$on('dashboard-service-project-info-change', callback);
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
     * Emit event to notify about a selected project change
     */
    var notifyProjectChange = function() {
        if (!notifyProjectInfoChangeLock) {
            notifyProjectInfoChangeLock = true;

            $timeout(function() {
                $rootScope.$emit('dashboard-service-project-info-change');

                notifyProjectInfoChangeLock = false;
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
     * Return the minimum year of the range or null if range is empty
     * @param dashboardId
     * @returns {*}
     */
    var getMinYear = function(dashboardId) {
        return _.isEmpty(yearRange[dashboardId]) ? null : _.min(yearRange[dashboardId]);
    };

    /**
     * Return the maximum year of the range or null if range is empty
     * @param dashboardId
     * @returns {*}
     */
    var getMaxYear = function(dashboardId) {
        return _.isEmpty(yearRange[dashboardId]) ? null : _.max(yearRange[dashboardId]);
    };

    /**
     * Return the selected view type
     * @param dashboardId
     * @returns {{}}
     */
    var getViewType = function(dashboardId) {
        return selectedViewType[dashboardId];
    };

    /**
     * Set the selected view type
     * @param dashboardID   Dashboard ID
     * @param viewType      View type object
     */
    var setViewType = function(dashboardID, viewType) {
        if (!_.isEqual(selectedViewType[dashboardID], viewType)) {
            selectedViewType[dashboardID] = viewType;

            notifyViewTypeChange();
        }
    };

    /**
     * Return selected project info
     * @returns {{id: string, type: string}}
     */
    var getSelectedProjectInfo = function() {
        return {
            id: projectInfoId,
            type: projectInfoType
        };
    };

    /**
     * Return selected visualization type
     * @returns {string}
     */
    var getSelectedVisType = function() {
        return visualizationType;
    };

    /**
     * Set the properties for the selected project
     * @param id
     * @param type
     */
    var setSelectedProject = function(id, type) {
        projectInfoId = id;
        projectInfoType = type;

        notifyProjectChange();
    };

    /**
     * Set the properties for the selected visualization type
     * @param newVis
     */
    var setVisType = function(newVis) {
        visualizationType = newVis;
    };

    return {
        getApiOptionsMapping: getApiOptionsMapping,
        getYearParamName: getYearParamName,
        getAggregates: getAggregates,
        getSearchParams: getSearchParams,
        getApiOptions: getApiOptions,
        subscribeSelectionChanges: subscribeSelectionChanges,
        subscribeYearChanges: subscribeToYearChanges,
        subscribeViewTypeChanges: subscribeViewTypeChanges,
        subscribeProjectChanges: subscribeProjectChanges,
        setCountries: setCountries,
        getCountries: getCountries,
        clearCountries: clearCountries,
        setYearRange: setYearRange,
        getYearRange: getYearRange,
        getMinYear: getMinYear,
        getMaxYear: getMaxYear,
        setViewType: setViewType,
        getViewType: getViewType,
        getSelectedProjectInfo: getSelectedProjectInfo,
        getSelectedVisType: getSelectedVisType,
        setSelectedProject: setSelectedProject,
        setVisType: setVisType
    };
});
