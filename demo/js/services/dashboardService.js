angular.module("yds").service("DashboardService", ["$rootScope", "$timeout", "$cookies", "$window",
    function ($rootScope, $timeout, $cookies, $window) {
        var dashboard = {}; // Public methods go in this object

        var countries = {};         // For storing selected countries (from Heatmaps)
        var yearRange = {};         // For storing selected year ranges
        var selectedViewType = {};  // For storing selected view type
        var gridSelection = {};     // For storing grid selections (e.g. CPVs)
        var objectStore = {};       // For storing various objects (e.g. enabled filters on dynamic dashboard)

        var projectInfoType = "";   // Type of currently selected project (from grids in View/Search Data)
        var projectInfoId = "";     // Currently selected project ID (from grids in View/Search Data)
        var visualizationType = ""; // Current Dashboard visualisation type (e.g. pie, bar...)

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
            },
            dianeosis_students: {
                regions: "student.regions.all",
                regional_units: "student.regional_units.all"
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
                    "contract.CPVs.for.countries.and.period",
                    "contract.tenders.received.all"
                ],
                titles: [
                    "Buyer Countries",
                    "Seller Countries",
                    "Buyers",
                    "Sellers",
                    "CPVs",
                    "Received Tenders"
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
            },
            dianeosis_students: {
                types: [
                    "student.lessons.all",
                    "student.lessons.per.region",
                    "student.lessons.per.regional.unit"
                ],
                titles: [
                    "Lessons",
                    "Regions",
                    "Regional Units"
                ]
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
                concept: "Contract"
            },
            traffic_observation_contracts: {
                concept: "Contract"
            }
        };

        // The cookie keys that are created in each Dashboard
        var dashboardCookies = {
            aidactivity: [
                "filter_aidactivity",
                "aidactivity_benefactor_countries_all",
                "aidactivity_beneficiary_countries_all",
                "year_aidactivity",
                "aidactivity_benefactor_organisations_all_filter_aidactivity",
                "aidactivity_beneficiary_organisations_all_filter_aidactivity",
                "aidactivity_sectors_for_countries_and_period_tree_aidactivity",
                "aid_spending",
                "aid_budget"
            ],
            tradeactivity: [
                "filter_tradeactivity",
                "tradeactivity_hasdestination_countries_all",
                "tradeactivity_hasorigin_countries_all",
                "year_tradeactivity",
                "trade_amount",
                "tradeactivity_sectors_for_countries_and_period_tree_tradeactivity"
            ],
            contract: [
                "filter_contract",
                "contract_buyer_countries_all",
                "contract_seller_countries_all",
                "year_contract",
                "contract_amount",
                "contract_CPVs_for_countries_and_period_filter_contract",
                "contract_buyers_all_filter_contract",
                "contract_sellers_all_filter_contract",
                "numberOfTenders"
            ],
            comparison: [
                "contract_comparison_CPVs_for_countries_and_period_comparison1",
                "contract_comparison_CPVs_for_countries_and_period_comparison2",
                "contract_comparison_countryA_countries_all",
                "contract_comparison_countryB_countries_all",
                "comparison_amount",
                "year_comparison"
            ],
            public_project: [
                "publicproject_filter_buyers_all_public_project",
                "publicproject_filter_sellers_all_public_project",
                "publicproject_regions_all_publicproject_regional_units_all",
                "year_public_project"
            ],
            traffic_observation: [
                "trafficobservation_direction",
                "trafficobservation_direction1",
                "trafficobservation_direction2",
                "trafficobservation_end_day",
                "trafficobservation_end_time",
                "trafficobservation_end_year",
                "trafficobservation_gap",
                "trafficobservation_on_points",
                "trafficobservation_start_day",
                "trafficobservation_start_time",
                "trafficobservation_start_year",
                "trafficobservation_vehicle_type"
            ],
            dianeosis_students: [
                "student_lessons",
                "student_not_lessons",
                "school_type",
                "school_shift",
                "student_regions_all_student_regional_units_all",
                "student_regions_all",
                "student_regional_units_all"
            ]
        };

        // Set variables that define the URL of each Dashboard
        var dashboardUrlPrefix = "http://ydsdev.iit.demokritos.gr/YDSComponents/#!/";
        // var dashboardUrlPrefix = "http://yds-lib.dev/#!/";

        var dashboardPaths = {
            aidactivity: "dashboard-aid",
            tradeactivity: "dashboard-trade",
            contract: "dashboard-contract",
            comparison: "country-comparison",
            public_project: "public-works",
            dianeosis_students: "dianeosis-students",
            traffic_observation: "traffic-observations"
        };

        // Configuration for available filters for each Dashboard (test)
        var dashboardFilters = {
            "contract": [
                {
                    name: "Buyer Countries",
                    type: "heatmap",
                    checked: true,  // This filter is selected by default
                    params: {
                        legendTitle: "Number of Contracts per Buyer Country",
                        viewType: "contract.buyer.countries.all",
                        europeOnly: true
                    }
                }, {
                    name: "Seller Countries",
                    type: "heatmap",
                    checked: true,
                    params: {
                        legendTitle: "Number of Contracts per Seller Country",
                        viewType: "contract.seller.countries.all"
                    }
                }, {
                    name: "Buyers",
                    type: "grid",
                    params: {
                        viewType: "contract.buyers.all.filter",
                        selectionId: "buyer_organizations"
                    }
                }, {
                    name: "Sellers",
                    type: "grid",
                    params: {
                        viewType: "contract.sellers.all.filter",
                        selectionId: "seller_organizations"
                    }
                }, {
                    name: "CPVs",
                    type: "grid-grouped",
                    params: {
                        viewType: "contract.CPVs.for.countries.and.period.filter",
                        selectionId: "cpvs"
                    }
                }, {
                    name: "Year Range",
                    type: "year",
                    checked: true,
                    params: {
                        label: "Time Period for Contracts"
                    }
                }, {
                    name: "Tenders Number",
                    type: "number-range",
                    checked: true,
                    params: {
                        label: "Number of tenders received",
                        selectionType: "numberOfTenders",
                        min: "0",
                        max: "20"
                    }
                }, {
                    name: "Amount",
                    type: "amount",
                    params: {
                        selectionId: "contract_amount",
                        apiParam: "amount",
                        label: "Amount",
                        min: 0,
                        max: 1000000000
                    }
                }
            ],
            "aidactivity": [
                {
                    name: "Benefactor Countries",
                    type: "heatmap",
                    checked: true,
                    params: {
                        legendTitle: "Number of Aid Activities per Benefactor Country",
                        viewType: "aidactivity.benefactor.countries.all"
                    }
                }, {
                    name: "Beneficiary Countries",
                    type: "heatmap",
                    checked: true,
                    params: {
                        legendTitle: "Number of Aid Activities per Beneficiary Country",
                        viewType: "aidactivity.beneficiary.countries.all"
                    }
                }, {
                    name: "Benefactor Organisations",
                    type: "grid",
                    params: {
                        viewType: "aidactivity.benefactor.organisations.all.filter",
                        selectionId: "benefactor_orgs"
                    }
                }, {
                    name: "Beneficiary Organisations",
                    type: "grid",
                    params: {
                        viewType: "aidactivity.beneficiary.organisations.all.filter",
                        selectionId: "beneficiary_orgs"
                    }
                }, {
                    name: "Year Range",
                    type: "year",
                    checked: true,
                    params: {
                        label: "Time Period for Aid Activities"
                    }
                }, {
                    name: "Sectors",
                    type: "grid-grouped",
                    params: {
                        viewType: "aidactivity.sectors.for.countries.and.period.tree",
                        selectionId: "sectors"
                    }
                }, {
                    name: "Budget",
                    type: "amount",
                    params: {
                        selectionId: "aid_budget",
                        apiParam: "budget",
                        label: "Budget",
                        min: 0,
                        max: 1000000000
                    }
                }, {
                    name: "Spending",
                    type: "amount",
                    params: {
                        selectionId: "aid_spending",
                        apiParam: "spending",
                        label: "Spending",
                        min: 0,
                        max: 1000000000
                    }
                }
            ],
            "tradeactivity": [
                {
                    name: "Origin Countries",
                    type: "heatmap",
                    checked: true,
                    params: {
                        legendTitle: "Number of Trade Activities per Origin Country",
                        viewType: "tradeactivity.hasorigin.countries.all"
                    }
                }, {
                    name: "Destination Countries",
                    type: "heatmap",
                    checked: true,
                    params: {
                        legendTitle: "Number of Trade Activities per Destination Country",
                        viewType: "tradeactivity.hasdestination.countries.all"
                    }
                }, {
                    name: "Year Range",
                    type: "year",
                    checked: true,
                    params: {
                        label: "Time Period for Trade Activities"
                    }
                }, {
                    name: "Amount",
                    type: "amount",
                    params: {
                        selectionId: "trade_amount",
                        apiParam: "amount",
                        label: "Amount",
                        min: 0,
                        max: 1000000000
                    }
                }, {
                    name: "Sectors",
                    type: "grid-grouped",
                    checked: true,
                    params: {
                        viewType: "tradeactivity.sectors.for.countries.and.period.tree",
                        selectionId: "sectors"
                    }
                }
            ]
        };

        /**
         * Save a key/value pair
         * @param key       Key
         * @param object    Value to save
         * @param noCookie  Set to true to prevent saving the value as a cookie too
         */
        dashboard.saveObject = function (key, object, noCookie) {
            if (!_.has(objectStore, key) || !_.isEqual(objectStore[key], object)) {
                objectStore[key] = object;

                // Save to cookie as well, in case it is needed
                if (_.isUndefined(noCookie) || !noCookie) {
                    dashboard.setCookieObject(key, object);
                }

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

                // Only keep defined values that are either numbers, or non-empty arrays/objects
                if (!_.isUndefined(value) && (!_.isEmpty(value) || _.isNumber(value))) {
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
                if (key.indexOf("filter_") !== -1) {
                    // Restore selected filter values as objects
                    dashboard.saveObject(key, data);
                } else {
                    dashboard.setCookieObject(key, data);
                }
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
         * Returns the search-tabs parameters for the specified dashboardId
         * @param dashboardId
         * @returns {*}
         */
        dashboard.getSearchParams = function (dashboardId) {
            return searchParams[dashboardId];
        };

        /**
         * Get the parameter names -> country view types mapping object for a Dashboard
         * @param dashboardId
         * @returns {*}
         */
        dashboard.getCountryMapping = function (dashboardId) {
            if (_.has(countryListMapping, dashboardId)) {
                return countryListMapping[dashboardId];
            } else {
                return null;
            }
        };

        /**
         * Get the extra parameters that should be sent to the API with each (dynamic) Dashboard component request,
         * using the filters that are enabled in that Dashboard.
         * @param dashboardId       Dashboard ID to get filters for
         * @returns {{}}
         */
        dashboard.getApiOptionsDynamic = function (dashboardId) {
            var apiOptions = {};

            // Get the required data
            var enabledFilters = getEnabledFilters(dashboardId);
            var apiOptionsMap = countryListMapping[dashboardId];

            // Gather data for any map filters
            var filters = _.where(enabledFilters, {type: "heatmap"});

            if (!_.isEmpty(filters)) {
                // Keep only the filter view types
                filters = _.pluck(_.pluck(filters, "params"), "viewType");

                _.each(apiOptionsMap, function (viewType, key) {
                    if (_.contains(filters, viewType)) {
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
                var yearRange = "[" + minYear + " TO " + maxYear + "]";

                // Only add the year range parameter if it doesn't contain null values
                if (yearRange.indexOf("null") === -1) {
                    apiOptions[dashboard.getYearParamName(dashboardId)] = yearRange;
                }
            }

            // Gather data for any grid & grid-grouped filters
            filters = _.union(
                _.where(enabledFilters, {type: "grid"}),
                _.where(enabledFilters, {type: "grid-grouped"})
            );

            _.each(filters, function (gridFilter) {
                var selectionId = gridFilter.params.selectionId;
                var selection = dashboard.getGridSelection(selectionId);

                // Check that the selection is not undefined, and at least the 1st item has an "id" property
                if (!_.isUndefined(selection) && !_.isEmpty(selection)) {
                    apiOptions[selectionId] = selection.join(",");
                }
            });

            // Gather data for amount filters
            filters = _.where(enabledFilters, {type: "amount"});

            _.each(filters, function (filter) {
                var selectionId = filter.params.selectionId;
                var apiParam = filter.params.apiParam;
                var selection = dashboard.getObject(selectionId);

                if (!_.isUndefined(selection) && selection.trim().length > 0) {
                    apiOptions[apiParam] = selection;
                }
            });

            // Gather data for number range filters
            filters = _.where(enabledFilters, {type: "number-range"});

            _.each(filters, function (filter) {
                var selectionType = filter.params.selectionType;
                var selection = dashboard.getObject(selectionType);

                if (!_.isUndefined(selection)) {
                    apiOptions[selectionType] = "[" + selection.minValue + " TO " + selection.maxValue + "]";
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
            var apiOptionsMap = countryListMapping[dashboardId];

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

                    if (!_.isEmpty(dashboard.getObject("comparison_amount")))
                        apiOptions.amount = dashboard.getObject("comparison_amount");

                    break;
                case "comparison1":
                    // Add year from "comparison" dashboardId
                    apiOptions.year = "[" + dashboard.getMinYear("comparison") + " TO " + dashboard.getMaxYear("comparison") + "]";

                    if (!_.isEmpty(dashboard.getObject("comparison_amount")))
                        apiOptions.amount = dashboard.getObject("comparison_amount");

                    break;
                case "comparison2":
                    // Add year from "comparison" dashboardId
                    apiOptions.year = "[" + dashboard.getMinYear("comparison") + " TO " + dashboard.getMaxYear("comparison") + "]";

                    if (!_.isEmpty(dashboard.getObject("comparison_amount")))
                        apiOptions.amount = dashboard.getObject("comparison_amount");

                    break;
                case "comparison_details_1":
                    // Add CPV 1
                    if (!_.isEmpty(dashboard.getGridSelection("cpv1")))
                        apiOptions.cpv1 = dashboard.getGridSelection("cpv1").join(",");

                    // Add year from "comparison" dashboardId
                    apiOptions.year = "[" + dashboard.getMinYear("comparison") + " TO " + dashboard.getMaxYear("comparison") + "]";

                    if (!_.isEmpty(dashboard.getObject("comparison_amount")))
                        apiOptions.amount = dashboard.getObject("comparison_amount");

                    break;
                case "comparison_details_2":
                    // Add CPV 2
                    if (!_.isEmpty(dashboard.getGridSelection("cpv2")))
                        apiOptions.cpv2 = dashboard.getGridSelection("cpv2").join(",");

                    // Add year from "comparison" dashboardId
                    apiOptions.year = "[" + dashboard.getMinYear("comparison") + " TO " + dashboard.getMaxYear("comparison") + "]";

                    if (!_.isEmpty(dashboard.getObject("comparison_amount")))
                        apiOptions.amount = dashboard.getObject("comparison_amount");

                    break;
                case "traffic_observation_line1":
                    addTrafficObservationParams(apiOptions);

                    // Add parameter for direction combobox #1
                    var directions1 = dashboard.getObject("trafficobservation.direction1");
                    if (!_.isUndefined(directions1)) {
                        apiOptions["trafficobservation.directions_aggregate"] = directions1;
                    }

                    break;
                case "traffic_observation_line2":
                    addTrafficObservationParams(apiOptions);

                    // Add parameter for direction combobox #2
                    var directions2 = dashboard.getObject("trafficobservation.direction2");
                    if (!_.isUndefined(directions2)) {
                        apiOptions["trafficobservation.directions_aggregate"] = directions2;
                    }

                    break;
                case "traffic_observation":
                case "traffic_observation_contracts":
                    addTrafficObservationParams(apiOptions);

                    break;
                case "country_page":
                    var indicators = dashboard.getGridSelection("country_indicators");
                    if (!_.isEmpty(indicators)) {
                        apiOptions["indicators"] = indicators.join(",");
                    }

                    break;
                case "country_producing_heatmap":
                    apiOptions["agricultural.products"] = dashboard.getObject("country_agricultural_products");
                    apiOptions["industries"] = dashboard.getObject("country_industries");
                    apiOptions["natural.resources"] = dashboard.getObject("country_natural_resources");

                    break;
                case "dianeosis_students":
                    apiOptions["lessons"] = dashboard.getObject("student_lessons");
                    apiOptions["not.lessons"] = dashboard.getObject("student_not_lessons");
                    apiOptions["school.type"] = dashboard.getObject("school_type");
                    apiOptions["school.shift"] = dashboard.getObject("school_shift");

                    break;
            }

            // Remove string values that contain "null" from the parameters
            apiOptions = _.omit(apiOptions, function (param) {
                return _.isString(param) && param.indexOf("null") !== -1;
            });

            return apiOptions;
        };

        /**
         * Add traffic observation parameters to an apiOptions object.
         * @param apiOptions    Object to add parameters to
         */
        var addTrafficObservationParams = function (apiOptions) {
            var vehicleTypes = dashboard.getObject("trafficobservation.vehicle_type");
            var directions = dashboard.getObject("trafficobservation.direction");

            if (!_.isUndefined(vehicleTypes) && !_.isNull(vehicleTypes)) {
                vehicleTypes = vehicleTypes.split(",");
            }
            if (!_.isUndefined(directions) && !_.isNull(directions)) {
                directions = directions.split(",");
            }

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
                "trafficobservation.gap": dashboard.getObject("trafficobservation.gap"),

                // Comboboxes
                "trafficobservation.vehicle_type": vehicleTypes,
                "trafficobservation.direction": directions
            };

            // Remove undefined and null values from the above object, and add the remaining ones to the apiOptions
            _.extend(apiOptions, _.omit(extraValues, function (item) {
                return _.isUndefined(item) || _.isNull(item);
            }));

            // Check that start year/day/time is smaller than end year/day/time, otherwise swap them
            ensureValueIntegrity(apiOptions, "trafficobservation.start_year", "trafficobservation.end_year");
            ensureValueIntegrity(apiOptions, "trafficobservation.start_time", "trafficobservation.end_time", dashboard.timeToNum);
            ensureValueIntegrity(apiOptions, "trafficobservation.start_day", "trafficobservation.end_day", dashboard.weekDayToNum);
        };

        /**
         * Given an object and two attributes, ensure that the minAttr has the smaller value between the two attributes,
         * and the maxAttr has the largest one, by swapping them if needed.
         * @param obj       Object with values
         * @param minAttr   Attribute which should have the minimum value
         * @param maxAttr   Attribute which should have the maximum value
         * @param mapper    (optional) Function that will translate the attribute's values to numbers, so the min/max
         *                  can be found
         */
        var ensureValueIntegrity = function (obj, minAttr, maxAttr, mapper) {
            if (_.has(obj, minAttr) && _.has(obj, maxAttr)) {
                var vals = [obj[minAttr], obj[maxAttr]];

                obj[minAttr] = _.min(vals, mapper);
                obj[maxAttr] = _.max(vals, mapper);
            }
        };

        /**
         * Get a name of a day of the week (in English) and get its number, starting from Monday as 0
         * @param weekday
         * @returns {number}
         */
        dashboard.weekDayToNum = function (weekday) {
            return ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].indexOf(weekday);
        };

        /**
         * Get a time string of the form HH:MM and transform it into the number of minutes that passed since 00:00
         * @param timeStr
         */
        dashboard.timeToNum = function (timeStr) {
            var timePiecies = timeStr.split(":");
            return (parseInt(timePiecies[0]) * 60) + parseInt(timePiecies[1]);
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
            gridSelection[type] = newSelection;

            notifyGridSelectionChange();
        };

        /**
         * Get grid selection for a given type
         * @param type
         * @returns {*}
         */
        dashboard.getGridSelection = function (type) {
            return gridSelection[type];
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
         * Get enabled filter objects for a Dashboard ID
         * @param dashboardId
         */
        var getEnabledFilters = function (dashboardId) {
            // Get set of enabled filter names
            var filterNames = dashboard.getObject("filter_" + dashboardId);

            // Get all the filters for this dashboard, and keep only the ones that are enabled
            return _.filter(dashboard.getDashboardFilters(dashboardId), function (filter) {
                return _.contains(filterNames, filter.name);
            });
        };

        /**
         * Subscribe to the appropriate selection changes, based on the filters that are currently enabled
         * @param dashboardId   Dashboard ID
         * @param subscriptions Array with functions to unsubscribe from the subscribed filters
         * @param scope         Scope to use for subscribing to new changes
         * @param changeHandler Function that will be called when the selection of a filter changes
         */
        dashboard.updateFilterSubscriptions = function (dashboardId, subscriptions, scope, changeHandler) {
            // Get set of enabled filter types
            var filterTypes = _.uniq(_.pluck(getEnabledFilters(dashboardId), "type"));

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
                    case "grid-grouped":
                        subscriptions.push(
                            dashboard.subscribeGridSelectionChanges(scope, changeHandler));
                        break;
                    case "year":
                        subscriptions.push(
                            dashboard.subscribeYearChanges(scope, changeHandler));
                        break;
                    case "amount":
                    case "number-range":
                        subscriptions.push(
                            dashboard.subscribeObjectChanges(scope, changeHandler));
                        break;
                    default:
                        console.warn("Unknown filter type in Dashboard Updater: " + type);
                }
            });
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
