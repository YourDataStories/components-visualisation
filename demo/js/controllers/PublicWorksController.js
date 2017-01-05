angular.module('yds').controller('PublicWorksController', ['$scope',
    function($scope) {
        var scope = $scope;

        scope.selector = "location";

        scope.setSelector = function(selector) {
            scope.selector = selector;
        }
    }
]);
