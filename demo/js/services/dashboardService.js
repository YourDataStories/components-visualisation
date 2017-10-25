angular.module("yds").service("DashboardService", ["$rootScope", "$timeout", "$cookies", "$window",
    function ($rootScope, $timeout, $cookies, $window) {
        var dashboard = {}; // Public methods go in this object

        var countries = {};
        var yearRange = {};
        var selectedViewType = {};
        var gridSeletion = {};
        var objectStore = {};   // For storing various objects (e.g. enabled filters on dynamic dashboard)
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
            },
            traffic_observation: {
                concept: "TrafficObservation"
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
            aidactivity: "dashboard2",
            tradeactivity: "dashboard2",
            contract: "dashboardp1",
            comparison: "country-comparison",
            public_project: "public-works"
        };

        // Configuration for available filters for each Dashboard (test)
        var dashboardFilters = {
            "contract": [
                {
                    name: "Buyer Countries",
                    type: "heatmap",
                    checked: true,  // This filter is selected by default
                    params: {
                        viewType: "contract.buyer.countries.all",
                        europeOnly: true
                    }
                }, {
                    name: "Seller Countries",
                    type: "heatmap",
                    checked: true,
                    params: {
                        viewType: "contract.seller.countries.all"
                    }
                }, {
                    name: "Buyers",
                    type: "grid",
                    checked: true,
                    params: {
                        viewType: "contract.buyers.all",
                        selectionId: "buyer_organizations"
                    }
                }, {
                    name: "Sellers",
                    type: "grid",
                    params: {
                        viewType: "contract.sellers.all",
                        selectionId: "seller_organizations"
                    }
                }, {
                    name: "CPVs",
                    type: "grid",
                    params: {
                        viewType: "contract.CPVs.for.countries.and.period",
                        selectionId: "cpvs"
                    }
                }, {
                    name: "Year Range",
                    type: "year",
                    checked: true,
                    params: {
                        label: "Time Period for Contracts"
                    }
                }
            ],
            "aidactivity": [
                {
                    name: "Benefactor Countries",
                    type: "heatmap",
                    checked: true,
                    params: {
                        viewType: "aidactivity.benefactor.countries.all"
                    }
                }, {
                    name: "Beneficiary Countries",
                    type: "heatmap",
                    checked: true,
                    params: {
                        viewType: "aidactivity.beneficiary.countries.all"
                    }
                }, {
                    name: "Benefactor Organisations",
                    type: "grid",
                    params: {
                        viewType: "aidactivity.benefactor.organisations.all",
                        selectionId: "benefactor_orgs"
                    }
                }, {
                    name: "Beneficiary Organisations",
                    type: "grid",
                    params: {
                        viewType: "aidactivity.beneficiary.organisations.all",
                        selectionId: "beneficiary_orgs"
                    }
                }, {
                    name: "Sectors",
                    type: "grid",
                    params: {
                        viewType: "aidactivity.sectors.for.countries.and.period",
                        selectionId: "sectors"
                    }
                }, {
                    name: "Year Range",
                    type: "year",
                    checked: true,
                    params: {
                        label: "Time Period for Aid Activities"
                    }
                }
            ],
            "tradeactivity": [
                {
                    name: "Origin Countries",
                    type: "heatmap",
                    checked: true,
                    params: {
                        viewType: "tradeactivity.hasorigin.countries.all"
                    }
                }, {
                    name: "Destination Countries",
                    type: "heatmap",
                    checked: true,
                    params: {
                        viewType: "tradeactivity.hasdestination.countries.all"
                    }
                }, {
                    name: "Sectors",
                    type: "grid",
                    params: {
                        viewType: "tradeactivity.sectors.for.countries.and.period",
                        selectionId: "sectors"
                    }
                }, {
                    name: "Year Range",
                    type: "year",
                    checked: true,
                    params: {
                        label: "Time Period for Trade Activities"
                    }
                }
            ]
        };

        /**
         * Save a key/value pair
         * @param key
         * @param object
         */
        dashboard.saveObject = function (key, object) {
            if (!_.has(objectStore, key) || !_.isEqual(objectStore[key], object)) {
                objectStore[key] = object;

                notifyObjectChange();
            }
        };

        /**
         * Get an object from the saved objects, by its key
         * @param key
         * @returns {*}
         */
        dashboard.getObject = function (key) {
            return objectStore[key];
        };

        /**
         * Return the available filters and their parameters for a Dashboard
         * @param dashboardId
         * @returns {*}
         */
        dashboard.getDashboardFilters = function (dashboardId) {
            return dashboardFilters[dashboardId];
        };

        /**
         * For a given dashboardId, return true if there are cookies for that dashboard
         * @param dashboardId
         * @returns {*}
         */
        dashboard.dashboardIdHasCookies = function (dashboardId) {
            return _.has(dashboardCookies, dashboardId);
        };

        /**
         * Clear the cookies for a specified Dashboard. The cookies to clear for each Dashboard are specified in the
         * "dashboardCookies" variable above.
         * @param dashboardId
         */
        dashboard.clearDashboardCookies = function (dashboardId) {
            // Get cookies for the specified Dashboard
            var cookieKeys = dashboardCookies[dashboardId];

            // Remove the cookies
            _.map(cookieKeys, $cookies.remove);
        };

        /**
         * Filter a selection object in order to keep only the required values. Those are (in order): "id", "code" and
         * "min/maxValue". If any of those is found, the object is filtered to contain only that. If none are found, the
         * object is returned without any filtering. If the object is an array, the items inside it are filtered.
         * @param obj   Object to filter
         * @returns {*} Filtered object
         */
        var filterCookieObject = function (obj) {
            if (_.isArray(obj)) {
                // If the object is an array, filter each item in it
                _.each(obj, function (arrayItem, index) {
                    obj[index] = filterCookieObject(arrayItem);
                });
            } else if (_.has(obj, "id")) {
                // Keep only "id" attribute
                return _.pick(obj, "id");
            } else if (_.has(obj, "code")) {
                // Keep only "code" attribute
                return _.pick(obj, "code");
            } else if (_.has(obj, "minValue") || _.has(obj, "maxValue")) {
                // Keep only "minValue" and "maxValue" attributes
                return _.pick(obj, ["minValue", "maxValue"]);
            }

            // No values matched or object was array, so return the entire object
            return obj;
        };

        /**
         * Get the saved cookies for a specific Dashboard
         * @param dashboardId
         * @returns {{}}
         */
        dashboard.getDashboardCookies = function (dashboardId) {
            var cookiesToSave = dashboardCookies[dashboardId];
            var cookies = {};

            // Add cookie values to the cookies variable
            _.each(cookiesToSave, function (cookieKey) {
                var value = $cookies.getObject(cookieKey);

                if (!_.isUndefined(value) && !_.isEmpty(value)) {
                    cookies[cookieKey] = filterCookieObject(value);
                }
            });

            return cookies;
        };

        /**
         * Get the value of a cookie as an object
         * @param key
         * @returns {*|Object}
         */
        dashboard.getCookieObject = function (key) {
            return $cookies.getObject(key.replace(/\./g, "_"));
        };

        /**
         * Set the value of a cookie to an object
         * @param key
         * @param valueObj
         */
        dashboard.setCookieObject = function (key, valueObj) {
            $cookies.putObject(key.replace(/\./g, "_"), valueObj);
        };

        /**
         * Restore the cookies for a specific Dashboard and go to its page
         * @param dashboardName
         * @param cookies
         */
        dashboard.restoreCookies = function (dashboardName, cookies) {
            var url = dashboardUrlPrefix + dashboardPaths[dashboardName];

            // Clear any previous cookies for the specified Dashboard
            dashboard.clearDashboardCookies(dashboardName);

            // Restore the new cookie values
            _.each(cookies, function (data, key) {
                dashboard.setCookieObject(key, data);
            });

            // Go to the dashboard
            if (url === $window.location.href) {
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
        dashboard.getProjectConceptForType = function (type) {
            var concept = null;

            _.each(searchParams, function (searchParam) {
                if (searchParam.requestType === type) {
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
        dashboard.getApiOptionsMapping = function (dashboardId) {
            return countryListMapping[dashboardId];
        };

        /**
         * Return the year parameter mapping for the specified dashboardId
         * @param dashboardId
         * @returns {*}
         */
        dashboard.getYearParamName = function (dashboardId) {
            return yearParamMapping[dashboardId];
        };

        /**
         * Return an array with the view types of the aggregates that should be shown
         * for the specified dashboard section ID
         * @param dashboardId
         * @returns {*}
         */
        dashboard.getAggregates = function (dashboardId) {
            return aggregates[dashboardId];
        };

        /**
         * Return the available Dashboard types, based on the "aggregates" variable (which holds the list of aggregates
         * for each available Dashboard)
         * @returns {*}
         */
        dashboard.getDashboardTypes = function () {
            return _.keys(aggregates);
        };

        /**
         * Returns the search-tabs parameters for the specified dashboardId
         * @param dashboardId
         * @returns {*}
         */
        dashboard.getSearchParams = function (dashboardId) {
            return searchParams[dashboardId];
        };

        /**
         * Get the extra parameters that should be sent to the API with each (dynamic) Dashboard component request,
         * using the filters that are enabled in that Dashboard.
         * @param dashboardId       Dashboard ID to get filters for
         * @param enabledFiltersKey Key that was used to save the enabled filters
         * @returns {{}}
         */
        dashboard.getApiOptionsDynamic = function (dashboardId, enabledFiltersKey) {
            var apiOptions = {};

            // Get the required data
            var enabledFilters = dashboard.getObject(enabledFiltersKey);
            var apiOptionsMap = dashboard.getApiOptionsMapping(dashboardId);

            // Gather data for any map filters
            var filters = _.where(enabledFilters, {type: "heatmap"});

            if (!_.isEmpty(filters)) {
                // Keep only the filter view types
                filters = _.pluck(_.pluck(filters, "params"), "viewType");

                _.each(apiOptionsMap, function (viewType, key) {
                    if (filters.indexOf(viewType) !== -1) {
                        // The filter for this key is enabled, add its value to the parameters
                        var countries = dashboard.getCountries(viewType);
                        countries = _.pluck(countries, "code").join(",");

                        if (countries.length > 0) {
                            apiOptions[key] = countries;
                        }
                    }
                });
            }

            // Gather data for any year range filters (only 1 supported right now)
            filters = _.findWhere(enabledFilters, {type: "year"});

            if (_.has(filters, "checked") && filters.checked === true) {
                // Get min and max selected year and create the year range string for request
                var minYear = dashboard.getMinYear(dashboardId);
                var maxYear = dashboard.getMaxYear(dashboardId);

                apiOptions[dashboard.getYearParamName(dashboardId)] = "[" + minYear + " TO " + maxYear + "]";
            }

            // Gather data for any grid filters
            filters = _.where(enabledFilters, {type: "grid"});

            _.each(filters, function (gridFilter) {
                var selectionId = gridFilter.params.selectionId;
                var selection = dashboard.getGridSelection(selectionId);

                // Check that the selection is not undefined, and at least the 1st item has an "id" property
                if (!_.isUndefined(selection) && _.has(_.first(selection), "id")) {
                    selection = _.pluck(selection, "id");
                    apiOptions[selectionId] = selection;
                }
            });

            return apiOptions;
        };

        /**
         * Create and return the extra parameters that should be sent to the API
         * with each Dashboard component request, for a specific Dashboard section
         * @param dashboardId
         * @returns {{}}
         */
        dashboard.getApiOptions = function (dashboardId) {
            var apiOptionsMap = dashboard.getApiOptionsMapping(dashboardId);

            // Get min and max selected year and create the year range string for request
            var minYear = dashboard.getMinYear(dashboardId);
            var maxYear = dashboard.getMaxYear(dashboardId);

            var yearRange = "[" + minYear + " TO " + maxYear + "]";

            // Get name of parameter that should be used for sending year range
            var yearParam = dashboard.getYearParamName(dashboardId);

            // Initialize extraParams object with year range
            var apiOptions = {};

            apiOptions[yearParam] = yearRange;

            // Get countries to send with request from DashboardService
            _.each(apiOptionsMap, function (viewType, key) {
                var countries = dashboard.getCountries(viewType);
                countries = _.pluck(countries, "code").join(",");

                if (countries.length > 0) {
                    apiOptions[key] = countries;
                }
            });

            switch (dashboardId) {
                case "galway_traffic":
                    if (!_.isEmpty(dashboard.getGridSelection("galway_contract")))
                        apiOptions.contract = dashboard.getGridSelection("galway_contract").join(",");
                    break;
                case "public_project":
                    if (!_.isEmpty(dashboard.getGridSelection("sellers")))
                        apiOptions.sellers = dashboard.getGridSelection("sellers").join(",");

                    if (!_.isEmpty(dashboard.getGridSelection("buyers")))
                        apiOptions.buyers = dashboard.getGridSelection("buyers").join(",");
                    break;
                case "comparison":
                    if (!_.isEmpty(dashboard.getGridSelection("cpv1")))
                        apiOptions.cpv1 = dashboard.getGridSelection("cpv1").join(",");

                    if (!_.isEmpty(dashboard.getGridSelection("cpv2")))
                        apiOptions.cpv2 = dashboard.getGridSelection("cpv2").join(",");
                    break;
                case "comparison1":
                    // Add year from "comparison" dashboardId
                    apiOptions.year = "[" + dashboard.getMinYear("comparison") + " TO " + dashboard.getMaxYear("comparison") + "]";
                    break;
                case "comparison2":
                    // Add year from "comparison" dashboardId
                    apiOptions.year = "[" + dashboard.getMinYear("comparison") + " TO " + dashboard.getMaxYear("comparison") + "]";
                    break;
                case "comparison_details_1":
                    // Add CPV 1
                    if (!_.isEmpty(dashboard.getGridSelection("cpv1")))
                        apiOptions.cpv1 = dashboard.getGridSelection("cpv1").join(",");

                    // Add year from "comparison" dashboardId
                    apiOptions.year = "[" + dashboard.getMinYear("comparison") + " TO " + dashboard.getMaxYear("comparison") + "]";
                    break;
                case "comparison_details_2":
                    // Add CPV 2
                    if (!_.isEmpty(dashboard.getGridSelection("cpv2")))
                        apiOptions.cpv2 = dashboard.getGridSelection("cpv2").join(",");

                    // Add year from "comparison" dashboardId
                    apiOptions.year = "[" + dashboard.getMinYear("comparison") + " TO " + dashboard.getMaxYear("comparison") + "]";
                    break;
                case "traffic_observation":
                    // Add slider & combobox values
                    var extraValues = {
                        // Map points
                        "trafficobservation.on_points": dashboard.getObject("trafficobservation.on_points"),

                        // Sliders
                        "trafficobservation.start_year": dashboard.getObject("trafficobservation.start_year"),
                        "trafficobservation.end_year": dashboard.getObject("trafficobservation.end_year"),
                        "trafficobservation.start_time": dashboard.getObject("trafficobservation.start_time"),
                        "trafficobservation.end_time": dashboard.getObject("trafficobservation.end_time"),
                        "trafficobservation.start_day": dashboard.getObject("trafficobservation.start_day"),
                        "trafficobservation.end_day": dashboard.getObject("trafficobservation.end_day"),

                        // Comboboxes
                        "trafficobservation.vehicle_type": dashboard.getObject("trafficobservation.vehicle_type"),
                        "trafficobservation.direction": dashboard.getObject("trafficobservation.direction")
                    };

                    // Remove undefined values from the above object, and add the remaining ones to the apiOptions
                    apiOptions = _.extend(apiOptions, _.omit(extraValues, _.isUndefined));
                    break;
            }

            // Remove string values that contain "null" from the parameters
            apiOptions = _.omit(apiOptions, function (param) {
                return _.isString(param) && param.indexOf("null") !== -1;
            });

            return apiOptions;
        };

        dashboard.subscribeSelectionChanges = function (scope, callback) {
            var unregister = $rootScope.$on("dashboard-service-change", callback);
            scope.$on("$destroy", unregister);

            return unregister;
        };

        dashboard.subscribeGridSelectionChanges = function (scope, callback) {
            var unregister = $rootScope.$on("dashboard-grid-sel-change", callback);
            scope.$on("$destroy", unregister);

            return unregister;
        };

        /**
         * Subscribe to be notified about changes in the year range
         * @param scope
         * @param callback
         * @returns {*}
         */
        dashboard.subscribeYearChanges = function (scope, callback) {
            var unregister = $rootScope.$on("dashboard-service-year-range-change", callback);
            scope.$on("$destroy", unregister);

            return unregister;
        };

        /**
         * Subscribe to be notified about changes in the selected view type
         * @param scope
         * @param callback
         * @returns {*}
         */
        dashboard.subscribeViewTypeChanges = function (scope, callback) {
            var unregister = $rootScope.$on("dashboard-service-view-type-change", callback);
            scope.$on("$destroy", unregister);

            return unregister;
        };

        /**
         * Subscribe to be notified about changes in the selected project
         * @param scope
         * @param callback
         * @returns {*}
         */
        dashboard.subscribeProjectChanges = function (scope, callback) {
            var unregister = $rootScope.$on("dashboard-service-project-info-change", callback);
            scope.$on("$destroy", unregister);

            return unregister;
        };

        /**
         * Subscribe to be notified about changes in the saved objects
         * @param scope
         * @param callback
         * @returns {*}
         */
        dashboard.subscribeObjectChanges = function (scope, callback) {
            var unregister = $rootScope.$on("dashboard-object-change", callback);
            scope.$on("$destroy", unregister);

            return unregister;
        };

        /**
         * Emit event to notify about an object change
         */
        var notifyObjectChange = function () {
            $timeout(function () {
                $rootScope.$emit("dashboard-object-change");
            }, 150);
        };

        /**
         * Emit event to notify about a grid selection change
         */
        var notifyGridSelectionChange = function () {
            if (!notifyGridSelectionChangeLock) {
                notifyGridSelectionChangeLock = true;

                $timeout(function () {
                    $rootScope.$emit("dashboard-grid-sel-change");

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
                    $rootScope.$emit("dashboard-service-view-type-change");

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
                    $rootScope.$emit("dashboard-service-change");

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
                    $rootScope.$emit("dashboard-service-year-range-change");

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
                    $rootScope.$emit("dashboard-service-project-info-change");

                    notifyProjectInfoChangeLock = false;
                }, 150);
            }
        };

        /**
         * Set new grid selection for the given type
         * @param type
         * @param newSelection
         */
        dashboard.setGridSelection = function (type, newSelection) {
            gridSeletion[type] = newSelection;

            notifyGridSelectionChange();
        };

        /**
         * Set new selected countries for the given type
         * @param type          Type to set countries for
         * @param newCountries  Countries to set
         */
        dashboard.setCountries = function (type, newCountries) {
            if (_.isUndefined(countries[type]) || !_.isEqual(countries[type], newCountries)) {
                countries[type] = newCountries;

                dashboard.setCookieObject(type, newCountries);

                notifyCountrySelectionChange();
            }
        };

        /**
         * Get selected countries for a given type
         * @param type  Type to get countries for
         * @returns {*}
         */
        dashboard.getCountries = function (type) {
            return countries[type];
        };

        /**
         * Get grid selection for a given type
         * @param type
         * @returns {*}
         */
        dashboard.getGridSelection = function (type) {
            return gridSeletion[type];
        };

        /**
         * Clear selected countries for a given type
         * @param type
         */
        dashboard.clearCountries = function (type) {
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
        dashboard.setYearRange = function (dashboardId, minYear, maxYear) {
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
        dashboard.getYearRange = function (dashboardId) {
            return yearRange[dashboardId];
        };

        /**
         * Return the minimum year of the range or null if range is empty
         * @param dashboardId
         * @returns {*}
         */
        dashboard.getMinYear = function (dashboardId) {
            return _.isEmpty(yearRange[dashboardId]) ? null : _.min(yearRange[dashboardId]);
        };

        /**
         * Return the maximum year of the range or null if range is empty
         * @param dashboardId
         * @returns {*}
         */
        dashboard.getMaxYear = function (dashboardId) {
            return _.isEmpty(yearRange[dashboardId]) ? null : _.max(yearRange[dashboardId]);
        };

        /**
         * Return the selected view type
         * @param dashboardId
         * @returns {{}}
         */
        dashboard.getViewType = function (dashboardId) {
            return selectedViewType[dashboardId];
        };

        /**
         * Set the selected view type
         * @param dashboardID   Dashboard ID
         * @param viewType      View type object
         */
        dashboard.setViewType = function (dashboardID, viewType) {
            if (!_.isEqual(selectedViewType[dashboardID], viewType)) {
                selectedViewType[dashboardID] = viewType;

                notifyViewTypeChange();
            }
        };

        /**
         * Return selected project info
         * @returns {{id: string, type: string}}
         */
        dashboard.getSelectedProjectInfo = function () {
            return {
                id: projectInfoId,
                type: projectInfoType
            };
        };

        /**
         * Return selected visualization type
         * @returns {string}
         */
        dashboard.getSelectedVisType = function () {
            return visualizationType;
        };

        /**
         * Set the properties for the selected project
         * @param id
         * @param type
         */
        dashboard.setSelectedProject = function (id, type) {
            projectInfoId = id;
            projectInfoType = type;

            notifyProjectChange();
        };

        /**
         * Set the properties for the selected visualization type
         * @param newVis
         */
        dashboard.setVisType = function (newVis) {
            visualizationType = newVis;
        };

        /**
         * Subscribe to the
         * @param subscriptions Array with functions to unsubscribe from the subscribed filters
         * @param scope         Scope to use for subscribing to new changes
         * @param changeHandler Function that will be called when the selection of a filter changes
         */
        dashboard.updateFilterSubscriptions = function (subscriptions, scope, changeHandler) {
            var filterTypes = _.uniq(_.pluck(dashboard.getObject("filter"), "type"));

            // Unsubscribe from old filter types
            _.each(subscriptions, function (unsubscribeFunction) {
                if (_.isFunction(unsubscribeFunction)) {
                    unsubscribeFunction();
                }
            });

            // Subscribe to new filter changes
            _.each(filterTypes, function (type) {
                switch (type) {
                    case "heatmap":
                        subscriptions.push(
                            dashboard.subscribeSelectionChanges(scope, changeHandler));
                        break;
                    case "grid":
                        subscriptions.push(
                            dashboard.subscribeGridSelectionChanges(scope, changeHandler));
                        break;
                    case "year":
                        subscriptions.push(
                            dashboard.subscribeYearChanges(scope, changeHandler));
                        break;
                    default:
                        console.warn("Unknown filter type in Dashboard Updater: " + type);
                }
            })
        };

        /**
         * Create and return a URL which goes to a Dashboard and restores specific filter values (the ones selected
         * when this is called).
         * @param dashboardId   Dashboard to get URL for
         * @returns {string}    URL
         */
        dashboard.getSharingUrl = function (dashboardId) {
            var cookies = dashboard.getDashboardCookies(dashboardId);

            return dashboardUrlPrefix + dashboardPaths[dashboardId]
                + "?dashboard=" + dashboardId
                + "&filters=" + JSURL.stringify(cookies);
        };

        return dashboard;
    }]
);
