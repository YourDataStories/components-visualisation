angular.module('yds').directive('ydsWorkbench', ['Data', 'Basket', '$timeout', function(Data, Basket, $timeout){
	return {
		restrict: 'E',
		scope: {
			userId:'@'
		},
		templateUrl: 'templates/workbench.html',
		link: function (scope, element, attrs) {
			var userId = scope.userId;
			scope.selectedVisualisation = "";
			scope.ydsAlert = "";
			scope.basketList = [];

			//if userId is undefined or empty, stop the execution of the directive
			if (angular.isUndefined(userId) || userId.trim().length==0) {
				scope.ydsAlert = "The YDS component is not properly configured." +
					"Please check the corresponding documentation section";
				return false;
			}

			var lineChartContainer = angular.element(element[0].querySelector('.vis-area-line'));
			var barChartContainer = angular.element(element[0].querySelector('.vis-area-bar'));
			var pieChartContainer = angular.element(element[0].querySelector('.vis-area-pie'));
			var mapChartContainer = angular.element(element[0].querySelector('.vis-area-map'));

			lineChartContainer[0].id = "line" + Data.createRandomId();
			barChartContainer[0].id = "bar" + Data.createRandomId();
			pieChartContainer[0].id = "pie" + Data.createRandomId();
			mapChartContainer[0].id = "map" + Data.createRandomId();

			//custom filter for searching in basket tags or title
			scope.customFilter = function(term){
				return function(item) {
					if (item.title.toLowerCase().indexOf(term.toLowerCase())>-1 || item.tags.join().toLowerCase().indexOf(term.toLowerCase())>-1 ) {
						return item;
					}
				};
			};

			//get all the basket items of the user
			Basket.getBasketItems(userId, "")
			.then(function(response){
				scope.basketList = response.items;

			}, function(error) {
				console.log('Get Basket Error in Workbench');

			});

			scope.myInterval = 5000;
			scope.noWrapSlides = false;
			scope.active = 0;
			var slides = scope.slides = [];

			var slides = [
				{
					id:0,
					images : [ {
						src: "img/chart_bar.png",
						name: "Line Chart",
						type: "line"
					}, {
						src: "img/chart_bar.png",
						name: "Bar Chart",
						type: "bar"
					}, {
						src: "img/chart_pie.png",
						name: "Pie Chart",
						type: "pie"
					}]
				}, {
					id:1,
					images : [{
						src: "img/chart_bar.png",
						name: "Map",
						type: "map"
					}]
				}
			];

			for (var i = 0; i < slides.length; i++) {
				scope.slides.push(slides[i]);
			}

			/*******************************************/
			/********* DELETE AFTER TESTING ************/
			/******************************************/
			scope.sampleSelectData = [
				"ColumnA", "ColumnB", "ColumnC"
			];
			/*******************************************/
			/****** END OF DELETE AFTER TESTING *******/
			/******************************************/


			//function that clears the visualisation area from previous charts
			var clearVisArea = function () {
				//check if element has client nodes and delete them.
				if (visAreaContainer[0].childNodes.length != 0) {
					while(visAreaContainer[0].firstChild){
						visAreaContainer[0].removeChild(visAreaContainer[0].firstChild);
					}
				}
			};



			var mapInitialised = false;
			scope.selectVisualisation = function(type) {
				switch(type) {
					case "line":
						if (scope.selectedVisualisation != "line") {
							//get data from server for line visualization
							//and init an empty line visualisation

							var options = {
								chart: {
									renderTo: lineChartContainer[0].id
								},
								rangeSelector : {
									selected : 1
								},
								title : {
									text : "My Line Chart"/*,
									 style: {
									 fontSize: titlepx"
									 }*/
								},
								exporting: {
									enabled: true
								},
								navigator: {
									enabled: true
								},
								series : [{
									//name : response.series,
									//data : response.data,
									name : "Series Name",
									data : [],
									tooltip: {
										valueDecimals: 2
									}
								}]
							};

							new Highcharts.StockChart(options);
						}

						break;
					case "bar":
						if (scope.selectedVisualisation != "bar") {
							//get data from server for bar visualization
							//and init an empty line visualisation
						}

						break;
					case "pie":
						if (scope.selectedVisualisation != "pie") {
							//get data from server for pie visualization
							//and init an empty line visualisation
						}

						break;
					case "map":
						if (scope.selectedVisualisation != "map") {
							//get data from server for map visualization
							//and init an empty line visualisation

							if (!mapInitialised) {
								var map = L.map(mapChartContainer[0].id, {
									center: [37.9833333,23.7333333],
									zoom: 5,
									zoomControl: true
								});

								L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
									maxZoom: 18,
									attribution: 'Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
								}).addTo(map);
								mapInitialised = true;
							}
						}

						break;
				}

				scope.selectedVisualisation = type;
			}
		}
	};
}]);