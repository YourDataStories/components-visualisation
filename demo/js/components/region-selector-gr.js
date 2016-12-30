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
                var highDetail = null;
                var lowDetail = null;
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

                        // Keep only the part of the map that we need
                        var mapData = _.clone(highDetail);
                        var drilldownData = [];

                        if (_.has(drilldownMap, mapKey)) {
                            mapData.features = _.filter(mapData.features, function(item) {
                                return _.contains(drilldownMap[mapKey], item.properties.NAME_ENG);
                            });
                        }

                        // For each prefecture to display, create a value of 0 for it so it is colored
                        $.each(mapData.features, function () {
                            drilldownData.push({
                                name: this.properties.NAME_ENG,
                                value: 0
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

                    }

                    this.setTitle(null, {text: regionName});
                };

                // Get map of regions -> prefectures
                var drilldownMap = Data.getRegionToPrefectureMapGr();

                // Get both high and low detail Greece map
                var promises = [
                    Data.getGeoJSON("low"),
                    Data.getGeoJSON("high")
                ];

                $q.all(promises).then(function(results) {
                    lowDetail = results[0];
                    highDetail = results[1];

                    Highcharts.maps["countries/gr-low-res"] = lowDetail;

                    // Get low detail map data and
                    var mapData = Highcharts.geojson(Highcharts.maps['countries/gr-low-res']);

                    var data = [];

                    _.each(mapData, function (item) {
                        var code = item.properties.hasc;
                        item.drilldown = code;
                        if (_.has(drilldownMap, code)) {
                            data.push({
                                code: code,
                                value: drilldownMap[code].length
                            });
                        } else {
                            data.push({
                                code: code,
                                value: 0
                            });
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
                        title: {
                            text: 'Greece'
                        },
                        tooltip: {
                            enabled: true,
                            pointFormatter: function() {
                                if (_.has(this, "selected") && this.selected == true) {
                                    return "<b>" + this.name + "</b>: " + this.value + "<br/>(click again to drilldown)";
                                } else {
                                    return "<b>" + this.name + "</b>: " + this.value;
                                }
                            }
                        },
                        mapNavigation: {
                            enabled: true,
                            enableMouseWheelZoom: true
                        },
                        colorAxis: {
                            min: 0
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
                                textOutline: '1px #000000'
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
