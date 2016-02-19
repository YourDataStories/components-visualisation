angular.module('yds').directive('ydsGrid', ['Data', function(Data){
    return {
        restrict: 'E',
        scope: {
            projectId: '@',     //id of the project that the data belong
            tableType: '@',     //name of the array that contains the visualised data
            sorting: '@',       //enable or disable array sorting, values: true, false
            colResize: '@',     //enable or disable column resize, values: true, false
            paging: '@',        //enable or disable the paging feature, values: true, false
            pageSize: '@',      //set the number of rows of each page
            elementH: '@'
        },
        templateUrl:'templates/grid.html',
        link: function(scope, element, attrs) {
            var projectId = scope.projectId;
            var tableType = scope.tableType;
            var sorting = scope.sorting;
            var colResize = scope.colResize;
            var paging = scope.paging;
            var pageSize = scope.pageSize;
            var elementH = scope.elementH;

            var gridWrapper = angular.element(element[0].querySelector('.component-wrapper'));
            var gridContainer = angular.element(element[0].querySelector('.grid-container'));

            //create a random id for the element that will render the chart
            var elementId = "grid" + Data.createRandomId();
            gridContainer[0].id = elementId;

            //check if project id or grid type are defined
            if(angular.isUndefined(projectId) || projectId.trim()=="" || angular.isUndefined(tableType) || tableType.trim()=="") {
                scope.ydsAlert = "The YDS component is not properly initialized " +
                    "because the projectId or the tableType attribute aren't configured properly." +
                    "Please check the corresponding documentation sertion";
                return false;
            }

            //check if the sorting attr is defined, else assign the default value
            if(angular.isUndefined(sorting) || (sorting!="true" && sorting!="false"))
                sorting = "true";

            //check if the colResize attr is defined, else assign default value
            if(angular.isUndefined(colResize) || (colResize!="true" && colResize!="false"))
                colResize = "false";

            //check if the paging attr is defined, else assign default value
            if(angular.isUndefined(paging) || (paging!="true" && paging!="false"))
                paging = "false";

            //check if the page size attr is defined, else assign default value
            if(angular.isUndefined(pageSize) || isNaN(pageSize))
                pageSize = "100";

            //check if the component's height attr is defined, else assign default value
            if(angular.isUndefined(elementH) || isNaN(elementH))
                elementH = 200 ;

            //set the height of the grid
            gridWrapper[0].style.height = elementH + 'px';

            Data.getVisualizationData(projectId, tableType)
            .then(function (response) {
                var localDataSource = {};
                var columnDefs = [];
    //            var rowData = angular.copy(response);

                //get the object's keys as the the
                var objectKeys = _.keys(response[0]);
                for (var i=0; i<objectKeys.length; i++){
                    columnDefs.push({headerName: objectKeys[i], field: objectKeys[i]})
                }

                scope.gridOptions = {
                    columnDefs: columnDefs,
                    rowSelection: 'multiple',
                    enableColResize: (colResize === "true"),
                    enableSorting: (sorting === "true")
                };

                //if paging enabled set the required options to the grid configuration
                if (paging==="true") {
                    var localDataSource = {
                        rowCount: parseInt(response.length),    // not setting the row count, infinite paging will be used
                        pageSize: parseInt(pageSize),           // changing to number, as scope keeps it as a string
                        getRows: function (params) {
                            console.log('asking for ' + params.startRow + ' to ' + params.endRow);
                            var rowsThisPage = response.slice(params.startRow, params.endRow);
                            // see if we have come to the last page. if we have, set lastRow to
                            // the very last row of the last page. if you are getting data from
                            // a server, lastRow could be returned separately if the lastRow
                            // is not in the current page.
                            var lastRow = -1;
                            if (response.length <= params.endRow) {
                                lastRow = response.length;
                            }
                            params.successCallback(rowsThisPage, lastRow);
                        }
                    };

                    scope.gridOptions.datasource = localDataSource;
                } else
                    scope.gridOptions.rowData = response;

                agGridGlobalFunc('#'+elementId, scope.gridOptions);
            }, function (error) {
                scope.ydsAlert = error.message;
                console.error('error', error);
            });
        }
    };
}]);