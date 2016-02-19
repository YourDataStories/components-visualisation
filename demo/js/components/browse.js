angular.module('yds').directive('ydsBrowse', ['Data', '$q', '$http', function(Data, $q, $http){
    return {
        restrict: 'E',
        scope: {
            lang: '@'
        },
        templateUrl:'templates/browse.html',
        link: function(scope, element) {
            var initialCall = true;
            scope.preferredLanguage = scope.lang;
            scope.rawData = [];       //array holding the data fetched from the server
            scope.levels = [];

            //fetch the browse data from the server
            Data.getBrowseData()
            .then(function (response) {
                scope. rawData = response;

                var firstLvl = formatLevel(scope.rawData, -1, -1);
                scope.levels.push(firstLvl);
            }, function(error) {
                console.log ("error in get browse data", error);
            });


            //function to show or hide a specific level
            scope.toggleVisibility = function(index) {
                var isVisible = scope.levels[index].visible;
                if (!angular.isUndefined(isVisible))
                    scope.levels[index].visible = !scope.levels[index].visible;
            };


            //function to render the breadcrumbs based on user clicks
            var formatBreadcrumbs = function () {
                var clickedItems = [];
                var breadcrumbs  = [];

                for (var l=0; l<scope.levels.length; l++) {
                    clickedItems = _.where(scope.levels[l].values, {selected: true});
                    for (var m=0; m<clickedItems.length; m++) {
                        var identifier = parseInt(clickedItems[m].uniqueId.split("_")[0]);
                        clickedItems[m].color = Data.getBreadcrumbColor(identifier);
                    }

                    if (clickedItems.length > 0) {
                        breadcrumbs.push({
                            id: l,
                            values: clickedItems
                        });
                    }
                }

                scope.breadcrumbs = angular.copy(breadcrumbs);
            };


            // function to initialize the first level of the shown data
            var formatLevel = function(inputData, parId, currentLevel) {
                var newLvl = {};

                if (angular.isUndefined(scope.levels[currentLevel+1])) {              //if level doesn't exist
                    newLvl = {
                        id: currentLevel+2,
                        visible: true,
                        values: []
                    };
                } else {
                    newLvl = angular.copy(_.findWhere (scope.levels, { id: currentLevel+2 }));
                    newLvl.visible = true;
                }

                for (var i=0; i<inputData.length; i++) {
                    if (angular.isUndefined(inputData[i].label) || inputData[i].label==null)
                        continue;

                    if (parId == -1) {
                        newLvl.values.push({
                            id: inputData[i].id,
                            uniqueId: inputData[i].id,
                            label: inputData[i].label,
                            content: inputData[i].values,
                            count: inputData[i].values.length
                        });
                    } else {
                        newLvl.values.push({
                            id: inputData[i].id,
                            uniqueId: parId + "_" + inputData[i].id,
                            label: inputData[i].label,
                            content: inputData[i].values,
                            count: inputData[i].values.length
                        });
                    }
                }

                return newLvl;
            };

            // function to render the selected folder of the user.
            scope.addLevel = function(index, position, objId) {
                //if the selected element has not been clicked
                if (angular.isUndefined(scope.levels[index].values[position].selected)) {
                    scope.levels[index].values[position].selected = true;
                    formatBreadcrumbs();
                } else {        //if element has already been manipulated
                    scope.levels[index].values[position].selected = !scope.levels[index].values[position].selected;
                    formatBreadcrumbs();

                    if (!scope.levels[index].values[position].selected) {  //already selected
                        var parentUniqueId = scope.levels[index].values[position].uniqueId;

                        //search all levels for items with uniqueId starting with their parent id
                        for(var j=index+1; j<scope.levels.length; j++) {
                            //get a copy of the current level without the values that have
                            var cleanLvlValues  = _.reject(scope.levels[j].values, function(obj){ return obj.uniqueId.indexOf(parentUniqueId) == 0; });

                            //if no values left, remove the entire level, else copy the updated values of the level
                            if (cleanLvlValues.length == 0)
                                scope.levels.splice(j, 1);
                            else
                                scope.levels[j].values = angular.copy(cleanLvlValues);
                        }

                        formatBreadcrumbs();
                        return false;
                    }
                }

                //get the content of the new level and check if is empty
                var nextLvlValues = scope.levels[index].values[position].content;

                //if empty, no action needed
                if (angular.isUndefined(nextLvlValues) || nextLvlValues.length == 0)
                    return false;

                //format the content of the new level in order to be added in the list
                var formatted = formatLevel(nextLvlValues, objId, index);

                //make visible only the levels which are after the level clicked
                for (var k=0; k<scope.levels.length; k++) {
                    if (k < index)
                        scope.levels[k].visible = false;
                    else
                        scope.levels[k].visible = true;
                }

                if (angular.isUndefined(_.findWhere(scope.levels, { id: formatted.id })))
                    scope.levels.push(formatted);
                else
                    scope.levels[formatted.id-1] = formatted;


                //Temp solution for initializing grid
                if(initialCall) {
                    renewDataOnGrid();
                    initialCall = false;
                }
            };


            //Fetching Demonstration Data from the Server
            var getGridData = function () {
                var deferred = $q.defer();
                var proxyUrl = "localhost:9292/";
               // proxyUrl = "";
                var baseUrl = "ydsdev.iit.demokritos.gr/api/mudcat/public-projects";
                //call the service with POST method
                $http({
                    method: 'GET',
                    url: "http://" + proxyUrl + baseUrl,
                    headers: {'Content-Type': 'application/json'}
                })
                .success(function (data) {
                    deferred.resolve(data);
                }).error(function (error) {
                    deferred.reject(error);
                });

                return deferred.promise;
            };


            /***************************************/
            /*** RENDER THE DATA IN PAGGED GRID ***/
			/***********************************/

            var renewDataOnGrid = function() {
                getGridData().then(function (response) {
                    var gridData = response.data;
                    var columnDefs = [];

                    var gridContainer = angular.element(element[0].querySelector('.grid-container'));

                    //create a random id for the element that will render the chart
                    var elementId = "grid" + Data.createRandomId();
                    gridContainer[0].id = elementId;

                    //reformat
                    for (var i=0; i<gridData.length; i++)
                        gridData[i] = gridData[i].attributes;

                    //define the name of each column based on the object property names
                    var objectKeys = _.keys(gridData[0]);
                    for (var i=0; i<objectKeys.length; i++)
                        columnDefs.push({headerName: objectKeys[i], field: objectKeys[i]})

                    scope.gridOptions = {
                        columnDefs: columnDefs,
                        rowSelection: 'multiple',
                        enableColResize: true,
                        enableSorting: true
                    };

                    var localDataSource = {
                        rowCount: parseInt(gridData.length),    // not setting the row count, infinite paging will be used
                        pageSize: 10,           // changing to number, as scope keeps it as a string
                        getRows: function (params) {
                            console.log('asking for ' + params.startRow + ' to ' + params.endRow);
                            var rowsThisPage = gridData.slice(params.startRow, params.endRow);

                            var lastRow = -1;
                            if (gridData.length <= params.endRow) {
                                lastRow = gridData.length;
                            }
                            params.successCallback(rowsThisPage, lastRow);
                        }
                    };

                    scope.gridOptions.datasource = localDataSource;
                    agGridGlobalFunc('#'+elementId, scope.gridOptions);
                }, function(error) {
                    console.log ("error in get browse data", error);
                });
            }
        }
    };
}]);