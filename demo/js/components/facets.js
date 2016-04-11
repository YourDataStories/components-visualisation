angular.module('yds').directive('ydsFacets', ['Data', 'Search', '$location', '$window', 'YDS_CONSTANTS',
	function(Data, Search, $location, $window, YDS_CONSTANTS){
	return {
		restrict: 'E',
		scope: {
			lang : '@'
		},
		templateUrl:'templates/facets.html',
		link: function(scope) {
			scope.initialized = false;		//flag that indicated when the component is initialized
			scope.fieldFacets = [];			//array which contains the field facets which are shown to the user
			scope.rangeFacets = [];			//array which contains the range facets which are shown to the user
			scope.applyBtnText = "";		//variable that contains the text shown inside the apply button (used for internationalization)

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

			//function to format the field facets returned from the search API
			var formatCheckboxFacets = function (fieldFacets, appliedFacets, facetsView) {
				//iterate through the keys of the field facets returned from the api
				_.each(_.keys(fieldFacets), function(facetAttr){
					//get the facet object based on its key value
					var rawFacetOptions = fieldFacets[facetAttr];

					//initialize a basic object which will hold the required attributes of each field facet
					var newFacet = {
						facet_name: _.findWhere(facetsView, {attribute: facetAttr}).header,
						facet_attribute: facetAttr,
						facet_options: []
					};

					//iterate through the values of the field facet
					for(var i=0; i<rawFacetOptions.length; i+=2) {
						//initialize a new object, which will hold the values of the corresponding facet
						var facetOptions = {
							name: rawFacetOptions[i],
							value: rawFacetOptions[i+1],
							selected: false
						};

						//check if the facet is already selected from the user, if it is selected make it selected
						var existingFacet = _.findWhere(appliedFacets, {type:"field", attribute: facetAttr, value: rawFacetOptions[i]});

						if(!_.isUndefined(existingFacet))
							facetOptions.selected = true;

						newFacet.facet_options.push(facetOptions);
					}

					scope.fieldFacets.push(newFacet);
				});
			};

			//function to format the range facets returned from the search API
			var formatRangeFacets = function (rangeFacets, appliedFacets, facetsView) {
				//iterate through the keys of the field facets returned from the api
				_.each(_.keys(rangeFacets), function(facetAttr){
					//get the facet object based on its key value
					var rawFacetOptions = rangeFacets[facetAttr];

					//initialize a basic object which will hold the required attributes of each range facet
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
							}
						}
					};

					//check if the facet is already selected from the user, if it is selected apply its values
					var existingFacet = _.findWhere(appliedFacets, {type:"range", attribute: facetAttr});
					if(!_.isUndefined(existingFacet)) {
						newFacet.facet_options.model = parseInt(existingFacet.value.model);
						newFacet.facet_options.high = parseInt(existingFacet.value.high);
					}

					scope.rangeFacets.push(newFacet);
				});
			};

			//callback function called after each search query
			var updateFacets = function() {
				initFacetArrays();
				var appliedFacets = Search.getAppliedFacets();
				var newFacets = Search.getFacets();
				var facetsView = Search.getFacetsView();

				formatCheckboxFacets(newFacets.facet_fields, appliedFacets, facetsView);
				formatRangeFacets(newFacets.facet_ranges, appliedFacets, facetsView);
				
				if (!scope.initialized)
					scope.initialized = true;
			};


			//function to transform the user selected facets list in a format
			// which is valid so as to be used as a url param
			scope.applyFacets = function () {
				var facetUrlString = "";

				var fieldFacets = scope.fieldFacets;
				//iterate through the field facets and transform it in a string valid for the query, (based on solr specification)
				_.each(fieldFacets, function (facet) {
					//get the selected values of the field facet
					var activeFacets = _.pluck( _.where(facet.facet_options, {selected: true}), 'name');
					
					//iterate though the selected values of the facet and format the query parameter
					_.each(activeFacets, function(active){
						facetUrlString+= "&fq={!tag=" + facet.facet_attribute.toUpperCase() + "}" +
							facet.facet_attribute + ":" + active;
					});
				});

				var rangeFacets = scope.rangeFacets;
				//iterate through the range facets and transform it in a string valid for the query, (based on solr specification)
				//ie "&fq={!tag=COMPLETION}completion[20+TO+100]"
				_.each(rangeFacets, function (facet) {
					if ( facet.facet_options.model != facet.facet_options.options.floor ||
						facet.facet_options.high != facet.facet_options.options.ceil ) {

						facetUrlString+= "&fq=" + "{!tag=" + facet.facet_options.options.id.toUpperCase() + "}"
							+ facet.facet_options.options.id
							+ ":["
							+ facet.facet_options.model
							+ "+TO+"
							+ facet.facet_options.high
							+ "]";
					}
				});

				//compose the url params string and pass it to the url
				var urlParams = "?q="+ $location.search().q + facetUrlString;
				if (scope.lang == "en")
					$window.location.href = (YDS_CONSTANTS.SEARCH_RESULTS_URL + urlParams);
				else
					$window.location.href = (YDS_CONSTANTS.SEARCH_RESULTS_URL_EL + urlParams);
			};

			//register callback function in order to be notified for the completion of a search query
			Search.registerFacetsCallback(updateFacets)
		}
	};
}]);