angular.module('yds').service('CountrySelectionService', function($rootScope) {
    var countries = [];

    var subscribe = function(scope, callback) {
        var unregister = $rootScope.$on('country-selection-service-change', callback);
        scope.$on('$destroy', unregister);

        return unregister;
    };

    var notifySubscribers = function() {
        $rootScope.$emit('country-selection-service-change');
    };

    var setCountries = function(newCountries) {
        countries = newCountries;

        notifySubscribers();
    };

    var getCountries = function() {
        return countries;
    };

    var clearCountries = function() {
        countries = [];

        notifySubscribers();
    };

    return {
        subscribe: subscribe,
        setCountries: setCountries,
        getCountries: getCountries,
        clearCountries: clearCountries
    };
});
