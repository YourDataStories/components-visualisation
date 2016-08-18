angular.module('yds').directive('queryBuilder', ['$compile', '$ocLazyLoad', '$location', 'Data', 'Search', 'queryBuilderService',
    function ($compile, $ocLazyLoad, $location, Data, Search, queryBuilderService) {
        return {
            restrict: 'E',
            scope: {
                lang:'@',               // Language of the query builder
                maxSuggestions: '@',    // Max suggestions to show in typeahead popups
                concept: '@',           // Concept to get filters for
                conceptId: '@',         // ID of concept for making requests to API
                builderId: '='          // Builder ID. '=' so it binds to the parent scope & search component can see it
            },
            templateUrl: ((typeof Drupal != 'undefined')? Drupal.settings.basePath  + Drupal.settings.yds_project.modulePath  +'/' :'') + 'templates/query-builder.html',
            link: function (scope) {
                scope.qbInputs = {};		// Keeps the QueryBuilder's typeahead ng models
                scope.noFilters = false;    // If there are no filters, show it on the page

                // Create unique ID for this query builder
                scope.builderId = "builder" + Data.createRandomId();

                // Only load QueryBuilder if a concept and concept ID are specified
                if (_.isUndefined(scope.conceptId) || scope.conceptId.trim().length == 0 || _.isUndefined(scope.concept) || scope.concept.trim().length == 0) {
                    return;
                }

		        // Lazy load jQuery QueryBuilder and add it to the page
                var drupalpath = ((typeof Drupal != 'undefined')? Drupal.settings.basePath  + Drupal.settings.yds_project.modulePath  +'/' :'');

                $ocLazyLoad.load({
                    files: [
                        "https://code.jquery.com/jquery-2.2.4.min.js",              // jQuery 2.x (needed for QB)
                        drupalpath + "lib/bootstrap-popover.min.js",                // Bootstrap JS (only Popover, for filter description)
                        drupalpath + "css/query-builder.default.min.css",           // QueryBuilder's CSS
                        drupalpath + "lib/query-builder.standalone.min.js",         // QueryBuilder JavaScript

                        drupalpath + "css/bootstrap-datepicker3.min.css",           // Bootstrap Datepicker's CSS
                        drupalpath + "lib/bootstrap-datepicker.min.js",             // Bootstrap Datepicker's JavaScript

                        drupalpath + "css/bootstrap-slider.min.css",                // Bootstrap Slider CSS
                        drupalpath + "lib/bootstrap-slider.min.js",                 // Bootstrap Slider JavaScript

                        drupalpath + "css/selectivity-full.min.css",                // Selectivity CSS
                        drupalpath + "lib/selectivity-full.min.js",                 // Selectivity JavaScript
                        drupalpath + "lib/querybuilder-selectivity-plugin.js",      // Selectivity QueryBuilder plugin

                        drupalpath + "css/flags.css",                               // Flags CSS from flag-sprites.com
                        drupalpath + "css/selectize.bootstrap3.css",                // Selectize Bootstrap 3 theme
                        drupalpath + "lib/selectize.min.js",                        // Selectize javaScript
                        drupalpath + "lib/yds-country-selector.js",                 // Country selection jQuery plugin
                        drupalpath + "lib/yds-currency-selector.js",                // Currency selection jQuery plugin
                        drupalpath + "lib/yds-map-selector.js"                      // Map point selection jQuery plugin
                    ],
                    cache: true,
                    serie: true
                }).then(function () {
                    var builder = $("#" + scope.builderId);

                    // Get filters for query builder from API
                    Search.getQueryBuilderFilters(scope.conceptId)
                        .then(function(filters) {
                            // Format filters in the format that QueryBuilder expects
                            var formattedFilters = formatFiltersForQueryBuilder(filters);

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
                                    plugins: {
                                        "filter-description": null,
                                        "selectivity-plugin": {
                                            filters: formatFiltersForSelectivity(formattedFilters),
                                            plainFilters: formattedFilters.map(function(filter) {
                                                return {
                                                    id: filter.id,
                                                    text: filter.label[scope.lang]
                                                }
                                            }),
                                            lang: scope.lang
                                        }
                                    },
                                    filters: formattedFilters,          // Filters, formatted for Query Builder
                                    rules: rules,                       // If undefined, the builder will start empty
                                    lang_code: scope.lang               // Language of the builder
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

                                // Fix for Bootstrap Popover from http://stackoverflow.com/a/34766224
                                $('body').off('hidden.bs.popover').on('hidden.bs.popover', function (e) {
                                    $(e.target).data("bs.popover").inState.click = false;
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
                var formatFiltersForQueryBuilder = function(filters) {
                    var availLangs = Search.geti18nLangs();

                    var newFilters = filters.map(function(obj) {
                        var filter = obj;

                        // Manually use the localized description because filter-description plugin does not support
                        // localization
                        var description = obj["description"][scope.lang];

                        if (_.isUndefined(description) || description.trim().length == 0) {
                            // If description does not exist for the prefered language, try the alternate one
                            var altLang = _.first(_.without(availLangs, scope.lang));

                            description = obj["description"][altLang];
                        }

                        filter.description = description;

                        // If filter is string add typeahead, if it's date add Datepicker plugin
                        if (filter.type == "string" && !_.has(filter, "plugin")) {
                            filter.input = function(rule, name) {
                                // Return html of text input element with typeahead
                                return $compile('<input type="text" class="form-control" name="typeahead"\
                                    placeholder="Type here..." ng-model="qbInputs.' + rule.id + '" \
                                    typeahead-popup-template-url="' + drupalpath + 'templates/search-typeahead-popup-small.html"\
                                    uib-typeahead="suggestion for suggestion in getFilterSuggestions($viewValue, \'' + filter.id + '\')" \
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
                        } else if (filter.type == "datetime") {
                            // Add Datepicker plugin
                            filter.plugin = "datepicker";
                            filter.plugin_config = {
                                format: 'dd/mm/yyyy',
                                todayBtn: 'linked',
                                todayHighlight: true,
                                autoclose: true
                            };
                        } else if (_.has(filter, "plugin") && filter.plugin == "slider") {
                            // Add setter and getter for the slider
                            filter.valueSetter = function(rule, value) {
                                if (rule.operator.nb_inputs == 1) value = [value];
                                rule.$el.find('.rule-value-container input').each(function(i) {
                                    $(this).slider('setValue', value[i] || 0);
                                });
                            };

                            filter.valueGetter = function(rule) {
                                var value = [];
                                rule.$el.find('.rule-value-container input').each(function() {
                                    value.push($(this).slider('getValue'));
                                });
                                return rule.operator.nb_inputs == 1 ? value[0] : value;
                            };
                        } else if (_.has(filter, "plugin") && filter.plugin == "yds_map_selector") {
                            // Give the scope and $compile to the plugin so it can add geoediting component
                            filter.plugin_config = {
                                scope: scope,
                                $compile: $compile
                            }
                        }

                        // Return the filter
                        return filter;
                    });

                    return newFilters;
                };

                /**
                 * Finds a specific filter item in a list of items
                 * @param items     List of items
                 * @param itemId    ID of item to find
                 * @returns {*}     Found item, or null if not found
                 */
                var findItem = function(items, itemId) {
                    var foundItem = null;

                    _.each(items, function(item) {
                        if (item.id == itemId) {
                            foundItem = item;
                        }
                    });

                    return foundItem;
                };

                /**
                 * Recursive function to add a filter item to an items list for Selectivity
                 * @param items     Items list
                 * @param item      Item to add to the list
                 * @param level     Shows how many submenus in we currently are in. When you call this, give 0
                 */
                var addItem = function(items, item, level) {
                    var idTokens = item.id.split("|");
                    var labelTokens = item.label[scope.lang].split("|");

                    if (idTokens.length == 1) {
                        items.push({
                            id: item.id,
                            text: item.label[scope.lang]
                        });
                    } else {
                        // Create ID that the item should have if it's a submenu
                        var id = idTokens.slice().splice(0, level + 1).join("|");
                        
                        // Check if the submenu exists
                        var insideItem = findItem(items, id);

                        if (_.isNull(insideItem)) {
                            if (level < idTokens.length - 1) {
                                // Item should be a submenu
                                var newItem = {
                                    id: id,
                                    text: labelTokens[level],
                                    submenu: { items: [] }
                                };
                            } else {
                                // Item is not a submenu, it's a choice
                                var newItem = {
                                    id: item.id,
                                    text: labelTokens[level],
                                    wholeText: item.label[scope.lang]
                                };
                            }

                            items.push(newItem);
                            insideItem = newItem;
                        }

                        // If item is a submenu, add the item to that
                        if (level < idTokens.length - 1) {
                            addItem(insideItem.submenu.items, item, level + 1)
                        }
                    }
                };

                /**
                 * Formats the query builder's filters into Selectivity format with submenus
                 * @param filters       Filters, formatted for query builder
                 * @returns {Array}     Filters, formatted for selectivity
                 */
                var formatFiltersForSelectivity = function(filters) {
                    var selectivityFilters = [];

                    _.each(filters, function(filter) {
                        addItem(selectivityFilters, filter, 0);
                    });

                    return selectivityFilters;
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
                 * @param val       Input from the search bar
                 * @param filterId  ID of the filter
                 */
                scope.getFilterSuggestions = function(val, filterId) {
                    return Search.getSuggestions(val, scope.lang, scope.maxSuggestions, filterId);
                };

            }
        };
    }
]);