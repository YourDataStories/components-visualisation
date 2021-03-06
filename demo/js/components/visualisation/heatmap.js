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
                legendTitle: "@",       // Title for the legend
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

                // Highcharts Heatmap instance
                var heatmap = null;

                // Any extra parameters will be saved to check if something changed before refreshing the heatmap
                var originalParams = scope.extraParams;
                var extraParams = {};

                // Selectivity instance & last colorAxis parameters used
                var selectivity = null;
                var colorAxisParams = null;

                // Check if the project id is defined
                if (_.isUndefined(projectId) || projectId.trim() === "") {
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
                        enabled: true
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

                    // Add legend title, if there is any
                    if (!_.isUndefined(scope.legendTitle) && scope.legendTitle.length > 0) {
                        heatmapOptions.legend.title = {
                            text: scope.legendTitle
                        };
                    }
                }

                // If country selection is enabled, find the parameter type for this heatmap
                var paramType = null;
                if (countrySelection === "true") {
                    paramType = _.invert(DashboardService.getCountryMapping(dashboardId))[viewType];
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
                            DashboardService.updateFilterSubscriptions(dashboardId, filterSubscriptions, scope, createHeatmap);

                            // Check if the Heatmap should be updated (in case a filter type was completely removed)
                            var newParams = DashboardService.getApiOptionsDynamic(dashboardId);

                            if (!_.isEqual(newParams, extraParams)) {
                                createHeatmap();
                            }
                        });

                        DashboardService.updateFilterSubscriptions(dashboardId, filterSubscriptions, scope, createHeatmap);
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
                 * Select or deselect a point in the Heatmap by its code
                 * @param pointCode Code of point (Country code)
                 * @param select    Boolean, true to select, false to deselect.
                 */
                var selectPointByCode = function (pointCode, select) {
                    var pointToSelect = _.findWhere(heatmap.series[0].data, {
                        "iso-a2": pointCode
                    });

                    // If the point was found and the selection will change, change it
                    if (!_.isUndefined(pointToSelect) && pointToSelect.selected !== select) {
                        // If we are going to select the point but its value is null, abort.
                        if (select && _.isNull(pointToSelect.value))
                            return;

                        pointToSelect.select(select, true);
                    }
                };

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
                    var selectivityData = _.filter(heatmap.series[0].data, function (item) {
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
                        if (_.has(e, "added") && !_.isUndefined(e.added)) {
                            selectPointByCode(e.added.id, true);
                        }

                        if (_.has(e, "removed") && !_.isUndefined(e.removed)) {
                            selectPointByCode(e.removed.id, false);
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
                        heatmap = new Highcharts.Map(heatmapOptions);

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

                    // Save the countries that exist on this heatmap in case they are needed
                    // (right now, used for enabling/disabling the "swap" button
                    var countryCodes = _.pluck(response.data, "code");
                    DashboardService.saveObject(viewType + "_codes", countryCodes, true);

                    if (_.isEmpty(heatmap.series)) {
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
                                        var points = heatmap.getSelectedPoints();
                                        points.push(this);

                                        points = formatPoints(points);

                                        // Give new selected countries to the service (sets the cookie too)
                                        DashboardService.setCountries(viewType, points);

                                        // Set new selected points in Selectivity
                                        setSelectivityData(selectivity, points);
                                    },
                                    unselect: function () {
                                        // Get selected points
                                        var points = heatmap.getSelectedPoints();

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
                            heatmap.addSeries(newSeries);

                            // Highcharts chart is initialized, create data for Selectivity dropdown
                            initializeSelectivity();
                        } else {
                            // If base URL is defined (and selection is disabled), add click event for the points
                            // to go to their URL (if they have any)
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
                            heatmap.addSeries(newSeries);

                            // Check if we should zoom in to a country
                            if (zoomToCountry === "true") {
                                var countryCode = _.first(response.data).code;

                                // Find the point by its code and zoom to it
                                var pointToZoom = _.findWhere(heatmap.series[0].points, {
                                    code: countryCode
                                });

                                pointToZoom.zoomTo();
                                $timeout(function () {
                                    // With many points we need timeout here...
                                    heatmap.mapZoom(3);
                                });
                            }
                        }
                    } else {
                        // Heatmap already has a series, update it with new data
                        heatmap.series[0].setData(response.data);

                        // In the new data, select the points that were selected before, if they exist
                        var prevSelectedCountries = $(selectivity).selectivity("value");
                        var heatmapCountries = heatmap.series[0].data;

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
                            // For each cookie country, try to find it in the heatmap series and select it
                            _.each(cookieCountries, function (point) {
                                selectPointByCode(point.code, true);
                            });
                        }

                        // Force an update of the legend and the colorAxis to make the legend show correctly
                        heatmap.legend.update();
                        if (!_.isNull(colorAxisParams)) {
                            _.first(heatmap.colorAxis).update(colorAxisParams);
                        }

                        firstLoad = false;
                    }
                };

                /**
                 * Get formatted points from the heatmap and add them as selected items in Selectivity
                 * @param selectivity   Selectivity instance
                 * @param points        Points to select
                 */
                var setSelectivityData = function (selectivity, points) {
                    // Transform the points into Selectivity's format
                    var formattedPoints = points.map(function (country) {
                        if (_.isUndefined(country.code) || _.isUndefined(country.name)) {
                            // Problem with this point, needs to be removed.
                            return null;
                        } else {
                            return {
                                id: country.code,
                                text: country.name
                            };
                        }
                    });

                    // Remove null values (countries that cannot be selected on this Heatmap right now)
                    formattedPoints = _.reject(formattedPoints, _.isNull);

                    // Add points to Selectivity
                    $(selectivity).selectivity("data", formattedPoints, {
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
                            newExtraParams = DashboardService.getApiOptionsDynamic(dashboardId);
                        } else {
                            newExtraParams = DashboardService.getApiOptions(dashboardId);
                        }

                        // Check if any parameters changed before continuing
                        if (_.isEqual(extraParams, newExtraParams)) {
                            // Nothing changed, do not refresh heatmap
                            return;
                        } else {
                            extraParams = newExtraParams;

                            // Check if this heatmap's selection has changed and if yes, use the new selection.
                            // This happens when countries are swapped between maps in the Dashboards.
                            if (!_.isNull(heatmap) && _.has(extraParams, paramType)) {
                                var highchartsPoints = heatmap.getSelectedPoints();
                                var currPoints = _.pluck(formatPoints(highchartsPoints), "code").sort();

                                var newPoints = extraParams[paramType].split(",").sort();

                                // If the points changed, we should use the new points
                                if (!_.isEqual(currPoints, newPoints)) {
                                    // Deselect currently selected points of Heatmap
                                    _.each(highchartsPoints, function (point) {
                                        point.select(false, true);
                                    });

                                    // Select the new points
                                    _.each(newPoints, function (newPointCode) {
                                        selectPointByCode(newPointCode, true);
                                    });
                                }
                            }
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
