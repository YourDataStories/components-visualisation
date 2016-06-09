app.factory('Search', ['$http', '$q', '$location', 'YDS_CONSTANTS', 'Data', 
	function ($http, $q, $location, YDS_CONSTANTS, Data) {
	var i18nLangs = ["en", "el"];
	var keyword = "";
	var facetsCallbacks = [];
	var facetsView= {};
	var searchResults = [];
	var fieldFacets = [];
	var rangeFacets = [];

	/**
	 * function to trigger the callbacks of observers
	 **/
	var notifyObservers = function (observerStack) {
		angular.forEach(observerStack, function (callback) {
			callback();
		});
	};


	/**
	 * function to format the search results returned fromm the search API.
	 **/
	var formatResults = function(results, resultsView, resultsViewNames, prefLang) {
		var formattedResults = [];
		//iterate through the results and format its data
		_.each(results, function(result) {
			//iterate through the types of the result
			for (var j=0; j<result.type.length; j++) {
				var viewName = result.type[j];

				//search if the type of the result exists inside the available views
				if (_.contains(resultsViewNames, viewName)) {
					//create an object for each result
					var formattedResult = {
						_hidden: true,
						id: result.id,
						type: result.type,
						rows: []
					};

					//get the contents of the result view
					var resultView = _.find(resultsView, function (view) { return viewName in view })[viewName];

					//iterate inside the view of the result in order to acquire the required data for each result
					_.each(resultView, function(view){
						var resultRow = {};
						resultRow.header = view.header;
						resultRow.type = view.type;
						resultRow.value = result[view.attribute];

						//if the row should have a url, find it and add it to the row
						if (!_.isUndefined(view.url)) {
							resultRow.url = result[view.url];
						}

						//if the value of a result doesn't exist
						if (_.isUndefined(resultRow.value) || String(resultRow.value).trim().length==0) {
							//extract the last 3 characters of the specific attribute of the result
							var last3chars = view.attribute.substr(view.attribute.length-3);

							//if it is internationalized
							if (last3chars == ("." + prefLang)) {
								//split the attribute in tokens
								var attributeTokens = view.attribute.split(".");
								//extract the attribute without the i18n tokens
								var nonInternationalizedAttr = _.first(attributeTokens, attributeTokens.length-1).join(".");
								//find the opposite language of the component
								var alternativeLang = _.first(_.without(i18nLangs, prefLang));

								//assign the value of the opposite language
								resultRow.value = result [nonInternationalizedAttr + "." + alternativeLang];

								//if no value was acquired from the i18n attributes, try with non-internationalized attribute
								if (_.isUndefined(resultRow.value) || String(resultRow.value).trim().length==0)
									resultRow.value = result [nonInternationalizedAttr];
							}
						}

						//if the value is not available assign an empty string, 
						// else check if it is an array and convert it to comma separated string
						if(_.isUndefined(resultRow.value))
							resultRow.value = "";
						else if (_.isArray(resultRow.value))
							resultRow.value = resultRow.value.join(", ");
						else if (resultRow.type == "date")
							resultRow.value = resultRow.value.split("T")[0].replace(/-/g, "/");

						//push the formatted row of the result in the array of the corresponding result
						formattedResult.rows.push(resultRow);
					});

					//if the view of the result has been found, don't search further for its view
					break;
				}
			}

			//push the result in the array containing all the results that will be visible to the user
			formattedResults.push(formattedResult);
		});

		return formattedResults;
	};


	/**
	 * function to format the field facets returned fromm the search API.
	 * @param {Array} newFacets, the field facets as returned from Solr
	 * @param {Array} facetsView, the view of the facets as returned from the search API
	 **/
	var saveFieldFacets = function(newFacets, facetsView) {
		var formattedFacets = [];

		_.each(_.keys(newFacets), function(facetAttr){
			//get the facet object based on its key value
			var rawFacetOptions = newFacets[facetAttr];
			var rawFacetView = _.findWhere(facetsView, {type:"field", attribute: facetAttr});

			//initialize a basic object which will hold the required attributes of each field facet
			var newFacet = {
				facet_name: rawFacetView.header,
				facet_type: rawFacetView.type,
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
				if(!_.isUndefined(rawFacetView.value) && _.contains(rawFacetView.value, facetOptions.name))
					facetOptions.selected = true;

				newFacet.facet_options.push(facetOptions);
			}

			formattedFacets.push(newFacet);
		});

		return formattedFacets;
	};


	/**
	 * function to format the range facets returned fromm the search API.
	 * @param {Array} newFacets, the field facets as returned from Solr
	 * @param {Array} facetsView, the view of the facets as returned from the search API
	 **/
	var saveRangeFacets = function (newFacets, facetsView) {
		var formattedFacets = [];

		_.each(_.keys(newFacets), function(facetAttr) {
			//get the facet object based on its key value
			var rawFacetOptions = newFacets[facetAttr];
			var rawFacetView = _.findWhere(facetsView, {attribute: facetAttr});
			var facetTypeTokens = rawFacetView.type.split("-");

			//initialize a basic object which will hold the required attributes of each range facet
			var newFacet = {
				facet_name: rawFacetView.header,
				facet_type: facetTypeTokens[1],
				facet_attribute: facetAttr,
				facet_options: {
					options: {
						id: facetAttr,
						hideLimitLabels: true
					}
				}
			};

			//if the facet is of type "date"
			if (facetTypeTokens[1] == "date") {
				//make its step to be around a month and set the slider's floor and ceil values
				newFacet.facet_options.options.step = 2629746;
				newFacet.facet_options.options.enforceStep = false;
				newFacet.facet_options.options.floor = Data.getTimestampFromDate(rawFacetOptions.start);
				newFacet.facet_options.options.ceil = Data.getTimestampFromDate(rawFacetOptions.end);

				//if the user has selected a specific range, assign the desired values on the slider
				//else asign the default ceil/floor values defined above
				if (rawFacetView.value.length==2) {
					newFacet.facet_options.model = Data.getTimestampFromDate(rawFacetView.value[0]);
					newFacet.facet_options.high = Data.getTimestampFromDate(rawFacetView.value[1]);
				} else {
					newFacet.facet_options.model = newFacet.facet_options.options.floor;
					newFacet.facet_options.high = newFacet.facet_options.options.ceil;
				}

				//define the way that the date will be shown to the user
				newFacet.facet_options.options.translate = function(timestamp) {
					return Data.getYearMonthFromTimestamp(timestamp, false)
				};
			} else if (facetTypeTokens[1] == "float") { //if the facet is of type "float"
				//set the slider's floor and ceil values
				newFacet.facet_options.options.floor = parseFloat(rawFacetOptions.start);
				newFacet.facet_options.options.ceil = parseFloat(rawFacetOptions.end);

				//if the user has selected a specific range, assign the desired values on the slider
				//else asign the default ceil/floor values defined above
				if (rawFacetView.value.length==2) {
					newFacet.facet_options.model = parseFloat(rawFacetView.value[0]);
					newFacet.facet_options.high = parseInt(rawFacetView.value[1]);
				} else {
					newFacet.facet_options.model = newFacet.facet_options.options.floor;
					newFacet.facet_options.high = newFacet.facet_options.options.ceil;
				}
			}

			formattedFacets.push(newFacet)
		});

		return formattedFacets;
	};


	/**
	 * function to format the applied facets located inside the search url
	 * @param {String} newKeyword, the search term
	 * @param {Integer} pageLimit, the max number of results returned from the API
	 * @param {Integer} pageNumber, the page number of the results
	 **/
	var performSearch = function (newKeyword, prefLang, pageLimit, pageNumber) {
		var deferred = $q.defer();

		//define an object with the standard params required for the search query
		var searchParameters = {
			lang: prefLang,
			rows: pageLimit,
			start: pageNumber
		};

		//merge the url params with the aforementioned object
		_.extend(searchParameters, $location.search());

		$http({
			method: 'GET',
			url: "http://"+ YDS_CONSTANTS.PROXY + YDS_CONSTANTS.API_SEARCH,
			params: searchParameters,
			headers: {'Content-Type': 'application/json'}
		}).success(function (response) {
			//if the search query is successful, copy the results in a local variable
			searchResults = angular.copy(response);
			//get the facet view from the response of the search API
			facetsView  = _.find(response.view , function (view) { return "SearchFacets" in view })["SearchFacets"];

			//copy the available facets in a local variable
			fieldFacets = saveFieldFacets(response.data.facet_counts.facet_fields, facetsView);
			rangeFacets = saveRangeFacets(response.data.facet_counts.facet_ranges, facetsView);
			//format the facets returned from the search API based on the facet view

			notifyObservers(facetsCallbacks);
			deferred.resolve(searchResults);
		}).error(function (error) {
			deferred.reject(error);
		});

		return deferred.promise;
	};

	/**
	 * Formats the suggestions as returned from the suggestion API to be an array for bootstrap typeahead.
	 * @param val				The value for which the suggestions are for
	 * @param rawSuggestions	Response from the suggestion API
	 * @param maxSuggestions	Maximum number of suggestions to return
	 */
	var formatSuggestions = function(val, rawSuggestions, maxSuggestions) {
		// Check for success of query
		if (rawSuggestions.success != true) {
			return [];
		}

		// Format suggestions (keep 15 first only)
		var newSuggestions = [];
		var dictionaries = rawSuggestions.data.suggest;

		_.each(dictionaries, function(dictionary) {
			var numOfSuggestions = dictionary[val]["numFound"];

			if (!_.isUndefined(numOfSuggestions) && numOfSuggestions > 0 && newSuggestions.length < maxSuggestions) {
				var suggestions = dictionary[val].suggestions;

				_.each(suggestions, function(suggestion) {
					if (newSuggestions.length < maxSuggestions) {
						newSuggestions.push(suggestion.term);
					}
				});
			}
		});

		return newSuggestions;
	};

	/**
	 * Function to get search suggestions for the given value
	 * @param val				Input from the search bar
	 * @param lang				Language of the suggestions
	 * @param maxSuggestions	Maximum number of suggestions to return
	 * @returns {a|d|s}
	 */
	var getSearchSuggestions = function(val, lang, maxSuggestions) {
		var deferred = $q.defer();

		var suggestionParams = {
			q: val,
			lang: lang
		};

		$http({
			method: 'GET',
			url: "http://" + YDS_CONSTANTS.API_SEARCH_SUGGESTIONS,
			params: suggestionParams,
			headers: {'Content-Type': 'application/json'}
		}).success(function(response) {
			var formattedSuggestions = formatSuggestions(val, response, maxSuggestions);

			deferred.resolve(formattedSuggestions);
		}).error(function(error) {
			deferred.reject(error);
		});

		return deferred.promise;
	};

	/**
	 * function that gets the tabs for the tabbed search
	 * from a static url and returns them as an array
	 */
	var getSearchTabs = function() {
		var deferred = $q.defer();
		$http({
			method: 'GET',
			url: YDS_CONSTANTS.TABBED_SEARCH_CATEGORIES_URL,
			headers: {'Content-Type': 'application/json'}
		}).success(function(response) {
			var data = {};

			// get tabs from json and create new array with only the tab names (no numbers)
			var tabs = response["data"]["facet_counts"]["facet_fields"]["type"];
			var tabsWithoutNumbers = {};

			_.each(tabs, function(tab, index) {
				// if it's a string, push it to the new array
				if (!isFinite(String(tab).trim() || NaN)) {
					if (_.isUndefined(data.firstTab)) {
						data.firstTab = tab;
					}

					var tabObj = {
						name: tab,
						active: false
					};

					tabsWithoutNumbers[tab] = tabObj;
				}
			});

			data.tabs = tabsWithoutNumbers;

			deferred.resolve(data);
		}).error(function(error) {
			deferred.reject(error);
		});

		return deferred.promise;
	};

	return {
		setKeyword: function(newKeyword) { keyword = newKeyword },
		getKeyword: function() { return keyword; },
		clearKeyword: function() { keyword = ""; },

		formatResults: formatResults,
		performSearch: performSearch,
		getResults: function () { return searchResults; },
		clearResults: function () { searchResults = []; },
		getSearchTabs: getSearchTabs,
		getSearchSuggestions: getSearchSuggestions,

		registerFacetsCallback: function(callback) { facetsCallbacks.push(callback); },
		getFieldFacets: function() { return fieldFacets; },
		getRangeFacets: function() { return rangeFacets; }
	}
}]);