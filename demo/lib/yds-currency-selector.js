/**
 * jQuery plugin for selecting currency
 */
(function($){
    $.fn.yds_currency_selector = function(options) {
        // Set default settings and currencies to show
        var settings = $.extend({
            width: 200,
            placeholder: "Select currency...",
            currencies: [
                { code: "EUR", name: "Euro"},
                { code: "USD", name: "U.S. Dollar"}
            ]
        }, options);

        // Apply currency selector
        return this.each(function() {
            // Get text input field
            var textInput = this;

            // Create new div for selectize and add it after text field
            var newInput = $("<div style='width: " + settings.width + "px'></div>");
            $(textInput).after(newInput);

            // Initialize Selectize
            var $select = $(newInput).selectize({
                maxItems: 1,
                labelField: 'name',
                valueField: 'code',
                searchField: ['name', 'code'],
                options: settings.currencies,
                placeholder: settings.placeholder,
                preload: true,
                persist: false
            });

            // Fetch Selectize instance
            var selectize = $select[0].selectize;

            // Hide text input from view
            $(textInput).hide();

            // If text input changes, it means that it got a value from the URL parameters,
            // so select the appropriate option in Selectize (runs only once)
            $(textInput).one("change", function() {
                selectize.setValue($(textInput).val());
            });

            // When Selectize option changes, change the text field's value
            selectize.on("change", function(e) {
                $(textInput).val(e).change();
            });
        });
    };
}(jQuery));
