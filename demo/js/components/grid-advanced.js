angular.module('yds').directive('ydsGridAdvanced', ['Data', 'Filters', '$timeout', '$q', function(Data, Filters, $timeout, $q){
	return {
		restrict: 'E',
		scope: {
			projectId: '@',         //id of the project that the data belong
			viewType: '@',         	//name of the array that contains the visualised data
			lang: '@',              //lang of the visualised data
			elementH: '@',          //set the height of the component
			pageSize: '@',			//set the number of results rendered on each grid page

			combobox: '@',			//set the types of the combobox filters (year, country)
			comboboxLabels: '@',	//set the labels that will be used for each combobox
			comboboxAttrs: '@'		//set the parameter each combobox will sent to the the server
		},
		templateUrl: ((typeof Drupal != 'undefined')? Drupal.settings.basePath  + Drupal.settings.yds_project.modulePath  +'/' :'') + 'templates/grid-advanced.html',
		link: function(scope, element, attrs) {
			//reference the dom elements in which the yds-grid-advanced is rendered
			var gridWrapper = angular.element(element[0].querySelector('.component-wrapper'));
			var gridContainer = angular.element(element[0].querySelector('.grid-container'));
			//set the variables which will be used for the creation of the grid
			var grid = {
				elementId: "grid" + Data.createRandomId(),
				lang: scope.lang,
				projectId: scope.projectId,
				viewType: scope.viewType,
				elementH: scope.elementH,
				pageSize: scope.pageSize,
				combobox: scope.combobox,
				comboboxLabels: scope.comboboxLabels,
				comboboxAttrs: scope.comboboxAttrs
			};
			
			scope.quickFilterValue = "";
			//array containing the selected data of the rendered comboboxes
			scope.comboboxFilters = [];
			//object containing the data for each different type of combobox
			scope.comboboxData = {};

			//check if project id attr is defined
			if(angular.isUndefined(grid.projectId) || grid.projectId.trim()=="") {
				scope.ydsAlert = "The YDS component is not properly initialized " +
					"because the projectId or the viewType attribute aren't configured properly." +
					"Please check the corresponding documentation section";
				return false;
			}

			//check if view-type attribute is empty and assign the default value
			if(_.isUndefined(grid.viewType) || grid.viewType.trim()=="")
				grid.viewType = "default";

			//check if the language attr is defined, else assign default value
			if(_.isUndefined(grid.lang) || grid.lang.trim()=="")
				grid.lang = "en";
			
			//check if the page size attr is defined, else assign default value
			if(_.isUndefined(grid.pageSize) || isNaN(grid.pageSize))
				grid.pageSize = "100";

			//check if the component's height attr is defined, else assign default value
			if(_.isUndefined(grid.elementH) || isNaN(grid.elementH))
				grid.elementH = 300;

			//add the unique id generated for the grid component and set its height
			gridContainer[0].id = grid.elementId;
			gridWrapper[0].style.height = grid.elementH + 'px';
			gridWrapper[0].style.marginBottom = '80px';


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
			 * Hide the alert
			 */
			scope.hideAlert = function() {
				scope.ydsAlert = "";
			};

			/**
			 * function to get the required data of each different type of combobox
			 **/
			var getComboFilterData = function(name, attribute) {
				var deferred = $q.defer();

				Data.getComboboxFilters(grid.projectId, "combobox." + name , attribute, grid.lang)
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
				if (!_.isUndefined(grid.combobox) && !_.isUndefined(grid.comboboxLabels) && !_.isUndefined(grid.comboboxAttrs)) {
					//extract and trim their values
					var filterPromises = [];
					grid.combobox = grid.combobox.replace(/ /g, "").split(",");
					grid.comboboxAttrs = grid.comboboxAttrs.replace(/ /g, "").split(",");
					grid.comboboxLabels = grid.comboboxLabels.split(",");

					//if the different combobox attributes have the same length, extract and save its values
					if (grid.combobox.length==grid.comboboxLabels.length &&
						grid.combobox.length==grid.comboboxAttrs.length &&
						grid.comboboxLabels.length==grid.comboboxAttrs.length ) {

						//iterate through the user provided comboboxes and fetch their data
						_.each(grid.combobox, function(value, index) {
							var newFilter = {
								selected: "",
								type: value,
								label: grid.comboboxLabels[index],
								attribute: grid.comboboxAttrs[index]
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
			 * function to render the grid based on the available filters
			 **/
			var visualizeGrid = function(filters) {
				var rawData = [];
				var columnDefs = [];

				//if the grid is being rendered for the first time, create an empty grid
				if (_.isUndefined(scope.gridOptions)) {
					//Define the options of the grid component
					scope.gridOptions = {
						columnDefs: columnDefs,
						enableColResize: true,
						enableSorting: true,
						enableFilter: true,
						rowModelType: 'pagination'
					};

					new agGrid.Grid(gridContainer[0], scope.gridOptions);
					scope.gridOptions.api.setRowData(rawData);
				}

				//if the grid has already been rendered, setup a new datasource used for the paging of the results
				var dataSource = {
					pageSize: parseInt(grid.pageSize),           // define the page size of the grid
					getRows: function (params) {
						//get the data from the server using the projectId, viewType, lang and filters variable,
						//as well as the number indicating the start index of the entire resultset
						Data.getProjectVisAdvanced("grid", grid.projectId, grid.viewType, grid.lang, filters, params.startRow)
						.then(function(response) {
							//format the column definitions returned from the API and add them to the grid
							columnDefs = Data.prepareGridColumns(response.view);
							scope.gridOptions.api.setColumnDefs(columnDefs);

							//format the data returned from the API and add them to the grid
							var rowsThisPage = Data.prepareGridData(response.data, response.view);
							params.successCallback(rowsThisPage, response.pager.total);
						}, function(error) {
							showAlert(error.message, false, false);
						});
					}
				};

				scope.gridOptions.api.setDatasource(dataSource);
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
					//if the length of the quickFilter input is greater than 0, append it to the object containing the selected filters
					if (scope.quickFilterValue.trim().length>0)
						appliedFilters["filter"] = scope.quickFilterValue.trim();

					//if all the filters is selected update the grid
					visualizeGrid(appliedFilters);
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

			//extract the user provided filters, and render the grid
			extractFilters();
		}
	};
}]);