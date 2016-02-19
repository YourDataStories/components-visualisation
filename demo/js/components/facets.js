angular.module('yds').directive('ydsFacets', ['Data', function(Data){
    return {
        restrict: 'A',
        scope: {},
        templateUrl:'templates/facets.html',
        link: function(scope) {
            scope._ = _;           //make underscore.js accessible as scope variable
            scope.facets = [];     //copy the facets returned from the server
            scope.rawAppliedFacets = [];       //array to insert the applied facets in a format that can be used by ng-class

            var updateFacets = function() {
                var appliedFacets = Data.getAppliedFacets();        //get the applied facets from the server

                //insert the applied facets like objects {category:x , value: y}
                // in the rawAppliedFacets array

                scope.rawAppliedFacets = [];
                for (var i=0; i<appliedFacets.length; i++) {
                    for (var j=0; j<appliedFacets[i].facet_value.length; j++){
                        scope.rawAppliedFacets.push({
                            category: appliedFacets[i].facet_type,
                            value: appliedFacets[i].facet_value[j]
                        });
                    }
                }

                //copy the whole list of available facets returned from the server
                scope.facets = Data.getFacetData();
            };

           // Data.registerServerDataCallback(updateFacets);
        }, controller: function($scope) {
            $scope.updateFilter = function(facetType,facetName) {
                Data.updateFacet(facetType, facetName);

                Data.search()
                .then(function (response) { //TODO: Check query succeded
                    Data.setServerData(response);
                }, function (error) {
                    console.log('error', error);
                });
            };
        }
    };
}]);