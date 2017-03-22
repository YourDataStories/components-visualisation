angular.module("yds").controller("DashboardConfigModalCtrl", function ($scope, DashboardService, modalInput, basketInput, Basket) {
    // Configuration of the shown modal
    $scope.modalConfig = {
        closeModal: modalInput.closeModal,
        title: modalInput.title,
        alert: "",
        infoType: modalInput.infoType,
        lang: modalInput.lang
    };

    // Prepare the basket item
    $scope.libraryObj = {
        title: "",
        type: basketInput.type,
        user_id: basketInput.user_id,
        dashboard: basketInput.dashboard,
        parameters: basketInput.parameters
    };

    // Get extra parameters for Info component
    $scope.extraParams = DashboardService.getApiOptions(basketInput.dashboard);

    /**
     * Save a Library item
     * @returns {boolean}
     */
    $scope.saveBasketItem = function () {
        if ($scope.libraryObj.title.trim().length == 0) {
            $scope.modalConfig.alert = "Please provide a title for your item";
            return false;
        }

        //call the service to check if basket item exists
        // Basket.saveBasketItem($scope.libraryObj)
        //     .then(function (response) {
        //         $scope.clearModalWarnings($scope.modalConfig);
        //         $scope.dismissModal();
        //     }, function (error) {
        //         $scope.modalConfig.alert = "An error occurred, please try again";
        //     });
    };

    /**
     * Clear any modal warning messages
     * @param modalConfig
     */
    $scope.clearModalWarnings = function (modalConfig) {
        if (modalConfig.alert.trim().length > 0)
            modalConfig.alert = "";
    };

    /**
     * Dismiss the modal when Cancel button is pressed
     */
    $scope.dismissModal = function () {
        $scope.modalConfig.closeModal();
    }
});
