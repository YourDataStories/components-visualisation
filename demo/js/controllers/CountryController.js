angular.module("yds").controller("CountryController", ["$scope", "$location", "$sce", "YDS_CONSTANTS", "Data",
    function ($scope, $location, $sce, YDS_CONSTANTS, Data) {
        var scope = $scope;
        // Set base URL variable
        scope.baseUrl = YDS_CONSTANTS.PROJECT_DETAILS_URL;

        // Get project ID from url parameters or set Greece as default country
        var projectId = $location.search().id;
        scope.projectId = projectId || "http://linkedeconomy.org/resource/Country/GR";

        // Get description of country in order to extract the required properties
        Data.getItemDescription(scope.projectId, "").then(function (response) {
            // Simplify processed response to a "dictionary" with key/values
            var responseDict = {};
            _.each(response, function (item) {
                responseDict[item.key.label] = item.value.label;
            });

            // Find country name for title & EuroPAM URL
            scope.countryName = responseDict["prefLabel"];

            // Find 2 and 3-letter codes for Public Integrity URL and flag
            var countryCodes = responseDict["notation"];

            var twoLetterCode = _.find(countryCodes, function (code) {
                return code.length === 2;
            });

            var threeLetterCode = _.find(countryCodes, function (code) {
                return code.length === 3;
            });

            // Create iframe URLs
            scope.publicIntegrityUrl = $sce.trustAsResourceUrl(
                "http://integrity-index.org/country-profile/?id=" + threeLetterCode + "&yr=2017");
            scope.euroPamUrl = $sce.trustAsResourceUrl(
                "http://europam.eu/index.php?module=country-profile&country=" + scope.countryName);

            // Flag class is flag-lg- and the two-letter country code
            scope.flagClass = "flag-lg-" + twoLetterCode;
        });
    }
]);
