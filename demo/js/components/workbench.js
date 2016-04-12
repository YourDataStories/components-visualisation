angular.module('yds').directive('ydsWorkbench', ['Data', 'Basket', '$timeout', '$window', 'Workbench',
	function(Data, Basket, $timeout, $window, Workbench){
	return {
		restrict: 'E',
		scope: {
			lang: '@',
			userId:'@'
		},
		templateUrl: 'templates/workbench.html',
		link: function (scope, element) {
			scope.ydsAlert = "";

			//if userId is undefined or empty, stop the execution of the directive
			if (angular.isUndefined(scope.userId) || scope.userId.trim().length==0) {
				scope.ydsAlert = "The YDS component is not properly configured." +
					"Please check the corresponding documentation section";
				return false;
			}

			//check if the language attr is defined, else assign default value
			if(angular.isUndefined(scope.lang) || scope.lang.trim()=="")
				scope.lang = "en";

			var lineChartContainer = angular.element(element[0].querySelector('.vis-area-line'));
			var pieChartContainer = angular.element(element[0].querySelector('.vis-area-pie'));
			var mapChartContainer = angular.element(element[0].querySelector('.vis-area-map'));

			lineChartContainer[0].id = "line" + Data.createRandomId();
			pieChartContainer[0].id = "pie" + Data.createRandomId();
			mapChartContainer[0].id = "map" + Data.createRandomId();
			
			scope.basketVars = {
				selBasketIds: [],
				basketList: [],
				searchText: ""
			};
			
			scope.lineChart = {
				data: [],
				chart: {},
				options: {
					chart: { renderTo: lineChartContainer[0].id },
					rangeSelector : { enabled: false },
					scrollbar : { enabled: false },
					title : { text : "Not available" },
					exporting: { enabled: true },
					navigator: { enabled: false },
					series : []
				},
				selectedAxisX: "",
				selectedAxisYa: "",
				selectedAxisYb: "",
				selectedAxisYc: "",
				axisX: [],
				axisY: []
			};
			
			scope.workbenchVars = {
				selectedVis: "default",
				availableViews: [],
				availableViewsRaw: [],
				selectedView: "",
				selectedViewObj: {}
			};

			scope.noWrapSlides = false;
			scope.active = 0;
			scope.slides = Workbench.getSlides();

			//get all the basket items of the user
			var getBasketItems = function () {
				Basket.getBasketItems(scope.userId, "dataset")
				.then(function(response){
					scope.basketVars.basketList = response.items;
				}, function(error) {
					console.log('Get Basket Error in Workbench');
				});
			};

			//custom filter for searching in basket tags or title
			scope.customBasketFilter = function(term){
				return function(item) {
					if (item.title.toLowerCase().indexOf(term.toLowerCase())>-1 || item.tags.join().toLowerCase().indexOf(term.toLowerCase())>-1 ) {
						return item;
					}
				};
			};

			//function to select a basket item
			scope.selectBasketItem = function(itemIndex) {
				var selectedItem = scope.basketVars.basketList[itemIndex];

				if (_.isUndefined(selectedItem))
					return false;

				if (_.isUndefined(selectedItem.selected))
					selectedItem.selected = true;
				else
					selectedItem.selected = !selectedItem.selected;

				scope.basketVars.selBasketIds = _.pluck(_.where(scope.basketVars.basketList, {selected: true}), 'basket_item_id');

				Workbench.getAvailableVisualisations(scope.lang, scope.basketVars.selBasketIds)
					.then(function(response){
						scope.workbenchVars.availableViews = _.pluck(response.data, 'type');
						scope.workbenchVars.availableViewsRaw = response.data;
					}, function(error) {
						debugger
					});
			};

			//function called when user selects one of the available views
			scope.selectView = function(viewName) {
				scope.workbenchVars.selectedViewObj = _.findWhere(scope.workbenchVars.availableViewsRaw, {type: viewName});

				if (!_.isUndefined(scope.workbenchVars.selectedViewObj)) {
					var viewComponents = _.pluck(scope.workbenchVars.selectedViewObj.values, 'component');

					_.each(scope.slides, function(slideView){
						_.each(slideView.images, function(slide){
							if(_.contains(viewComponents, slide.type) && slide.visible==false ) {
								slide.visible = true;
							}
						});
					})
				} else {
					scope.workbenchVars.selectedVis = "default"
					_.each(scope.slides, function(slideView){
						_.each(slideView.images, function(slide){
							slide.visible = false;
						});
					})

				}
			};

			getBasketItems();


			var triggerResizeEvt = function() {
				var evt = $window.document.createEvent('UIEvents');
				evt.initUIEvent('resize', true, false, $window, 0);
				$window.dispatchEvent(evt);
			};
			
			scope.createVisualization = function() {
				Workbench.generateLinechart(scope.workbenchVars.selectedView, scope.lineChart.axisX[0].attribute,
											scope.lineChart.axisY[0].attribute, scope.basketVars.selBasketIds)
					.then(function(response){
							scope.lineChart.data = response.data.data;
							scope.lineChart.title = Data.deepObjSearch(response.data, response.view[0].attribute + "." + scope.lang)

                            scope.lineChart.chart.setTitle({ text: scope.lineChart.title });
							scope.lineChart.chart.addSeries({
								name : scope.lineChart.series,
								data : scope.lineChart.data,
								tooltip: {
									valueDecimals: 2
								}
							});

							scope.lineChart.chart.redraw();
					}, function (error) {
						debugger;
					})
			};
			
			var lineInit = barInit = pieInit = mapInit = false;
			scope.selectVisualisation = function(slideId, type) {
				if (!Workbench.checkVisAvailability(slideId, type)) {
					return false;
				} else {
					scope.workbenchVars.selectedVis = type;

					switch(scope.workbenchVars.selectedVis) {
						case "linechart":
							var linechartInput = _.findWhere(scope.workbenchVars.selectedViewObj.values, {component: type})//;.values;

							if (!_.isUndefined(linechartInput)) {
								scope.lineChart.axisX = linechartInput["axis-x"];
								scope.lineChart.axisY = linechartInput["axis-y"];
							}

							break;
					}
				}

				switch(type) {
					case "linechart":
						if (!lineInit) {
							scope.lineChart.chart = new Highcharts.StockChart(scope.lineChart.options);
							lineInit = true;

							$timeout(function(){
								triggerResizeEvt();
							});
						}

						break;
					/*case "pie":
						if (scope.selectedVisualisation != "pie") {
							//get data from server for pie visualization
							//and init an empty line visualisation
						}

						if (!pieInit) {
							var options = {
								chart: {
									plotBackgroundColor: null,
									plotBorderWidth: null,
									plotShadow: false,
									type: 'pie',
									renderTo: pieChartContainer[0].id
								},
								title: { text: "My Pie Chart" },
								tooltip: {
									pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
								},
								legend: { enabled: true },
								exporting: { enabled: true },
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
									name: [],
									colorByPoint: true,
									data: []
								}]
							};

							$timeout(function(){
								triggerResizeEvt();
								new Highcharts.Chart(options);
								pieInit = true;
							});
						}

						break;*/
				}
			}
		}
	};
}]);