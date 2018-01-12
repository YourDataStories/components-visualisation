angular.module("yds").directive("ydsHybrid", ["Data", "DashboardService", "$http", "$stateParams", "$location",
    function (Data, DashboardService, $http, $stateParams, $location) {
        return {
            restrict: "E",
            scope: {
                maxHeight: "@",     // Set the max height of the component. If undefined, will use all available height.
                useUrlParams: "@"   // Set to true to get chart parameters from the URL instead of embed code.
            },
            templateUrl: Data.templatePath + "templates/hybrid.html",
            compile: function (tElem, tAttrs) {
                return {
                    pre: function (scope, element, iAttrs) {
                        scope.ydsAlert = "";
                        var maxHeight = parseInt(scope.maxHeight);

                        // Create a random ID for the component container
                        var hybridContainer = _.first(angular.element(element[0].querySelector(".hybrid-container")));
                        hybridContainer.id = "hybrid" + Data.createRandomId();

                        if (_.isUndefined(scope.useUrlParams) || (scope.useUrlParams !== "true" && scope.useUrlParams !== "false")) {
                            scope.useUrlParams = "false";
                        }

                        /**
                         * Get visualization parameters and add them to the scope so the correct
                         * visualization is shown
                         * @param projectId Project ID
                         * @param vizType   Type of visualization to show (pie, grid, bar etc.)
                         * @param filters   Any extra parameters for the component (countries, year range etc.)
                         * @param viewType  View type of component
                         * @param lang      Language of component
                         */
                        var visualiseProject = function (projectId, vizType, filters, viewType, lang) {
                            // Set scope variables that will be used by the embedded component
                            scope.projectId = projectId;
                            scope.lang = lang;
                            scope.extraParams = filters;
                            scope.viewType = viewType;
                            if (_.isUndefined(scope.viewType) || scope.viewType === "undefined") {
                                scope.viewType = "default";
                            }

                            // Get title size from URL params and add it to scope
                            var urlParams = $location.search();
                            if (_.has(urlParams, "titlesize")) {
                                scope.titleSize = urlParams.titlesize;
                            }

                            // Get the current height of the container and set the chart to that height
                            var currH = hybridContainer.offsetHeight;

                            // If there is a max height defined, use it
                            if (!_.isNaN(maxHeight)) {
                                currH = Math.min(maxHeight, currH);
                            }

                            // If a height could not be found, use default of 300px
                            if (_.isNaN(currH) || _.isUndefined(currH) || currH < 300) {
                                currH = 300;
                            }
                            scope.elementH = currH;

                            // Set visualization type so the ng-switch shows the component
                            scope.vizType = vizType.toLowerCase();

                            // If there is a q parameter and the visualisation type is grid, then use grid-results.
                            // (when we are using URL parameters, the grid type is set beforehand)
                            if (scope.useUrlParams !== "true" && _.has(scope.extraParams, "q") && scope.vizType === "grid") {
                                scope.vizType = "grid-results";

                                // Find concept type and add it as the project details type for grid-results
                                var type = DashboardService.getProjectConceptForType(viewType);

                                if (!_.isNull(type)) {
                                    scope.projectDetailsType = type;
                                } else {
                                    scope.projectDetailsType = viewType;
                                }
                            }
                        };

                        // Create the chart
                        if (scope.useUrlParams !== "true") {
                            // Get embed code
                            var embedCode = $stateParams.embedCode;

                            // Recover saved object from embed code and visualise it
                            Data.recoverEmbedCode(embedCode)
                                .then(function (response) {
                                    // Get filters for this visualisation if there are any
                                    var filters = [];
                                    var facets = response.embedding.facets;
                                    if (!_.isEmpty(facets)) {
                                        var facetValues = _.first(facets).facet_values;
                                        if (!_.isEmpty(facetValues)) {
                                            var facetValue = _.first(facetValues);
                                            if (_.isString(facetValue)) {
                                                facetValue = JSON.parse(facetValue);
                                            }

                                            filters = facetValue;
                                        }
                                    }

                                    // If the filters contain an "extraParams" object, merge it with the other parameters
                                    if (_.has(filters, "extraParams")) {
                                        filters = _.extend(_.omit(filters, "extraParams"), filters.extraParams);
                                    }

                                    // If there are "pagingGrid" = true, and numberOfItems attributes, we should use grid-results
                                    // in order to take advantage of paging.
                                    if (_.has(filters, "pagingGrid") && filters.pagingGrid === true) {
                                        // Force the grid-paging visualization type
                                        response.embedding.type = "grid-paging";

                                        // Add number of items to scope (needed by grid-results component in this case)
                                        scope.numberOfItems = filters.numberOfItems;
                                    }

                                    // Visualise project with filters
                                    visualiseProject(response.embedding.project_id, response.embedding.type, filters,
                                        response.embedding.view_type, response.embedding.lang);
                                }, function (error) {
                                    scope.ydsAlert = error.message;
                                });
                        } else {
                            // Get chart parameters from URL
                            var params = _.clone($location.search());

                            // If params.lang is an array, keep the 1st one
                            if (_.has(params, "lang") && _.isArray(params.lang)) {
                                //todo: Find when this happens
                                params.lang = _.first(params.lang);
                            }

                            var chart = params.chart;
                            var filters = _.omit(params, Data.omittedChartParams);

                            // For bar charts, add the "numberOfItems" and "enablePaging" parameters to the scope
                            if (chart === "bar" && _.has(params, "numberOfItems") && _.has(params, "enablePaging")) {
                                scope.numberOfItems = params.numberOfItems;
                                scope.enablePaging = params.enablePaging;
                            }

                            if (chart === "grid" && _.has(params, "gridtype") && params.gridtype !== "grid-adv") {
                                if (_.has(params, "groupedData")) { // In the case of "grid" gridtype
                                    scope.groupedData = params.groupedData;
                                }

                                if (_.has(params, "query")) {
                                    filters.q = params.query;
                                }

                                // Make the chart be the grid type
                                params.chart = params.gridtype;

                                // If the grid is grid-results, and we need to use grid API, switch to "paging-grid"
                                if (params.gridtype === "grid-results" && params.gridapi === "true") {
                                    params.chart = "grid-paging";
                                }
                            }

                            visualiseProject(params.id, params.chart, filters, params.viewType, params.lang);
                        }
                    }
                }
            }
        }
    }
]);
