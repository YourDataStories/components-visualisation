angular.module('yds').controller('ProjectController', ['$scope', 'DashboardService',
    function($scope, DashboardService) {
        // Set view types for the 4 Details widgets
        DashboardService.setViewType("publicproject_diavgeia_decisions_financial_per_type", {
            type: "publicproject.diavgeia.decisions.financial.per.type"
        });
        DashboardService.setViewType("publicproject_diavgeia_decisions_non_financial_per_type", {
            type: "publicproject.diavgeia.decisions.non_financial.per.type"
        });
        DashboardService.setViewType("publicproject_subprojects_per_title", {
            type: "publicproject.subprojects.per.title"
        });
        DashboardService.setViewType("publicproject_sellers_per_name", {
            type: "publicproject.sellers.per.name"
        });
    }
]);
