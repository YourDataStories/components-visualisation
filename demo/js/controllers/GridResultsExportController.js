angular.module("yds").controller("GridResultsExportModalCtrl", ["$scope", "modalInput",
    function ($scope, modalInput) {
        $scope.modalConfig = {
            title: modalInput.title,
            alert: "",
            view: _.map(modalInput.view, function (viewItem) {
                viewItem.selected = true;
                return viewItem;
            })
        };

        $scope.exportGrid = function () {
            var selection = _.where($scope.modalConfig.view, {
                selected: true
            });

            $scope.$close(selection);
        };
    }
]);
