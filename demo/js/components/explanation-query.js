angular.module("yds").directive("ydsExplanationQuery", ["$location", "Search", "Data",
    function ($location, Search, Data) {
        return {
            restrict: "E",
            scope: {},
            templateUrl: Data.templatePath + "templates/explanation-query.html",
            link: function (scope) {
                var responseSuccess = function (response) {
                    // Calculate links for executing query
                    scope.queries = _.map(response.data, function (query) {
                        query.gridBtn = false;

                        if (query.repository === "Virtuoso") {
                            // Create Virtuoso query URL
                            query.executeQueryUrl = query.url + "?query=" + encodeURIComponent(query.data)
                                + "+LIMIT+100&format=text%2Fhtml";
                        } else if (query.repository === "Solr") {
                            if (query.method === "post") {
                                // Solr + POST
                                query.executeQueryUrl = "http://143.233.226.60/solr/#/yds/query?q="
                                    + encodeURIComponent(query.data);
                            } else {
                                // Solr + GET (just show the button that calls scope.showGrid)
                                query.gridBtn = true;
                            }
                        }

                        return query;
                    });
                };

                var responseError = function (error) {
                    console.error("Error while getting explanation for component!", error);
                };

                /**
                 * Set the parameters required to show the grid
                 * @param query
                 */
                scope.showGrid = function (query) {
                    var gridQuery = query.data;

                    // Remove "q=" from start of query
                    if (gridQuery.substring(0, 2) === "q=") {
                        gridQuery = gridQuery.substring(2);
                    }

                    // Add query to the URL parameters
                    $location.search("q", gridQuery);
                    $location.search("tab", "none");

                    // Add grid type to URL parameters if there is any, or remove it
                    var gridType = query.type;
                    $location.search("gridType", gridType.length > 0 ? gridType : null);
                };

                // Get parameters
                var params = $location.search();

                // Gather the required ones
                var chartType = params.chart;
                var projectId = params.id;
                var viewType = params.viewType;
                var lang = params.lang;

                var useGridApi = params.gridapi;
                var gridType = params.gridtype;

                // All other parameters are put in the extra parameters object
                var extraParams = _.omit(params, "chart", "id", "viewType", "lang", "gridapi", "gridtype");

                // Add explain_calls parameter so the server will explain the query
                extraParams.explain_calls = 1;

                // Simulate the component's original request
                if (chartType !== "grid" || gridType === "grid") {
                    // Use regular project visualization function
                    Data.getProjectVis(chartType, projectId, viewType, lang, extraParams)
                        .then(responseSuccess, responseError);
                } else if (gridType === "grid-results") {
                    // Remove regular parameters from extraParams
                    extraParams = _.omit(extraParams, "projectId", "pagingGrid");

                    // Only send language once if it was added twice
                    if (_.isArray(lang)) {
                        lang = _.first(lang);
                    }

                    // For grid-results we need to check which API to call
                    if (useGridApi === "true") {
                        Data.getProjectVis("grid", projectId, viewType, lang, extraParams)
                            .then(responseSuccess, responseError);
                    } else {
                        // Search API should be used
                        var query = extraParams.query;
                        var facets = JSURL.parse(extraParams.facets);

                        if (!_.has(extraParams, "searchRules")) {
                            // Use GET request
                            Data.getGridResultData(query, facets, viewType, 0, 1, lang, undefined, _.pick(extraParams, "explain_calls"))
                                .then(responseSuccess, responseError)
                        } else {
                            // Use POST request
                            var rules = JSURL.parse(extraParams.searchRules);

                            Data.getGridResultDataAdvanced(query, facets, rules, viewType, 0, 1, lang, undefined, _.pick(extraParams, "explain_calls"))
                                .then(responseSuccess, responseError);
                        }
                    }
                }
            }
        };
    }
]);
