/**
 * jQuery plugin for selecting years
 */
(function($){
    $.fn.yds_year_selector = function(options) {
        // Apply datepicker with configuration to select years
        return this.each(function() {
            $(this).datepicker({
                format: "yyyy",
                viewMode: "years",
                minViewMode: "years",
                autoclose: true,
                todayBtn: false
            });
        });
    };
}(jQuery));
