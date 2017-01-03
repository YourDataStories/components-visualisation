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

                // Declare objects used in the configuration of the map later
                var states = {
                    // States of map points
                    hover: {
                        color: '#e5ed04'
                    },
                    select: {
                        color: '#a4edba',
                        borderColor: 'black',
                        dashStyle: 'shortdot'
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
                            // Keep only the part of the map that we need
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

                // Get map of regions -> prefectures
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

                    new Highcharts.mapChart(elementId, {
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
                                    return "<b>" + this.name + "</b>: " + this.value + "<br/><b style='color: red'>(click again to drilldown)</b>";
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
                                    select: function() {
                                        var point = this;
                                        setTimeout(function() {
                                            point.series.chart.redraw();
                                        }, 0);
                                    }
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
                    });
                });
            }
        };
    }
]);
