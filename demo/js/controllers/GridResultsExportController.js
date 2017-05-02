angular.module('yds').controller('GridResultsExportModalCtrl', ['$scope', 'modalInput',
    function ($scope, modalInput) {
        $scope.modalConfig = {
            title: modalInput.title,
            alert: "",
            view: modalInput.view
        };

        $scope.exportGrid = function () {
            //todo
            $scope.$close("data");
        };
    }
]);
