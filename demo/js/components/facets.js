angular.module('yds').directive('ydsFacets', ['Data', 'Search', function(Data, Search){
	return {
		restrict: 'E',
		scope: {},
		templateUrl:'templates/facets.html',
		link: function(scope) {
			scope._ = _;           //make underscore.js accessible as scope variable
			scope.facets = [];     //copy the facets returned from the server
			scope.rawAppliedFacets = [];       //array to insert the applied facets in a format that can be used by ng-class
			scope.checkboxFacets = [];
			scope.rangeFacets = [];

			var formatCheckboxFacets = function (checkboxFacets, facetsView) {
				_.each(_.keys(checkboxFacets), function(facetName){
					var rawFacetOptions = checkboxFacets[facetName];
					var newFacet = {
						facet_name: _.findWhere(facetsView, {attribute: facetName}).header,
						facet_options: []
					};

					for(var i=0; i<rawFacetOptions.length; i+=2) {
						newFacet.facet_options.push({
							name: rawFacetOptions[i],
							value: rawFacetOptions[i+1]
						});
					}

					scope.checkboxFacets.push(newFacet);
				});
			};

			var formatRangeFacets = function (rangeFacets, facetsView) {
				_.each(_.keys(rangeFacets), function(facetName){
					var rawFacetOptions = rangeFacets[facetName];
					
					var newFacet = {
						facet_name: _.findWhere(facetsView, {attribute: facetName}).header,
						facet_options: {
							model: rawFacetOptions.start,
							high: rawFacetOptions.end,
							options: {
								hideLimitLabels: true,
								floor: rawFacetOptions.start,
								ceil: rawFacetOptions.end,
								/*translate: function (value, sliderId, label) {
									switch (label) {
										case 'model':
											return '%' + value;
										case 'high':
											return '%' + value;
										default:
											return '%' + value
									}
								}*/
							}
						}
					};

					scope.rangeFacets.push(newFacet);
					debugger;
				});
			};

			var updateFacets = function() {
				var newFacets = Search.getFacets();
				var facetsView = Search.getFacetsView();

				formatCheckboxFacets(newFacets.facet_fields, facetsView);
				formatRangeFacets(newFacets.facet_ranges, facetsView);
			};

			scope.applyFacets = function () {
				
			}
			Search.registerFacetsCallback(updateFacets)
		}
	};
}]);