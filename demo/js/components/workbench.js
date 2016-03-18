angular.module('yds').directive('ydsWorkbench', ['Data', 'Basket', '$timeout', '$window',
	function(Data, Basket, $timeout, $window){
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
						src: "img/thumbnails/line_chart.png",
						name: "Line Chart",
						type: "line"
					}, {
						src: "img/thumbnails/bar_chart.png",
						name: "Bar Chart",
						type: "bar"
					}, {
						src: "img/thumbnails/pie_chart.png",
						name: "Pie Chart",
						type: "pie"
					}]
				}, {
					id:1,
					images : [{
						src: "img/thumbnails/map.png",
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

			var triggerResizeEvt = function() {
				var evt = $window.document.createEvent('UIEvents');
				evt.initUIEvent('resize', true, false, $window, 0);
				$window.dispatchEvent(evt);
			};


			var lineInit = barInit = pieInit = mapInit = false;
			scope.selectVisualisation = function(type) {
				switch(type) {
					case "line":
						if (scope.selectedVisualisation != "line") {
							//get data from server for line visualization
							//and init an empty line visualisation
						}

						if (!lineInit) {
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


							$timeout(function(){
								triggerResizeEvt();
								new Highcharts.StockChart(options);
							});

							lineInit = true;
						}

						break;
					case "bar":
						if (!barInit) {
							var options = {
								chart: {
									type: 'column',
									renderTo: barChartContainer[0].id
								},
								title: {
									text: "My Bar Chart"/*,
									style: {
										fontSize: titleSize + "px"
									}*/
								},
								xAxis: {
									categories: [],
									//categories: response.categories,
									crosshair: true,
									title : { text: "xAxis" },
									labels: { enabled: true }
								},
								yAxis: {
									title : { text: "yAxis" },
									labels: { enabled: true }
								},
								legend: {
									enabled: true
								},
								exporting: {
									enabled: true
								},
								/*tooltip: {
									headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
									pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
									'<td style="padding:0"><b>{point.y:.1f}</b></td></tr>',
									footerFormat: '</table>',
									shared: true,
									useHTML: true
								},*/
								plotOptions: {
									column: {
										pointPadding: 0.2,
										borderWidth: 0
									}
								},
								series: []
							};


							$timeout(function(){
								triggerResizeEvt();
								new Highcharts.Chart(options);
							});

							barInit = true;
						}

						break;
					case "pie":
						if (scope.selectedVisualisation != "pie") {
							//get data from server for pie visualization
							//and init an empty line visualisation
						}

						if (!pieInit) {

							pieInit = true;
						}

						break;
					case "map":
						if (scope.selectedVisualisation != "map") {
							//get data from server for map visualization
							//and init an empty line visualisation

							if (!mapInit) {
								var map = L.map(mapChartContainer[0].id, {
									center: [37.9833333,23.7333333],
									zoom: 5,
									zoomControl: true
								});

								$timeout(function(){
									triggerResizeEvt();
									L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
										maxZoom: 18,
										attribution: 'Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
									}).addTo(map);
								});

								mapInit = true;
							}
						}

						break;
				}

				scope.selectedVisualisation = type;
			}
		}
	};
}]);