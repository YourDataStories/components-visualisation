/**
 * jQuery plugin for selecting routes/areas
 */
(function($){
    $.fn.yds_map_selector = function(options) {
        // Set default settings
        var settings = $.extend({
            placeholder: "Select point..."
        }, options);

        // Apply currency selector
        return this.each(function() {
            // Get text input field
            var textInput = this;
            // var inputName = $(textInput).attr("name");

            // Create (and compile) button to open map selector using Angular Bootstrap Popover
            var newInput = settings.$compile("  <button uib-popover-template='\"templates/yds-map-selector-template.html\"' \
                                                    popover-placement='bottom' \
                                                    popover-title='Create route' \
                                                    popover-trigger='click' \
                                                    type='button' \
                                                    class='btn btn-default'>Map Selector \
                                                </button>"
            )(settings.scope);

            // Add the button after the text input
            $(textInput).after(newInput);
        });
    };
}(jQuery));
