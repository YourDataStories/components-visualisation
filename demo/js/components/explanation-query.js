angular.module("yds").directive("ydsExplanationQuery", ["$location", "Search", "Data",
    function ($location, Search, Data) {
        return {
            restrict: "E",
            scope: {},
            templateUrl: ((typeof Drupal != "undefined") ? Drupal.settings.basePath + Drupal.settings.yds_project.modulePath + "/" : "") + "templates/explanation-query.html",
            link: function (scope) {
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
                        .then(function (response) {
                            scope.queries = response.data;
                        }, function (error) {
                            console.error("Error while getting explanation for component!", error);
                        });
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
                            .then(function (response) {
                                scope.queries = response.data;
                            }, function (error) {
                                console.error("Error while getting explanation for component!", error);
                            });
                    } else {
                        //todo: search API should be used
                    }
                }
            }
        };
    }
]);
