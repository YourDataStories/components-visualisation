angular.module('yds').directive('ydsLineAdvanced', ['$timeout', '$q', 'Data', 'Filters', function($timeout, $q, Data, Filters){
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
		templateUrl: ((typeof Drupal != 'undefined')? Drupal.settings.basePath  + Drupal.settings.yds_project.modulePath  +'/' :'') + 'templates/line-advanced.html',
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
			 * function show errors on top of the visualization
			 **/
			var showAlert = function(alertMsg, predefined, persistent) {
				if(!predefined)
					scope.ydsAlert = alertMsg;
				else
					scope.ydsAlert = "The YDS component is not properly initialized " +
						"because the projectId or the viewType attribute aren't configured properly." +
						"Please check the corresponding documentation section";

				if (!persistent)
					$timeout(function () { scope.ydsAlert = ""; }, 2000);
			};


			/**
			 * function to get the required data of each different type of combobox
			 **/
			var getComboFilterData = function(name, attribute) {
				var deferred = $q.defer();

				Data.getComboboxFilters(line.projectId, "combobox." + name , attribute, line.lang)
				.then(function(response) {
					scope.comboboxData[attribute] = response.data;

					//find the filter entry and assign the default value
					var filterObj  = _.findWhere(scope.comboboxFilters, {"attribute": attribute});
					if (!_.isUndefined(filterObj))
						filterObj.selected =  _.findWhere(response.data, response.default);

					deferred.resolve(response);
				}, function(error){
					deferred.reject(error);
				});

				return deferred.promise;
			};

			/**
			 * function to extract the combobox values defined on the element's attributes
			 **/
			var extractFilters = function () {
				//check if all the required attributes for the rendering of fthe comboboxes are defined
				if (!_.isUndefined(line.combobox) && !_.isUndefined(line.comboboxLabels) && !_.isUndefined(line.comboboxAttrs)) {
					//extract and trim their values
					var filterPromises = [];
					line.combobox = line.combobox.replace(/ /g, "").split(",");
					line.comboboxAttrs = line.comboboxAttrs.replace(/ /g, "").split(",");
					line.comboboxLabels = line.comboboxLabels.split(",");

					//if the different combobox attributes have the same length, extract and save its values
					if (line.combobox.length==line.comboboxLabels.length &&
						line.combobox.length==line.comboboxAttrs.length &&
						line.comboboxLabels.length==line.comboboxAttrs.length ) {

						//iterate through the user provided comboboxes and fetch their data
						_.each(line.combobox, function(value, index) {
							var newFilter = {
								selected: "",
								type: value,
								label: line.comboboxLabels[index],
								attribute: line.comboboxAttrs[index]
							};

							scope.comboboxFilters.push(newFilter);
							filterPromises.push(getComboFilterData(newFilter.type, newFilter.attribute));
						});

						//when the data of all the filters have been returned, create the corresponding visualization
						$q.all(filterPromises).then(function() {
							scope.applyComboFilters();
						}, function(error) {
							showAlert("", true, true);
						});
					} else {
						showAlert("", true, true);
					}
				} else
					showAlert("", true, true);
			};


			/**
			 * function to render the line chart based on the available filters
			 **/
			var visualizeLineChart = function(filters) {
				//if the line chart is being initialized for the first time
				//set its options and render the chart without data
				if (_.isUndefined(line["chart"])) {
					var options = {
						chart: { renderTo: line.elementId },
						rangeSelector : {
							enabled: (line.showNavigator === "true"),
							selected : 1
						},
						scrollbar : { enabled: (line.showNavigator === "true") },
						title : {
							text : "",
							style: { fontSize: line.titleSize + "px" }
						},
						exporting: { enabled: (line.exporting === "true") },
						navigator: { enabled: (line.showNavigator === "true") }
					};

					line["chart"] = new Highcharts.StockChart(options);
				}

				//if the chart has already been rendered, fetch data from the server and visualize the results
				Data.getProjectVisAdvanced("line", line.projectId, line.viewType, line.lang, filters)
				.then(function(response) {
					//get the title of the chart from the result
					var titlePath = response.view[0].attribute;
					var lineTitle = Data.deepObjSearch(response.data, titlePath);

					//set the chart's title
					line["chart"].setTitle({text: lineTitle});

					//remove the existing line chart series
					while(line["chart"].series.length > 0)
						line["chart"].series[0].remove(true);

					//add the new series to the line chart
					line["chart"].addSeries({
						name : response.data.series,
						data : response.data.data
					});
				}, function (error) {
					showAlert(error.message, false, false);
				});
			};


			/**
			 * function called when the 'apply filters' btn is clicked
			 **/
			scope.applyComboFilters = function() {
				var appliedFilters = {};

				//iterate through the data of the rendered filters and check which of them are selected
				_.each(scope.comboboxFilters, function (filter) {
					if (filter.selected != null && !_.isUndefined(filter.selected.value))
						appliedFilters[filter.attribute] = filter.selected.value;
				});

				///if at least one of the filters is not selected show an error message
				if (_.keys(appliedFilters).length != scope.comboboxFilters.length) {
					var errorMsg = "Please select a value for all the available filters";
					showAlert(errorMsg, false, false);
				} else {
					//if all the filters is selected update the line
					visualizeLineChart(appliedFilters);
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

			//extract the user provided filters, and render the line chart
			extractFilters();
		}
	};
}]);