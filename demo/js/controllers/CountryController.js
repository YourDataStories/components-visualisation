angular.module("yds").controller("CountryController", ["$scope", "$location", "$sce", "YDS_CONSTANTS", "Data",
    function ($scope, $location, $sce, YDS_CONSTANTS, Data) {
        var scope = $scope;
        // Set base URL variable
        scope.baseUrl = YDS_CONSTANTS.PROJECT_DETAILS_URL;

        // Get project ID from url parameters or set Greece as default country
        var projectId = $location.search().id;
        scope.projectId = projectId || "http://linkedeconomy.org/resource/Country/GR";

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

            // Links for Trade Activity Dashboard buyer & seller URLs
            scope.tradeActivityBuyerUrl = $sce.trustAsResourceUrl("http://platform.yourdatastories.eu/" +
                "official-development-assistance/#!?dashboard=tradeactivity" +
                "&filters=~(tradeactivity_hasorigin_countries_all~(~(code~'" + twoLetterCode + ")))");

            scope.tradeActivitySellerUrl = $sce.trustAsResourceUrl("http://platform.yourdatastories.eu/" +
                "official-development-assistance/#!?dashboard=tradeactivity" +
                "&filters=~(tradeactivity_hasdestination_countries_all~(~(code~'" + twoLetterCode + ")))");

            // Links for Aid Activity Dashboard benefactor & beneficiary URLs
            scope.aidActivityBenefactorUrl = $sce.trustAsResourceUrl("http://platform.yourdatastories.eu/" +
                "official-development-assistance/#!?dashboard=aidactivity" +
                "&filters=~(aidactivity_benefactor_countries_all~(~(code~'" + twoLetterCode + ")))");

            scope.aidActivityBeneficiaryUrl = $sce.trustAsResourceUrl("http://platform.yourdatastories.eu/" +
                "official-development-assistance/#!?dashboard=aidactivity" +
                "&filters=~(aidactivity_beneficiary_countries_all~(~(code~'" + twoLetterCode + ")))");

            // Links for Contract Dashboard buyer & seller URLs
            scope.contractBuyerUrl = $sce.trustAsResourceUrl("http://platform.yourdatastories.eu/" +
                "public-contracts/#!?dashboard=contract" +
                "&filters=~(contract_buyer_countries_all~(~(code~'" + twoLetterCode + ")))");

            scope.contractSellerUrl = $sce.trustAsResourceUrl("http://platform.yourdatastories.eu/" +
                "public-contracts/#!?dashboard=contract" +
                "&filters=~(contract_seller_countries_all~(~(code~'" + twoLetterCode + ")))");
        };

        // Get description of country in order to extract the required properties
        Data.getItemDescription(scope.projectId, null, 0, 0)
            .then(showCountryInfo);
    }
]);
