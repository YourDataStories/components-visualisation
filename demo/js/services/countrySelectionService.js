angular.module('yds').service('countrySelectionService', function() {
    var countries = [];

    var setCountries = function(newCountries) {
        countries = newCountries;

        console.log(countries);
    };

    return {
        setCountries: setCountries
    };
});
