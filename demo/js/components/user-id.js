/**
 * This directive is used to set a given user ID in the Basket service, which can then be used for saving items to the
 * Basket/Library, or rating charts.
 */
angular.module('yds').directive('ydsUserId', ["Basket",
    function (Basket) {
        return {
            restrict: "E",
            scope: {
                userId: "@"
            },
            template: "",
            link: function (scope) {
                // Set user ID as "ydsUser" if there is a problem with it
                if (_.isUndefined(scope.userId) || scope.userId.trim().length == 0) {
                    scope.userId = "ydsUser";
                }

                // Set the ID in the Basket service
                Basket.setUserId(scope.userId);
            }
        }
    }
]);
