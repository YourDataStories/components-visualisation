var ydsDemo = angular.module("ydsDemo", ["ui.router", "ui.bootstrap", "oc.lazyLoad", "yds"]);

ydsDemo.run(function ($rootScope, $location) {
    $rootScope.location = $location;
});

// Controller to set base URL and project ID in Organisation buyer & seller demo pages
ydsDemo.controller("ProjectDetailsController", ["$scope", "$location", "YDS_CONSTANTS",
    function ($scope, $location, YDS_CONSTANTS) {
        // Set base URL variable
        $scope.baseUrl = YDS_CONSTANTS.PROJECT_DETAILS_URL;

        // Get project ID from url parameters
        var projectId = $location.search().id;
        var path = $location.path();

        // Set language and default project ID if needed, depending on which page is shown
        switch (path) {
            case "/dcat-ap":
                projectId = projectId || "http://linkedeconomy.org/resource/PublicWork/356835";
                break;
            case "/organisation-buyer":
                $scope.lang = "el";

                projectId = projectId || "http://linkedeconomy.org/resource/Organization/997687930";
                break;
            case "/organisation-seller":
                $scope.lang = "el";

                projectId = projectId || "http://linkedeconomy.org/resource/Organization/099878514";
                break;
            case "/organisation-buyer-ted":
                $scope.lang = "en";

                projectId = projectId || "http://linkedeconomy.org/resource/Organization/TEDB_840910";
                break;
            case "/organisation-seller-ted":
                $scope.lang = "en";

                projectId = projectId || "http://linkedeconomy.org/resource/Organization/TEDS_3732149";
                break;
            case "/contract-ted-n6":
                $scope.lang = "en";

                projectId = "http://linkedeconomy.org/resource/Contract/AwardNotice/2013208591/5795646";
                break;
            case "/contract-ted-qb":
                $scope.lang = "en";

                projectId = "http://linkedeconomy.org/ontology/traffic/resource/ObservationPoint/1";
                break;
            case "/contract-ted":
                $scope.lang = "en";

                projectId = projectId || "http://linkedeconomy.org/resource/Contract/AwardNotice/2015233765/6910539";
                break;
            case "/contract-notice":
                $scope.lang = "en";

                projectId = projectId || "http://linkedeconomy.org/resource/Contract/AwardNotice/2015233765/6910539";
                break;
            case "/project2":
                $scope.lang = "el";

                projectId = projectId || "http://linkedeconomy.org/resource/PublicWork/216004";
                break;
            case "/graph":
                $scope.lang = "el";

                projectId = projectId || "http://linkedeconomy.org/resource/PublicWork/216004";
                break;
            case "/country":
                $scope.lang = "en";

                projectId = projectId || "http://linkedeconomy.org/resource/Country/GR";
                break;
        }

        $scope.projectId = projectId;
    }
]);

ydsDemo.config(function ($stateProvider, $urlRouterProvider, $locationProvider) {
    $urlRouterProvider.otherwise("/search");
    $locationProvider.hashPrefix("!");

    $stateProvider
        .state("search", {
            url: "/search",
            templateUrl: "templates-demo/search/search.html"
        })
        .state("search-el", {
            url: "/search-el",
            templateUrl: "templates-demo/search/search-el.html"
        })
        .state("search-tabbed", {
            url: "/search-tabbed",
            templateUrl: "templates-demo/search/search-tabbed.html"
        })
        .state("dashboard-galway", {
            url: "/dashboard-galway",
            templateUrl: "templates-demo/dashboards/galway-traffic.html"
        })
        .state("dianeosis-students", {
            url: "/dianeosis-students",
            templateUrl: "templates-demo/dashboards/dianeosis-students.html"
        })
        .state("dashboard", {
            url: "/dashboard",
            templateUrl: "templates-demo/dashboards/dashboard.html"
        })
        .state("dashboard2", {
            url: "/dashboard2",
            templateUrl: "templates-demo/dashboards/dashboard2.html"
        })
        .state("dashboard-contract", {
            url: "/dashboard-contract",
            templateUrl: "templates-demo/dashboards/dashboard-contract.html"
        })
        .state("public-works", {
            url: "/public-works",
            templateUrl: "templates-demo/dashboards/public-works.html"
        })
        .state("traffic-observations", {
            url: "/traffic-observations",
            templateUrl: "templates-demo/dashboards/traffic-observations.html"
        })
        .state("country-comparison", {
            url: "/country-comparison",
            templateUrl: "templates-demo/dashboards/country-comparison.html"
        })
        .state("dashboard-dynamic", {
            url: "/dashboard-dynamic",
            templateUrl: "templates-demo/dashboards/dashboard-dynamic.html"
        })
        .state("dashboard-aid", {
            url: "/dashboard-aid",
            templateUrl: "templates-demo/dashboards/dashboard-aid.html"
        })
        .state("dashboard-trade", {
            url: "/dashboard-trade",
            templateUrl: "templates-demo/dashboards/dashboard-trade.html"
        })
        .state("redirect", {
            url: "/redirect",
            template: "<div class='container'><h2>Redirecting...</h2></div>",
            controller: function ($scope, $location) {
                // Check type url parameter and redirect to appropriate page
                var urlParams = $location.search();

                if (_.has(urlParams, "type")) {
                    switch (urlParams.type) {
                        case "Organisation.Buyer":
                            $location.path("/organisation-buyer");
                            break;
                        case "Organisation.Seller":
                            $location.path("/organisation-seller");
                            break;
                        case "TED.Organisation.Buyer":
                            $location.path("/organisation-buyer-ted");
                            break;
                        case "TED.Organisation.Seller":
                            $location.path("/organisation-seller-ted");
                            break;
                        case "Contract":
                            $location.path("/contract-ted");
                            break;
                        case "Contract.Notice":
                            $location.path("/contract-notice");
                            break;
                        case "PublicProject":
                            $location.path("/project2");
                            break;
                        case "DcatAp":
                            $location.path("/dcat-ap");
                            break;
                        case "Country":
                            $location.path("/country");
                            break;
                    }
                }
            }
        })
        .state("project2", {
            url: "/project2",
            templateUrl: "templates-demo/pages/project2.html",
            controller: "ProjectDetailsController"
        })
        .state("projects", {
            url: "/projects",
            templateUrl: "templates-demo/pages/resource.html",
            controller: function ($scope) {
                $scope.disqusConfig = {
                    disqus_shortname: "ydscommentstest",
                    disqus_identifier: "projects",
                    disqus_url: "http://ydsdev.iit.demokritos.gr/YDSComponents/#!/projects"
                };
            }
        })
        .state("trustworthiness", {
            url: "/trustworthiness",
            templateUrl: "templates-demo/pages/trustworthiness.html"
        })
        .state("country", {
            url: "/country",
            templateUrl: "templates-demo/pages/country.html",
            controller: "ProjectDetailsController"
        })
        .state("contract-ted", {
            url: "/contract-ted",
            templateUrl: "templates-demo/pages/contract-ted.html",
            controller: "ProjectDetailsController"
        })
        .state("graph", {
            url: "/graph",
            templateUrl: "templates-demo/pages/graph.html",
            controller: "ProjectDetailsController"
        })
        .state("contract-ted-n6", {
            url: "/contract-ted-n6",
            templateUrl: "templates-demo/pages/contract-ted.html",
            controller: "ProjectDetailsController"
        })
        .state("contract-ted-qb", {
            url: "/contract-ted-qb",
            templateUrl: "templates-demo/pages/contract-ted.html",
            controller: "ProjectDetailsController"
        })
        .state("contract-notice", {
            url: "/contract-notice",
            templateUrl: "templates-demo/pages/contract-notice.html",
            controller: "ProjectDetailsController"
        })
        .state("organisation-buyer", {
            url: "/organisation-buyer",
            templateUrl: "templates-demo/pages/organisation-buyer.html",
            controller: "ProjectDetailsController"
        })
        .state("organisation-seller", {
            url: "/organisation-seller",
            templateUrl: "templates-demo/pages/organisation-seller.html",
            controller: "ProjectDetailsController"
        })
        .state("organisation-buyer-ted", {
            url: "/organisation-buyer-ted",
            templateUrl: "templates-demo/pages/organisation-buyer-ted.html",
            controller: "ProjectDetailsController"
        })
        .state("organisation-seller-ted", {
            url: "/organisation-seller-ted",
            templateUrl: "templates-demo/pages/organisation-seller-ted.html",
            controller: "ProjectDetailsController"
        })
        .state("map", {
            url: "/map",
            templateUrl: "templates-demo/map.html"
        })
        .state("dataset-correlations", {
            url: "/dataset-correlations",
            templateUrl: "templates-demo/pages/dataset-correlations.html",
            controller: "DatasetCorrelationsController"
        })
        .state("dcat-ap", {
            url: "/dcat-ap",
            templateUrl: "templates-demo/pages/dcat-ap.html",
            controller: "ProjectDetailsController"
        })
        .state("geo-editing", {
            url: "/geo-editing",
            templateUrl: "templates-demo/geo-editing.html"
        })
        .state("cache", {
            url: "/cache",
            templateUrl: "templates-demo/cache-management.html"
        })
        .state("embed", {
            url: "/embed/:embedCode",
            template: "<yds-hybrid></yds-hybrid>"
        })
        .state("iframe", {
            url: "/iframe",
            templateUrl: "templates-demo/iframe.html"
        })
        .state("browse", {
            url: "/browse",
            templateUrl: "templates-demo/browse.html"
        })
        .state("workbench-new", {
            url: "/workbench-new",
            templateUrl: "templates-demo/workbench-new.html"
        });
});

ydsDemo.run(function ($rootScope, $templateCache) {
    $rootScope.$on("$stateChangeStart", function (event, next, current) {
        if (typeof(current) !== "undefined") {
            $templateCache.remove(current.templateUrl);
        }
    });
});
