angular.module("yds").directive("ydsExplanation", ["$templateRequest", "$compile", "$window", "$location", "YDS_CONSTANTS", "Filters", "Data",
    function ($templateRequest, $compile, $window, $location, YDS_CONSTANTS, Filters, Data) {
        return {
            restrict: "A",
            link: function (scope, element, attrs) {
                var elementClass = attrs.class;
                var disableExplanation = scope.disableExplanation;
                var visualisationType = "";
                var defaultVisTypes = ["pie", "line", "scatter", "bubble", "bar", "tree", "map", "grid", "chord", "box"];

                // If the disableExplanation scope variable is set to true, stop here
                if (!_.isUndefined(disableExplanation) && disableExplanation === "true") {
                    return false;
                }

                // Find the visualisation type from its class
                if (!_.isUndefined(elementClass) && elementClass.trim().length > 0) {
                    var visTypeFound = false;

                    var visTypesLen = defaultVisTypes.length;
                    for (var i = 0; i < visTypesLen; i++) {
                        var index = elementClass.indexOf(defaultVisTypes[i]);

                        if (index !== -1) {
                            visualisationType = defaultVisTypes[i];
                            visTypeFound = true;

                            break;
                        }
                    }

                    if (!visTypeFound) {
                        console.error("The explanation button cannot be applied on this element!");
                        return false;
                    }
                } else {
                    return false;
                }

                // Add rating buttons to the chart
                $templateRequest(Data.templatePath + "templates/chart-buttons/explanation-button.html").then(function (html) {
                    var template = angular.element(html);

                    // Compile the element
                    var compiledTemplate = $compile(template)(scope);

                    // Add element as a child to the parent
                    element.append(compiledTemplate);
                });

                var keyValueToUrlParam = function (key, value) {
                    return "&" + key + "=" + encodeURIComponent(value);
                };

                /**
                 * Go to the Data Analysis page for this chart
                 */
                scope.viewDataAnalysis = function () {
                    // Get the attributes for the chart
                    var attributes = _.extend({
                        id: scope.projectId,
                        viewType: scope.viewType,
                        lang: scope.lang,
                        groupedData: scope.groupedData,     // For grids with grouped data
                        enablePaging: scope.enablePaging,   // For bar component
                        numberOfItems: scope.numberOfItems, // For bar component
                        timeseries: scope.timeseries        // For line and grid components
                    }, scope.extraParams);

                    // Set default language if it's not defined
                    if (_.isUndefined(attributes.lang) || attributes.lang.trim().length === 0) {
                        attributes.lang = "en";
                    }

                    // Generate the URL for the data analysis page
                    var dataAnalysisUrl = YDS_CONSTANTS.DATA_ANALYSIS_URL
                        + "?chart=" + visualisationType;

                    _.each(attributes, function (attrValue, attrKey) {
                        // Add attribute to the URL
                        if (!_.isUndefined(attrValue) && !_.isNull(attrValue)) {
                            dataAnalysisUrl += keyValueToUrlParam(attrKey, attrValue);
                        }
                    });

                    // If the component is a grid, specify which grid it was in the URL
                    if (visualisationType === "grid") {
                        var gridType = attrs.ydsExplanation;

                        // Add grid type to the URL
                        dataAnalysisUrl += keyValueToUrlParam("gridtype", gridType);

                        // For grid-results grid, we also need to specify some extra parameters (and for grid advanced,
                        // get the filters)
                        if (gridType === "grid-results" || gridType === "grid-adv") {
                            var useGridApi = scope.useGridApi;

                            if (_.isUndefined(useGridApi)) {
                                useGridApi = "false";
                            }

                            if (useGridApi === "true" || useGridApi === "false") {
                                dataAnalysisUrl += keyValueToUrlParam("gridapi", useGridApi);
                            }

                            // Add query, rules & facets to the URL
                            var gridId = scope.elementId;
                            var filters = Filters.get(gridId);

                            // Keep only attributes from the filters
                            filters = _.first(filters).attrs;

                            // Map the filter keys to new ones so that they are not removed from the URL parameters
                            var toChange = _.pick(filters, "q", "fq", "rules");
                            filters = _.omit(filters, "q", "fq", "rules");

                            filters.query = toChange.q;
                            filters.facets = toChange.fq;
                            filters.searchRules = toChange.rules;

                            // Add the filters to the URL parameters
                            _.each(filters, function (filterValue, key) {
                                if (!_.isUndefined(filterValue)) {
                                    // Stringify value
                                    if (_.isObject(filterValue)) {
                                        filterValue = JSURL.stringify(filterValue);
                                    }

                                    dataAnalysisUrl += keyValueToUrlParam(key, filterValue);
                                }
                            })
                        }
                    }

                    // Open data analysis page in new tab
                    $window.open(dataAnalysisUrl, "_blank");
                }
            }
        }
    }
]);
