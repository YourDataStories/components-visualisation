angular.module('yds').directive('ydsInfo', ['Data', function(Data){
    return {
        restrict: 'E',
        scope: {
            projectId: '@',     //id of the project that the data belong
            tableType: '@'      //name of the array that contains the visualised data
        },
        templateUrl:'templates/info.html',
        link: function(scope) {
            var projectId = scope.projectId;
            var tableType = scope.tableType;

            //check if project id or grid type are defined
            if(angular.isUndefined(projectId) || projectId.trim()=="" || angular.isUndefined(tableType) || tableType.trim()=="") {
                scope.ydsAlert = "The YDS component is not properly initialized " +
                    "because the projectId or the tableType attribute aren't configured properly." +
                    "Please check the corresponding documentation sertion";
                return false;
            }

            scope.info = [];
            Data.getVisualizationData(projectId, tableType)
            .then(function (response) {// debugger;
                if(response.length>0)
                    scope.info = response[0];
            }, function (error) {
                scope.ydsAlert = error.message;
                console.error('error', error);
            });

        }
    };
}]);