angular.module('yds').directive('ydsRegionSelectorGr', ['Data', 'DashboardService', '$q',
    function (Data, DashboardService, $q) {
        return {
            restrict: 'E',
            scope: {
                regionType: '@',        // Type used for getting the regions from the API
                regionalUnitType: '@',  // Type used for getting the regional units from the API
                dashboardId: '@',       // Dashboard ID to use for getting parameters from DashboardService
                elementH:'@'            // Height of the component in pixels
            },
            templateUrl: ((typeof Drupal != 'undefined')? Drupal.settings.basePath + Drupal.settings.yds_project.modulePath + '/' : '') + 'templates/region-selector-gr.html',
            link: function (scope, element) {
                var regionType = scope.regionType;
                var regionalUnitType = scope.regionalUnitType;
                var dashboardId = scope.dashboardId;
                var elementH = parseInt(scope.elementH);

                var regionSelContainer = angular.element(element[0].querySelector('.region-selector-container'));
                var initialized = false;

                // Create a random id for the element that will render the plot
                var elementId = "regionsel" + Data.createRandomId();
                regionSelContainer[0].id = elementId;

                // Check that the regionType and regionalUnitType attributes are defined, else show error
                if(_.isUndefined(regionType) || regionType.trim() == "" ||
                    _.isUndefined(regionalUnitType) || regionalUnitType.trim() == "") {
                    scope.ydsAlert = "The YDS component is not properly configured. " +
                        "Please check the corresponding documentation section.";
                    return false;
                }

                // Check if the component's height attr is defined, else assign default value
                if(_.isUndefined(elementH) || _.isNaN(elementH))
                    elementH = 300;

                // Variables for Selectivity and Highmaps instances
                var selectivity = null;
                var chart = null;

                // Boolean to indicate if the chart is drilled down or not
                var drilledDown = false;
                var drilldownRegion = "";

                // Declare states of map points object, used in the configuration of the map later
                var states = {
                    hover: {
                        color: '#e5ed04'
                    },
                    select: {
                        color: '#a4edba',
                        borderColor: 'black',
                        dashStyle: 'shortdot'
                    }
                };

                // Declare object with regions
                //todo: get from API
                var regions = {
                    "GR.TS": {
                        name: "Thessalia",
                        prefectures: [
                            "N. MAGNISIAS",
                            "N. KARDITSAS",
                            "N. LARISAS",
                            "N. TRIKALON"
                        ]
                    },
                    "GR.AT": {
                        name: "Attiki",
                        prefectures: [
                            "N. PIREOS KE NISON",
                            "N. ANATOLIKIS ATTIKIS",
                            "N. DYTIKIS ATTIKIS",
                            "N. ATHINON"
                        ]
                    },
                    "GR.GC": {
                        name: "Sterea Ellada",
                        prefectures: [
                            "N. VIOTIAS",
                            "N. EVVIAS",
                            "N. EVRYTANIAS",
                            "N. FOKIDAS",
                            "N. FTHIOTIDAS"
                        ]
                    },
                    "GR.MC": {
                        name: "Kentriki Makedonia",
                        prefectures: [
                            "N. IMATHIAS",
                            "N. THESSALONIKIS",
                            "N. KILKIS",
                            "N. PELLAS",
                            "N. PIERIAS",
                            "N. SERRON",
                            "N. CHALKIDIKIS"
                        ]
                    },
                    "GR.CR": {
                        name: "Kriti",
                        prefectures: [
                            "N. CHANION",
                            "N. IRAKLIOU",
                            "N. LASITHIOU",
                            "N. RETHYMNOU"
                        ]
                    },
                    "GR.MT": {
                        name: "Anatoliki Makedonia kai Thraki",
                        prefectures: [
                            "N. DRAMAS",
                            "N. EVROU",
                            "N. KAVALAS",
                            "N. XANTHIS",
                            "N. RODOPIS"
                        ]
                    },
                    "GR.EP": {
                        name: "Ipeiros",
                        prefectures: [
                            "N. ARTAS",
                            "N. IOANNINON",
                            "N. PREVEZAS",
                            "N. THESPROTIAS"
                        ]
                    },
                    "GR.II": {
                        name: "Ionioi Nisoi",
                        prefectures: [
                            "N. KERKYRAS",
                            "N. KEFALLONIAS",
                            "N. LEFKADAS",
                            "N. ZAKYNTHOU"
                        ]
                    },
                    "GR.AN": {
                        name: "Voreio Aigaio",
                        prefectures: [
                            "N. CHIOU",
                            "N. SAMOU",
                            "N. LESVOU"
                        ]
                    },
                    "GR.PP": {
                        name: "Peloponnisos",
                        prefectures: [
                            "N. ARKADIAS",
                            "N. ARGOLIDAS",
                            "N. KORINTHOU",
                            "N. LAKONIAS",
                            "N. MESSINIAS"
                        ]
                    },
                    "GR.AS": {
                        name: "Notio Aigaio",
                        prefectures: [
                            "N. KYKLADON",
                            "N. DODEKANISON"
                        ]
                    },
                    "GR.GW": {
                        name: "Dytiki Ellada",
                        prefectures: [
                            "N. ACHAIAS",
                            "N. ETOLOAKARNANIAS",
                            "N. ILIAS"
                        ]
                    },
                    "GR.MW": {
                        name: "Dytiki Makedonia",
                        prefectures: [
                            "N. FLORINAS",
                            "N. GREVENON",
                            "N. KASTORIAS",
                            "N. KOZANIS"
                        ]
                    },
                    "GR.MA": {
                        name: "Ayion Oros",
                        prefectures: [
                            "AGIO OROS"
                        ]
                    }
                };

                /**
                 * Callback for when drillup happens. Clears the selected points from the chart,
                 * and sets the chart's subtitle to empty.
                 */
                var drillup = function () {
                    drilledDown = false;

                    // After the drill up completes, refresh the map because the selection might have changed
                    setTimeout(updateHeatmap, 0);

                    // Set the chart's subtitle to empty
                    this.setTitle(null, {text: ""});
                };

                /**
                 * Callback for when drilldown happens. Gets the prefectures for the drilled-down point from the API
                 * @param e
                 */
                var drilldown = function (e) {
                    if (!e.seriesOptions  && e.point.selected) {
                        var chart = this,
                            mapKey = e.point.drilldown,
                            regionName = e.point.name;

                        drilldownRegion = mapKey;

                        chart.showLoading("Loading...");

                        var extraParams = DashboardService.getApiOptions(dashboardId);
                        extraParams.regions = mapKey;

                        $q.all([
                            Data.getGeoJSON("high", mapKey),
                            Data.getProjectVis("heatmap", "none", regionalUnitType, "en", extraParams)
                        ]).then(function(results) {
                            // Get higher detail map with prefectures
                            var mapData = results[0];

                            // Get data for the prefectures and the color axis
                            var drilldownData = results[1].data;
                            var colorAxis = _.find(results[1].view, function(view) {
                                return _.has(view, "colorAxis");
                            }).colorAxis;

                            // Hide loading and add series
                            chart.hideLoading();
                            chart.addSeriesAsDrilldown(e.point, {
                                name: regionName,
                                data: drilldownData,
                                mapData: mapData,
                                joinBy: ["NAME_ENG", "code"],
                                keys: ["NAME_ENG", "value"],
                                allowPointSelect: true,
                                dataLabels: {
                                    enabled: true,
                                    format: '{point.properties.NAME_ENG}'
                                },
                                colorAxis: colorAxis,
                                tooltip: {
                                    enabled: false,
                                    pointFormatter: function() {
                                        return "<b>" + this.properties.NAME_ENG + "</b>: " + this.value;
                                    }
                                },
                                point: {
                                    events: {
                                        select: prefectureSelectionHandler,
                                        unselect: prefectureUnselectionHandler
                                    }
                                },
                                states: states
                            });

                            drilledDown = true;

                            // Select any prefectures that are in Selectivity's selection on the chart
                            selectFromSelectivityToMap();
                        });
                    }

                    this.setTitle(null, {text: regionName});
                };

                var updateHeatmap = function() {
                    if (drilledDown) {
                        // Get data for this region to update it
                        console.log("ned to update data for ", drilldownRegion);

                        var extraParams = DashboardService.getApiOptions(dashboardId);
                        extraParams.regions = drilldownRegion;

                        Data.getProjectVis("heatmap", "none", regionalUnitType, "en", extraParams)
                            .then(function(response) {
                                _.first(chart.series).setData(response.data);

                                // Reselect previously selected points
                                selectFromSelectivityToMap();
                            });
                    } else {
                        createHeatmap();
                    }
                };

                // Get low resolution map of Greece to initialize map
                Data.getGeoJSON("low", null).then(function(response) {
                    // Give map to highcharts
                    Highcharts.maps["countries/gr-low-res"] = response;

                    // Subscribe to changes
                    DashboardService.subscribeGridSelectionChanges(scope, updateHeatmap);
                    DashboardService.subscribeYearChanges(scope, updateHeatmap);

                    // Initialize heatmap
                    createHeatmap();
                });

                var createHeatmap = function() {
                    var extraParams = DashboardService.getApiOptions(dashboardId);

                    // Get number of items in each region
                    Data.getProjectVis("heatmap", "none", regionType, "en", extraParams).then(visualizeHeatmap);
                };

                var visualizeHeatmap = function(results) {
                    // Create new series to add to heatmap
                    var mapData = Highcharts.geojson(Highcharts.maps['countries/gr-low-res']);

                    // Get number of items in each region and the colorAxis
                    var data = results.data;
                    var colorAxis = _.find(results.view, function(view) {
                        return _.has(view, "colorAxis");
                    }).colorAxis;

                    // Add drilldown properties to the map data
                    _.each(mapData, function (item) {
                        item.drilldown = item.properties.hasc;
                    });

                    // If chart is not initialized, initialize it
                    if (!initialized) {
                        // Initialize heatmap (without a series)
                        chart = new Highcharts.mapChart(elementId, getMapOptions(colorAxis));

                        initialized = true;

                        initializeSelectivity();
                    } else {
                        // Remove series
                        while(chart.series.length > 0)
                            chart.series[0].remove(true);
                    }

                    // chart = new Highcharts.mapChart(elementId, getMapOptions(data, mapData, colorAxis));
                    var series = getSeries(mapData, data);
                    chart.addSeries(series);

                    // Reselect previously selected points
                    selectFromSelectivityToMap();
                };

                var updateDashboardServiceValues = function(newData) {
                    // Filter selection into regions and prefectures
                    var regionsFilter = function(item) {
                        return _.has(regions, item.id);
                    };

                    var selectedRegions = _.filter(newData, regionsFilter);
                    var selectedPrefectures = _.reject(newData, regionsFilter);

                    var transformation = function(item) {
                        return {
                            code: item.id,
                            value: item.name
                        }
                    };

                    selectedRegions = selectedRegions.map(transformation);
                    selectedPrefectures = selectedPrefectures.map(transformation);

                    // Set in Dashboard Service
                    DashboardService.setCountries(regionType, selectedRegions);
                    DashboardService.setCountries(regionalUnitType, selectedPrefectures);
                };

                /**
                 * Selection handler for regions and prefectures. Uses the given function to create the new item
                 * to give to selectivity to select
                 * @param e         Highcharts event
                 * @param newItem   Function to create a selectivity item
                 */
                var selectionHandler = function(e, newItem) {
                    var clickedPoint = e.target;

                    // Get currently selected vales from Selectivity
                    var selectedValues = $(selectivity).selectivity("data");

                    // Find the name of the clicked point and add it to the selected values
                    var item = regions[clickedPoint.code];  // this object contains a "name" attribute

                    selectedValues.push(newItem(clickedPoint, item));
                    selectedValues = unique(selectedValues);

                    // Set the new selected data in selectivity (do not trigger change event to prevent loop)
                    $(selectivity).selectivity("data", selectedValues, {
                        triggerChange: false
                    });

                    // Redraw selectivity to show the new selection
                    $(selectivity).selectivity("rerenderSelection");

                    // Redraw the chart to show updated tooltip for the selected point
                    setTimeout(function() {
                        clickedPoint.series.chart.redraw();
                    }, 0);

                    updateDashboardServiceValues(selectedValues);
                };

                /**
                 * Unselection handler for regions and prefectures. Uses the given function to remove the
                 * unselected values from the Selectivity selection
                 * @param e             Highcharts event
                 * @param updateValues  Function that removes the unselected point from a list
                 */
                var unselectionHandler = function(e, updateValues) {
                    var pointToUnselect = e.target;

                    // Get currently selected vales from Selectivity
                    var selectedValues = $(selectivity).selectivity("data");

                    // Remove the clicked point from the selected values
                    selectedValues = updateValues(selectedValues, pointToUnselect);
                    selectedValues = unique(selectedValues);

                    // Set the new selected data in selectivity (do not trigger change event to prevent loop)
                    $(selectivity).selectivity("data", selectedValues, {
                        triggerChange: false
                    });

                    // Redraw selectivity to show the new selection
                    $(selectivity).selectivity("rerenderSelection");

                    updateDashboardServiceValues(selectedValues);
                };

                /**
                 * Handles the selection of a region on the Highmaps chart
                 */
                var regionSelectionHandler = function(e) {
                    selectionHandler(e, function(point, item) {
                        return {
                            id: point.code,
                            text: item.name
                        }
                    });
                };

                /**
                 * Handle the unselection of a region on the Highmaps chart
                 * @param e
                 */
                var regionUnselectionHandler = function(e) {
                    unselectionHandler(e, function(selectedValues, clickedPoint) {
                        return _.reject(selectedValues, function(val) {
                            return val.id == clickedPoint.code;
                        });
                    })
                };

                /**
                 * Handle the selection of a prefecture
                 * @param e
                 */
                var prefectureSelectionHandler = function(e) {
                    selectionHandler(e, function(point, item) {
                        return {
                            id: point.NAME_ENG,
                            text: point.NAME_ENG
                        }
                    });
                };

                /**
                 * Handle the unselection of a prefecture
                 * @param e
                 */
                var prefectureUnselectionHandler = function(e) {
                    unselectionHandler(e, function(selectedValues, pointToUnselect) {
                        return _.reject(selectedValues, function(val) {
                            return val.id == pointToUnselect.NAME_ENG;
                        });
                    });
                };

                /**
                 * Gets an array of Selectivity points (with IDs) and returns a new one
                 * that has each item only once.
                 * @param arr
                 * @returns {Array}
                 */
                var unique = function(arr) {
                    var newArray = [];

                    _.each(arr, function(item) {
                        if (_.isUndefined(_.findWhere(newArray, {
                                id: item.id
                            }))) {
                            newArray.push(item);
                        }
                    });

                    return newArray;
                };

                /**
                 * Return the series for the regions map (not drilled down)
                 * @param mapData
                 * @param data
                 * @returns {*}
                 */
                var getSeries = function(mapData, data) {
                    return {
                        data: data,
                        mapData: mapData,
                        dataLabels: {
                            enabled: true,
                            format: '{point.properties.name}'
                        },
                        joinBy: ['hasc', 'code'],
                        keys: ['hasc', 'value'],
                        name: "Regions of Greece",
                        allowPointSelect: true,
                        states: states,
                        point: {
                            events: {
                                select: regionSelectionHandler,
                                unselect: regionUnselectionHandler
                            }
                        }
                    };
                };

                /**
                 * Create and return the options for the highmaps chart
                 * @param colorAxis
                 * @returns {*}
                 */
                var getMapOptions = function(colorAxis) {
                    return {
                        chart: {
                            height: elementH,
                            events: {
                                drilldown: drilldown,
                                drillup: drillup
                            }
                        },
                        legend: { enabled: false },
                        title: {
                            text: 'Greece'
                        },
                        tooltip: {
                            enabled: true,
                            pointFormatter: function() {
                                if (_.has(this, "selected") && this.selected == true) {
                                    return "<b>" + this.name + "</b>: " + this.value +
                                        '<br/><span style="font-weight: bold; color: red">(click again to drilldown)' +
                                        '</span>';
                                } else {
                                    return "<b>" + this.name + "</b>: " + this.value;
                                }
                            }
                        },
                        mapNavigation: {
                            enabled: true,
                            enableMouseWheelZoom: true,
                            enableDoubleClickZoomTo: false,
                            enableDoubleClickZoom: false
                        },
                        colorAxis: colorAxis,
                        series: [],
                        drilldown: {
                            activeDataLabelStyle: {
                                color: '#FFFFFF',
                                textDecoration: 'none',
                                textShadow: '0px 1px 3px black'
                            },
                            drillUpButton: {
                                relativeTo: 'spacingBox',
                                position: {
                                    x: 0,
                                    y: 60
                                }
                            }
                        }
                    };
                };

                /**
                 * Get a point ID and set its state to selected or unselected based on the
                 * (boolean) select parameter. Uses the correct property for finding the
                 * point in the Highmap series based on if the chart is drilled-down or not
                 * @param select        Boolean, set to true if the point should be selected
                 * @param pointId       ID of point to select/unselect
                 */
                var togglePoint = function(select, pointId) {
                    var points = chart.series[0].data;

                    // Use the correct "search" term to find the point
                    var searchTerm = {};

                    if (!drilledDown) {
                        searchTerm.code = pointId;      // ID will be the code in the point object
                    } else {
                        searchTerm.NAME_ENG = pointId;  // ID will be the NAME_ENG property
                    }

                    var pointToSelect = _.findWhere(points, searchTerm);

                    if (!_.isUndefined(pointToSelect)) {
                        pointToSelect.select(select, true);
                    }
                };

                /**
                 * Select any points that are selected in Selectivity, on the Highmaps chart.
                 */
                var selectFromSelectivityToMap = function() {
                    var selectivityData = $(selectivity).selectivity("data");

                    _.each(selectivityData, function(item) {
                        togglePoint(true, item.id);
                    });
                };

                /**
                 * Initialize Selectivity dropdown for region or prefecture selection
                 */
                var initializeSelectivity = function() {
                    // Create the available selection items for Selectivity
                    var items = [];

                    _.each(regions, function(region, key) {
                        // Add the actual region to the items
                        items.push({
                            id: key,
                            text: region.name
                        });

                        // Add the region's prefectures to the items
                        _.each(region.prefectures, function(pref) {
                            items.push({
                                id: pref,
                                text: pref
                            });
                        });
                    });

                    // Use jQuery to initialize Selectivity
                    var dropdownContainer = _.first(angular.element(element[0].querySelector('.selectivity-container')));

                    selectivity = $(dropdownContainer).selectivity({
                        items: items,
                        multiple: true,
                        placeholder: 'Type to search a region or prefecture'
                    });

                    // Set Selectivity selection change event handler
                    $(selectivity).on("change", function(e) {
                        // Check for added point
                        if (_.has(e, "added") && !_.isUndefined(e.added)) {
                            togglePoint(true, e.added.id);
                        }

                        // Check for removed point
                        if (_.has(e, "removed") && !_.isUndefined(e.removed)) {
                            togglePoint(false, e.removed.id);
                        }

                        updateDashboardServiceValues($(selectivity).selectivity("data"));
                    });
                };
            }
        };
    }
]);
