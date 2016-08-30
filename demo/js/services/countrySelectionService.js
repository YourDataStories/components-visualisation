angular.module('yds').service('CountrySelectionService', function($rootScope) {
    var countries = [];

    var subscribe = function(scope, callback) {
        var unregister = $rootScope.$on('country-selection-service-change', callback);
        scope.$on('$destroy', unregister);

        return unregister;
    };

    var setCountries = function(newCountries) {
        countries = newCountries;

        $rootScope.$emit('country-selection-service-change');
    };

    var getCountries = function() {
        return countries;
    };

    return {
        subscribe: subscribe,
        setCountries: setCountries,
        getCountries: getCountries
    };
});
