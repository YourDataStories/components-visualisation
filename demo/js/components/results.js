angular.module('yds').directive('ydsResults', ['YDS_CONSTANTS', '$window', '$rootScope', '$location', 'Search', 'Data',
    function(YDS_CONSTANTS, $window, $rootScope, $location, Search, Data){
    return {
        restrict: 'E',
        scope: {},
        templateUrl:'templates/results.html',
        link: function(scope) {
            scope.results = [];

            scope.$watch(function () { return location.hash }, function (value) {
                var query = "";
                var urlComponents = [];

                if(!angular.isUndefined(value)) {
                    urlComponents = value.split('q=');
                    if (!angular.isUndefined(urlComponents[1]))
                        query = decodeURIComponent(urlComponents[1]);
                    else
                        query = "";
                } else
                    query = "";


                Search.setKeyword(query);
                Search.performSearch(query)
                .then(function (response) {
                    scope.results = angular.copy(response);
                }, function (error) {
                    console.log('error', error);
                });

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