angular.module('yds').directive('ydsWorkbench', ['Data', 'Basket', '$timeout', function(Data, Basket, $timeout){
	return {
		restrict: 'E',
		scope: {
			userId:'@'
		},
		templateUrl: 'templates/workbench.html',
		link: function (scope, element, attrs) {
			var userId = scope.userId;
			var selectedVisualisation = "";
			scope.ydsAlert = "";
			scope.basketList = [];

			//if userId is undefined or empty, stop the execution of the directive
			if (angular.isUndefined(userId) || userId.trim().length==0) {
				scope.ydsAlert = "The YDS component is not properly configured." +
					"Please check the corresponding documentation section";
				return false;
			}

			var elementId = "workbench" + Data.createRandomId();
			var workbenchContainer = angular.element(element[0].querySelector('.vis-area'));
			workbenchContainer[0].id = elementId;


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


			scope.selectVisualisation = function(type) {


				switch(type) {
					case "line":
						if (selectedVisualisation == "line") return;
						//get data from server for line visualization
						//and init an empty line visualisation


						var options = {
							chart: {
								renderTo: elementId
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


						break;
					case "bar":
						if (selectedVisualisation == "bar") return;
						//get data from server for bar visualization
						//and init an empty line visualisation


						break;
					case "pie":
						if (selectedVisualisation == "pie") return;
						//get data from server for pie visualization
						//and init an empty line visualisation


						break;
					case "map":
						if (selectedVisualisation == "map") return;
						//get data from server for map visualization
						//and init an empty line visualisation


						break;
				}

				selectedVisualisation = type;
			}
		}
	};
}]);