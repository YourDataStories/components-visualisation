angular.module('yds').directive('ydsFacets', ['Data', 'Search', '$location', '$window', 'YDS_CONSTANTS',
	function(Data, Search, $location, $window, YDS_CONSTANTS){
	return {
		restrict: 'E',
		scope: {
            tabbed: '@',    // If true, will not go to normal search URL
			lang : '@'
		},
		templateUrl: ((typeof Drupal != 'undefined')? Drupal.settings.basePath  + Drupal.settings.yds_project.modulePath  +'/' :'') + 'templates/facets.html',
		link: function(scope) {
			scope.initialized = false;		//flag that indicated when the component is initialized
			scope.fieldFacets = [];			//array which contains the field facets which are shown to the user
			scope.rangeFacets = [];			//array which contains the range facets which are shown to the user
			scope.applyBtnText = "";		//variable that contains the text shown inside the apply button (used for internationalization)

			//check if the tabbed attr is defined, else assign default value
			if(angular.isUndefined(scope.tabbed) || scope.tabbed.trim()=="")
				scope.tabbed = "false";

			//check if the language attr is defined, else assign default value
			if(angular.isUndefined(scope.lang) || scope.lang.trim()=="")
				scope.lang = "en";

			//define the text of the "Apply" button based on the components language
			switch(scope.lang) {
				case "el":
					scope.applyBtnText = "Εφαρμογή";
					break;
				case "en":
					scope.applyBtnText = "Apply";
					break;
			}

			//function to initialize the arrays, in which the different kind of facets are stored
			var initFacetArrays = function() {
				scope.fieldFacets = [];
				scope.rangeFacets = [];
			};
			
			//callback function called after each search query
			var updateFacets = function() {
				initFacetArrays();
				scope.fieldFacets = Search.getFieldFacets();
				scope.rangeFacets = Search.getRangeFacets();
				
				if (!scope.initialized)
					scope.initialized = true;
			};
			
			//function to transform the user selected facets list in a format
			// which is valid so as to be used as a url param
			scope.applyFacets = function () {
				var facetUrlParts = [];

				var fieldFacets = scope.fieldFacets;
				//iterate through the field facets and transform it in a string valid for the query, (based on solr specification)
				_.each(fieldFacets, function (facet) {
					//get the selected values of the field facet
					var activeFacets = _.pluck( _.where(facet.facet_options, {selected: true}), 'name');
					
					//iterate though the selected values of the facet and format the query parameter
					_.each(activeFacets, function(active){
                        facetUrlParts.push("{!tag=" + facet.facet_attribute.toUpperCase() + "}" +
                            facet.facet_attribute + ":" + active);
					});
				});

				var rangeFacets = scope.rangeFacets;
				//iterate through the range facets and transform it in a string valid for the query, (based on solr specification)
				//ie "&fq={!tag=COMPLETION}completion[20+TO+100]"
				_.each(rangeFacets, function (facet) {
					if (facet.facet_options.model != facet.facet_options.options.floor ||
						facet.facet_options.high != facet.facet_options.options.ceil ) {

						if (facet.facet_type=="float") {
                            facetUrlParts.push("{!tag=" + facet.facet_options.options.id.toUpperCase() + "}"
								+ facet.facet_options.options.id
								+ ":["
								+ facet.facet_options.model
								+ "+TO+"
								+ facet.facet_options.high
								+ "]");
						} else if (facet.facet_type=="date") {
                            facetUrlParts.push("{!tag=" + facet.facet_options.options.id.toUpperCase() + "}"
								+ facet.facet_options.options.id
								+ ":["
								+ Data.getYearMonthFromTimestamp(facet.facet_options.model, true)
								+ "+TO+"
								+ Data.getYearMonthFromTimestamp(facet.facet_options.high, true)
								+ "]");
						}
					}
				});

                if (scope.tabbed != "true") {
					//Normal search, compose the url params string and pass it to the url
					var facetUrlString = "&fq=" + facetUrlParts.join("&fq=");

					var urlParams = "?q="+ $location.search().q + facetUrlString;

                    if (scope.lang == "en")
                        $window.location.href = (YDS_CONSTANTS.SEARCH_RESULTS_URL + urlParams);
                    else
                        $window.location.href = (YDS_CONSTANTS.SEARCH_RESULTS_URL_EL + urlParams);
                } else {
                    // Tabbed search, only modify URL parameters, not location.href
                    var query = $location.search().q;
                    if (_.isUndefined(query) || query.length == 0) {
                        query = "*";
                    }

                    $location.search("q", query);
                    $location.search("fq", facetUrlParts);
                }
			};

			//register callback function in order to be notified for the completion of a search query
			Search.registerFacetsCallback(updateFacets)
		}
	};
}]);