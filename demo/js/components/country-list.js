angular.module('yds').directive('ydsCountryList', ['CountrySelectionService',
    function(CountrySelectionService) {
        return {
            restrict: 'E',
            scope: {},
            templateUrl: ((typeof Drupal != 'undefined')? Drupal.settings.basePath  + Drupal.settings.yds_project.modulePath  +'/' :'') + 'templates/country-list.html',
            link: function (scope, element, attrs) {
                scope.countries = [];

                CountrySelectionService.subscribe(scope, function() {
                    scope.countries = CountrySelectionService.getCountries();

                    scope.$apply();
                });
            }
        };
    }
]);
