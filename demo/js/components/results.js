angular.module('yds').directive('ydsResults', ['YDS_CONSTANTS', '$window', '$rootScope', '$location', 'Search', 'Data',
    function(YDS_CONSTANTS, $window, $rootScope, $location, Search, Data){
    return {
        restrict: 'E',
        scope: {},
        templateUrl:'templates/results.html',
        link: function(scope) {
            scope.results = [];

            //if back button was pressed for navigation, restore old content
            if($rootScope.actualLocation === $location.path())
                Data.backButtonUsed();
            else {
                Data.backButtonNotUsed();
                Search.clearResults();
            }

            scope.$watch(function(){
                return Search.getKeyword();
            }, function(newVal, oldVal){
                if (angular.isUndefined(newVal) || newVal==null || newVal=="")
                    return false;

                var prevSearchResults = Search.getResults();

                if (Data.isBackButtonUsed() && !angular.isUndefined(prevSearchResults) && prevSearchResults.length>0) {
                    scope.results = prevSearchResults;
                } else {
                    Search.performSearch(newVal)
                    .then(function (response) {
                        scope.results = angular.copy(response);
                    }, function (error) {
                        console.log('error', error);
                    });
                }
            });
        },
        controller: function($scope) {
            $scope.resultsPreview = function (project, vizType) {
                // firing an event downwards from the parent scope
                $scope.$parent.$broadcast('previsualiseResult', {
                    projectId : project.attributes['project-id'],
                    projectTitle : project.attributes.title,
                    vizType : vizType
                });
            };

            $scope.visitResult = function(project) {
                var redirectURL = YDS_CONSTANTS.PROJECT_DETAILS_URL + '?id=' + project.attributes['project-id'];
                $window.location.href = redirectURL;
            }
        }
    };
}]);