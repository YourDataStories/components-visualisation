angular.module('yds').directive('queryBuilder', ['$compile', '$ocLazyLoad', 'Search', 'queryBuilderService',
    function ($compile, $ocLazyLoad, Search, queryBuilderService) {
        return {
            restrict: 'E',
            scope: {
                lang:'@',
                maxSuggestions: '@'
            },
            template: '<div id="builder"></div>',
            link: function (scope) {
                scope.qbInputs = {};		// Keeps the QueryBuilder's typeahead ng models

                // Lazy load jQuery QueryBuilder and add it to the page
                $ocLazyLoad.load({
                    files: [
                        "https://code.jquery.com/jquery-2.2.4.min.js",
                        "css/query-builder.default.min.css",
                        "lib/query-builder.standalone.min.js"
                    ],
                    cache: true,
                    serie: true
                }).then(function () {
                    var builder = $('#builder');

                    // Create builder
                    builder.queryBuilder({
                        filters: getQueryBuilderFilters(),
                        rules: {
                            condition: 'AND',
                            rules: [{
                                id: 'typeahead',
                                operator: 'begins_with',
                                value: ''
                            }, {
                                condition: 'OR',
                                rules: [{
                                    id: 'category',
                                    operator: 'equal',
                                    value: 2
                                }, {
                                    id: 'typeahead',
                                    operator: 'equal',
                                    value: ''
                                }]
                            }]
                        }
                    });

                    // Watch for all changes in the builder, and update the rules in QueryBuilderService
                    // (https://github.com/mistic100/jQuery-QueryBuilder/issues/195)
                    builder.on("afterDeleteGroup.queryBuilder afterUpdateRuleFilter.queryBuilder " +
                        "afterAddRule.queryBuilder afterDeleteRule.queryBuilder afterUpdateRuleValue.queryBuilder " +
                        "afterUpdateRuleOperator.queryBuilder afterUpdateGroupCondition.queryBuilder ", function (e) {
                        queryBuilderService.setRules(builder.queryBuilder('getRules'));
                    }).on('validationError.queryBuilder', function(e, rule, error, value) {
                        // Don't display validation error
                        e.preventDefault();
                    });
                });

                /**
                 * Returns an array of the query builder filters
                 * todo: take them from API
                 * @returns {*[]}
                 */
                var getQueryBuilderFilters = function() {
                    return [{
                        id: 'name',
                        label: 'Name',
                        type: 'string'
                    }, {
                        id: 'category',
                        label: 'Category',
                        type: 'integer',
                        input: 'select',
                        values: {
                            1: 'Books',
                            2: 'Movies',
                            3: 'Music',
                            4: 'Tools',
                            5: 'Goodies',
                            6: 'Clothes'
                        },
                        operators: ['equal', 'not_equal', 'in', 'not_in', 'is_null', 'is_not_null']
                    }, {
                        id: 'in_stock',
                        label: 'In stock',
                        type: 'integer',
                        input: 'radio',
                        values: {
                            1: 'Yes',
                            0: 'No'
                        },
                        operators: ['equal']
                    }, {
                        id: 'price',
                        label: 'Price',
                        type: 'double',
                        validation: {
                            min: 0,
                            step: 0.01
                        }
                    }, {
                        id: 'typeahead',
                        label: 'Typeahead',
                        type: 'string',
                        input: function(rule, name) {
                            // Return html of text input element with typeahead
                            return $compile('<input type="text" class="form-control" name="typeahead"\
									placeholder="Type here..." ng-model="qbInputs.' + rule.id + '" \
									typeahead-popup-template-url="templates/search-typeahead-popup-small.html"\
									uib-typeahead="suggestion for suggestion in getSuggestions($viewValue)" \
									typeahead-focus-first="false" autocomplete="off" \
									typeahead-on-select="typeaheadSelectHandler(\'' + rule.id + '\', $item)" \
									typeahead-append-to-body="true">')( scope );

                        },
                        valueGetter: function(rule) {
                            return scope.qbInputs[rule.id];
                        },
                        valueSetter: function(rule, value) {
                            scope.qbInputs[rule.id] = value;
                        }
                    }];
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
                    var rootModel = $('#builder').queryBuilder('getModel');

                    // Set rule's value in the model
                    setRule(rootModel, ruleId, selectedItem);
                };

                /**
                 * Function to get search suggestions from the Search service
                 * @param val   Input from the search bar
                 */
                scope.getSuggestions = function(val) {
                    //todo: enter "Textile Fabrics; Coated With Gum Or Amylaceous Substances, Of A Kind Used For The Outer Covers Of Books Or The Like" and enter spaces for error
                    return Search.getSearchSuggestions(val, scope.lang, scope.maxSuggestions);
                };

            }
        };
    }]);