angular.module('yds').controller('WorkbenchModalController', ['$uibModalInstance', '$scope', '$timeout', 'Basket',
    function ($uibModalInstance, $scope, $timeout, Basket) {
        var scope = $scope;

        var myData = {
            "chart": {},
            "title": {
                "text": "Imported Chart"
            },
            "series": [{
                "name": "Amount (€)",
                "data": [15.3, 25.6, 10.15]
            }]
        };

        // Get user ID from Basket service
        scope.userId = Basket.getUserId();

        scope.ok = function () {
            $uibModalInstance.close({
                chartConfig: myData
            });
        };

        scope.cancel = function () {
            $uibModalInstance.dismiss('cancel');
        };
    }
]);
