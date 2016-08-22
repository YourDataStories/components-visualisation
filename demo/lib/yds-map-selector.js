/**
 * jQuery plugin for selecting a point on the map
 */
(function($){
    $.fn.yds_map_selector = function(options) {
        // Set default settings
        var settings = $.extend({
            popoverTitle: "Select point"
        }, options);

        // Apply map selector
        return this.each(function() {
            // Get input name and create the ID of the div to put the map in
            var textInput = this;
            var inputName = $(textInput).attr("name");
            var mapDivId = inputName + "_map";

            var marker = null;
            var map = null;

            // Add marker icon to Leaflet
            var markerIcon = L.icon({
                iconUrl: 'lib/images/marker-icon-start.png',
                iconSize:   [26, 41],
                iconAnchor:   [13, 41]
            });

            // Function that adds a point to the map at the specified coordinates
            var addPointToMap = function(coords) {
                // If there is already a marker on the map, remove it
                if (!_.isNull(marker)) {
                    map.removeLayer(marker);
                }

                // Add new marker to map and return it
                return L.marker(coords, { icon: markerIcon }).addTo(map);
            };

            // Function that will get called when the user selects a point in the map
            var setPoint = function(e) {
                // Update rule input text field with new coordinates
                var pointStr = JSON.stringify(e.latlng);                // Get coordinates JSON object as String
                $("[name='" + inputName + "']").val(pointStr).change(); // Put point coordinates into rule input

                // Add selected point to the map
                marker = addPointToMap([e.latlng.lat, e.latlng.lng]);
            };

            // Add button that will open popover
            var btn = $("<button class='btn btn-default' style='margin-left: 10px'>Select point</button>");
            $(textInput).after(btn);

            // Create template and content html for Bootstrap Popover
            var templateHtml =  '<div class="popover" role="tooltip" style="max-width: 500px">' +
                                    '<div class="arrow"></div>' +
                                    '<h3 class="popover-title"></h3>' +
                                    '<div class="popover-content"></div>' +
                                '</div>';

            var contentHtml = "<div id='" + mapDivId + "' style='width: 400px; height: 350px'></div>";

            // Apply Bootstrap Popover to the button
            $(btn).popover({
                template: templateHtml,
                content: contentHtml,
                title: settings.popoverTitle,
                html: true
            });

            // After popover is shown put Leaflet map in it
            $(btn).on("shown.bs.popover", function(e) {
                // Initialize map
                map = L.map(mapDivId, {
                    contextmenu: true,
                    contextmenuWidth: 140,
                    contextmenuItems: [
                        {
                            text: 'Select point',
                            callback: setPoint
                        }
                    ]
                }).setView([35.52,23.80], 10);

                // Set OSM as map layer
                L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                }).addTo(map);

                // If there is a point in the text field, add it to the map
                if ($(textInput).val().trim().length > 0) {
                    var coords = JSON.parse($(textInput).val());

                    marker = addPointToMap([coords.lat, coords.lng]);
                }
            });
        });
    };
}(jQuery));
