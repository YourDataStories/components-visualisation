/**
 * Add parameters required for Chord to load in the TED Sellers page to the scope
 */
angular.module("yds").controller("ChordSellerController", ["$scope", "$location", "YDS_CONSTANTS",
    function ($scope, $location, YDS_CONSTANTS) {
        // Get info for selected project from DashboardService
        var urlParams = $location.search();
        $scope.extraParams = {
            baseurl: YDS_CONSTANTS.PROJECT_DETAILS_URL,
            seller_organizations: urlParams.id || "http://linkedeconomy.org/resource/Organization/TEDS_3732149"
        };
    }
]);
