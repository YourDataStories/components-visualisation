angular.module("yds").directive("ydsFacets", ["Data", "Search", "$location", "$window", "YDS_CONSTANTS",
    function (Data, Search, $location, $window, YDS_CONSTANTS) {
        return {
            restrict: "E",
            scope: {
                tabbed: "@",    // If true, will not go to normal search URL
                lang: "@"       // Language of the facets
            },
            templateUrl: ((typeof Drupal != "undefined") ? Drupal.settings.basePath + Drupal.settings.yds_project.modulePath + "/" : "") + "templates/facets.html",
            link: function (scope) {
                scope.initialized = false;		// Flag that indicated when the component is initialized
                scope.fieldFacets = [];			// Array which contains the field facets which are shown to the user
                scope.rangeFacets = [];			// Array which contains the range facets which are shown to the user
                scope.applyBtnText = "";		// Variable that contains the text shown inside the apply button (used for internationalization)

                // Check if the tabbed attr is defined, else assign default value
                if (angular.isUndefined(scope.tabbed) || scope.tabbed.trim() === "")
                    scope.tabbed = "false";

                // Check if the language attr is defined, else assign default value
                if (angular.isUndefined(scope.lang) || scope.lang.trim() === "")
                    scope.lang = "en";

                // Define the text of the "Apply" button based on the components language
                switch (scope.lang) {
                    case "el":
                        scope.applyBtnText = "Εφαρμογή";
                        break;
                    case "en":
                        scope.applyBtnText = "Apply";
                        break;
                }

                /**
                 * Initialize the arrays that hold the different kinds of facets
                 */
                var initFacetArrays = function () {
                    scope.fieldFacets = [];
                    scope.rangeFacets = [];
                };

                /**
                 * Update the facets (after each search query)
                 */
                var updateFacets = function () {
                    initFacetArrays();
                    scope.fieldFacets = Search.getFieldFacets();
                    scope.rangeFacets = Search.getRangeFacets();

                    if (!scope.initialized)
                        scope.initialized = true;
                };

                /**
                 * Return a string valid for Solr for a range facet.
                 * @param tag
                 * @param min
                 * @param max
                 * @returns {string}
                 */
                var toSorlRange = function (tag, min, max) {
                    return "{!tag=" + tag.toUpperCase() + "}" + tag + ":[" + min + "+TO+" + max + "]";
                };

                /**
                 * Transform the user selected facets list to a format which is valid as a URL parameter
                 */
                scope.applyFacets = function () {
                    var facetUrlParts = [];

                    var fieldFacets = scope.fieldFacets;
                    // Iterate through the field facets and transform it in a string valid for the query, (based on solr specification)
                    _.each(fieldFacets, function (facet) {
                        // Get the selected values of the field facet
                        var activeFacets = _.pluck(_.where(facet.facet_options, {selected: true}), "name");

                        // Iterate though the selected values of the facet and format the query parameter
                        _.each(activeFacets, function (active) {
                            facetUrlParts.push("{!tag=" + facet.facet_attribute.toUpperCase() + "}" +
                                facet.facet_attribute + ":" + active);
                        });
                    });

                    var rangeFacets = scope.rangeFacets;
                    // Iterate through the range facets and transform it in a string valid for the query, (based on solr specification)
                    // ie "&fq={!tag=COMPLETION}completion[20+TO+100]"
                    _.each(rangeFacets, function (facet) {
                        if (facet.facet_options.model !== facet.facet_options.options.floor ||
                            facet.facet_options.high !== facet.facet_options.options.ceil) {

                            if (facet.facet_type === "float") {
                                facetUrlParts.push(toSorlRange(facet.facet_options.options.id, facet.facet_options.model, facet.facet_options.high));
                            } else if (facet.facet_type === "date") {
                                facetUrlParts.push(toSorlRange(facet.facet_options.options.id, Data.getYearMonthFromTimestamp(facet.facet_options.model, true), Data.getYearMonthFromTimestamp(facet.facet_options.high, true)));
                            }
                        }
                    });

                    if (scope.tabbed !== "true") {
                        // Normal search, compose the url params string and pass it to the url
                        var facetUrlString = "&fq=" + facetUrlParts.join("&fq=");

                        var urlParams = "?q=" + $location.search().q + facetUrlString;

                        if (scope.lang === "en")
                            $window.location.href = (YDS_CONSTANTS.SEARCH_RESULTS_URL + urlParams);
                        else
                            $window.location.href = (YDS_CONSTANTS.SEARCH_RESULTS_URL_EL + urlParams);
                    } else {
                        // Tabbed search, only modify URL parameters, not location.href
                        var query = $location.search().q;
                        if (_.isUndefined(query) || query.length === 0) {
                            query = "*";
                        }

                        $location.search("q", query);
                        $location.search("fq", facetUrlParts);
                    }
                };

                // Register callback function in order to be notified for the completion of a search query
                Search.registerFacetsCallback(updateFacets)
            }
        };
    }
]);
