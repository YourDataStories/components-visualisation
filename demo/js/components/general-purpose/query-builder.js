angular.module("yds").directive("queryBuilder", ["$compile", "$ocLazyLoad", "$location", "Data", "Search", "queryBuilderService",
    function ($compile, $ocLazyLoad, $location, Data, Search, queryBuilderService) {
        return {
            restrict: "E",
            scope: {
                lang: "@",               // Language of the query builder
                urlParamPrefix: "@",	// Prefix to add before all url parameters (optional)
                maxSuggestions: "@",    // Max suggestions to show in typeahead popups
                concept: "@",           // Concept to get filters for
                conceptId: "@",         // ID of concept for making requests to API
                watchRuleUrlParam: "@", // If the builder should watch URL parameter for rule changes and apply them
                builderId: "="          // Builder ID. "=" so it binds to the parent scope & search component can see it
            },
            templateUrl: Data.templatePath + "templates/query-builder.html",
            link: function (scope) {
                scope.qbInputs = {};		// Keeps the QueryBuilder's typeahead ng models
                scope.noFilters = false;    // If there are no filters, show it on the page

                var paramPrefix = scope.urlParamPrefix;
                var watchRuleUrlParam = scope.watchRuleUrlParam;

                // Create unique ID for this query builder
                scope.builderId = "builder" + Data.createRandomId();

                // Only load QueryBuilder if a concept and concept ID are specified
                if (_.isUndefined(scope.conceptId) || scope.conceptId.trim().length === 0 || _.isUndefined(scope.concept) || scope.concept.trim().length === 0) {
                    return;
                }

                // If no url parameter prefix is defined or it is only whitespace, use no parameter prefix
                if (_.isUndefined(paramPrefix) || (paramPrefix.trim() === "" && paramPrefix.length > 0))
                    paramPrefix = "";

                // If watchRuleUrlParam is invalid, set it to false
                if (_.isUndefined(watchRuleUrlParam) || watchRuleUrlParam.trim().length === 0)
                    watchRuleUrlParam = "false";

                /**
                 * Get query builder rules from URL parameter and set them in the QueryBuilder service
                 * @returns {*}     Rules from URL parameter
                 */
                var getRulesFromUrlParam = function () {
                    var rulesStr = $location.search()[paramPrefix + "rules"];

                    if (!_.isUndefined(rulesStr)) {
                        var rules = JSURL.parse(rulesStr);

                        queryBuilderService.setRules(scope.builderId, rules);
                    }

                    return rules;
                };

                // Lazy load jQuery QueryBuilder and add it to the page
                $ocLazyLoad.load({
                    files: [
                        Data.templatePath + "lib/bootstrap-popover.min.js",                // Bootstrap JS (only Popover, for filter description)
                        Data.templatePath + "css/query-builder.default.min.css",           // QueryBuilder's CSS
                        Data.templatePath + "lib/query-builder.standalone.min.js",         // QueryBuilder JavaScript

                        Data.templatePath + "css/bootstrap-datepicker3.min.css",           // Bootstrap Datepicker's CSS
                        Data.templatePath + "lib/bootstrap-datepicker.min.js",             // Bootstrap Datepicker's JavaScript

                        Data.templatePath + "css/bootstrap-slider.min.css",                // Bootstrap Slider CSS
                        Data.templatePath + "lib/bootstrap-slider.min.js",                 // Bootstrap Slider JavaScript

                        Data.templatePath + "lib/querybuilder-selectivity-plugin.js",      // Selectivity QueryBuilder plugin

                        Data.templatePath + "css/selectize.bootstrap3.css",                // Selectize Bootstrap 3 theme
                        Data.templatePath + "lib/selectize.min.js",                        // Selectize javaScript
                        Data.templatePath + "lib/plugins/yds-country-selector.js",                 // Country selection jQuery plugin
                        Data.templatePath + "lib/plugins/yds-currency-selector.js",                // Currency selection jQuery plugin
                        Data.templatePath + "lib/plugins/yds-year-selector.js",                    // Year selection jQuery plugin
                        Data.templatePath + "lib/plugins/yds-map-selector.js"                      // Map point selection jQuery plugin
                    ],
                    cache: true,
                    serie: true
                }).then(function () {
                    var builder = $("#" + scope.builderId);

                    // Get filters for query builder from API
                    Search.getQueryBuilderFilters(scope.conceptId)
                        .then(function (filters) {
                            // Format filters in the format that QueryBuilder expects
                            var formattedFilters = formatFiltersForQueryBuilder(filters);

                            // If there are filters, create builder
                            if (!_.isEmpty(formattedFilters)) {
                                // If the builder is in the active tab and there are rules, give them to the builder
                                var curTab = $location.search()[paramPrefix + "tab"];

                                if (!_.isUndefined(curTab) && scope.concept === curTab) {
                                    var rules = getRulesFromUrlParam();
                                }

                                // Create the builder
                                builder.queryBuilder({
                                    plugins: {
                                        "filter-description": null,
                                        "selectivity-plugin": {
                                            filters: formatFiltersForSelectivity(formattedFilters),
                                            plainFilters: formattedFilters.map(function (filter) {
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

                                if (watchRuleUrlParam === "true") {
                                    // Watch for changes in the rules URL parameter
                                    var rulesParamName = paramPrefix + "rules";

                                    scope.$watch(function () {
                                        return $location.search()[rulesParamName]
                                    }, function (urlParams) {
                                        var curTab = $location.search()[paramPrefix + "tab"];

                                        if (!_.isUndefined(curTab) && scope.concept === curTab) {
                                            var newRules = getRulesFromUrlParam();

                                            if (!_.isUndefined(newRules)) {
                                                builder.queryBuilder('setRules', newRules);
                                            }
                                        }
                                    });
                                }
                            } else {
                                // Show information box saying there are no filters
                                scope.noFilters = true;
                                queryBuilderService.setNoFilters(scope.builderId, true);
                            }
                        });
                });

                /**
                 * Changes the filters array as returned from the server in order to add typeahead in string fields
                 * and get the correct labels depending on the language of the component
                 * @param filters       Filters as returned from the server
                 * @returns {Array}     Formatted filters
                 */
                var formatFiltersForQueryBuilder = function (filters) {
                    var availLangs = Search.geti18nLangs();

                    var newFilters = filters.map(function (obj) {
                        var filter = obj;

                        // Manually use the localized description because filter-description plugin does not support
                        // localization
                        var description = obj["description"][scope.lang];

                        if (_.isUndefined(description) || description.trim().length === 0) {
                            // If description does not exist for the prefered language, try the alternate one
                            var altLang = _.first(_.without(availLangs, scope.lang));

                            description = obj["description"][altLang];
                        }

                        filter.description = description;

                        // If filter is string add typeahead, if it's date add Datepicker plugin
                        if (filter.type === "string" && !_.has(filter, "plugin")) {
                            filter.input = function (rule, name) {
                                // Return html of text input element with typeahead
                                return $compile('<input type="text" class="form-control" name="typeahead"\
                                    placeholder="Type here..." ng-model="qbInputs.' + rule.id + '" \
                                    typeahead-popup-template-url="' + Data.templatePath + 'templates/search-typeahead-popup-small.html"\
                                    uib-typeahead="suggestion for suggestion in getFilterSuggestions($viewValue, \'' + filter.id + '\')" \
                                    typeahead-focus-first="false" autocomplete="off" \
                                    typeahead-on-select="typeaheadSelectHandler(\'' + rule.id + '\', $item)" \
                                    typeahead-append-to-body="true">')(scope);
                            };

                            filter.valueGetter = function (rule) {
                                return scope.qbInputs[rule.id];
                            };

                            filter.valueSetter = function (rule, value) {
                                scope.qbInputs[rule.id] = value;
                            };
                        } else if (_.has(filter, "plugin") && filter.plugin === "slider") {
                            // Add setter and getter for the slider
                            filter.valueSetter = function (rule, value) {
                                if (rule.operator.nb_inputs === 1) value = [value];
                                rule.$el.find('.rule-value-container input').each(function (i) {
                                    $(this).slider('setValue', value[i] || 0);
                                });
                            };

                            filter.valueGetter = function (rule) {
                                var value = [];
                                rule.$el.find('.rule-value-container input').each(function () {
                                    value.push($(this).slider('getValue'));
                                });
                                return rule.operator.nb_inputs === 1 ? value[0] : value;
                            };
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
                var findItem = function (items, itemId) {
                    var foundItem = null;

                    _.each(items, function (item) {
                        if (item.id === itemId) {
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
                var addItem = function (items, item, level) {
                    var idTokens = item.id.split("|");
                    var labelTokens = item.label[scope.lang].split("|");

                    if (idTokens.length === 1) {
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
                            var newItem;
                            if (level < idTokens.length - 1) {
                                // Item should be a submenu
                                newItem = {
                                    id: id,
                                    text: labelTokens[level],
                                    submenu: {items: []}
                                };
                            } else {
                                // Item is not a submenu, it's a choice
                                newItem = {
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
                var formatFiltersForSelectivity = function (filters) {
                    var selectivityFilters = [];

                    _.each(filters, function (filter) {
                        addItem(selectivityFilters, filter, 0);
                    });

                    return selectivityFilters;
                };

                /**
                 * Recursive function that checks if a group has the specified rule, and sets its value
                 * If a rule is a group, it calls itself with that group as parameter
                 * @param group        Group to search inside
                 * @param ruleId    id of the rule to find
                 * @param value        Value to give to the rule
                 */
                var setRule = function (group, ruleId, value) {
                    // For each rule, check if it has the desired id or if it's a group, check inside of it
                    _.each(group.rules, function (rule) {
                        if (_.has(rule, "rules")) {
                            setRule(rule, ruleId, value);
                        } else {
                            if (rule.id === ruleId) {
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
                scope.typeaheadSelectHandler = function (ruleId, selectedItem) {
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
                scope.getFilterSuggestions = function (val, filterId) {
                    return Search.getSuggestions(val, scope.lang, scope.maxSuggestions, filterId);
                };

            }
        };
    }
]);
