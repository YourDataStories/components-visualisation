angular.module("yds").directive("ydsDynamicDashboard", ["$timeout", "DashboardService", "Data",
    function ($timeout, DashboardService, Data) {
        return {
            restrict: "E",
            scope: {
                type: "@"   // Type of Dashboard. If undefined, will show type selection radio buttons.
            },
            templateUrl: Data.templatePath + "templates/dashboard/dynamic-dashboard.html",
            link: function (scope, element, attrs) {
                // Set Dashboard type. The dashboard-dynamic controller sees it in its scope.
                if (_.isUndefined(scope.type) || scope.type.trim() === "") {
                    scope.type = "choose";
                }
            }
        };
    }
]);
