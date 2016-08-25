angular.module('yds').directive('ydsWorkbench', ['$ocLazyLoad', '$timeout', '$window', 'Data', 'Basket', 'Workbench',
	function($ocLazyLoad, $timeout, $window, Data, Basket, Workbench){
	return {
		restrict: 'E',
		scope: {
			lang: '@',
			userId:'@'
		},
		templateUrl: ((typeof Drupal != 'undefined')? Drupal.settings.basePath  + Drupal.settings.yds_project.modulePath  +'/' :'') + 'templates/workbench.html',
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
			var barChartContainer = angular.element(element[0].querySelector('.vis-area-bar'));
			var pieChartContainer = angular.element(element[0].querySelector('.vis-area-pie'));

			lineChartContainer[0].id = "line" + Data.createRandomId();
			barChartContainer[0].id = "bar" + Data.createRandomId();
			pieChartContainer[0].id = "pie" + Data.createRandomId();

			scope.workbench = Workbench.init();
			scope.slidesConfig = Workbench.getSlidesConfig();
			scope.lineChart = Workbench.initLineChart(lineChartContainer[0].id);
			scope.barChart = Workbench.initBarChart(barChartContainer[0].id);

			scope.basketVars = {
				selBasketIds: [],
				basketList: [],
				searchText: ""
			};

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
						scope.workbench.availableViews = _.pluck(response.data, 'type');
						scope.workbench.availableViewsRaw = response.data;
					}, function(error) {
						console.log("error in getAvailableVisualisations function")
					});
			};

			//function called when user selects one of the available views
			scope.selectView = function(viewName) {
				scope.workbench.selectedViewObj = _.findWhere(scope.workbench.availableViewsRaw, {type: viewName});

				if (!_.isUndefined(scope.workbench.selectedViewObj)) {
					var viewComponents = _.pluck(scope.workbench.selectedViewObj.values, 'component');

					_.each(scope.slidesConfig.slides, function(slideView){
						_.each(slideView.images, function(slide){
							if(_.contains(viewComponents, slide.type) && slide.visible==false ) {
								slide.visible = true;
							}
						});
					})
				} else {
					scope.workbench.selectedVis = "default";
					_.each(scope.slidesConfig.slides, function(slideView){
						_.each(slideView.images, function(slide){
							slide.visible = false;
						});
					})

				}
			};


			/**
			 * functions used to show or hide alert messages in workbench
			 **/
			var setAlertMsg = function(message, time) {
				scope.workbench.alert = message;

				if (time>0) {
					$timeout(function() {
						scope.workbench.alert = "";
					}, time);
				}
			};

			var hideAlertMessage = function() {
				scope.workbench.alert = "";
			};


			/**********************************************/
			/************ LINE CHART FUNCTIONS ************/
			/**********************************************/

			/**
			 * functions used to add or remove comboboxes to/from the line chart configuration
			 **/
			scope.addLineAxisY = Workbench.addLineAxisY;
			scope.removeLineAxisY = Workbench.removeLineAxisY;


			/**
			 * function used to create the line chart visualization based on the supplied configuration
			 **/
			var createLineChart = function(lineInput) {
				//remove the existing line chart series
				if(!_.isUndefined(scope.lineChart.chart.series)) {
					while(scope.lineChart.chart.series.length > 0)
						scope.lineChart.chart.series[0].remove(true);
				}

				//get the data and the title of the chart
				scope.lineChart.data = lineInput.data.data;
				scope.lineChart.title = Data.deepObjSearch(lineInput.data, lineInput.view[0].attribute + "." + scope.lang);

				//if the line chart is visualized for the first time, create it
				if (!Workbench.getLineChartStatus()) {
					scope.lineChart.chart = new Highcharts.StockChart(scope.lineChart.options);
					scope.lineChart.initialized = true;
				}

				//set the title of the line chart and add its series
				scope.lineChart.chart.setTitle({ text: scope.lineChart.title });
				scope.lineChart.chart.addSeries({
					name : scope.lineChart.series,
					data : scope.lineChart.data,
					tooltip: {
						valueDecimals: 2
					}
				});

				scope.lineChart.chart.redraw();
			};


			/**********************************************/
			/************ BAR CHART FUNCTIONS *************/
			/**********************************************/

			/**
			 * functions used to add or remove comboboxes to/from the bar chart configuration
			 **/
			scope.addBarAxisY = Workbench.addBarAxisY;
			scope.removeBarAxisY = Workbench.removeBarAxisY;

			
			/**
			 * function used to create the bar chart visualization based on the supplied configuration
			 **/
			var createBarChart = function(barInput) {
				//remove the existing bar chart series
				if(!_.isUndefined(scope.barChart.chart.series)) {
					while(scope.barChart.chart.series.length > 0)
						scope.barChart.chart.series[0].remove(true);
				}

				//get the data, the categories and the title of the chart
				scope.barChart.data = barInput.data.data;
				scope.barChart.categories = barInput.data.categories;
				scope.barChart.title = Data.deepObjSearch(barInput.data, barInput.view[0].attribute);

				//if the line chart is visualized for the first time, create it
				if (!Workbench.getBarChartStatus()) {
					scope.barChart.chart = new Highcharts.Chart(scope.barChart.options);
					scope.barChart.initialized = true;
				}

				//set the title of the line chart and add its series
				scope.barChart.chart.setTitle({ text: scope.lineChart.title });
				scope.barChart.chart.xAxis[0].setCategories(scope.barChart.categories);
				_.each(scope.barChart.data, function(serie){
					scope.barChart.chart.addSeries(serie);
				});

				scope.barChart.chart.redraw();
			};


			/**********************************************/
			/***** GENERAL - VISUALIZATION FUNCTIONS ******/
			/**********************************************/
			scope.selectVisualisation = function(slideId, type) {
				if (!Workbench.checkVisAvailability(slideId, type)) {
					return false;
				} else {
					scope.workbench.selectedVis = type;

					switch(scope.workbench.selectedVis) {
						case "linechart":
							var linechartInput = _.findWhere(scope.workbench.selectedViewObj.values, {component: type});

							if (!_.isUndefined(linechartInput)) {
								scope.lineChart.axisX = linechartInput["axis-x"];
								scope.lineChart.axisY = linechartInput["axis-y"];

								if(scope.lineChart.axisX.length==1)
									scope.lineChart.selectedAxisX = scope.lineChart.axisX[0];

								scope.lineChart.axisYConfig = [{
									selected: "",
									options: scope.lineChart.axisY
								}]
							}

							break;
						case "barchart":
							var barchartInput = _.findWhere(scope.workbench.selectedViewObj.values, {component: type});

							if (!_.isUndefined(barchartInput)) {
								scope.barChart.axisX = barchartInput["axis-x"];
								scope.barChart.axisY = barchartInput["axis-y"];

								if(scope.barChart.axisX.length==1)
									scope.barChart.selectedAxisX = scope.barChart.axisX[0];

								scope.barChart.axisYConfig = [{
									selected: "",
									options: scope.barChart.axisY
								}];
							}
							
							break;
					}
				}
			};


			/**
			 * filter function applied on the in comboboxes which are used
			 * for the configuration of the line & bar chart visualization
			 **/
			scope.lineBarFilterY= function (index, type) {
				return function (item) {
					var attrSelected = false;
					var chartAxisY = scope.$eval(type + '.axisYConfig');
					var axisYConfig = angular.copy(chartAxisY);

					//if the filtered attribute is already selected, return it
					if (axisYConfig[index].selected!=null && axisYConfig[index].selected.attribute == item.attribute)
						return item;

					//else search if the attribute is selected in one of the other compoboxes
					axisYConfig.splice(index, 1);
					if (axisYConfig.length > 0) {
						var existingCombos = _.where(_.pluck(axisYConfig, 'selected'), {attribute: item.attribute});

						if (existingCombos.length > 0)
							attrSelected = true;
					}

					//if the attribute is not selected in none of the comboboxes return it as available
					if (!attrSelected)
						return item;
				};

			};

            /**
             * Function that gets an axis object with all the attributes of the axis, and returns only the ones needed
             * by the API
             * @param axis
             * @returns {{attribute: *, field_id: *, function: *, label: *, type: *}}
             */
			var neededAxisProperties = function(axis) {
				return {
					attribute: axis.attribute,
					field_id: axis.field_id,
					function: axis.function,
					label: axis.label,
					type: axis.type
				};
			};

			/**
			 * function called when "Visualise Data" is clicked, which is responsible to fetch the data of the
			 * selected visualization and call the corresponding chart visualization function
			 **/
			scope.createVisualization = function() {
				switch(scope.workbench.selectedVis) {
					case "linechart":
						// Gather selected y axis attributes
						var lineAxisYAttrs = [];
						_.forEach(scope.lineChart.axisYConfig, function(axis){
							if (axis.selected!=null && !_.isUndefined(axis.selected) && _.isObject(axis.selected))
								lineAxisYAttrs.push(neededAxisProperties(axis.selected));
						});

                        // Get needed X axis properties to send
                        var lineAxisXAttrs = neededAxisProperties(scope.lineChart.selectedAxisX);

						if (lineAxisYAttrs.length > 0) {
							Workbench.getLineBarVis(scope.workbench.selectedVis, scope.workbench.selectedView,
								lineAxisXAttrs, lineAxisYAttrs, scope.basketVars.selBasketIds, scope.lang)
								.then(function (response) {
									createLineChart(response);
								}, function (error) {
									console.log("error in linechart - getLineBarVis function");
								});
						} else
							setAlertMsg("Please select a Y axis attribute.", 2000);

						break;
					case "barchart":
						// Gather selected y axis attributes
						var barAxisYAttrs = [];
						_.forEach(scope.barChart.axisYConfig, function(axis){
							if (axis.selected!=null && !_.isUndefined(axis.selected) && _.isObject(axis.selected)) {
								barAxisYAttrs.push(neededAxisProperties(axis.selected));
							}
						});

						// Get needed X axis properties to send
                        var barAxisXAttrs = neededAxisProperties(scope.barChart.selectedAxisX);

						if (barAxisYAttrs.length > 0) {
							Workbench.getLineBarVis(scope.workbench.selectedVis, scope.workbench.selectedView,
								barAxisXAttrs, barAxisYAttrs, scope.basketVars.selBasketIds, scope.lang)
								.then(function (response) {
									createBarChart(response);
								}, function (error) {
									console.log("error in barchart - getLineBarVis function");
								});
						} else
							setAlertMsg("Please select a Y axis attribute.", 2000);

						break;
				}
			};

			var triggerResizeEvt = function() {
				var evt = $window.document.createEvent('UIEvents');
				evt.initUIEvent('resize', true, false, $window, 0);
				$window.dispatchEvent(evt);
			};


			//function to prepare the templates used in search results 
			var loadTemplates = function(){
				$ocLazyLoad.load ({
					files: ['templates/workbench/linechart-config.html',
							'templates/workbench/barchart-config.html'],
					cache: true
				}).then(function(response) {
					console.log("Templates properly loaded:", response);
				});
			};

			loadTemplates();
			getBasketItems();
		}
	};
}]);