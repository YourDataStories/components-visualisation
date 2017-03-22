angular.module("yds").controller("DashboardConfigModalCtrl", function ($scope, modalInput, basketInput, Basket) {
    //configuration of the shown modal
    $scope.modalConfig = {
        closeModal: modalInput.closeModal,
        title: modalInput.title,
        alert: ""
    };

    //prepare the basket item
    $scope.basketObj = {
        title: "",
        type: basketInput.type,
        user_id: basketInput.user_id,
        dashboard: basketInput.dashboard,
        parameters: basketInput.parameters
    };

    //function to save a basket item
    $scope.saveBasketItem = function () {
        if ($scope.basketObj.title.trim().length == 0) {
            $scope.modalConfig.alert = "Please provide a title for your item";
            return false;
        }

        //call the service to check if basket item exists
        Basket.saveBasketItem($scope.basketObj)
            .then(function (response) {
                $scope.clearModalWarnings($scope.modalConfig);
                $scope.dismissModal();
            }, function (error) {
                $scope.modalConfig.alert = "An error occurred, please try again";
            });
    };

    //function to clear modal warning messages
    $scope.clearModalWarnings = function (modalConfig) {
        if (modalConfig.alert.trim().length > 0)
            modalConfig.alert = "";
    };

    //function to be called when the modal's cancel button is pressed
    $scope.dismissModal = function () {
        $scope.modalConfig.closeModal();
    }
});
