angular.module('yds').directive('ydsCountryList', ['$timeout', 'CountrySelectionService',
    function($timeout, CountrySelectionService) {
        return {
            restrict: 'E',
            scope: {
                elementH: '@'   // Height of component
            },
            templateUrl: ((typeof Drupal != 'undefined') ? Drupal.settings.basePath + Drupal.settings.yds_project.modulePath  +'/' :'') + 'templates/country-list.html',
            link: function (scope, element, attrs) {
                var elementH = scope.elementH;

                var countrylistContainer = angular.element(element[0].querySelector(".countrylist-container"));

                // Check if the component's height attribute is defined, else assign default value
                if (_.isUndefined(elementH) || elementH.trim() == "")
                    elementH = 300;

                // Set the height of the component and make it scroll when content is longer
                countrylistContainer[0].style.height = elementH + "px";
                countrylistContainer[0].style.overflowY = "auto";

                // Set path to blank.gif image (used for country flags) depending on Drupal config
                scope.blankSrc = ((typeof Drupal != 'undefined') ? Drupal.settings.basePath + Drupal.settings.yds_project.modulePath  +'/' :'') + 'img/blank.gif';

                scope.countries = [];

                // Subscribe to be notified of changes in selected countries
                CountrySelectionService.subscribe(scope, function() {
                    // Update scope variable inside $timeout to trigger digest
                    $timeout(function() {
                        scope.countries = CountrySelectionService.getCountries();
                    });
                });
            }
        };
    }
]);
