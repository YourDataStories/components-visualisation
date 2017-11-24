angular.module("yds").directive("ydsHeatmap", ["$window", "$ocLazyLoad", "$timeout", "Data", "DashboardService",
    function ($window, $ocLazyLoad, $timeout, Data, DashboardService) {
        return {
            restrict: "E",
            scope: {
                projectId: "@",         // ID of the project
                viewType: "@",          // View type of heatmap
                lang: "@",			    // Language of the data
                extraParams: "=",       // Extra parameters for the API

                colorAxis: "@",         // Enable or disable colored axis of chart
                colorType: "@",			// Axis color type (linear or logarithmic)

                legend: "@",            // Enable or disable chart legend
                legendVAlign: "@",      // Vertical alignment of the chart legend (top, middle, bottom)
                legendHAlign: "@",      // Horizontal alignment of the chart legend (left, center, right)
                legendLayout: "@",      // Layout of the chart legend (vertical, horizontal)

                useDashboardParams: "@",// If true, the heatmap will watch for DashboardService parameter changes
                dashboardId: "@",		// Optional, used for getting parameters from DashboardService
                dynamicDashboard: "@",  // Set to true if you are using this in a Dashboard with dynamic filters
                countrySelection: "@",  // Allow selecting countries on the map
                europeOnly: "@",		// If true, the heatmap will show a map of Europe instead of the entire world
                zoomToCountry: "@",     // If true, zoom to the first point (works only with selection off)
                baseUrl: "@",           // (Optional) Base URL to send to API

                exporting: "@",         // Enable or disable the export of the chart
                noBorder: "@",			// If true, the component will have no border
                elementH: "@"		    // Set the height of the component
            },
            templateUrl: Data.templatePath + "templates/visualisation/heatmap.html",
            link: function (scope, elem) {
                var projectId = scope.projectId;
                var viewType = scope.viewType;
                var lang = scope.lang;
                var colorAxis = scope.colorAxis;
                var colorType = scope.colorType;
                var legend = scope.legend;
                var legendVAlign = scope.legendVAlign;
                var legendHAlign = scope.legendHAlign;
                var legendLayout = scope.legendLayout;
                var useDashboardParams = scope.useDashboardParams;
                var dashboardId = scope.dashboardId;
                var countrySelection = scope.countrySelection;
                var noBorder = scope.noBorder;
                var exporting = scope.exporting;
                var elementH = scope.elementH;
                var europeOnly = scope.europeOnly;
                var zoomToCountry = scope.zoomToCountry;
                var baseUrl = scope.baseUrl;

                var heatmapContainer = _.first(angular.element(elem[0].querySelector(".heatmap-container")));

                // Create a random id for the element that will render the chart
                var elementId = "heatmap" + Data.createRandomId();
                heatmapContainer.id = elementId;

                // Any extra parameters will be saved to check if something changed before refreshing the heatmap
                var originalParams = scope.extraParams;
                var extraParams = {};

                // Selectivity instance & last colorAxis parameters used
                var selectivity = null;
                var colorAxisParams = null;

                // Check if the project id is defined
                if (angular.isUndefined(projectId) || projectId.trim() === "") {
                    scope.ydsAlert = "The YDS component is not properly initialized " +
                        "because the projectId attribute isn't configured properly. " +
                        "Please check the corresponding documentation section";
                    return false;
                }

                // Check if view-type attribute is defined, else assign default value
                if (_.isUndefined(viewType) || viewType.trim() === "")
                    viewType = "default";

                // Check if the language attribute is defined, else assign default value
                if (_.isUndefined(lang) || lang.trim() === "")
                    lang = "en";

                // Check if colorAxis attribute is defined, else assign default value
                if (_.isUndefined(colorAxis) || colorAxis.trim() === "")
                    colorAxis = "false";

                // Check if colorType attribute is defined, else assign default value
                if (_.isUndefined(colorType) || colorType.trim() === "")
                    colorType = "linear";

                // Check if legend attribute is defined, else assign default value
                if (_.isUndefined(legend) || legend.trim() === "")
                    legend = "false";

                // Check if legendVAlign attribute is defined, else assign default value
                if (_.isUndefined(legendVAlign) || legendVAlign.trim() === "")
                    legendVAlign = "top";

                // Check if legendVAlign attribute is defined, else assign default value
                if (_.isUndefined(legendHAlign) || legendHAlign.trim() === "")
                    legendHAlign = "left";

                // Check if legendLayout attribute is defined, else assign default value
                if (_.isUndefined(legendLayout) || legendLayout.trim() === "")
                    legendLayout = "horizontal";

                // Check if useDashboardParams attribute is defined, else assign default value
                if (_.isUndefined(useDashboardParams) || useDashboardParams.trim() === "")
                    useDashboardParams = "false";

                // Check if dashboardId attribute is defined, else assign default value
                if (_.isUndefined(dashboardId) || dashboardId.trim() === "")
                    dashboardId = "default";

                // Check if countrySelection attribute is defined, else assign default value
                if (_.isUndefined(countrySelection) || countrySelection.trim() === "")
                    countrySelection = "false";

                // Check if the noBorder attribute is defined, else assign default value
                if (_.isUndefined(noBorder) || (noBorder !== "true" && noBorder !== "false"))
                    noBorder = "false";

                // Check if the exporting attribute is defined, else assign default value
                if (_.isUndefined(exporting) || (exporting !== "true" && exporting !== "false"))
                    exporting = "true";

                // Check if the europeOnly attribute is defined, else assign default value
                if (_.isUndefined(europeOnly) || (europeOnly !== "true" && europeOnly !== "false"))
                    europeOnly = "false";

                // Check if the zoomToCountry attribute is defined, else assign default value
                if (_.isUndefined(zoomToCountry) || (zoomToCountry !== "true" && zoomToCountry !== "false"))
                    zoomToCountry = "false";

                // Check if the dynamicDashboard attribute is defined, else assign default value
                if (_.isUndefined(scope.dynamicDashboard) || (scope.dynamicDashboard !== "true" && scope.dynamicDashboard !== "false"))
                    scope.dynamicDashboard = "false";

                // Check if the component's height attribute is defined, else assign default value
                if (_.isUndefined(elementH) || _.isNaN(elementH))
                    elementH = 300;

                // Set cookie related variables
                var cookieKey = viewType;   // Key of cookie for this heatmap
                var firstLoad = true;       // Remember if it is the first load or not, to load countries from cookie

                // Setup base heatmap options
                var heatmapOptions = {
                    initialized: false,
                    chart: {
                        renderTo: elementId,
                        borderWidth: (noBorder === "true") ? 0 : 1
                    },
                    title: {text: ""},
                    mapNavigation: {
                        enabled: true,
                        buttonOptions: {
                            style: {display: "none"}
                        }
                    },
                    exporting: {
                        buttons: {
                            contextButton: {
                                symbol: "url(" + Data.templatePath + "img/fa-download-small.png)",
                                symbolX: 19,
                                symbolY: 19
                            }
                        },
                        enabled: (exporting === "true")
                    },
                    legend: {
                        enabled: false
                    },
                    series: []
                };

                // Add default color axis to heatmap options
                if (colorAxis === "true") {
                    heatmapOptions.colorAxis = {
                        min: 1,
                        type: colorType,
                        minColor: "#EEEEFF",
                        maxColor: "#000022",
                        stops: [
                            [0, "#EFEFFF"],
                            [0.67, "#4444FF"],
                            [1, "#000022"]
                        ]
                    };
                }

                // Add chart legend to heatmap options
                if (legend === "true") {
                    heatmapOptions.legend = {
                        layout: legendLayout,
                        backgroundColor: "rgba(255,255,255,0.85)",
                        floating: true,
                        verticalAlign: legendVAlign,
                        align: legendHAlign
                    };
                }

                // Set the height of the chart
                heatmapContainer.style.height = elementH + "px";

                // Load map data from highcharts and create the heatmap
                $ocLazyLoad.load({
                    files: [Data.templatePath + "lib/highcharts-maps/world.js",
                        Data.templatePath + "lib/highcharts-maps/europe.js"],
                    cache: true
                }).then(function () {
                    // Check if we should subscribe to parameter changes (used in Dashboards)
                    if (useDashboardParams === "true" && scope.dynamicDashboard !== "true") {
                        // For non-dynamic dashboards, subscribe only to year & selection changes
                        DashboardService.subscribeYearChanges(scope, createHeatmap);
                        DashboardService.subscribeSelectionChanges(scope, createHeatmap);
                    } else if (useDashboardParams === "true") {
                        // For dynamic dashboards, we should subscribe to the selected filters in the Dashboard
                        var filterSubscriptions = [];
                        DashboardService.subscribeObjectChanges(scope, function () {
                            DashboardService.updateFilterSubscriptions(filterSubscriptions, scope, createHeatmap);

                            // Check if the Heatmap should be updated (in case a filter type was completely removed)
                            var newParams = DashboardService.getApiOptionsDynamic(dashboardId, "filter");

                            if (!_.isEqual(newParams, extraParams)) {
                                createHeatmap();
                            }
                        });

                        DashboardService.updateFilterSubscriptions(filterSubscriptions, scope, createHeatmap);
                    }

                    createHeatmap();
                });

                // When the heatmap is destroyed, clear the selected countries of it
                if (countrySelection === "true") {
                    scope.$on("$destroy", function () {
                        DashboardService.clearCountries(scope.viewType);
                    });
                }

                /**
                 * Take Highmaps points array and keep only the country names, codes and values
                 * @param points
                 * @returns {*}
                 */
                var formatPoints = function (points) {
                    return points.map(function (p) {
                        return {
                            name: p.name,
                            code: p.code,
                            value: p.value
                        };
                    });
                };

                /**
                 * Get points from the heatmap's series, and turn it into options for Selectivity
                 * @returns {*}
                 */
                var getSelectivityItemsFromPoints = function () {
                    // Keep only countries that have a value, which means they are available for selection
                    var selectivityData = _.filter(scope.heatmap.series[0].data, function (item) {
                        return !_.isNull(item.value) && !_.isUndefined(item["iso-a2"]);
                    });

                    // Keep only code and name for each country
                    selectivityData = selectivityData.map(function (point) {
                        return {
                            id: point["iso-a2"],
                            text: point.name
                        }
                    });

                    // Sort countries by their names
                    selectivityData = _.sortBy(selectivityData, "text");

                    return selectivityData;
                };

                /**
                 * Initialize Selectivity dropdown for country selection
                 */
                var initializeSelectivity = function () {
                    // Use jQuery to initialize Selectivity
                    var dropdownContainer = _.first(angular.element(elem[0].querySelector(".country-selection-container")));

                    selectivity = $(dropdownContainer).selectivity({
                        items: getSelectivityItemsFromPoints(),
                        multiple: true,
                        placeholder: "Type to search a country"
                    });

                    // Add listener for when something in Selectivity is added or removed
                    $(selectivity).on("change", function (e) {
                        var points = scope.heatmap.series[0].data;

                        if (_.has(e, "added") && !_.isUndefined(e.added)) {
                            var countryToSelect = e.added.id;

                            var pointToSelect = _.findWhere(points, {
                                "iso-a2": countryToSelect
                            });

                            pointToSelect.select(true, true);
                        }

                        if (_.has(e, "removed") && !_.isUndefined(e.removed)) {
                            var countryToDeselect = e.removed.id;

                            var pointToDeselect = _.findWhere(points, {
                                "iso-a2": countryToDeselect
                            });

                            pointToDeselect.select(false, true);
                        }
                    });
                };

                /**
                 * Create the heatmap on the page if it doesn't exist, or update it
                 * with the new data if it is initialized already
                 * @param response    Server response from heatmap API
                 */
                var visualizeHeatmap = function (response) {
                    // Initialize heatmap if it's not initialized
                    if (!heatmapOptions.initialized) {
                        // Create empty heatmap
                        scope.heatmap = new Highcharts.Map(heatmapOptions);

                        heatmapOptions.initialized = true;
                    }

                    // If view has color axis use that instead of default one
                    if (colorAxis === "true") {
                        var view = _.first(response.view);

                        if (_.has(view, "colorAxis")) {
                            colorAxisParams = view.colorAxis;
                            if (!_.has(colorAxisParams, "stops")) {
                                // Make the stops explicitly null, because we have stops in the default colorAxis, so by
                                // just "updating" it, it does not remove them if they are not null in the new params.
                                colorAxisParams.stops = null;
                            }
                        }
                    }

                    if (_.isEmpty(scope.heatmap.series)) {
                        var mapData = Highcharts.maps["custom/world"];
                        if (europeOnly === "true") {
                            mapData = Highcharts.maps["custom/europe"];
                        }

                        // Create new series object
                        var newSeries = {
                            name: "Country",
                            mapData: mapData,
                            data: response.data,
                            mapZoom: 2,
                            joinBy: ["iso-a2", "code"],
                            dataLabels: {
                                enabled: true,
                                color: "#FFFFFF",
                                formatter: function () {
                                    if (this.point.value) {
                                        return this.point.name;
                                    }
                                }
                            },
                            tooltip: {
                                headerFormat: "",
                                pointFormat: "{point.name}"
                            }
                        };

                        if (countrySelection === "true") {
                            // Country selection enabled, set more properties to the series before adding it to heatmap
                            newSeries.allowPointSelect = true;
                            newSeries.cursor = "pointer";

                            newSeries.states = {
                                select: {
                                    color: "#a4edba",
                                    borderColor: "black",
                                    dashStyle: "shortdot"
                                }
                            };

                            newSeries.point = {
                                events: {
                                    select: function () {
                                        // Get selected points
                                        var points = scope.heatmap.getSelectedPoints();
                                        points.push(this);

                                        points = formatPoints(points);

                                        // Give new selected countries to the service (sets the cookie too)
                                        DashboardService.setCountries(viewType, points);

                                        // Set new selected points in Selectivity
                                        setSelectivityData(selectivity, points);
                                    },
                                    unselect: function () {
                                        // Get selected points
                                        var points = scope.heatmap.getSelectedPoints();

                                        // Remove unselected points from points
                                        var pIndex = points.indexOf(this);
                                        if (pIndex > -1) {
                                            points.splice(pIndex, 1);
                                        }

                                        points = formatPoints(points);

                                        // Give new selected countries to the service (sets the cookie too)
                                        DashboardService.setCountries(viewType, points);

                                        // Set new selected points in Selectivity
                                        setSelectivityData(selectivity, points);
                                    }
                                }
                            };

                            // Add new series to the heatmap
                            scope.heatmap.addSeries(newSeries);

                            // Highcharts chart is initialized, create data for Selectivity dropdown
                            initializeSelectivity();
                        } else {
                            // If base URL is defined and since selection is disabled, add click event
                            // for the points, to go to their URL (if they have any)
                            if (!_.isUndefined(baseUrl)) {
                                newSeries.point = {
                                    events: {
                                        click: function () {
                                            if (_.has(this.options, "url")) {
                                                // Open the URL in a new tab
                                                $window.open(this.options.url, "_blank");
                                            }
                                        }
                                    }
                                };
                            }

                            // Add new series to the heatmap
                            scope.heatmap.addSeries(newSeries);

                            // Check if we should zoom in to a country
                            if (zoomToCountry === "true") {
                                var countryCode = _.first(response.data).code;

                                // Find the point by its code and zoom to it
                                var pointToZoom = _.findWhere(scope.heatmap.series[0].points, {
                                    code: countryCode
                                });

                                pointToZoom.zoomTo();
                                $timeout(function () {
                                    // With many points we need timeout here...
                                    scope.heatmap.mapZoom(3);
                                });
                            }
                        }
                    } else {
                        // Heatmap already has a series, update it with new data
                        scope.heatmap.series[0].setData(response.data);

                        // In the new data, select the points that were selected before, if they exist
                        var prevSelectedCountries = $(selectivity).selectivity("value");
                        var heatmapCountries = scope.heatmap.series[0].data;

                        _.each(prevSelectedCountries, function (country) {
                            // Get the Highcharts point for this country
                            var countryPoint = _.findWhere(heatmapCountries, {"iso-a2": country});

                            // If the point value is not null, select it, otherwise deselect it
                            countryPoint.select(!_.isNull(countryPoint.value), true);
                        });

                        // Update the available options in Selectivity
                        $(selectivity).selectivity("setOptions", {
                            items: getSelectivityItemsFromPoints()
                        });
                    }

                    if (firstLoad) {
                        // On first load, restore selected countries from cookie
                        var cookieCountries = DashboardService.getCookieObject(cookieKey);

                        if (!_.isEmpty(cookieCountries)) {
                            // Get points of heatmap
                            var points = scope.heatmap.series[0].points;

                            // For each cookie country, try to find it in the heatmap series and select it
                            _.each(cookieCountries, function (point) {
                                var pointToSelect = _.findWhere(points, {
                                    "iso-a2": point.code
                                });

                                // Select the point if found (selected check not needed with firstLoad variable)
                                if (!_.isUndefined(pointToSelect) && !pointToSelect.selected) {
                                    pointToSelect.select(true, true);
                                }
                            });
                        }

                        // Force an update of the legend and the colorAxis to make the legend show correctly
                        scope.heatmap.legend.update();
                        if (!_.isNull(colorAxisParams)) {
                            _.first(scope.heatmap.colorAxis).update(colorAxisParams);
                        }

                        firstLoad = false;
                    }
                };

                /**
                 * Get formatted points from the heatmap and add them as the selection in Selectivity
                 * @param selectivity    Selectivity instance
                 * @param points        Points to select
                 */
                var setSelectivityData = function (selectivity, points) {
                    $(selectivity).selectivity("data", points.map(function (country) {
                        return {
                            id: country.code,
                            text: country.name
                        }
                    }), {
                        triggerChange: false
                    });

                    $(selectivity).selectivity("rerenderSelection");
                };

                /**
                 * Show an error to the user (for when heatmap API returns error)
                 * @param error
                 */
                var createHeatmapError = function (error) {
                    if (_.isNull(error) || _.isUndefined(error) || _.isUndefined(error.message))
                        scope.ydsAlert = "An error has occurred, please check the configuration of the component";
                    else
                        scope.ydsAlert = error.message;
                };

                /**
                 * Get extra parameters if needed, fetch data and call the function to render the heatmap component
                 */
                var createHeatmap = function () {
                    // If the map should use variables from DashboardService, add them to extra params
                    if (useDashboardParams === "true") {
                        var newExtraParams;
                        if (scope.dynamicDashboard === "true") {
                            newExtraParams = DashboardService.getApiOptionsDynamic(dashboardId, "filter");
                        } else {
                            newExtraParams = DashboardService.getApiOptions(dashboardId);
                        }

                        // Check if any parameters changed before continuing
                        if (_.isEqual(extraParams, newExtraParams)) {
                            // Nothing changed, do not refresh heatmap
                            return;
                        } else {
                            extraParams = newExtraParams;
                        }
                    }

                    // Add base URL to parameters, if it exists
                    if (!_.isUndefined(baseUrl)) {
                        extraParams.baseurl = baseUrl;
                    }

                    // If there are original parameters, use those
                    if (!_.isUndefined(originalParams)) {
                        extraParams = _.extend(extraParams, originalParams);
                    }

                    // Get heatmap data
                    Data.getProjectVis("heatmap", projectId, viewType, lang, extraParams)
                        .then(visualizeHeatmap, createHeatmapError);
                };
            }
        }
    }
]);
