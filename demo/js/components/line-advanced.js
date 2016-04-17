angular.module('yds').directive('ydsLineAdvanced', ['$timeout', 'Data', 'Filters', function($timeout, Data, Filters){
	return {
		restrict: 'E',
		scope: {
			projectId: '@',     //id of the project that the data belong
			viewType: '@',     //name of the array that contains the visualised data
			lang: '@',          //lang of the visualised data

			showNavigator: '@', //enable or disable line chart's navigation
			exporting: '@',     //enable or disable the export of the chart
			elementH: '@',      //set the height of the component
			titleSize: '@',     //the size of the chart's main title
			
			combobox: '@',			//set the types of the combobox filters (year, country)
			comboboxLabels: '@',	//set the labels that will be used for each combobox
			comboboxAttrs: '@'		//set the parameter each combobox will sent to the the server
		},
		templateUrl: 'templates/line-advanced.html',
		link: function (scope, element, attrs) {
			//reference the dom element in which the yds-line-advanced is rendered
			var lineContainer = angular.element(element[0].querySelector('.line-container'));
			//set the variables which will be used for the creation of the line chart
			var line = {
				elementId: "line" + Data.createRandomId(),
				projectId: scope.projectId,
				viewType: scope.viewType,
				lang: scope.lang,
				showNavigator: scope.showNavigator,
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

			//check if the projectId attr is defined, else stop the process
			if (angular.isUndefined(line.projectId) || line.projectId.trim()=="") {
				scope.ydsAlert = "The YDS component is not properly configured." +
					"Please check the corresponding documentation section";
				return false;
			}

			//check if pie-type attribute is empty and assign the default value
			if(_.isUndefined(line.viewType) || line.viewType.trim()=="")
				line.viewType = "default";

			//check if the language attr is defined, else assign default value
			if(angular.isUndefined(line.lang) || line.lang.trim()=="")
				line.lang = "en";

			//check if the exporting attr is defined, else assign default value
			if(angular.isUndefined(line.showNavigator) || (line.showNavigator!="true" && line.showNavigator!="false"))
				line.showNavigator = "true";

			//check if the exporting attr is defined, else assign default value
			if(angular.isUndefined(line.exporting) || (line.exporting!="true" && line.exporting!="false"))
				line.exporting = "true";

			//check if the component's height attr is defined, else assign default value
			if(angular.isUndefined(line.elementH) || isNaN(line.elementH))
				line.elementH = 200 ;

			//check if the component's title size attr is defined, else assign default value
			if(angular.isUndefined(line.titleSize) || isNaN(line.titleSize))
				line.titleSize = 18 ;

			//add the unique id generated for the line component and set its height
			lineContainer[0].id = line.elementId;
			lineContainer[0].style.height = line.elementH + 'px';


			/**
			 * function to get the required data of each different type of combobox
			 **/
			var getComboFilterData = function(name) {
				//if the data of the specific type of combobox have already been fetched, return
				if (!_.isUndefined(scope.comboboxData[name]) && scope.comboboxData[name].length>0) {
					return false;
				}

				//if the data of the specific type of combobox doesn't exist, fetch them from the server
				Data.getComboboxFilters(line.projectId, "combobox." + name , line.lang)
					.then(function(response) {
						scope.comboboxData[name] = response.data;
					}, function(error){
						console.log("Error retrieving data for yds-line-advanced filters")
					});
			};


			/**
			 * function to extract the combobox values defined on the element's attributes
			 **/
			var extractFilters = function () {
				//check if all the required attributes for the rendering of fthe comboboxes are defined
				if (!_.isUndefined(line.combobox) && !_.isUndefined(line.comboboxLabels) && !_.isUndefined(line.comboboxAttrs)) {
					//extract and trim their values
					line.combobox = line.combobox.replace(/ /g, "").split(",");
					line.comboboxAttrs = line.comboboxAttrs.replace(/ /g, "").split(",");
					line.comboboxLabels = line.comboboxLabels.split(",");

					//if the different combobox attributes have the same length, extract and save its values
					if (line.combobox.length==line.comboboxLabels.length &&
						line.combobox.length==line.comboboxAttrs.length &&
						line.comboboxLabels.length==line.comboboxAttrs.length ) {

						_.each(line.combobox, function(value, index) {
							getComboFilterData(value);

							scope.comboboxFilters.push({
								selected: "",
								type: value,
								label: line.comboboxLabels[index],
								attribute: line.comboboxAttrs[index]
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
			 * function to render the line chart based on the available filters
			 **/
			var visualizeLineChart = function(filters, initializeFlag) {
				//if the line chart is being initialized for the first time
				//set its options and render the chart without data
				if (initializeFlag) {
					var options = {
						chart: { renderTo: line.elementId },
						rangeSelector : {
							enabled: (line.showNavigator === "true"),
							selected : 1
						},
						scrollbar : { enabled: (line.showNavigator === "true") },
						title : {
							text : "Please apply one of the available filters",
							style: { fontSize: line.titleSize + "px" }
						},
						exporting: { enabled: (line.exporting === "true") },
						navigator: { enabled: (line.showNavigator === "true") }
					};

					line["chart"] = new Highcharts.StockChart(options);
				} else {
					//if the chart has already been rendered, fetch data from the server and visualize the results
					Data.getProvectVisAdvanced("line", line.projectId, line.viewType, line.lang, filters)
						.then(function(response) {
							//get the title of the chart from the result
							var titlePath = response.view[0].attribute;
							var lineTitle = Data.deepObjSearch(response.data, titlePath);

							//set the chart's title
							line["chart"].setTitle({text: lineTitle});

							//remove the existing line chart series
							_.each(line["chart"].series, function(item) {
								item.remove();
							});

							//add the new series to the line chart
							line["chart"].addSeries({
								name : response.data.series,
								data : response.data.data
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
					//if at least one of the filters is selected update the grid
					visualizeLineChart(appliedFilters, false);
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
			
			//initial attempt to render an empty grid, if the filter extraction is successfull
			if (extractFilters())
				visualizeLineChart({}, true);
			else
				scope.ydsAlert = "The YDS component is not properly initialized " +
					"because the projectId or the viewType attribute aren't configured properly." +
					"Please check the corresponding documentation section";
		}
	};
}]);