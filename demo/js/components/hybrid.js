angular.module('yds').directive('ydsHybrid', ['Data', '$http', '$stateParams', '$timeout',
	function(Data, $http, $stateParams, $timeout){
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

					Data.recoverEmbedCode(embedCode)
					.then (function (response) {
						visualiseProject(response.embedding.project_id, response.embedding.type)
					}, function (error) {
						scope.ydsAlert = error.message;
						console.log('error during Data.recoverEmbedCode:', error);
					});

					//function to create a pie visualisation using data from the server
					var pieVisualisation = function (response) {
						var options = {
							chart: {
								plotBackgroundColor: null,
								plotBorderWidth: null,
								plotShadow: false,
								type: 'pie',
								renderTo: 'hybrid-container'
							},
							title: {
								text: response.title
							},
							tooltip: {
								pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
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
								name: response.series,
								colorByPoint: true,
								data: response.data
							}],
							exporting: {
								enabled: false
							}
						};

						var chart = new Highcharts.Chart(options);
					};


					//function to create a bar visualisation using data from the server
					var barVisualisation = function (response) {
						var options = {
							chart: {
								type: 'column',
								renderTo: elementId
							},
							title: {
								text: response.title
							},
							xAxis: {
								categories: response.categories,
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
							series: response.data,
							exporting: {
								enabled: false
							}
						};

						var chart = new Highcharts.Chart(options);
					};

					/**
					 * Function to format the server's response so the line visualization can be created easily
					 * @param response	Server's response
                     * @returns {{}}	Formatted response
                     */
					var formatLineData = function(response) {
						var newData = {};					// Object to put formatted data in
						var responseData = response.data;	// Data from the response

						// Get graph data
						newData.data = responseData.data;

						// Get series name
						newData.series = responseData.series;

						// Get view and find title from view
						var titleView = _.first(response.view);

						newData.title = responseData[titleView.attribute];
						if (_.isUndefined(newData.title)) {
							newData.title = Data.deepObjSearch(responseData, titleView.attribute);
						}

						// Return formatted data
						return newData;
					};

					//function to create a line visualisation using data from the server
					var lineVisualisation = function (response) {
						var formattedData = formatLineData(response);

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
							series: [{
								name: formattedData.series,
								data: formattedData.data,
								tooltip: {
									valueDecimals: 2
								}
							}],
							exporting: {
								enabled: false
							}
						};

						var chart = new Highcharts.StockChart(options);
					};


					//function to create a map visualisation using data from the server
					var mapVisualisation = function (response) {
						var map = L.map(elementId, {
							center: [35.52, 23.80],
							zoom: 5
						});

						L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
							maxZoom: 18,
							attribution: 'Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
						}).addTo(map);

						var polyline = L.polyline([]).addTo(map);
						var route = angular.copy(response.route);
						for (var i=0; i<route.length; i++){
							polyline.addLatLng([parseFloat(route[i].lng),parseFloat(route[i].lat)]);
						}

						// zoom the map to the polyline
						map.fitBounds(polyline.getBounds());
					};

					//function responsible for the visualisation of a project depending on the project id and the vis_type
					var visualiseProject = function (projectId, vizType) {
						vizType = vizType.toLowerCase();

						if (vizType == "pie") {
							Data.getProjectVis(vizType, projectId, "default", "en")
							.then(function (response) {
								pieVisualisation(response);
							}, function (error) {
								console.log('error', error);
							});
						} else if (vizType == "bar") {
							Data.getProjectVis(vizType, projectId, "default", "en")
							.then(function (response) {
								barVisualisation(response);
							}, function (error) {
								console.log('error', error);
							});
						} else if (vizType == "line") {
							Data.getProjectVis(vizType, projectId, "default", "en")
							.then(function (response) {
								lineVisualisation(response);
							}, function (error) {
								console.log('error', error);
							});
						} else if (vizType == "map") {
							Data.getProjectVis(vizType, projectId, "default", "en")
							.then(function (response) {
								mapVisualisation(response);
							}, function (error) {
								console.log('error', error);
							});
						}
					};
				}
			}
		}
	}
}]);