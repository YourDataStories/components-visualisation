angular.module('yds').directive('ydsBarAdvanced', ['$timeout', '$q', 'Data', 'Filters', function($timeout, $q, Data, Filters){
	return {
		restrict: 'E',
		scope: {
			projectId: '@',     //id of the project that the data belong
			viewType: '@',     	//name of the array that contains the visualised data
			lang: '@',          //lang of the visualised data

			showLabelsX: '@',   //show or hide the X-axis label
			showLabelsY: '@',   //show or hide the Y-axis label
			showLegend: '@',    //enable or disable the chart's legend
			exporting: '@',     //enable or disable the export of the chart
			elementH: '@',      //set the height of the component
			titleSize: '@',     //the size of the chart's main title

			combobox: '@',			//set the types of the combobox filters (year, country)
			comboboxLabels: '@',	//set the labels that will be used for each combobox
			comboboxAttrs: '@'		//set the parameter each combobox will sent to the the server
		},
		templateUrl: Data.templatePath + 'templates/bar-advanced.html',
		link: function (scope, element, attrs) {
			//reference the dom element in which the yds-bar-advanced is rendered
			var barContainer = angular.element(element[0].querySelector('.bar-container'));
			//set the variables which will be used for the creation of the bar chart
			var bar = {
				elementId: "bar" + Data.createRandomId(),
				projectId: scope.projectId,
				viewType: scope.viewType,
				lang: scope.lang,
				showLabelsX: scope.showLabelsX,
				showLabelsY: scope.showLabelsY,
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

			//check if the projectId attr is defined, else stop the process
			if (angular.isUndefined(bar.projectId) || bar.projectId.trim()=="") {
				scope.ydsAlert = "The YDS component is not properly configured." +
					"Please check the corresponding documentation section";
				return false;
			}

			//check if pie-type attribute is empty and assign the default value
			if(_.isUndefined(bar.viewType) || bar.viewType.trim()=="")
				bar.viewType = "default";

			//check if the language attr is defined, else assign default value
			if(angular.isUndefined(bar.lang) || bar.lang.trim()=="")
				bar.lang = "en";

			//check if the x-axis showLabels attr is defined, else assign default value
			if(angular.isUndefined(bar.showLabelsX) || (bar.showLabelsX!="true" && bar.showLabelsX!="false"))
				bar.showLabelsX = "true";

			//check if the y-axis showLabels attr is defined, else assign default value
			if(angular.isUndefined(bar.showLabelsY) || (bar.showLabelsY!="true" && bar.showLabelsY!="false"))
				bar.showLabelsY = "true";

			//check if the showLegend attr is defined, else assign default value
			if(angular.isUndefined(bar.showLegend) || (bar.showLegend!="true" && bar.showLegend!="false"))
				bar.showLegend = "true";
			
			//check if the exporting attr is defined, else assign default value
			if(angular.isUndefined(bar.exporting) || (bar.exporting!="true" && bar.exporting!="false"))
				bar.exporting = "true";

			//check if the component's height attr is defined, else assign default value
			if(angular.isUndefined(bar.elementH) || isNaN(bar.elementH))
				bar.elementH = 200 ;

			//check if the component's title size attr is defined, else assign default value
			if(angular.isUndefined(bar.titleSize) || isNaN(bar.titleSize))
				bar.titleSize = 18 ;

			//add the unique id generated for the bar component and set its height
			barContainer[0].id = bar.elementId;
			barContainer[0].style.height = bar.elementH + 'px';


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

				Data.getComboboxFilters(bar.projectId, "combobox." + name , attribute, bar.lang)
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
				if (!_.isUndefined(bar.combobox) && !_.isUndefined(bar.comboboxLabels) && !_.isUndefined(bar.comboboxAttrs)) {
					//extract and trim their values
					var filterPromises = [];
					bar.combobox = bar.combobox.replace(/ /g, "").split(",");
					bar.comboboxAttrs = bar.comboboxAttrs.replace(/ /g, "").split(",");
					bar.comboboxLabels = bar.comboboxLabels.split(",");

					//if the different combobox attributes have the same length, extract and save its values
					if (bar.combobox.length==bar.comboboxLabels.length &&
						bar.combobox.length==bar.comboboxAttrs.length &&
						bar.comboboxLabels.length==bar.comboboxAttrs.length ) {

						//iterate through the user provided comboboxes and fetch their data
						_.each(bar.combobox, function(value, index) {
							var newFilter = {
								selected: "",
								type: value,
								label: bar.comboboxLabels[index],
								attribute: bar.comboboxAttrs[index]
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
			 * function to render the bar chart based on the available filters
			 **/
			var visualizeLineChart = function(filters) {
				//if the bar chart is being initialized for the first time
				//set its options and render the chart without data
				if (_.isUndefined(bar["chart"])) {
					var options = {
						chart: {
							type: 'column',
							renderTo: bar.elementId
						},
						title: {
							text: "",
							style: { fontSize: bar.titleSize + "px" }
						},
						xAxis: {
							crosshair: true,
							title : { text: "" },
							labels: { enabled: (bar.showLabelsX === "true") }
						},
						yAxis: {
							title : { text: "" },
							labels: { enabled: (bar.showLabelsY === "true") }
						},
						legend: { enabled: (bar.showLegend === "true") },
						exporting: { enabled: (bar.exporting === "true") },
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
								pointPadding: 0,
								borderWidth: 0
							}
						}
					};

					bar["chart"] = new Highcharts.Chart(options);
				}

				//if the chart has already been rendered, fetch data from the server and visualize the results
				Data.getProjectVisAdvanced("bar", bar.projectId, bar.viewType, bar.lang, filters)
				.then(function(response) {
					//get the data and the title of the chart from the result
					var barData = response.data.data;
					var barCategories = response.data.categories;
					var titlePath = response.view[0].attribute;
					var barTitle = Data.deepObjSearch(response.data, titlePath);

					//set the chart's title
					bar["chart"].setTitle({text: barTitle});

					//remove the existing bar chart series
					while(bar["chart"].series.length > 0)
						bar["chart"].series[0].remove(true);

					//if there are data to be visualized, add the new series to the bar chart and set the xAxis categories
					if (barData.length>0){
						_.each(barData, function(serie){
							bar["chart"].addSeries(serie);
						});

						bar["chart"].xAxis[0].setCategories(barCategories);
					} else {
						//if no data are available, add default serie to the bar chart
						bar["chart"].addSeries({
							name: "No Data Available",
							data: []
						})
					}
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
					//if all the filters is selected update the bar
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

			//extract the user provided filters, and render the bar chart
			extractFilters();
		}
	};
}]);