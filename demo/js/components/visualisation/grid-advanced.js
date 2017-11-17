angular.module("yds").directive("ydsGridAdvanced", ["Data", "Filters", "$timeout", "$q",
    function (Data, Filters, $timeout, $q) {
        return {
            restrict: "E",
            scope: {
                projectId: "@",         // ID of the project that the data belong
                viewType: "@",          // Name of the array that contains the visualised data
                lang: "@",              // Lang of the visualised data
                elementH: "@",          // Set the height of the component
                pageSize: "@",          // Set the number of results rendered on each grid page

                combobox: "@",          // Set the types of the combobox filters (year, country)
                comboboxLabels: "@",    // Set the labels that will be used for each combobox
                comboboxAttrs: "@",     // Set the parameter each combobox will sent to the the server

                addToBasket: "@",       // Enable or disable "add to basket" functionality, values: true, false
                basketBtnX: "@",        // X-axis position of the basket button
                basketBtnY: "@",        // Y-axis position of the basket button

                embeddable: "@",        // Enable or disable the embedding of the component
                embedBtnX: "@",         // X-axis position of the embed button
                embedBtnY: "@",         // Y-axis position of the embed button
                popoverPos: "@",        // The side of the embed button from which the embed window will appear

                explanationBtnX: "@",   // Explanation button horizontal position
                explanationBtnY: "@",   // Explanation button vertical position
                disableExplanation: "@" // Set to true to disable the explanation button
            },
            templateUrl: Data.templatePath + "templates/visualisation/grid-advanced.html",
            link: function (scope, element, attrs) {
                // Reference the DOM elements in which the component is rendered
                var gridWrapper = _.first(angular.element(element[0].querySelector(".component-wrapper")));
                var gridContainer = _.first(angular.element(element[0].querySelector(".grid-container")));

                // Set the variables which will be used for the creation of the grid
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
                // Array containing the selected data of the rendered comboboxes
                scope.comboboxFilters = [];
                // Object containing the data for each different type of combobox
                scope.comboboxData = {};

                // Enable quick filtering because the advanced grid needs to show combo boxes
                scope.quickFiltering = "true";

                // Check if project id attr is defined
                if (_.isUndefined(grid.projectId) || grid.projectId.trim() === "") {
                    scope.ydsAlert = "The YDS component is not properly initialized " +
                        "because the projectId or the viewType attribute aren't configured properly." +
                        "Please check the corresponding documentation section";
                    return false;
                }

                // Check if view-type attribute is empty and assign the default value
                if (_.isUndefined(grid.viewType) || grid.viewType.trim() === "")
                    grid.viewType = "default";

                // Check if the language attribute is defined, else assign default value
                if (_.isUndefined(grid.lang) || grid.lang.trim() === "")
                    grid.lang = "en";

                // Check if the page size attribute is defined, else assign default value
                if (_.isUndefined(grid.pageSize) || _.isNaN(grid.pageSize))
                    grid.pageSize = "100";

                // Check if the component's height attribute is defined, else assign default value
                if (_.isUndefined(grid.elementH) || _.isNaN(grid.elementH))
                    grid.elementH = 300;

                // Add the unique id generated for the grid component and set its height
                gridContainer.id = grid.elementId;
                gridContainer.style.height = grid.elementH + "px";
                gridWrapper.style.height = grid.elementH + "px";
                gridWrapper.style.marginBottom = "80px";


                /**
                 * Show errors on top of the visualization
                 */
                var showAlert = function (alertMsg, predefined, persistent) {
                    if (!predefined)
                        scope.ydsAlert = alertMsg;
                    else
                        scope.ydsAlert = "The YDS component is not properly initialized " +
                            "because the projectId or the viewType attribute aren't configured properly. " +
                            "Please check the corresponding documentation section";

                    if (!persistent)
                        $timeout(function () {
                            scope.ydsAlert = "";
                        }, 2000);
                };

                /**
                 * Hide the alert
                 */
                scope.hideAlert = function () {
                    scope.ydsAlert = "";
                };

                /**
                 * Get the required data of each different type of combobox
                 */
                var getComboFilterData = function (name, attribute) {
                    var deferred = $q.defer();

                    Data.getComboboxFilters(grid.projectId, "combobox." + name, attribute, grid.lang)
                        .then(function (response) {
                            scope.comboboxData[attribute] = response.data;

                            // Find the filter entry and assign the default value
                            var filterObj = _.findWhere(scope.comboboxFilters, {"attribute": attribute});
                            if (!_.isUndefined(filterObj))
                                filterObj.selected = _.findWhere(response.data, response.default);

                            deferred.resolve(response);
                        }, function (error) {
                            deferred.reject(error);
                        });

                    return deferred.promise;
                };


                /**
                 * Extract the combobox values defined on the element's attributes
                 */
                var extractFilters = function () {
                    // Check if all the required attributes for the rendering of the comboboxes are defined
                    if (!_.isUndefined(grid.combobox) && !_.isUndefined(grid.comboboxLabels) && !_.isUndefined(grid.comboboxAttrs)) {
                        // Extract and trim their values
                        var filterPromises = [];
                        grid.combobox = grid.combobox.replace(/ /g, "").split(",");
                        grid.comboboxAttrs = grid.comboboxAttrs.replace(/ /g, "").split(",");
                        grid.comboboxLabels = grid.comboboxLabels.split(",");

                        // If the different combobox attributes have the same length, extract and save its values
                        if (grid.combobox.length === grid.comboboxLabels.length &&
                            grid.combobox.length === grid.comboboxAttrs.length &&
                            grid.comboboxLabels.length === grid.comboboxAttrs.length) {

                            // Iterate through the user provided comboboxes and fetch their data
                            _.each(grid.combobox, function (value, index) {
                                var newFilter = {
                                    selected: "",
                                    type: value,
                                    label: grid.comboboxLabels[index],
                                    attribute: grid.comboboxAttrs[index]
                                };

                                scope.comboboxFilters.push(newFilter);
                                filterPromises.push(getComboFilterData(newFilter.type, newFilter.attribute));
                            });

                            // When the data of all the filters have been returned, create the corresponding visualization
                            $q.all(filterPromises).then(function () {
                                scope.applyComboFilters();
                            }, function (error) {
                                showAlert("", true, true);
                            });
                        } else {
                            showAlert("", true, true);
                        }
                    } else {
                        showAlert("", true, true);
                    }
                };


                /**
                 * Render the grid based on the available filters
                 */
                var visualizeGrid = function (filters) {
                    var rawData = [];
                    var columnDefs = [];

                    // If the grid is being rendered for the first time, create an empty grid
                    if (_.isUndefined(scope.gridOptions)) {
                        // Define the options of the grid component
                        scope.gridOptions = {
                            columnDefs: columnDefs,
                            enableColResize: true,
                            enableSorting: true,
                            enableFilter: true,
                            rowModelType: "pagination"
                        };

                        new agGrid.Grid(gridContainer, scope.gridOptions);
                        scope.gridOptions.api.setRowData(rawData);
                    }

                    // If the grid has already been rendered, setup a new datasource used for the paging of the results
                    var dataSource = {
                        pageSize: parseInt(grid.pageSize),           // Define the page size of the grid
                        getRows: function (params) {
                            // Get the data from the server using the projectId, viewType, lang and filters variable,
                            // as well as the number indicating the start index of the entire resultset
                            Data.getProjectVisAdvanced("grid", grid.projectId, grid.viewType, grid.lang, filters, params.startRow)
                                .then(function (response) {
                                    // Format the column definitions returned from the API and add them to the grid
                                    columnDefs = Data.prepareGridColumns(response.view);
                                    scope.gridOptions.api.setColumnDefs(columnDefs);

                                    // Format the data returned from the API and add them to the grid
                                    var rowsThisPage = Data.prepareGridData(response.data, response.view);
                                    params.successCallback(rowsThisPage, response.pager.total);
                                }, function (error) {
                                    showAlert(error.message, false, false);
                                });
                        }
                    };

                    scope.gridOptions.api.setDatasource(dataSource);
                };


                /**
                 * Apply combobox filters
                 */
                scope.applyComboFilters = function () {
                    var appliedFilters = {};

                    // Iterate through the data of the rendered filters and check which of them are selected
                    _.each(scope.comboboxFilters, function (filter) {
                        if (!_.isNull(filter.selected) && !_.isUndefined(filter.selected.value))
                            appliedFilters[filter.attribute] = filter.selected.value;
                    });

                    // If at least one of the filters is not selected show an error message
                    if (_.keys(appliedFilters).length !== scope.comboboxFilters.length) {
                        var errorMsg = "Please select a value for all the available filters";
                        showAlert(errorMsg, false, false);
                    } else {
                        // If the length of the quickFilter input is greater than 0, append it to the object containing the selected filters
                        if (scope.quickFilterValue.trim().length > 0)
                            appliedFilters["filter"] = scope.quickFilterValue.trim();

                        // If all the filters is selected update the grid
                        visualizeGrid(appliedFilters);
                    }

                    // Save new filters to filters service
                    Filters.addAdvancedGridFilter(grid.elementId, appliedFilters);
                };


                /**
                 * Clear combobox filters
                 */
                scope.clearComboFilters = function () {
                    // Clear the filters' error message and initialize the selected value of each filter
                    scope.ydsAlert = "";

                    _.each(scope.comboboxFilters, function (filter) {
                        filter.selected = "";
                    });
                };

                // Extract the user provided filters, and render the grid
                extractFilters();
            }
        };
    }
]);
