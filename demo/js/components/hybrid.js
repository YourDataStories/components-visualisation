angular.module('yds').directive('ydsHybrid', ['Data', '$http', '$stateParams', '$location',
	function(Data, $http, $stateParams, $location){
	return {
		restrict: 'E',
		scope: {},
		template: '<div class="hybrid-container" class="col-md-12" style="min-height: 300px; padding: 0px;">' +
					'<div class="alert alert-danger" role="alert" ng-if="ydsAlert.length>0">' +
							'<span class="glyphicon glyphicon-exclamation-sign" aria-hidden="true"></span>' +
							'  <b>Error:</b> {{ydsAlert}}' +
					'</div>' +
				  '</div>',
		compile: function(tElem, tAttrs){
			return {
				pre: function(scope, element, iAttrs) {
					scope.ydsAlert = "";
					var embedCode = $stateParams.embedCode;

					var hybridContainer = angular.element(element[0].querySelector('.hybrid-container'));

					//create a random id for the element that will render the chart
					var elementId = "hybrid" + Data.createRandomId();
					hybridContainer[0].id = elementId;

					// Recover saved object from embed code and visualise it
					Data.recoverEmbedCode(embedCode)
					.then (function (response) {
						visualiseProject(response.embedding.project_id, response.embedding.type,
							response.embedding.view_type, response.embedding.lang);
					}, function (error) {
						scope.ydsAlert = error.message;
						console.log('error during Data.recoverEmbedCode:', error);
					});

					/**
					 * Function that takes a chart options object and if the URL has a titlesize parameter
					 * sets the size of the chart's title to the specified one
					 * @param options
					 */
					var setupTitleSize = function(options) {
						// Check URL for title size parameter to add the size to baseOptions
						var urlParams = $location.search();

						if (_.has(urlParams, "titlesize")) {
							if (urlParams.titlesize == 0) {
								// titlesize is set to 0, disable title completely
								options.title.text = null;
							} else {
								// Set the custom title size
								options.title.style = {
									fontSize: urlParams.titlesize
								};
							}
						}
					};

					/**
					 * Formats the server's response according to the chart type
					 * @param viewType	Chart type (pie, line, map etc.)
                     * @param response	Server's response
                     * @returns {{}}	Formatted response
                     */
					var formatResponseData = function(viewType, response) {
						var newData = {};					// Object to put formatted data in
						var responseData = response.data;	// Data from the response

						// If chart is not a map, get some data that is common for all of them
						if (viewType != "map") {
							// Get graph data
                            if (viewType == "bar" || viewType == "pie") {
                                newData.series = responseData.data;
                            } else {
                                newData.series = responseData.series;
                            }

							// Get view and find title from view
							var titleView = _.first(response.view);

							newData.title = responseData[titleView.attribute];
							if (_.isUndefined(newData.title)) {
								newData.title = Data.deepObjSearch(responseData, titleView.attribute);
							}
						}

						// Get remaining fields (depending on the view type)
						switch(viewType) {
							case "line":
							case "scatter":
								// Get type of axis x and y
								newData.xAxisType = "linear";
								newData.yAxisType = "linear";

								for (var i = 0; i < response.view.length; i++) {
									if (response.view[i].header == "xAxis") {
										newData.xAxisType = response.view[i].type;
									} else if (response.view[i].header == "yAxis") {
										newData.yAxisType = response.view[i].type;
									}
								}

								break;
							case "pie":
								// Get series title
								newData.seriesTitle = responseData.series;
								break;
							case "bar":
								// Get categories
								newData.categories = responseData.categories;
								break;
							case "map":
								// Get route
								newData.route = _.first(responseData.routes).asWKT;
								break;
							default:
								console.error("Unknown chart type!");
						}

						// Return formatted data
						return newData;
					};

					//function to create a pie visualisation using data from the server
					var pieVisualisation = function (response) {
                        var formattedData = formatResponseData("pie", response);

                        var options = {
							chart: {
								plotBackgroundColor: null,
								plotBorderWidth: null,
								plotShadow: false,
								type: 'pie',
								renderTo: elementId
							},
							title: {
								text: formattedData.title
							},
							tooltip: {
								pointFormat: '({point.y}) <b>{point.percentage:.1f}%</b>'
							},
							plotOptions: {
								pie: {
									allowPointSelect: true,
									cursor: 'pointer',
									dataLabels: {
										enabled: false
									},
									showInLegend: true
								}
							},
							series: [{
							    name: formattedData.seriesTitle,
								colorByPoint: true,
							    data: formattedData.series
                            }],
							exporting: {
								enabled: false
							}
						};

						setupTitleSize(options);

						var chart = new Highcharts.Chart(options);
					};

					//function to create a bar visualisation using data from the server
					var barVisualisation = function (response) {
                        var formattedData = formatResponseData("bar", response);

						var options = {
							chart: {
								type: 'column',
								renderTo: elementId
							},
							title: {
								text: formattedData.title
							},
							xAxis: {
								categories: formattedData.categories,
								crosshair: true
							},
							tooltip: {
								headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
								pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
								'<td style="padding:0"><b>{point.y:.1f}</b></td></tr>',
								footerFormat: '</table>',
								shared: true,
								useHTML: true
							},
							plotOptions: {
								column: {
									pointPadding: 0.2,
									borderWidth: 0
								}
							},
							series: formattedData.series,
							exporting: {
								enabled: false
							}
						};

						setupTitleSize(options);

						var chart = new Highcharts.Chart(options);
					};

					//function to create a line visualisation using data from the server
					var lineVisualisation = function (response) {
						var formattedData = formatResponseData("line", response);

						var options = {
							chart: {
								renderTo: elementId
							},
							rangeSelector: {
								selected: 1
							},
							title: {
								text: formattedData.title
							},
							series: formattedData.series,
							exporting: {
								enabled: false
							}
						};

						setupTitleSize(options);

						var chart = new Highcharts.StockChart(options);
					};

					//function to create a scatter visualisation using data from the server
					var scatterVisualisation = function (response) {
						var formattedData = formatResponseData("scatter", response);

						var options = {
							chart: {
								renderTo: elementId,
								type: "scatter"
							},
							rangeSelector: {
								selected: 1
							},
							title: {
								text: formattedData.title
							},
							series: formattedData.series,
							exporting: {
								enabled: false
							},
							xAxis: {
								type: formattedData.xAxisType
							},
							yAxis: {
								type: formattedData.yAxisType,
                                title: {
								    enabled: false
                                }
							}
						};

						if (formattedData.xAxisType == "datetime") {
							options.tooltip = {
								headerFormat: '<span style="font-size: 10px">{point.x:%A, %b %e, %H:%M}</span><br />',
								pointFormat: '<span style="color:{point.color}">●</span> {series.name}: <b>{point.y}</b>'
							};
						}

						setupTitleSize(options);

						var chart = new Highcharts.Chart(options);
					};

					//function to create a map visualisation using data from the server
					var mapVisualisation = function (response) {
						var formattedData = formatResponseData("map", response);

						var map = L.map(elementId, {
							center: [35.52, 23.80],
							zoom: 5
						});

						L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
							maxZoom: 18,
							attribution: 'Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
						}).addTo(map);

						var polyline = L.polyline([]).addTo(map);
						var route = angular.copy(formattedData.route);
						for (var i=0; i<route.length; i++){
							polyline.addLatLng([parseFloat(route[i].lng),parseFloat(route[i].lat)]);
						}

						// zoom the map to the polyline
						map.fitBounds(polyline.getBounds());
					};

					//function responsible for the visualisation of a project
					var visualiseProject = function (projectId, vizType, viewType, lang) {
						vizType = vizType.toLowerCase();

						if (vizType == "map") {
							viewType = "default";
						}

						Data.getProjectVis(vizType, projectId, viewType, lang)
							.then(function (response) {
								switch(vizType) {
									case "pie":
										pieVisualisation(response);
										break;
									case "bar":
										barVisualisation(response);
										break;
									case "line":
										lineVisualisation(response);
										break;
									case "scatter":
										scatterVisualisation(response);
										break;
									case "map":
										mapVisualisation(response);
										break;
								}
							});
					};
				}
			}
		}
	}
}]);