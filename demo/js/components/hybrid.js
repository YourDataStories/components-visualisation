angular.module('yds').directive('ydsHybrid', ['Data', 'DashboardService', '$http', '$stateParams', '$location',
    function (Data, DashboardService, $http, $stateParams, $location) {
        return {
            restrict: 'E',
            scope: {},
            templateUrl: ((typeof Drupal != 'undefined') ? Drupal.settings.basePath + Drupal.settings.yds_project.modulePath + '/' : '') + 'templates/hybrid.html',
            compile: function (tElem, tAttrs) {
                return {
                    pre: function (scope, element, iAttrs) {
                        scope.ydsAlert = "";
                        var embedCode = $stateParams.embedCode;

                        var hybridContainer = angular.element(element[0].querySelector('.hybrid-container'));

                        //create a random id for the element that will render the chart
                        var elementId = "hybrid" + Data.createRandomId();
                        hybridContainer[0].id = elementId;

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
                                if (_.has(filters, "pagingGrid") && _.has(filters, "numberOfItems")
                                    && filters.pagingGrid == true && !_.isNaN(filters.numberOfItems)) {
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
                            if (_.isUndefined(scope.viewType) || scope.viewType == "undefined") {
                                scope.viewType = "default";
                            }

                            // Get title size from URL params and add it to scope
                            var urlParams = $location.search();
                            if (_.has(urlParams, "titlesize")) {
                                scope.titleSize = urlParams.titlesize;
                            }

                            // Set visualization type so the ng-switch shows the component
                            scope.vizType = vizType.toLowerCase();

                            // If there is a q parameter and the visualisation type is grid, the use grid-results
                            if (_.has(scope.extraParams, "q") && scope.vizType == "grid") {
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
                    }
                }
            }
        }
    }]);
