angular.module('yds').directive('queryBuilder', ['$compile', '$ocLazyLoad', '$location', 'Data', 'Search', 'queryBuilderService',
    function ($compile, $ocLazyLoad, $location, Data, Search, queryBuilderService) {
        return {
            restrict: 'E',
            scope: {
                lang:'@',               // Language of the query builder
                maxSuggestions: '@',    // Max suggestions to show in typeahead popups
                concept: '@',           // Concept to get filters for
                builderId: '='          // Builder ID. '=' so it binds to the parent scope & search component can see it
            },
            templateUrl: ((typeof Drupal != 'undefined')? Drupal.settings.basePath  + Drupal.settings.yds_project.modulePath  +'/' :'') + 'templates/query-builder.html',
            link: function (scope) {
                scope.qbInputs = {};		// Keeps the QueryBuilder's typeahead ng models
                scope.noFilters = false;    // If there are no filters, show it on the page

                // Create unique ID for this query builder
                scope.builderId = "builder" + Data.createRandomId();

                // Only load QueryBuilder if a concept is specified
                if (_.isUndefined(scope.concept) || scope.concept.trim().length == 0) {
                    return;
                }

                // Lazy load jQuery QueryBuilder and add it to the page
                $ocLazyLoad.load({
                    files: [
                        "css/query-builder.default.min.css",                // QueryBuilder's CSS
                        "css/bootstrap-datepicker3.min.css",                // Bootstrap Datepicker's CSS
                        "https://code.jquery.com/jquery-2.2.4.min.js",      // jQuery 2.x (needed for QB)
                        "lib/query-builder.standalone.min.js",              // QueryBuilder JavaScript
                        "lib/bootstrap-datepicker.min.js"                   // Bootstrap Datepicker's JavaScript
                    ],
                    cache: true,
                    serie: true
                }).then(function () {
                    var builder = $("#" + scope.builderId);

                    // Get filters for query builder from API
                    Search.getQueryBuilderFilters(scope.concept)
                        .then(function(filters) {
                            // Format filters in the format that QueryBuilder expects
                            var formattedFilters = formatFilters(filters);

                            // If there are filters, create builder
                            if (!_.isEmpty(formattedFilters)) {
                                // If the builder is in the active tab and there are rules, give them to the builder
                                var curTab = $location.search().tab;
                                var rulesStr = $location.search().rules;

                                if (!_.isUndefined(curTab) && !_.isUndefined(rulesStr) && scope.concept == curTab) {
                                    var rules = JSURL.parse(rulesStr);

                                    queryBuilderService.setRules(scope.builderId, rules);
                                }

                                // Create the builder
                                builder.queryBuilder({
                                    filters: formattedFilters,
                                    rules: rules                // If this wasn't defined, the builder will start empty
                                });

                                // Watch for all changes in the builder, and update the rules in QueryBuilderService
                                // (https://github.com/mistic100/jQuery-QueryBuilder/issues/195)
                                builder.on("afterDeleteGroup.queryBuilder afterUpdateRuleFilter.queryBuilder " +
                                    "afterAddRule.queryBuilder afterDeleteRule.queryBuilder afterUpdateRuleValue.queryBuilder " +
                                    "afterUpdateRuleOperator.queryBuilder afterUpdateGroupCondition.queryBuilder ", function (e) {
                                    queryBuilderService.setRules(scope.builderId, builder.queryBuilder('getRules'));
                                }).on('validationError.queryBuilder', function (e) {
                                    // Don't display QueryBuilder's validation errors
                                    e.preventDefault();
                                });
                            } else {
                                // Show information box saying there are no filters
                                scope.noFilters = true;
                                queryBuilderService.setNoFilters(scope.builderId, true);
                            }
                        });
                });

                /**
                 * Changes the filters array as returned from the server in order to add typeahead in string fields,
                 * datepicker in date fields and get the correct labels depending on the language of the component
                 * @param filters       Filters as returned from the server
                 * @returns {Array}     Formatted filters
                 */
                var formatFilters = function(filters) {
                    var availLangs = Search.geti18nLangs();

                    var newFilters = filters.map(function(obj) {
                        // Find the label the filter should have depending on language
                        var label = obj["label"][scope.lang];
                        if (_.isUndefined(label)) {
                            var otherLang = _.first(_.without(availLangs, scope.lang));
                            label = obj["label"][otherLang];
                        }

                        // Create filter object
                        var filter = {
                            id: obj.id,
                            label: label,
                            type: obj.type
                        };

                        // If filter is string add typeahead, if it's date add Datepicker plugin
                        if (obj.type == "string") {
                            filter.input = function(rule, name) {
                                // Return html of text input element with typeahead
                                return $compile('<input type="text" class="form-control" name="typeahead"\
                                    placeholder="Type here..." ng-model="qbInputs.' + rule.id + '" \
                                    typeahead-popup-template-url="templates/search-typeahead-popup-small.html"\
                                    uib-typeahead="suggestion for suggestion in getSuggestions($viewValue)" \
                                    typeahead-focus-first="false" autocomplete="off" \
                                    typeahead-on-select="typeaheadSelectHandler(\'' + rule.id + '\', $item)" \
                                    typeahead-append-to-body="true">')( scope );
                            };

                            filter.valueGetter = function(rule) {
                                return scope.qbInputs[rule.id];
                            };

                            filter.valueSetter = function(rule, value) {
                                scope.qbInputs[rule.id] = value;
                            };
                        } else if (obj.type == "datetime") {
                            // Make filter's type "date" instead of "datetime"
                            filter.type = "date";

                            // Add Datepicker plugin
                            filter.plugin = "datepicker";
                            filter.plugin_config = {
                                format: 'dd/mm/yyyy',
                                todayBtn: 'linked',
                                todayHighlight: true,
                                autoclose: true
                            };
                        }

                        // Return the filter
                        return filter;
                    });

                    return newFilters;
                };

                /**
                 * Recursive function that checks if a group has the specified rule, and sets its value
                 * If a rule is a group, it calls itself with that group as parameter
                 * @param group		Group to search inside
                 * @param ruleId	id of the rule to find
                 * @param value		Value to give to the rule
                 */
                var setRule = function(group, ruleId, value) {
                    // For each rule, check if it has the desired id or if it's a group, check inside of it
                    _.each(group.rules, function(rule) {
                        if (_.has(rule, "rules")) {
                            setRule(rule, ruleId, value);
                        } else {
                            if (rule.id == ruleId) {
                                rule.value = value;
                            }
                        }
                    });
                };

                /**
                 * Runs when something is selected in the Angular UI Bootstrap typeahead popup, and updates
                 * the value in jQuery Query Builder's model because it is not getting updated on its own.
                 * @param ruleId        id of the rule that changed
                 * @param selectedItem  item that was selected
                 */
                scope.typeaheadSelectHandler = function(ruleId, selectedItem) {
                    // Get root model
                    var rootModel = $("#" + scope.builderId).queryBuilder('getModel');

                    // Set rule's value in the model
                    setRule(rootModel, ruleId, selectedItem);
                };

                /**
                 * Function to get search suggestions from the Search service
                 * @param val   Input from the search bar
                 */
                scope.getSuggestions = function(val) {
                    return Search.getSearchSuggestions(val, scope.lang, scope.maxSuggestions);
                };

            }
        };
    }
]);