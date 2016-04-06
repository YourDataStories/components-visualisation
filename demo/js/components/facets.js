angular.module('yds').directive('ydsFacets', ['Data', 'Search', '$location', '$window', 'YDS_CONSTANTS',
	function(Data, Search, $location, $window, YDS_CONSTANTS){
	return {
		restrict: 'E',
		scope: {
			lang : '@'
		},
		templateUrl:'templates/facets.html',
		link: function(scope) {
			scope._ = _;           //make underscore.js accessible as scope variable
			scope.facets = [];     //copy the facets returned from the server
			scope.rawAppliedFacets = [];       //array to insert the applied facets in a format that can be used by ng-class
			scope.checkboxFacets = [];
			scope.rangeFacets = [];
			scope.applyBtnText = "";

			//check if the language attr is defined, else assign default value
			if(angular.isUndefined(scope.lang) || scope.lang.trim()=="")
				scope.lang = "en";

			//define the apply button text based on the components language
			switch(scope.lang) {
				case "el":
					scope.applyBtnText = "Εφαρμογή";
					break;
				case "en":
					scope.applyBtnText = "Apply";
					break;
			}

			var initFacetArrays = function() {
				scope.rawAppliedFacets = [];
				scope.checkboxFacets = [];
				scope.rangeFacets = [];
			};

			var formatCheckboxFacets = function (checkboxFacets, appliedFacets, facetsView) {
				_.each(_.keys(checkboxFacets), function(facetAttr){
					var rawFacetOptions = checkboxFacets[facetAttr];

					var newFacet = {
						facet_name: _.findWhere(facetsView, {attribute: facetAttr}).header,
						facet_attribute: facetAttr,
						facet_options: []
					};

					for(var i=0; i<rawFacetOptions.length; i+=2) {
						var facetOptions = {
							name: rawFacetOptions[i],
							value: rawFacetOptions[i+1],
							selected: false
						};

						var existingFacet = _.findWhere(appliedFacets, {type:"field", attribute: facetAttr, value: rawFacetOptions[i]});
						if(!_.isUndefined(existingFacet))
							facetOptions.selected = true;

						newFacet.facet_options.push(facetOptions);
					}

					scope.checkboxFacets.push(newFacet);
				});
			};

			var formatRangeFacets = function (rangeFacets, appliedFacets, facetsView) {
				_.each(_.keys(rangeFacets), function(facetAttr){
					var rawFacetOptions = rangeFacets[facetAttr];

					var newFacet = {
						facet_name: _.findWhere(facetsView, {attribute: facetAttr}).header,
						facet_attribute: facetAttr,
						facet_options: {
							model: rawFacetOptions.start,
							high: rawFacetOptions.end,
							options: {
								id: facetAttr,
								hideLimitLabels: true,
								floor: rawFacetOptions.start,
								ceil: rawFacetOptions.end
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

					var existingFacet = _.findWhere(appliedFacets, {type:"range", attribute: facetAttr});
					if(!_.isUndefined(existingFacet)) {
						newFacet.facet_options.model = parseInt(existingFacet.value.model);
						newFacet.facet_options.high = parseInt(existingFacet.value.high);
					}

					scope.rangeFacets.push(newFacet);
				});
			};

			var updateFacets = function() {
				initFacetArrays();
				var appliedFacets = Search.getAppliedFacets();
				var newFacets = Search.getFacets();
				var facetsView = Search.getFacetsView();

				formatCheckboxFacets(newFacets.facet_fields, appliedFacets, facetsView);
				formatRangeFacets(newFacets.facet_ranges, appliedFacets, facetsView);
			};


			//function to transform the facet list in format that is valid
			//to pass it as a url param
			scope.applyFacets = function () {
				var facetUrlString = "";

				var checkboxFacets = scope.checkboxFacets;
				_.each(checkboxFacets, function (facet) {
					var activeFacets = _.pluck( _.where(facet.facet_options, {selected: true}), 'name').join();
					if (activeFacets.trim().length>0)
						facetUrlString+= "&fq={!tag=" + facet.facet_attribute.toUpperCase() + "}" +
										 facet.facet_attribute + ":" + activeFacets;
				});

				var rangeFacets = scope.rangeFacets;
				_.each(rangeFacets, function (facet) {
					facetUrlString+= "&fq=" + "{!tag=" + facet.facet_options.options.id.toUpperCase() + "}"
											+ facet.facet_options.options.id
											+ "["
											+ facet.facet_options.model
											+ "+TO+"
											+ facet.facet_options.high
											+ "]";

											/*+ facet.facet_options.options.id
											+ "("
											+ facet.facet_options.model
											+ ","
											+ facet.facet_options.high
											+ ")";*/
				});

				var urlParams = "?q="+ $location.search().q + facetUrlString;
				$window.location.href = (YDS_CONSTANTS.SEARCH_RESULTS_URL + urlParams);
			};

			Search.registerFacetsCallback(updateFacets)
		}
	};
}]);