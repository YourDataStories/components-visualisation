angular.module("yds").controller("CountryController", ["$scope", "$location", "$sce", "$timeout", "YDS_CONSTANTS", "Data", "DashboardService",
    function ($scope, $location, $sce, $timeout, YDS_CONSTANTS, Data, DashboardService) {
        var scope = $scope;
        // Set base URL variable
        scope.baseUrl = YDS_CONSTANTS.PROJECT_DETAILS_URL;
        scope.lang = "en";

        // Get project ID from url parameters or set Greece as default country
        var projectId = $location.search().id;
        scope.projectId = projectId || "http://linkedeconomy.org/resource/Country/GR";

        // Prevent W.D.I. grid from remembering past selection
        DashboardService.setCookieObject("country_indicator_search_country_page", undefined);

        // Set selected project (Dataset) variables
        scope.hasSelectedProject = false;   // Shows where a project has been selected, ever (since loading the page)
        scope.selectedProject = null;       // Holds currently selected Dataset ID

        /**
         * Given a response from the server for a country description, generate the required items to display
         * information on the page
         * @param response  Response with item description
         */
        var showCountryInfo = function (response) {
            // Simplify processed response to a "dictionary" with key/values
            var responseDict = {};
            _.each(response, function (item) {
                responseDict[item.key.label] = item.value.label;
            });

            // Find flag SVG URL
            scope.flagUrl = $sce.trustAsResourceUrl(responseDict["depiction"]);

            // Find country name for title & EuroPAM URL
            scope.countryName = responseDict["prefLabel"];

            // Find 3-letter code for Public Integrity URL
            var threeLetterCode = _.find(responseDict["notation"], function (code) {
                return code.length === 3;
            });

            // Find 2-letter code for Dashboard links
            var twoLetterCode = _.find(responseDict["notation"], function (code) {
                return code.length === 2;
            });

            // Create object containing information for the indexes' tabs
            scope.indexes = [{
                heading: "Index of Public Integrity",
                url: $sce.trustAsResourceUrl(
                    "http://integrity-index.org/country-profile/?id=" + threeLetterCode + "&yr=2017")
            }, {
                heading: "Index of Public Accountability",
                url: $sce.trustAsResourceUrl(
                    "http://europam.eu/index.php?module=country-profile&country=" + scope.countryName)
            }];

            // Create object with information for the Dashboard tabs
            scope.dashboardTabs = [{
                dashboardName: "Trade Activities",
                iconClass: "fa-exchange",
                descriptionUrl: $sce.trustAsResourceUrl("templates-demo/dashboards/descriptions/trade.html"),
                buttons: [{
                    title: "Buyer",
                    url: $sce.trustAsResourceUrl("http://platform.yourdatastories.eu/" +
                        "official-development-assistance/#!?dashboard=tradeactivity" +
                        "&filters=~(tradeactivity_hasorigin_countries_all~(~(code~'" + twoLetterCode + ")))")
                }, {
                    title: "Seller",
                    url: $sce.trustAsResourceUrl("http://platform.yourdatastories.eu/" +
                        "official-development-assistance/#!?dashboard=tradeactivity" +
                        "&filters=~(tradeactivity_hasdestination_countries_all~(~(code~'" + twoLetterCode + ")))")
                }]
            }, {
                dashboardName: "Aid Activities",
                iconClass: "fa-medkit",
                descriptionUrl: $sce.trustAsResourceUrl("templates-demo/dashboards/descriptions/aid.html"),
                buttons: [{
                    title: "Benefactor",
                    url: $sce.trustAsResourceUrl("http://platform.yourdatastories.eu/" +
                        "official-development-assistance/#!?dashboard=aidactivity" +
                        "&filters=~(aidactivity_benefactor_countries_all~(~(code~'" + twoLetterCode + ")))")
                }, {
                    title: "Beneficiary",
                    url: $sce.trustAsResourceUrl("http://platform.yourdatastories.eu/" +
                        "official-development-assistance/#!?dashboard=aidactivity" +
                        "&filters=~(aidactivity_beneficiary_countries_all~(~(code~'" + twoLetterCode + ")))")
                }]
            }, {
                dashboardName: "Contracts",
                iconClass: "fa-pencil",
                descriptionUrl: $sce.trustAsResourceUrl("templates-demo/dashboards/descriptions/contracts.html"),
                buttons: [{
                    title: "Buyer",
                    url: $sce.trustAsResourceUrl("http://platform.yourdatastories.eu/" +
                        "public-contracts/#!?dashboard=contract" +
                        "&filters=~(contract_buyer_countries_all~(~(code~'" + twoLetterCode + ")))")
                }, {
                    title: "Seller",
                    url: $sce.trustAsResourceUrl("http://platform.yourdatastories.eu/" +
                        "public-contracts/#!?dashboard=contract" +
                        "&filters=~(contract_seller_countries_all~(~(code~'" + twoLetterCode + ")))")
                }]
            }];

        };

        // Get description of country in order to extract the required properties
        Data.getItemDescription(scope.projectId, null, 0, 0)
            .then(showCountryInfo);

        // Listen for changes in the selected project (for the Datasets grid) and add it to the scope
        DashboardService.subscribeProjectChanges(scope, function () {
            scope.selectedProject = null;
            $timeout(function () {
                scope.selectedProject = DashboardService.getSelectedProjectInfo().id;
                scope.hasSelectedProject = true;
            });
        });
    }
]);
