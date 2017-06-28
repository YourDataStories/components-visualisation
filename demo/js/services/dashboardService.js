angular.module('yds').service('DashboardService', ["$rootScope", "$timeout", "$cookies", "$window",
    function ($rootScope, $timeout, $cookies, $window) {
        var countries = {};
        var yearRange = {};
        var selectedViewType = {};
        var gridSeletion = {};
        var projectInfoType = "";
        var projectInfoId = "";
        var visualizationType = "";

        var notifySelectionChangeLock = false;
        var notifyGridSelectionChangeLock = false;
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
            },
            public_project: {
                regions: "publicproject.regions.all",
                regional_units: "publicproject.regional_units.all"
            },
            comparison: {
                country1: "contract.comparison.countryA.countries.all",
                country2: "contract.comparison.countryB.countries.all"
            },
            comparison1: {
                country1: "contract.comparison.countryA.countries.all"
            },
            comparison2: {
                country2: "contract.comparison.countryB.countries.all"
            },
            comparison_details_1: {
                country1: "contract.comparison.countryA.countries.all"
            },
            comparison_details_2: {
                country2: "contract.comparison.countryB.countries.all"
            }
        };

        // Mapping of dashboardIds and parameter names that the API expects the selected year range to be sent at.
        // For example for aid activities, the server expects the years in a parameter called "year"
        var yearParamMapping = {
            aidactivity: "year",
            tradeactivity: "financialyear",
            contract: "year",
            public_project: "year",
            comparison: "year",
            comparison1: "year",
            comparison2: "year",
            comparison_details_1: "year",
            comparison_details_2: "year"
        };

        // View types of aggregates to show for each Dashboard section
        var aggregates = {
            aidactivity: {
                types: [
                    "aidactivity.benefactor.countries.all",
                    "aidactivity.beneficiary.countries.all",
                    "aidactivity.benefactor.organisations.all",
                    "aidactivity.beneficiary.organisations.all",
                    "aidactivity.sectors.for.countries.and.period",
                    "aidactivity.budget.for.countries.and.period",
                    "aidactivity.spending.for.countries.and.period"
                ],
                titles: [
                    "Benefactor Countries",
                    "Beneficiary Countries",
                    "Benefactor Organisations",
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
                    "contract.buyer.countries.all",
                    "contract.seller.countries.all",
                    "contract.buyers.all",
                    "contract.sellers.all",
                    "contract.CPVs.for.countries.and.period"
                ],
                titles: [
                    "Buyer Countries",
                    "Seller Countries",
                    "Buyers",
                    "Sellers",
                    "CPVs"
                ],
                width: 6
            },
            public_work: {
                types: [
                    "publicproject.buyers.all",
                    "publicproject.sellers.all"
                ],
                titles: [
                    "Buyers",
                    "Sellers"
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
            },
            contract: {
                concept: "Contract",
                urlParamPrefix: "ct-",
                requestType: "contract.listitems.for.countries.and.period"
            },
            public_project: {
                concept: "PublicProject",
                urlParamPrefix: "pw-",
                requestType: "publicproject.listitems.for.countries.and.period"
            }
        };

        // The cookie keys that are created in each Dashboard
        var dashboardCookies = {
            aidactivity: [
                "aidactivity_benefactor_countries_all",
                "aidactivity_beneficiary_countries_all",
                "year_aidactivity"
            ],
            tradeactivity: [
                "tradeactivity_hasdestination_countries_all",
                "tradeactivity_hasorigin_countries_all",
                "year_tradeactivity"
            ],
            contract: [
                "contract_buyer_countries_all",
                "contract_seller_countries_all",
                "year_contract"
            ],
            comparison: [
                "contract_comparison_CPVs_for_countries_and_period_comparison1",
                "contract_comparison_CPVs_for_countries_and_period_comparison2",
                "contract_comparison_countryA_countries_all",
                "contract_comparison_countryB_countries_all",
                "year_comparison"
            ],
            public_project: [
                "publicproject_filter_buyers_all_public_project",
                "publicproject_filter_sellers_all_public_project",
                "publicproject_regions_all_publicproject_regional_units_all",
                "year_public_project"
            ]
        };

        // Set variables that define the URL of each Dashboard
        var dashboardUrlPrefix = "http://ydsdev.iit.demokritos.gr/YDSComponents/#!/";
        // var dashboardUrlPrefix = "http://yds-lib.dev/#!/";

        var dashboardPaths = {
            aidactivity: "dashboard",
            tradeactivity: "dashboard",
            contract: "dashboardp1",
            comparison: "country-comparison",
            public_project: "public-works"
        };

        /**
         * For a given dashboardId, return true if there are cookies for that dashboard
         * @param dashboardId
         * @returns {*}
         */
        var dashboardIdHasCookies = function (dashboardId) {
            return _.has(dashboardCookies, dashboardId);
        };

        /**
         * Clear the cookies for a specified Dashboard. The cookies to clear for each Dashboard are specified in the
         * "dashboardCookies" variable above.
         * @param dashboardId
         */
        var clearDashboardCookies = function (dashboardId) {
            // Get cookies for the specified Dashboard
            var cookieKeys = dashboardCookies[dashboardId];

            // Remove the cookies
            _.map(cookieKeys, $cookies.remove);
        };

        /**
         * Get the saved cookies for a specific Dashboard
         * @param dashboardId
         * @returns {{}}
         */
        var getDashboardCookies = function (dashboardId) {
            var cookiesToSave = dashboardCookies[dashboardId];
            var cookies = {};

            // Add cookie values to the cookies variable
            _.each(cookiesToSave, function (cookieKey) {
                var value = $cookies.getObject(cookieKey);

                if (!_.isUndefined(value)) {
                    cookies[cookieKey] = value;
                }
            });

            return cookies;
        };

        /**
         * Get the value of a cookie as an object
         * @param key
         * @returns {*|Object}
         */
        var getCookieObject = function (key) {
            return $cookies.getObject(key.replace(/\./g, "_"));
        };

        /**
         * Set the value of a cookie to an object
         * @param key
         * @param valueObj
         */
        var setCookieObject = function (key, valueObj) {
            $cookies.putObject(key.replace(/\./g, "_"), valueObj);
        };

        /**
         * Restore the cookies for a specific Dashboard and go to its page
         * @param dashboard
         * @param cookies
         */
        var restoreCookies = function (dashboard, cookies) {
            var url = dashboardUrlPrefix + dashboardPaths[dashboard];

            // Clear any previous cookies for the specified Dashboard
            clearDashboardCookies(dashboard);

            // Restore the new cookie values
            _.each(cookies, function (data, key) {
                setCookieObject(key, data);
            });

            // Go to the dashboard
            if (url == $window.location.href) {
                // URL is the same, reload the page
                $window.location.reload();
            } else {
                // URL is different, go to the Dashboard page
                $window.location.href = url;
            }
        };

        /**
         * Get a grid-result request type and find the concept for it (in the searchParams object)
         * @param type      The request type
         * @returns {*}     Type of request
         */
        var getProjectConceptForType = function (type) {
            var concept = null;

            _.each(searchParams, function (searchParam) {
                if (searchParam.requestType == type) {
                    concept = searchParam.concept;
                }
            });

            return concept;
        };

        /**
         * Return the api options mappings
         * @param dashboardId
         * @returns {{countries: string, benefactors: string}}
         */
        var getApiOptionsMapping = function (dashboardId) {
            return countryListMapping[dashboardId];
        };

        /**
         * Return the year parameter mapping for the specified dashboardId
         * @param dashboardId
         * @returns {*}
         */
        var getYearParamName = function (dashboardId) {
            return yearParamMapping[dashboardId];
        };

        /**
         * Return an array with the view types of the aggregates that should be shown
         * for the specified dashboard section ID
         * @param dashboardId
         * @returns {*}
         */
        var getAggregates = function (dashboardId) {
            return aggregates[dashboardId];
        };

        /**
         * Return the available Dashboard types, based on the "aggregates" variable (which holds the list of aggregates
         * for each available Dashboard)
         * @returns {*}
         */
        var getDashboardTypes = function () {
            return _.keys(aggregates);
        };

        /**
         * Returns the search-tabs parameters for the specified dashboardId
         * @param dashboardId
         * @returns {*}
         */
        var getSearchParams = function (dashboardId) {
            return searchParams[dashboardId];
        };

        /**
         * Create and return the extra parameters that should be sent to the API
         * with each Dashboard component request, for a specific Dashboard section
         * @param dashboardId
         * @returns {{}}
         */
        var getApiOptions = function (dashboardId) {
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
            _.each(apiOptionsMap, function (viewType, key) {
                var countries = getCountries(viewType);
                countries = _.pluck(countries, "code").join(",");

                if (countries.length > 0) {
                    apiOptions[key] = countries;
                }
            });

            switch (dashboardId) {
                case "public_project":
                    if (!_.isEmpty(getGridSelection("sellers")))
                        apiOptions.sellers = _.pluck(getGridSelection("sellers"), "id").join(",");

                    if (!_.isEmpty(getGridSelection("buyers")))
                        apiOptions.buyers = _.pluck(getGridSelection("buyers"), "id").join(",");
                    break;
                case "comparison":
                    if (!_.isEmpty(getGridSelection("cpv1")))
                        apiOptions.cpv1 = _.pluck(getGridSelection("cpv1"), "id").join(",");

                    if (!_.isEmpty(getGridSelection("cpv2")))
                        apiOptions.cpv2 = _.pluck(getGridSelection("cpv2"), "id").join(",");

                    break;
                case "comparison1":
                    // Add year from "comparison" dashboardId
                    apiOptions.year = "[" + getMinYear("comparison") + " TO " + getMaxYear("comparison") + "]";
                    break;
                case "comparison2":
                    // Add year from "comparison" dashboardId
                    apiOptions.year = "[" + getMinYear("comparison") + " TO " + getMaxYear("comparison") + "]";
                    break;
                case "comparison_details_1":
                    // Add CPV 1
                    if (!_.isEmpty(getGridSelection("cpv1")))
                        apiOptions.cpv1 = _.pluck(getGridSelection("cpv1"), "id").join(",");

                    // Add year from "comparison" dashboardId
                    apiOptions.year = "[" + getMinYear("comparison") + " TO " + getMaxYear("comparison") + "]";
                    break;
                case "comparison_details_2":
                    // Add CPV 2
                    if (!_.isEmpty(getGridSelection("cpv2")))
                        apiOptions.cpv2 = _.pluck(getGridSelection("cpv2"), "id").join(",");

                    // Add year from "comparison" dashboardId
                    apiOptions.year = "[" + getMinYear("comparison") + " TO " + getMaxYear("comparison") + "]";
                    break;
            }
            // console.log(dashboardId, apiOptions);
            return apiOptions;
        };

        var subscribeSelectionChanges = function (scope, callback) {
            var unregister = $rootScope.$on('dashboard-service-change', callback);
            scope.$on('$destroy', unregister);

            return unregister;
        };

        var subscribeGridSelectionChanges = function (scope, callback) {
            var unregister = $rootScope.$on('dashboard-grid-sel-change', callback);
            scope.$on('$destroy', unregister);

            return unregister;
        };

        /**
         * Subscribe to be notified about changes in the year range
         * @param scope
         * @param callback
         * @returns {*}
         */
        var subscribeToYearChanges = function (scope, callback) {
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
        var subscribeViewTypeChanges = function (scope, callback) {
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
        var subscribeProjectChanges = function (scope, callback) {
            var unregister = $rootScope.$on('dashboard-service-project-info-change', callback);
            scope.$on('$destroy', unregister);

            return unregister;
        };

        /**
         * Emit event to notify about a grid selection change
         */
        var notifyGridSelectionChange = function () {
            if (!notifyGridSelectionChangeLock) {
                notifyGridSelectionChangeLock = true;

                $timeout(function () {
                    $rootScope.$emit('dashboard-grid-sel-change');

                    notifyGridSelectionChangeLock = false;
                }, 150);
            }
        };

        /**
         * Emit event to notify about a view type change
         */
        var notifyViewTypeChange = function () {
            if (!notifyViewTypeChangeLock) {
                notifyViewTypeChangeLock = true;

                $timeout(function () {
                    $rootScope.$emit('dashboard-service-view-type-change');

                    notifyViewTypeChangeLock = false;
                }, 150);
            }
        };

        /**
         * Emit event to notify about a country selection change
         */
        var notifyCountrySelectionChange = function () {
            if (!notifySelectionChangeLock) {
                notifySelectionChangeLock = true;

                $timeout(function () {
                    $rootScope.$emit('dashboard-service-change');

                    notifySelectionChangeLock = false;
                }, 150);
            }
        };

        /**
         * Emit event to notify about a year range change
         */
        var notifySubscribersYearChange = function () {
            if (!notifyYearChangeLock) {
                notifyYearChangeLock = true;

                $timeout(function () {
                    $rootScope.$emit('dashboard-service-year-range-change');

                    notifyYearChangeLock = false;
                }, 150);
            }
        };

        /**
         * Emit event to notify about a selected project change
         */
        var notifyProjectChange = function () {
            if (!notifyProjectInfoChangeLock) {
                notifyProjectInfoChangeLock = true;

                $timeout(function () {
                    $rootScope.$emit('dashboard-service-project-info-change');

                    notifyProjectInfoChangeLock = false;
                }, 150);
            }
        };

        /**
         * Set new grid selection for the given type
         * @param type
         * @param newSelection
         */
        var setGridSelection = function (type, newSelection) {
            gridSeletion[type] = newSelection;

            notifyGridSelectionChange();
        };

        /**
         * Set new selected countries for the given type
         * @param type          Type to set countries for
         * @param newCountries  Countries to set
         */
        var setCountries = function (type, newCountries) {
            if (_.isUndefined(countries[type]) || !_.isEqual(countries[type], newCountries)) {
                countries[type] = newCountries;

                setCookieObject(type, newCountries);

                notifyCountrySelectionChange();
            }
        };

        /**
         * Get selected countries for a given type
         * @param type  Type to get countries for
         * @returns {*}
         */
        var getCountries = function (type) {
            return countries[type];
        };

        /**
         * Get grid selection for a given type
         * @param type
         * @returns {*}
         */
        var getGridSelection = function (type) {
            return gridSeletion[type];
        };

        /**
         * Clear selected countries for a given type
         * @param type
         */
        var clearCountries = function (type) {
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
        var setYearRange = function (dashboardId, minYear, maxYear) {
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
        var getYearRange = function (dashboardId) {
            return yearRange[dashboardId];
        };

        /**
         * Return the minimum year of the range or null if range is empty
         * @param dashboardId
         * @returns {*}
         */
        var getMinYear = function (dashboardId) {
            return _.isEmpty(yearRange[dashboardId]) ? null : _.min(yearRange[dashboardId]);
        };

        /**
         * Return the maximum year of the range or null if range is empty
         * @param dashboardId
         * @returns {*}
         */
        var getMaxYear = function (dashboardId) {
            return _.isEmpty(yearRange[dashboardId]) ? null : _.max(yearRange[dashboardId]);
        };

        /**
         * Return the selected view type
         * @param dashboardId
         * @returns {{}}
         */
        var getViewType = function (dashboardId) {
            return selectedViewType[dashboardId];
        };

        /**
         * Set the selected view type
         * @param dashboardID   Dashboard ID
         * @param viewType      View type object
         */
        var setViewType = function (dashboardID, viewType) {
            if (!_.isEqual(selectedViewType[dashboardID], viewType)) {
                selectedViewType[dashboardID] = viewType;

                notifyViewTypeChange();
            }
        };

        /**
         * Return selected project info
         * @returns {{id: string, type: string}}
         */
        var getSelectedProjectInfo = function () {
            return {
                id: projectInfoId,
                type: projectInfoType
            };
        };

        /**
         * Return selected visualization type
         * @returns {string}
         */
        var getSelectedVisType = function () {
            return visualizationType;
        };

        /**
         * Set the properties for the selected project
         * @param id
         * @param type
         */
        var setSelectedProject = function (id, type) {
            projectInfoId = id;
            projectInfoType = type;

            notifyProjectChange();
        };

        /**
         * Set the properties for the selected visualization type
         * @param newVis
         */
        var setVisType = function (newVis) {
            visualizationType = newVis;
        };

        return {
            getProjectConceptForType: getProjectConceptForType,
            getApiOptionsMapping: getApiOptionsMapping,
            getYearParamName: getYearParamName,
            getAggregates: getAggregates,
            getDashboardTypes: getDashboardTypes,

            getSearchParams: getSearchParams,
            getApiOptions: getApiOptions,

            subscribeGridSelectionChanges: subscribeGridSelectionChanges,
            subscribeSelectionChanges: subscribeSelectionChanges,
            subscribeYearChanges: subscribeToYearChanges,
            subscribeViewTypeChanges: subscribeViewTypeChanges,
            subscribeProjectChanges: subscribeProjectChanges,

            setCountries: setCountries,
            getCountries: getCountries,
            clearCountries: clearCountries,

            setGridSelection: setGridSelection,
            getGridSelection: getGridSelection,

            setYearRange: setYearRange,
            getYearRange: getYearRange,
            getMinYear: getMinYear,
            getMaxYear: getMaxYear,

            setViewType: setViewType,
            getViewType: getViewType,

            getSelectedProjectInfo: getSelectedProjectInfo,
            setSelectedProject: setSelectedProject,

            getSelectedVisType: getSelectedVisType,
            setVisType: setVisType,

            getCookieObject: getCookieObject,
            setCookieObject: setCookieObject,
            dashboardIdHasCookies: dashboardIdHasCookies,
            clearDashboardCookies: clearDashboardCookies,
            getDashboardCookies: getDashboardCookies,
            restoreCookies: restoreCookies
        };
    }]
);
