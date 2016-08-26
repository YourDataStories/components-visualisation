angular.module('yds').factory('Workbench', [ 'YDS_CONSTANTS', '$q', '$http', 'Data',
	function (YDS_CONSTANTS, $q, $http, Data) {

	var slidesConfig = {
		noWrap: false,
		active: 0,
		slides: [{
			images : [ {
				src: ((typeof Drupal != 'undefined')? Drupal.settings.basePath  + Drupal.settings.yds_project.modulePath  +'/' :'') + "img/thumbnails/line_chart.png",
				name: "Line Chart",
				type: "linechart",
				visible: false
			}, {
				src: ((typeof Drupal != 'undefined') ? Drupal.settings.basePath + Drupal.settings.yds_project.modulePath + '/' : '') + "img/thumbnails/bar_chart.png",
				name: "Bar Chart",
				type: "barchart",
				visible: false
			}, {
				src: ((typeof Drupal != 'undefined')? Drupal.settings.basePath  + Drupal.settings.yds_project.modulePath  +'/' :'') + "img/thumbnails/scatter_chart.png",
				name: "Scatter Chart",
				type: "scatterchart",
				visible: false
			}]
		}, {
			images : [{
				src: ((typeof Drupal != 'undefined')? Drupal.settings.basePath  + Drupal.settings.yds_project.modulePath  +'/' :'') + "img/thumbnails/pie_chart.png",
				name: "Pie Chart",
				type: "piechart",
				visible: false
			}]
		}]
	};

	var workbenchConfig = {};
	var lineChartConfig = {};
	var scatterChartConfig = {};
	var barChartConfig = {};

	return {
		init: function() {
			//iterate through all the available vis options of the carousel and deactivate them
			_.each(slidesConfig.slides, function(slideView){
				_.each(slideView.images, function(image) {
					image.visible = false;
				})
			});

			//initialize the configuration options of workbench
			workbenchConfig = {
				alert: "",
				selectedVis: "default",
				availableViews: [],
				availableViewsRaw: [],
				selectedView: "",
				selectedViewObj: {}
			};

			return workbenchConfig;
		},
		initLineChart: function (elementId) {
			//initialize the configuration options of the line chart component
			lineChartConfig = {
				initialized: false,
				data: [],
				chart: {},
				options: {
					chart: { renderTo: elementId },
					rangeSelector : { enabled: false },
					scrollbar : { enabled: false },
					title : { text : "Not available" },
					exporting: { enabled: true },
					navigator: { enabled: false },
					series : []
				},
				selectedAxisX: "",
				axisX: [],
				axisY: [],
				axisYConfig: []
			};

			return lineChartConfig;
		},
		initScatterChart: function (elementId) {
			//initialize the configuration options of the scatter chart component
			scatterChartConfig = {
				initialized: false,
				data: [],
				chart: {},
				options: {
					chart: {
						renderTo: elementId,
						type: "scatter",
						zoomType: "xy"
					},
					rangeSelector : { enabled: false },
					scrollbar : { enabled: false },
					title : { text : "Not available" },
					exporting: { enabled: true },
					navigator: { enabled: false },
					series : []
				},
				selectedAxisX: "",
				axisX: [],
				axisY: [],
				axisYConfig: []
			};

			return scatterChartConfig;
		},
		initBarChart: function(elementId) {
			//initialize the configuration options of the bar chart component
			barChartConfig = {
				initialized: false,
				data: [],
				categories: [],
				chart: {},
				selectedAxisX: "",
				axisX: [],
				axisY: [],
				axisYConfig: [],
				options: {
					chart: {
						type: 'column',
						renderTo: elementId
					},
					title: { text: "Not available" },
					xAxis: { categories: [] },
					legend: { enabled: true },
					exporting: { enabled: true },
					tooltip: {
						headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
						pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
						'<td style="padding:0"><b>{point.y:.0f}</b></td></tr>',
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
					series: []
				}
			};

			return barChartConfig;
		},
		getSlidesConfig : function() { return slidesConfig; },
		checkVisAvailability: function (slideId, visType) { return _.findWhere(slidesConfig.slides[slideId].images, {type: visType}).visible; },
		getLineBarVis: function(visType, viewType, xAxis, yAxis, basketIds, lang, sparql) {
			var visUrl = "";
			var deferred = $q.defer();

			switch(visType) {
				case "linechart":
					visUrl = "http://" + YDS_CONSTANTS.API_INTERACTIVE_LINE;
					break;
				case "scatterchart":
					visUrl = "http://" + YDS_CONSTANTS.API_INTERACTIVE_SCATTER;
					break;
				case "barchart":
					visUrl = "http://" + YDS_CONSTANTS.API_INTERACTIVE_BAR;
					break;
			}

			// If sparql parameter is true add parameter to the URL
			if (sparql == true) {
				visUrl += "?sparql=1";
			}

			$http({
				method: 'POST',
				url: visUrl,
				headers: {'Content-Type': 'application/x-www-form-urlencoded'},
				data: {
					lang: lang,
					type: viewType,
					basket_ids: basketIds,
					axis_x: xAxis,
					axis_y: yAxis
				}
			}).success(function (data) {
				deferred.resolve(data);
			}).error(function (error) {
				deferred.reject(error);
			});

			return deferred.promise;
		},
		getAvailableVisualisations: function(lang, basketIds) {
			var deferred = $q.defer();

			//call the service with POST method
			$http({
				method: 'POST',
				url: "http://"+ YDS_CONSTANTS.API_PLOT_INFO + "?lang=" + lang ,
				headers: {'Content-Type': 'application/x-www-form-urlencoded'},
				data: Data.transform(JSON.stringify(basketIds))
			}).success(function (data) {
				deferred.resolve(data);
			}).error(function (error) {
				deferred.reject(error);
			});

			return deferred.promise;
		},
		getLineChartStatus: function() { return lineChartConfig.initialized;  },
		addLineAxisY: function() {			// function used to add combobox entries for the configuration of the line chart visualization
			// check if there is any combobox with default value
			var nonSelectedCombo = _.where(lineChartConfig.axisYConfig, {selected: ""});

			// if there is an empty combobox or the number of comboboxes is equals with number
			// of the line axis, stop the excecution of the function
			if ( nonSelectedCombo.length>0 ||
				lineChartConfig.axisYConfig.length>5 ||
				lineChartConfig.axisYConfig.length == lineChartConfig.axisY.length ) {

				return false;
			} else {
				var newCombo = {
					selected: "",
					options: lineChartConfig.axisY
				};

				//else create a new combobox with default values and append it to the combobox array
				lineChartConfig.axisYConfig.push(newCombo);
			}
		},
		removeLineAxisY: function(index) {		//function used to remove combobox entries for the configuration of the line chart visualization
			if (lineChartConfig.axisYConfig.length>1)
				lineChartConfig.axisYConfig.splice(index, 1);
		},
		getScatterChartStatus: function() { return scatterChartConfig.initialized;  },
		addScatterAxisY: function() {			// function used to add combobox entries for the configuration of the scatter chart visualization
			// check if there is any combobox with default value
			var nonSelectedCombo = _.where(scatterChartConfig.axisYConfig, {selected: ""});

			// if there is an empty combobox or the number of comboboxes is equals with number
			// of the scatter axis, stop the excecution of the function
			if ( nonSelectedCombo.length>0 ||
				scatterChartConfig.axisYConfig.length>5 ||
				scatterChartConfig.axisYConfig.length == scatterChartConfig.axisY.length ) {

				return false;
			} else {
				var newCombo = {
					selected: "",
					options: scatterChartConfig.axisY
				};

				//else create a new combobox with default values and append it to the combobox array
				scatterChartConfig.axisYConfig.push(newCombo);
			}
		},
		removeScatterAxisY: function(index) {		//function used to remove combobox entries for the configuration of the scatter chart visualization
			if (scatterChartConfig.axisYConfig.length>1)
				scatterChartConfig.axisYConfig.splice(index, 1);
		},
		getBarChartStatus: function() { return barChartConfig.initialized; },
		addBarAxisY: function() {			// function used to add combobox entries for the configuration of the bar chart visualization
			// check if there is any combobox with default value
			var nonSelectedCombo = _.where(barChartConfig.axisYConfig, {selected: ""});

			// if there is an empty combobox or the number of comboboxes is equals with number
			// of the bar axis, stop the excecution of the function
			if ( nonSelectedCombo.length>0 ||
				barChartConfig.axisYConfig.length>5 ||
				barChartConfig.axisYConfig.length == barChartConfig.axisY.length ) {

				return false;
			} else {
				var newCombo = {
					selected: "",
					options: barChartConfig.axisY
				};

				//else create a new combobox with default values and append it to the combobox array
				barChartConfig.axisYConfig.push(newCombo);
			}
		},
		removeBarAxisY: function(index) {		//function used to remove combobox entries for the configuration of the bar chart visualization
			if (barChartConfig.axisYConfig.length>1)
				barChartConfig.axisYConfig.splice(index, 1);
		}
	}
}]);
