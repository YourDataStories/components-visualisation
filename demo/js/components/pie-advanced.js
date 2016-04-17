angular.module('yds').directive('ydsPieAdvanced', ['$timeout', 'Data', function($timeout, Data){
	return {
		restrict: 'E',
		scope: {
			projectId: '@',     //id of the project that the data belong
			viewType: '@',     //name of the array that contains the visualised data
			lang: '@',          //lang of the visualised data

			showLegend: '@',    //enable or disable the chart's legend
			exporting: '@',     //enable or disable the export of the chart
			elementH: '@',      //set the height of the component
			titleSize: '@',     //the size of the chart's main title

			combobox: '@',			//set the types of the combobox filters (year, country)
			comboboxLabels: '@',	//set the labels that will be used for each combobox
			comboboxAttrs: '@'		//set the parameter each combobox will sent to the the server
		},
		templateUrl: 'templates/pie-advanced.html',
		link: function (scope, element, attrs) {
			//reference the dom element in which the yds-pie-advanced is rendered
			var pieContainer = angular.element(element[0].querySelector('.pie-container'));

			//set the variables which will be used for the creation of the pie chart
			var pie = {
				elementId: "pie" + Data.createRandomId(),
				projectId: scope.projectId,
				viewType: scope.viewType,
				lang: scope.lang,
				showLegend: scope.showLegend,
				exporting: scope.exporting,
				elementH: scope.elementH,
				titleSize: scope.titleSize,
				combobox: scope.combobox,
				comboboxLabels: scope.comboboxLabels,
				comboboxAttrs: scope.comboboxAttrs
			};

			//array containing the selected data of the rendered comboboxes
			scope.comboboxFilters = [];
			//object containing the data for each different type of combobox
			scope.comboboxData = {};

			
			//check if the projectId is defined, else stop the process
			if (angular.isUndefined(pie.projectId) || pie.projectId.trim()=="") {
				scope.ydsAlert = "The YDS component is not properly configured." +
					"Please check the corresponding documentation section";
				return false;
			}

			//check if view-type attribute is empty and assign the default value
			if(_.isUndefined(pie.viewType) || pie.viewType.trim()=="")
				pie.viewType = "default";

			//check if the language attr is defined, else assign default value
			if(angular.isUndefined(pie.lang) || pie.lang.trim()=="")
				pie.lang = "en";

			//check if the showLegend attr is defined, else assign default value
			if(angular.isUndefined(pie.showLegend) || (pie.showLegend!="true" && pie.showLegend!="false"))
				pie.showLegend = "true";

			//check if the exporting attr is defined, else assign default value
			if(angular.isUndefined(pie.exporting) || (pie.exporting!="true" && pie.exporting!="false"))
				pie.exporting = "true";

			//check if the component's height attr is defined, else assign default value
			if(angular.isUndefined(pie.elementH) || isNaN(pie.elementH))
				pie.elementH = 200 ;

			//check if the component's title size attr is defined, else assign default value
			if(angular.isUndefined(pie.titleSize) || isNaN(pie.titleSize))
				pie.titleSize = 18 ;

			//add the unique id generated for the pie component and set its height
			pieContainer[0].id = pie.elementId;
			pieContainer[0].style.height = pie.elementH + 'px';

			/**
			 * function to get the required data of each different type of combobox
			 **/
			var getComboFilterData = function(name) {
				//if the data of the specific type of combobox have already been fetched, return
				if (!_.isUndefined(scope.comboboxData[name]) && scope.comboboxData[name].length>0) {
					return false;
				}

				//if the data of the specific type of combobox doesn't exist, fetch them from the server
				Data.getComboboxFilters(pie.projectId, "combobox." + name , pie.lang)
					.then(function(response) {
						scope.comboboxData[name] = response.data;
					}, function(error){
						console.log("Error retrieving data for yds-pie-advanced filters")
					});
			};


			/**
			 * function to extract the combobox values defined on the element's attributes
			 **/
			var extractFilters = function () {
				//check if all the required attributes for the rendering of fthe comboboxes are defined
				if (!_.isUndefined(pie.combobox) && !_.isUndefined(pie.comboboxLabels) && !_.isUndefined(pie.comboboxAttrs)) {
					//extract and trim their values
					pie.combobox = pie.combobox.replace(/ /g, "").split(",");
					pie.comboboxAttrs = pie.comboboxAttrs.replace(/ /g, "").split(",");
					pie.comboboxLabels = pie.comboboxLabels.split(",");

					//if the different combobox attributes have the same length, extract and save its values
					if (pie.combobox.length==pie.comboboxLabels.length &&
						pie.combobox.length==pie.comboboxAttrs.length &&
						pie.comboboxLabels.length==pie.comboboxAttrs.length ) {

						_.each(pie.combobox, function(value, index) {
							getComboFilterData(value);

							scope.comboboxFilters.push({
								selected: "",
								type: value,
								label: pie.comboboxLabels[index],
								attribute: pie.comboboxAttrs[index]
							});
						});

						return true;
					}
				}

				//if the different attributes doesn't have the same length, show an error message and return
				scope.ydsAlert = "The YDS component is not properly initialized " +
					"because the projectId or the viewType attribute aren't configured properly." +
					"Please check the corresponding documentation sertion";
				return false;
			};


			/**
			 * function to render the pie chart based on the available filters
			 **/
			var visualizePieChart = function(filters, initializeFlag) {
				//if the pie chart is being initialized for the first time
				//set its options and render the chart without data
				if (initializeFlag) {
					var options = {
						chart: {
							type: 'pie',
							renderTo: pie.elementId
						},
						title: {
							text : "Please apply one of the available filters",
							style: { fontSize: pie.titleSize + "px" }
						},
						tooltip: { pointFormat: '({point.y}) <b>{point.percentage:.1f}%</b>' },
						legend: { enabled: (pie.showLegend === "true") },
						exporting: { enabled: (pie.exporting === "true") },
						plotOptions: {
							pie: {
								allowPointSelect: true,
								cursor: 'pointer',
								dataLabels: {
									enabled: true,
									format: '<b>{point.name}</b>: {point.percentage:.1f} %',
									style: {
										color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black'
									}
								}
							}
						}
					};

					pie["chart"] = new Highcharts.Chart(options);
				} else {
					//if the chart has already been rendered, fetch data from the server and visualize the results
					Data.getProvectVisAdvanced("pie", pie.projectId, pie.viewType, pie.lang, filters)
						.then(function(response) {
							//get the title of the chart from the result
							var titlePath = response.view[0].attribute;
							var pieTitle = Data.deepObjSearch(response.data, titlePath);

							//set the chart's title
							pie["chart"].setTitle({text: pieTitle});

							//remove the existing pie chart series
							_.each(pie["chart"].series, function(item) {
								item.remove();
							});

							//add the new series to the pie chart
							pie["chart"].addSeries({
								name: response.data.series,
								data: response.data.data,
								colorByPoint: true
							});

						}, function (error) {
							if (error==null || _.isUndefined(error) || _.isUndefined(error.message))
								scope.ydsAlert = "An error was occurred, please try with a different filter";
							else
								scope.ydsAlert = error.message;

							$timeout(function () {
								scope.ydsAlert = "";
							}, 4000)
						});
				}
			};


			/**
			 * function called when the 'apply filters' btn is clicked
			 **/
			scope.applyComboFilters = function() {
				var valid = false;
				var appliedFilters = {};

				//iterate through the data of the rendered filters and check which of them are selected
				_.each(scope.comboboxFilters, function (filter) {
					if (filter.selected != null && !_.isUndefined(filter.selected.value)) {
						appliedFilters[filter.attribute] = filter.selected.value;
						valid = true;
					}
				});

				//if none of the filters are selected show an error message
				if (!valid) {
					scope.ydsAlert = "Please select at least one filter";
					$timeout(function () {
						scope.ydsAlert = "";
					}, 2000)
				} else if (_.keys(appliedFilters).length > 0) {
					//if at least one of the filters is selected update the pie
					visualizePieChart(appliedFilters, false);
				}
			};


			/**
			 * function called when the 'clear filters' btn is clicked
			 **/
			scope.clearComboFilters = function() {
				//clear the filters' error message and initialize the selected value of each filter
				scope.ydsAlert = "";

				_.each(scope.comboboxFilters, function (filter) {
					filter.selected = "";
				});
			};

			//initial attempt to render an empty pie, if the filter extraction is successfull
			if (extractFilters())
				visualizePieChart({}, true);
			else
				scope.ydsAlert = "The YDS component is not properly initialized " +
					"because the projectId or the viewType attribute aren't configured properly." +
					"Please check the corresponding documentation section";
		}
	};
}]);