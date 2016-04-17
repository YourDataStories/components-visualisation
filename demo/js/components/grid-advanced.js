angular.module('yds').directive('ydsGridAdvanced', ['Data', 'Filters', '$timeout', function(Data, Filters, $timeout){
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
		templateUrl:'templates/grid-advanced.html',
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
			scope.comboboxFiltersAlert = "";

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
			 * function to get the required data of each different type of combobox
			 **/
			var getComboFilterData = function(name) {
				//if the data of the specific type of combobox have already been fetched, return
				if (!_.isUndefined(scope.comboboxData[name]) && scope.comboboxData[name].length>0) {
					return false;
				}

				//if the data of the specific type of combobox doesn't exist, fetch them from the server
				Data.getComboboxFilters(grid.projectId, "combobox." + name , grid.lang)
				.then(function(response) {
					scope.comboboxData[name] = response.data;
				}, function(error){
					console.log("Error retrieving data for yds-grid-advanced filtes")
				});
			};


			/**
			 * function to extract the combobox values defined on the element's attributes
			 **/
			var extractFilters = function () {
				//check if all the required attributes for the rendering of fthe comboboxes are defined
				if (!_.isUndefined(grid.combobox) && !_.isUndefined(grid.comboboxLabels) && !_.isUndefined(grid.comboboxAttrs)) {
					//extract and trim their values
					grid.combobox = grid.combobox.replace(/ /g, "").split(",");
					grid.comboboxAttrs = grid.comboboxAttrs.replace(/ /g, "").split(",");
					grid.comboboxLabels = grid.comboboxLabels.split(",");

					//if the different combobox attributes have the same length, extract and save its values
					if (grid.combobox.length==grid.comboboxLabels.length &&
						grid.combobox.length==grid.comboboxAttrs.length &&
						grid.comboboxLabels.length==grid.comboboxAttrs.length ) {

						_.each(grid.combobox, function(value, index) {
							getComboFilterData(value);

							scope.comboboxFilters.push({
								selected: "",
								type: value,
								label: grid.comboboxLabels[index],
								attribute: grid.comboboxAttrs[index]
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
			 * function to render the grid based on the available filters
			 **/
			var visualizeGrid = function(filters, initializeFlag) {
				var rawData = [];
				var columnDefs = [];

				//if the grid is being rendered for the first time, create an empty grid
				if (initializeFlag) {
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

					return false;
				}

				//if the grid has already been rendered, setup a new datasource used for the paging of the results
				var dataSource = {
					pageSize: parseInt(grid.pageSize),           // define the page size of the grid
					getRows: function (params) {
						//get the data from the server using the projectId, viewType, lang and filters variable,
						//as well as the number indicating the start index of the entire resultset
						Data.getProvectVisAdvanced("grid", grid.projectId, grid.viewType, grid.lang, filters, params.startRow)
						.then(function(response) {
							//format the column definitions returned from the API and add them to the grid
							columnDefs = Data.prepareGridColumns(response.view);
							scope.gridOptions.api.setColumnDefs(columnDefs);

							//format the data returned from the API and add them to the grid
							var rowsThisPage = Data.prepareGridData(response.data, response.view);
							params.successCallback(rowsThisPage, response.pager.total);
						}, function(error) {
							console.log("Error retrieving data for yds-grid-advanced")
						});
					}
				};

				scope.gridOptions.api.setDatasource(dataSource);
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
					scope.comboboxFiltersAlert = "Please select at least one filter";
					$timeout(function () {
						scope.comboboxFiltersAlert = "";
					}, 2000)
				} else if (_.keys(appliedFilters).length > 0) {
					//if at least one of the filters is selected update the grid
					visualizeGrid(appliedFilters, false);
				}
			};


			/**
			 * function called when the 'clear filters' btn is clicked
			 **/
			scope.clearComboFilters = function() {
				//clear the filters' error message and initialize the selected value of each filter
				scope.comboboxFiltersAlert = "";
				
				_.each(scope.comboboxFilters, function (filter) {
					filter.selected = "";
				});
			};


			/**
			 * function to handle quick filtering
			 **/
			scope.applyQuickFilter = function(input) {
				if (!_.isUndefined(scope.gridOptions.api))
					scope.gridOptions.api.setQuickFilter(input);
			};

			//initial attempt to render an empty grid, if the filter extraction is successfull 
			if (extractFilters())
				visualizeGrid({}, true);
			else
				scope.ydsAlert = "The YDS component is not properly initialized " +
					"because the projectId or the viewType attribute aren't configured properly." +
					"Please check the corresponding documentation section";
		}
	};
}]);