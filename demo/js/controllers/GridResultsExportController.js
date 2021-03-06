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

        /**
         * Make all items in the modal selected or deselected, based on the given boolean value
         * @param selected  True to select all, false to deselect all
         */
        $scope.selectAll = function (selected) {
            _.each($scope.modalConfig.view, function (item) {
                item.selected = selected;
            });
        };
    }
]);
