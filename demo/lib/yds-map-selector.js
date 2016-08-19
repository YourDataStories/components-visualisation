/**
 * jQuery plugin for selecting routes/areas
 */
(function($){
    $.fn.yds_map_selector = function(options) {
        // Set default settings
        var settings = $.extend({
            label: "Select route..."
        }, options);

        // Function that will be used to set the rule input text field's text
        settings.scope.setRuleInput = function(input, msg) {
            $(input).val(msg).change();
        };

        // Apply map selector
        return this.each(function() {
            // Set the variables in QueryBuilder's scope
            settings.scope.textField = this;
            //todo: support multiple map selectors

            // Create (and compile) button to open map selector using Angular Bootstrap Popover
            var popoverBtn = settings.$compile("<button uib-popover-template='\"templates/yds-map-selector-template.html\"' \
                                                    popover-placement='bottom' popover-trigger='click' \
                                                    popover-title='Create route' type='button' \
                                                    class='btn btn-default'>" + settings.label + "</button>")(settings.scope);

            // Add the button after the text input
            $(this).after(popoverBtn);
        });
    };
}(jQuery));
