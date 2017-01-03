angular.module('yds').directive('ydsRegionSelectorGr', ['Data', '$q',
    function (Data, $q) {
        return {
            restrict: 'E',
            scope: {
                elementH:'@'    // Height of the component in pixels
            },
            templateUrl: ((typeof Drupal != 'undefined')? Drupal.settings.basePath  + Drupal.settings.yds_project.modulePath  +'/' :'') + 'templates/region-selector-gr.html',
            link: function (scope, element) {
                var elementH = parseInt(scope.elementH);

                var regionSelContainer = angular.element(element[0].querySelector('.region-selector-container'));

                //create a random id for the element that will render the plot
                var elementId = "regionsel" + Data.createRandomId();
                regionSelContainer[0].id = elementId;

                //check if the component's height attr is defined, else assign default value
                if(_.isUndefined(elementH) || _.isNaN(elementH))
                    elementH = 300;

                // Selectivity instance
                var selectivity = null;

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
                 * and sets the chart's subtitle to empty
                 */
                var drillup = function () {
                    var chart = this,
                        points = [];
                    setTimeout(function () {
                        points = chart.getSelectedPoints();

                        Highcharts.each(points, function (p) {
                            // unselect points from previous drilldown
                            p.selected = false;
                            p.setState('', true);
                        });
                    }, 0);

                    chart.setTitle(null, {text: ''});
                };

                /**
                 * Callback for when drilldown happens. Gets the drilled-down point, and creates the series that should
                 * be shown based on the drilldownMap
                 * @param e
                 */
                var drilldown = function (e) {
                    if (!e.seriesOptions  && e.point.selected) {
                        var chart = this,
                            mapKey = e.point.drilldown,
                            regionName = e.point.name;
                        chart.showLoading("Loading...");

                        Data.getGeoJSON("high", mapKey).then(function(response) {
                            var mapData = response;
                            var drilldownData = [];

                            // For each prefecture to display, create a value of 1 for it so it is colored
                            $.each(mapData.features, function () {
                                drilldownData.push({
                                    name: this.properties.NAME_ENG,
                                    value: 1
                                });
                            });

                            // Hide loading and add series
                            chart.hideLoading();
                            chart.addSeriesAsDrilldown(e.point, {
                                name: regionName,
                                data: drilldownData,
                                mapData: mapData,
                                joinBy: ['NAME_ENG', "name"],
                                keys: ['NAME_ENG', 'value'],
                                allowPointSelect: true,
                                dataLabels: {
                                    enabled: true,
                                    format: '{point.properties.NAME_ENG}'
                                },
                                tooltip: {
                                    enabled: false,
                                    pointFormatter: function() {
                                        return "<b>" + this.properties.NAME_ENG + "</b>";
                                    }
                                },
                                states: states
                            });
                        });
                    }

                    this.setTitle(null, {text: regionName});
                };

                // Declare object which shows how many prefectures are in each region of Greece
                var drilldownMap = {
                    "GR.TS": 4,
                    "GR.AT": 4,
                    "GR.GC": 5,
                    "GR.MC": 7,
                    "GR.CR": 4,
                    "GR.MT": 5,
                    "GR.EP": 4,
                    "GR.II": 4,
                    "GR.AN": 3,
                    "GR.PP": 5,
                    "GR.AS": 2,
                    "GR.GW": 3,
                    "GR.MW": 4,
                    "GR.MA": 1
                };

                // Get low detail Greece map
                Data.getGeoJSON("low", null).then(function(response) {
                    Highcharts.maps["countries/gr-low-res"] = response;

                    // Get low detail map data
                    var mapData = Highcharts.geojson(Highcharts.maps['countries/gr-low-res']);
                    var data = [];

                    _.each(mapData, function (item) {
                        var code = item.properties.hasc;
                        item.drilldown = code;
                        if (_.has(drilldownMap, code)) {
                            data.push({
                                code: code,
                                value: drilldownMap[code]
                            });
                        } else {
                            data.push({
                                code: code,
                                value: 1
                            });
                            console.warn(code + " does not exist in drilldownMap, something went wrong?");
                        }
                    });

                    new Highcharts.mapChart(elementId, getMapOptions(data, mapData));

                    initializeSelectivity();
                });

                /**
                 * Handles the selection of a region on the highmap
                 */
                var regionSelectionHandler = function(e) {
                    var clickedPoint = e.target;

                    // Get currently selected vales from Selectivity
                    var selectedValues = $(selectivity).selectivity("data");

                    // Find the name of the clicked point and add it to the selected values
                    var item = regions[clickedPoint.code];  // this object contains a "name" attribute

                    selectedValues.push({
                        id: clickedPoint.code,
                        text: item.name
                    });

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
                };

                var regionUnselectionHandler = function() {
                    console.log("unselection");
                    //todo
                };

                /**
                 * Create and return the options for the highmaps chart
                 * @param data
                 * @param mapData
                 * @returns {*}
                 */
                var getMapOptions = function(data, mapData) {
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
                        colorAxis: {
                            min: 1,
                            type: "logarithmic",
                            minColor: '#FFFFFF',
                            maxColor: '#063798',
                            stops: [
                                [0, '#FFFFFF'],
                                [1, '#063798']
                            ]
                        },
                        series: [{
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
                        }],
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
                 * Get the regions of a country with their prefectures and names, and return them
                 * as an array of items for Selectivity.js
                 * @param regions
                 * @returns {Array}
                 */
                var getSelectivityItemsFromRegions = function(regions) {
                    // Variable to hold the selectivity items
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

                    return items;
                };

                /**
                 * Initialize Selectivity dropdown for region or prefecture selection
                 */
                var initializeSelectivity = function() {
                    // Use jQuery to initialize Selectivity
                    var dropdownContainer = _.first(angular.element(element[0].querySelector('.selectivity-container')));

                    selectivity = $(dropdownContainer).selectivity({
                        items: getSelectivityItemsFromRegions(regions),
                        multiple: true,
                        placeholder: 'Type to search a region or prefecture'
                    });
                };
            }
        };
    }
]);
