app.factory("Search", ["$http", "$q", "$location", "YDS_CONSTANTS", "Data",
    function ($http, $q, $location, YDS_CONSTANTS, Data) {
        var i18nLangs = ["en", "el"];
        var keyword = "";
        var facetsCallbacks = [];
        var facetsView = {};
        var fieldFacets = [];
        var rangeFacets = [];

        /**
         * Trigger the callbacks of observers
         */
        var notifyObservers = function (observerStack) {
            _.forEach(observerStack, function (callback) {
                callback();
            });
        };

        /**
         * Save the facets from the response to a local variable
         * @param response
         */
        var saveFacets = function (response) {
            var responseQ = response.data.responseHeader.params.q;

            // Check that the response is for the current keyword, or that the search box is empty (when this happens,
            // the saved keyword is undefined and facets are for "*" search keyword)
            if (responseQ === keyword || (responseQ === "*" && _.isUndefined(keyword))) {
                // Get the facet view from the response of the search API
                facetsView = _.find(response.view, function (view) {
                    return "SearchFacets" in view
                })["SearchFacets"];

                // Format the facets returned from the search API based on the facet view and save them in a local variable
                fieldFacets = saveFieldFacets(response.data.facet_counts.facet_fields, facetsView);
                rangeFacets = saveRangeFacets(response.data.facet_counts.facet_ranges, facetsView);

                notifyObservers(facetsCallbacks);
            }
        };

        /**
         * Format the search results returned from the search API
         */
        var formatResults = function (results, resultsView, resultsViewNames, prefLang) {
            var formattedResults = [];
            //iterate through the results and format its data
            _.each(results, function (result) {
                //iterate through the types of the result
                for (var j = 0; j < result.type.length; j++) {
                    var viewName = result.type[j];

                    //search if the type of the result exists inside the available views
                    if (_.contains(resultsViewNames, viewName)) {
                        //create an object for each result
                        var formattedResult = {
                            _hidden: true,
                            id: result.id,
                            type: result.type,
                            rows: []
                        };

                        //get the contents of the result view
                        var resultView = _.find(resultsView, function (view) {
                            return viewName in view
                        })[viewName];

                        //iterate inside the view of the result in order to acquire the required data for each result
                        _.each(resultView, function (view) {
                            var resultRow = {};
                            resultRow.header = view.header;
                            resultRow.type = view.type;
                            resultRow.value = Data.findValueInResult(result, view.attribute, i18nLangs, prefLang);

                            //if the row should have a url, find it and add it to the row
                            if (!_.isUndefined(view.url)) {
                                resultRow.url = result[view.url];
                            }

                            //if the value is not available assign an empty string,
                            // else check if it is an array and convert it to comma separated string
                            if (_.isUndefined(resultRow.value))
                                resultRow.value = "";
                            else if (_.isArray(resultRow.value))
                                resultRow.value = resultRow.value.join(", ");
                            else if (resultRow.type === "date")
                                resultRow.value = resultRow.value.split("T")[0].replace(/-/g, "/");

                            //push the formatted row of the result in the array of the corresponding result
                            formattedResult.rows.push(resultRow);
                        });

                        //if the view of the result has been found, don't search further for its view
                        break;
                    }
                }

                //push the result in the array containing all the results that will be visible to the user
                formattedResults.push(formattedResult);
            });

            return formattedResults;
        };

        /**
         * Format the field facets returned from the search API.
         * @param {Array} newFacets, the field facets as returned from Solr
         * @param {Array} facetsView, the view of the facets as returned from the search API
         */
        var saveFieldFacets = function (newFacets, facetsView) {
            var formattedFacets = [];

            _.each(_.keys(newFacets), function (facetAttr) {
                //get the facet object based on its key value
                var rawFacetOptions = newFacets[facetAttr];
                var rawFacetView = _.findWhere(facetsView, {type: "field", attribute: facetAttr});

                //create array of selected facets
                var selectedFacets = [];
                _.each(rawFacetView.value, function (facetVal) {
                    // Strip parentheses and split into the strings of selected facets
                    var newSelectedFacets = facetVal.replace(/[()]/g, "").split(" OR ");

                    // Merge new facets with already selected ones
                    selectedFacets = _.union(selectedFacets, newSelectedFacets);
                });

                //initialize a basic object which will hold the required attributes of each field facet
                var newFacet = {
                    facet_name: rawFacetView.header,
                    facet_type: rawFacetView.type,
                    facet_attribute: facetAttr,
                    facet_options: []
                };

                //iterate through the values of the field facet
                for (var i = 0; i < rawFacetOptions.length; i += 2) {
                    //initialize a new object, which will hold the values of the corresponding facet
                    var facetOptions = {
                        name: rawFacetOptions[i],
                        value: rawFacetOptions[i + 1],
                        selected: false
                    };

                    //check if the facet is already selected from the user, if it is selected make it selected
                    // if(!_.isUndefined(rawFacetView.value) && _.contains(rawFacetView.value, facetOptions.name))
                    if (_.contains(selectedFacets, facetOptions.name))
                        facetOptions.selected = true;

                    newFacet.facet_options.push(facetOptions);
                }

                formattedFacets.push(newFacet);
            });

            return formattedFacets;
        };

        /**
         * Format the range facets returned from the search API.
         * @param {Array} newFacets, the field facets as returned from Solr
         * @param {Array} facetsView, the view of the facets as returned from the search API
         **/
        var saveRangeFacets = function (newFacets, facetsView) {
            var formattedFacets = [];

            _.each(_.keys(newFacets), function (facetAttr) {
                // Get the facet object based on its key value
                var rawFacetOptions = newFacets[facetAttr];
                var rawFacetView = _.findWhere(facetsView, {attribute: facetAttr});
                var facetTypeTokens = rawFacetView.type.split("-");

                // Initialize a basic object which will hold the required attributes of each range facet
                var newFacet = {
                    facet_name: rawFacetView.header,
                    facet_type: facetTypeTokens[1],
                    facet_attribute: facetAttr,
                    facet_options: {
                        options: {
                            id: facetAttr,
                            hideLimitLabels: true
                        }
                    }
                };

                // If the facet is of type "date"
                if (facetTypeTokens[1] === "date") {
                    // Make its step to be around a month and set the slider's floor and ceil values
                    newFacet.facet_options.options.step = 2629746;
                    newFacet.facet_options.options.enforceStep = false;
                    newFacet.facet_options.options.floor = Data.getTimestampFromDate(rawFacetOptions.start);
                    newFacet.facet_options.options.ceil = Data.getTimestampFromDate(rawFacetOptions.end);

                    // If the user has selected a specific range, assign the desired values on the slider
                    //else asign the default ceil/floor values defined above
                    if (rawFacetView.value.length === 2) {
                        newFacet.facet_options.model = Data.getTimestampFromDate(rawFacetView.value[0]);
                        newFacet.facet_options.high = Data.getTimestampFromDate(rawFacetView.value[1]);
                    } else {
                        newFacet.facet_options.model = newFacet.facet_options.options.floor;
                        newFacet.facet_options.high = newFacet.facet_options.options.ceil;
                    }

                    // Define the way that the date will be shown to the user
                    newFacet.facet_options.options.translate = function (timestamp) {
                        return Data.getYearMonthFromTimestamp(timestamp, false)
                    };
                } else if (facetTypeTokens[1] === "float") { //if the facet is of type "float"
                    // Set the slider's floor and ceil values
                    newFacet.facet_options.options.floor = parseFloat(rawFacetOptions.start);
                    newFacet.facet_options.options.ceil = parseFloat(rawFacetOptions.end);

                    // If the user has selected a specific range, assign the desired values on the slider
                    // else asign the default ceil/floor values defined above
                    if (rawFacetView.value.length === 2) {
                        newFacet.facet_options.model = parseFloat(rawFacetView.value[0]);
                        newFacet.facet_options.high = parseInt(rawFacetView.value[1]);
                    } else {
                        newFacet.facet_options.model = newFacet.facet_options.options.floor;
                        newFacet.facet_options.high = newFacet.facet_options.options.ceil;
                    }
                }

                formattedFacets.push(newFacet)
            });

            return formattedFacets;
        };

        /**
         * Format the applied facets located inside the search url
         * @param prefLang      Prefered results language
         * @param pageLimit     The max number of results returned from the API
         * @param pageNumber    The page number of the results
         */
        var performSearch = function (prefLang, pageLimit, pageNumber) {
            var deferred = $q.defer();

            // Define an object with the standard params required for the search query
            var searchParameters = {
                lang: prefLang,
                rows: pageLimit,
                start: pageNumber
            };

            // Merge the url params with the aforementioned object
            _.extend(searchParameters, $location.search());

            $http({
                method: "GET",
                url: "http://" + YDS_CONSTANTS.PROXY + YDS_CONSTANTS.API_SEARCH,
                params: searchParameters,
                headers: {"Content-Type": "application/json"}
            }).then(function (response) {
                saveFacets(response.data);

                deferred.resolve(response.data);
            }, function (error) {
                deferred.reject(error);
            });

            return deferred.promise;
        };

        /**
         * Format the suggestions as returned from the suggestion API to be an array for bootstrap typeahead.
         * @param val                The value for which the suggestions are for
         * @param rawSuggestions    Response from the suggestion API
         * @param maxSuggestions    Maximum number of suggestions to return
         */
        var formatSuggestions = function (val, rawSuggestions, maxSuggestions) {
            // Check for success of query
            if (rawSuggestions.success !== true) {
                return [];
            }

            // Initialize suggestions array and get dictionaries from the API's response
            var newSuggestions = [];
            var dictionaries = rawSuggestions.data.suggest;

            // Check all returned dictionaries for suggestions
            _.each(dictionaries, function (dictionary) {
                if (_.has(dictionary, val)) {
                    var numOfSuggestions = dictionary[val]["numFound"];

                    // If there are suggestions in this dictionary and the specified value, add them to the list
                    if (!_.isUndefined(numOfSuggestions) && numOfSuggestions > 0 && newSuggestions.length < maxSuggestions) {
                        var suggestions = dictionary[val]["suggestions"];

                        _.each(suggestions, function (suggestion) {
                            // Only add more suggestions if the maxSuggestions limit has not been reached
                            if (newSuggestions.length < maxSuggestions) {
                                newSuggestions.push(suggestion.term);
                            }
                        });
                    }
                }
            });

            return newSuggestions;
        };

        /**
         * Get search/input suggestions for search, or an Advanced Search filter if filterId is defined
         * @param val                Input from the search bar
         * @param lang                Language of the suggestions
         * @param maxSuggestions    Maximum number of suggestions to return
         * @param filterId            Filter to get suggestions for
         * @returns {a|d|s}
         */
        var getSuggestions = function (val, lang, maxSuggestions, filterId) {
            var deferred = $q.defer();

            // Set required request parameters
            var suggestionParams = {
                q: val,
                filter_id: filterId,
                lang: lang
            };

            // Request suggestions from the API
            $http({
                method: "GET",
                url: "http://" + (_.isUndefined(filterId) ? YDS_CONSTANTS.API_SEARCH_SUGGESTIONS : YDS_CONSTANTS.API_FILTER_SUGGESTIONS),
                params: suggestionParams,
                headers: {"Content-Type": "application/json"}
            }).then(function (response) {
                // Format the returned suggestions and resolve the promise
                var formattedSuggestions = formatSuggestions(val, response.data, maxSuggestions);

                deferred.resolve(formattedSuggestions);
            }, function (error) {
                deferred.reject(error);
            });

            return deferred.promise;
        };

        /**
         * Return the tabs that should be shown in Tabbed Search from the API
         * @param lang        language of tabs
         * @returns {d|s|a}    tabs
         */
        var getSearchTabs = function (lang) {
            var deferred = $q.defer();

            $http({
                method: "GET",
                url: "http://" + YDS_CONSTANTS.API_SEARCH_TABS,
                params: {
                    lang: lang
                },
                headers: {"Content-Type": "application/json"}
            }).then(function (response) {
                deferred.resolve(response.data.data);
            }, function (error) {
                deferred.reject(error);
            });

            return deferred.promise;
        };

        /**
         * Get info from the server's response about how many results are in each tab of tabbed search
         * and adds them into an object that the search tabs component uses
         * @param response            The server's response (from search API)
         * @returns {{}}
         */
        var formatTabs = function (response) {
            // Get tabs from json and create new object to put the result counts in
            var tabResultCounts = {};
            var tabs = response.data.facet_counts.facet_fields.type;

            _.each(tabs, function (tab, index) {
                // If it's a string add the tab's amount to the object
                if (_.isString(tab)) {
                    // The amount of results in this tab is the next array value of the json data
                    tabResultCounts[tab] = tabs[index + 1];
                }
            });

            return tabResultCounts;
        };

        /**
         * Get the available tabs for the current (tabbed) search query and returns
         * their result counts so the number can be shown on the page for each tab
         * @param lastQuery Query of search that will be performed (used for sanity check)
         * @param rules     Rules for the search
         * @param facets    Facets for the search
         * @returns {d|s|a}
         */
        var getTabResultCounts = function (lastQuery, rules, facets) {
            var deferred = $q.defer();

            // Declare functions for query success/fail
            var tabResultCountsSuccess = function (response) {
                // Save facets
                saveFacets(response.data);

                // Return formatted tabs
                deferred.resolve({
                    tabResultCounts: formatTabs(response.data),
                    query: lastQuery,
                    rules: rules
                });
            };

            var tabResultCountsError = function (error) {
                deferred.reject(error);
            };

            // Get the current search keyword (if empty, get total results in each tab)
            var query = keyword;
            if (_.isUndefined(query) || query.trim().length === 0) {
                query = "*";
            }

            var params = {
                q: query,
                fq: facets,
                rows: 0
            };

            // Get tabs from the server, using the appropriate API for normal or advanced search
            if (_.isUndefined(rules)) {
                // Rules do not exist, use normal search API to get tab result counts
                $http({
                    method: "GET",
                    url: "http://" + YDS_CONSTANTS.API_SEARCH,
                    params: params,
                    headers: {"Content-Type": "application/json"}
                }).then(
                    tabResultCountsSuccess,
                    tabResultCountsError
                );
            } else {
                // Rules exist, use advanced search API to get tab result counts
                // The server expects fq to always be an array, so if it's a string we make it an array
                if (_.isString(params.fq)) {
                    params.fq = [params.fq];
                }

                // Add rules to the array
                params.rules = rules;

                $http({
                    method: "POST",
                    url: "http://" + YDS_CONSTANTS.API_ADVANCED_SEARCH,
                    data: params,
                    headers: {"Content-Type": "application/x-www-form-urlencoded"}
                }).then(
                    tabResultCountsSuccess,
                    tabResultCountsError
                );
            }

            return deferred.promise;
        };

        /**
         * Get the filters for the query builder, for a specific concept.
         * @param id        ID of concept
         * @returns {*}
         */
        var getQueryBuilderFilters = function (id) {
            // Get filters from server
            var deferred = $q.defer();

            $http({
                method: "GET",
                url: "http://" + YDS_CONSTANTS.API_ADVANCED_SEARCH_RULES,
                params: {
                    id: id
                },
                headers: {"Content-Type": "application/json"}
            }).then(function (response) {
                deferred.resolve(response.data.data.filters);
            }, function (error) {
                deferred.reject(error);
            });

            return deferred.promise;
        };

        /**
         * Get available values for one or more grid column filters.
         * @param concept       Concept to get values for
         * @param attributes    Attributes list with the attributes to get values for
         */
        var getSearchFieldValues = function (concept, attributes) {
            // Get filters from server
            var deferred = $q.defer();

            $http({
                method: "GET",
                url: "http://" + YDS_CONSTANTS.API_SEARCH_FIELD_VALUES,
                params: {
                    type: concept,
                    field: attributes.join(",")
                },
                headers: {"Content-Type": "application/json"}
            }).then(function (response) {
                deferred.resolve(response.data.data);
            }, function (error) {
                deferred.reject(error);
            });

            return deferred.promise;
        };

        return {
            setKeyword: function (newKeyword) {
                keyword = newKeyword
            },
            getKeyword: function () {
                return keyword;
            },
            clearKeyword: function () {
                keyword = "";
            },

            formatResults: formatResults,
            performSearch: performSearch,
            getTabResultCounts: getTabResultCounts,
            getSearchTabs: getSearchTabs,
            getSuggestions: getSuggestions,
            getQueryBuilderFilters: getQueryBuilderFilters,
            getSearchFieldValues: getSearchFieldValues,

            geti18nLangs: function () {
                return i18nLangs
            },

            registerFacetsCallback: function (callback) {
                facetsCallbacks.push(callback);
            },
            getFieldFacets: function () {
                return fieldFacets;
            },
            getRangeFacets: function () {
                return rangeFacets;
            }
        }
    }
]);
