/*!
 * jQuery QueryBuilder Selectivity plugin for filter selection
 */

/**
 * @throws ConfigError
 */
$.fn.queryBuilder.define('selectivity-plugin', function(options) {
    var ruleFilterSelector = '.rule-filter-container [name$=_filter]';
    var ruleContainerSelector = '.rule-filter-container';

    /**
     * Triggers when creating a new rule, hides QueryBuilder's <select> element for filters, and creates another
     * one based on Selectivity.
     */
    this.on('afterCreateRuleFilters', function(e, rule) {
        var ruleFilterContainer = _.first(rule.$el.find(ruleContainerSelector));
        var ruleFilter = _.first(rule.$el.find(ruleFilterSelector));

        // Create a div for selectivity and add it to the page
        var selectivityDiv = $('<div name="selectivityDiv" width="350px"></div>');
        $(ruleFilterContainer).append(selectivityDiv);

        // Add selectivity to the div
        $(selectivityDiv).selectivity({
            items: options.filters,
            placeholder: "No filter selected",
            showSearchInputInDropdown: false
        });

        // Change selectivity div size
        $(selectivityDiv).width('250px');

        // Hide query builder's select box
        $(ruleFilter).hide();

        // Listen for selection change
        $(selectivityDiv).on("change", function(e) {
            // Make the value that the user selected in Selectivity, the selected one in QueryBuilder's select
            var selectedFilterId = e.value;
            $(ruleFilter).val(selectedFilterId).change();

            // Find the label of the filter with the id e.value
            var wholeLabel = "";
            _.each(options.plainFilters, function(filter) {
                if (filter.id == selectedFilterId) {
                    wholeLabel = filter.text.replace(/\|/g, " ");   // Replace | with space
                }
            });

            // Change the text of the span inside Selectivity to show the whole label of the filter
            $(_.first($(selectivityDiv).find('span'))).text(wholeLabel);    // gets the first span inside the div and changes its text
        });
    });

    /**
     * This will be triggered when setting QueryBuilder rules from the url parameters. In that case we need to
     * set Selectivity's selection to the one of the rule.
     */
    this.on('afterUpdateRuleFilter', function(e, rule) {
        // Get div with selectivity
        var selectivityDiv = _.first(rule.$el.find("[name='selectivityDiv']"));

        // Select the correct option in selectivity
        $(selectivityDiv).selectivity("value", rule.filter.id, {
            triggerChange: false
        });

        // Because we set triggerChange to false, we need to manually tell selectivity to render the selected option
        $(selectivityDiv).selectivity("rerenderSelection");

        // Set the Selectivity div to show the entire rule label
        var wholeLabel = rule.filter.label[options.lang].replace(/\|/g, " ");

        $(_.first($(selectivityDiv).find('span'))).text(wholeLabel);
    });
}, {
    // default options
    filters: {},
    plainFilters: {},
    lang: "en"
});