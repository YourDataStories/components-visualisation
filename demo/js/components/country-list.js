angular.module('yds').directive('ydsCountryList', ['CountrySelectionService',
    function(CountrySelectionService) {
        return {
            restrict: 'E',
            scope: {},
            templateUrl: ((typeof Drupal != 'undefined') ? Drupal.settings.basePath + Drupal.settings.yds_project.modulePath  +'/' :'') + 'templates/country-list.html',
            link: function (scope, element, attrs) {
                // Set path to blank.gif image (used for country flags) depending on Drupal config
                scope.blankSrc = ((typeof Drupal != 'undefined') ? Drupal.settings.basePath + Drupal.settings.yds_project.modulePath  +'/' :'') + 'img/blank.gif';

                scope.countries = [];

                // Subscribe to be notified of changes in selected countries
                CountrySelectionService.subscribe(scope, function() {
                    scope.countries = CountrySelectionService.getCountries();

                    scope.$apply();
                });
            }
        };
    }
]);
