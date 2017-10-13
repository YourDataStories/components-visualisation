angular.module("yds").directive("ydsMap", ["Data", "$timeout", function (Data, $timeout) {
    return {
        restrict: "E",
        scope: {
            projectId: "@",         // ID of the project that the data belong
            viewType: "@",          // Name of the array that contains the visualised data
            lang: "@",              // Lang of the visualised data

            clickedPoint: "=",      // Set this to an existing object, to make the map add the clicked point's ID to it

            zoomControl: "@",       // Enable or disable map's zoom control
            elementH: "@",          // Set the height of the component

            addToBasket: "@",       // Enable or disable "add to basket" functionality, values: true, false
            basketBtnX: "@",        // X-axis position of the basket button
            basketBtnY: "@",        // Y-axis position of the basket button

            embeddable: "@",        // Enable or disable the embedding of the component
            embedBtnX: "@",         // X-axis position of the embed button
            embedBtnY: "@",         // Y-axis position of the embed button
            popoverPos: "@",        // The side of the embed button from which the embed information window will appear

            enableRating: "@",      // Enable rating buttons for this component
            disableExplanation: "@" // Set to true to disable the explanation button
        },
        templateUrl: ((typeof Drupal != "undefined") ? Drupal.settings.basePath + Drupal.settings.yds_project.modulePath + "/" : "") + "templates/map.html",
        link: function (scope, element) {
            var mapContainer = angular.element(element[0].querySelector(".map-container"));
            var drupalPath = (typeof Drupal != "undefined") ? Drupal.settings.basePath + Drupal.settings.yds_project.modulePath + "/" : "";

            // Create a random id for the element that will render the chart
            var elementId = "map" + Data.createRandomId();
            mapContainer[0].id = elementId;

            var projectId = scope.projectId;
            var viewType = scope.viewType;
            var lang = scope.lang;
            var zoomControl = scope.zoomControl;
            var elementH = scope.elementH;

            // When the points are more than the number here, clustering will be used
            var clusterThreshold = 100;

            // Check if point selection should be enabled
            var pointSelection = !_.isUndefined(scope.clickedPoint);

            // Check if the projectId is defined, else stop the process
            if (_.isUndefined(projectId) || projectId.trim() === "") {
                scope.ydsAlert = "The YDS component is not properly configured. " +
                    "Please check the corresponding documentation section.";
                return false;
            }

            // Check if view-type attribute is empty and assign the default value
            if (_.isUndefined(viewType) || viewType.trim() === "")
                viewType = "default";

            // Check if the language attr is defined, else assign default value
            if (_.isUndefined(lang))
                lang = "en";

            // Check if the zoom-control attr is defined, else assign default value
            if (_.isUndefined(zoomControl) || (zoomControl !== "true" && zoomControl !== "false"))
                zoomControl = "true";

            // Check if the component's height attr is defined, else assign default value
            if (_.isUndefined(elementH) || _.isNaN(elementH))
                elementH = 200;

            // Set the height of the chart
            mapContainer[0].style.height = elementH + "px";

            var map = L.map(elementId, {
                center: [37.9833333, 23.7333333],
                zoom: 5,
                zoomControl: (zoomControl === "true")
            });

            // Create the default map pins for the start and the end of route
            var mapPins = {
                start: L.icon({
                    iconUrl: drupalPath + "lib/images/marker-icon-start.png",
                    iconSize: [26, 41],
                    iconAnchor: [13, 41]
                }),
                end: L.icon({
                    iconUrl: drupalPath + "lib/images/marker-icon-end.png",
                    iconSize: [26, 41],
                    iconAnchor: [13, 41]
                })
            };

            // Add OpenStreetMap tile layer
            L.tileLayer("http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                maxZoom: 18,
                attribution: "Map data © <a href='http://openstreetmap.org'>OpenStreetMap</a> contributors"
            }).addTo(map);

            // Create a general Feature Group to add each project layer
            var allFeatureGroup = L.featureGroup([]);

            Data.getProjectVis("map", projectId, viewType, lang)
                .then(function (response) {
                    // Extract the required objects from the view
                    var routePointsView = _.findWhere(response.view, {type: "geo-route"});
                    var routeTitleView = _.findWhere(response.view, {type: "string-i18n"});

                    if (!_.isUndefined(routePointsView)) {
                        // Create a separate leaflet featureGroup for each route
                        var routePath = _.rest(routePointsView.attribute.split("."), 1).join(".");
                        var routeTitlePath = _.rest(routeTitleView.attribute.split("."), 1).join(".");

                        var routes = response.data.routes;

                        // Check if we should cluster the markers (if # of routes exceeds the threshold)
                        var shouldCluster = routes.length > clusterThreshold;
                        var clusterGroup = L.markerClusterGroup();

                        // Iterate through the different routes and visualize them on the map
                        _.each(routes, function (routeObj) {
                            // Create a polyline layer which will contain the points of each route
                            var polyline = L.polyline([]);
                            // Create a featureGroup layer which will contain the polyline and the markers of the route
                            var projectLayer = L.featureGroup([]);
                            // Find the title and the points of each route based on the provided view
                            var route = Data.deepObjSearch(routeObj, routePath);
                            var routeTitle = Data.deepObjSearch(routeObj, routeTitlePath);

                            if (shouldCluster && route.length === 1) {
                                // If we should cluster and route length is 1, add the single marker to the cluster group
                                clusterGroup.addLayer(makeMarker(routeTitle, _.first(route), mapPins.start));
                            } else {
                                // Add the points of each route to the polyline layer
                                _.each(route, function (routePoints) {
                                    polyline.addLatLng([parseFloat(routePoints.lng), parseFloat(routePoints.lat)]);
                                });

                                // Create the start marker of the route and add it to the featureGroup layer
                                var startMarker = makeMarker(routeTitle, _.first(route), mapPins.start);
                                projectLayer.addLayer(startMarker);

                                // If the route has more than one point, create the end marker of the route and add it to the featureGroup layer
                                if (route.length > 1) {
                                    var endMarker = makeMarker(routeTitle, _.last(route), mapPins.end);
                                    projectLayer.addLayer(endMarker);
                                }

                                projectLayer.addLayer(polyline);
                                allFeatureGroup.addLayer(projectLayer);
                            }
                        });

                        if (shouldCluster) {
                            allFeatureGroup.addLayer(clusterGroup);
                        }

                        allFeatureGroup.addTo(map);

                        // Zoom the map to the layerGroup
                        map.fitBounds(allFeatureGroup.getBounds(), {
                            padding: new L.Point(21, 21)
                        });
                    }
                }, function (error) {
                    if (_.isNull(error) || _.isUndefined(error) || _.isUndefined(error.message))
                        scope.ydsAlert = "An error has occurred, please check the configuration of the component.";
                    else
                        scope.ydsAlert = error.message;
                });

            /**
             * Create a marker with a specific icon, which shows a popup with the specified
             * title when clicked.
             * @param title Title to show on popup
             * @param point Point object
             * @param icon  Icon to use for new point
             */
            var makeMarker = function (title, point, icon) {
                var newMarker = L.marker([parseFloat(point.lng), parseFloat(point.lat)], {icon: icon});
                newMarker.bindPopup(title, {offset: new L.Point(0, -33)});

                // If point selection is enabled, add click event
                if (pointSelection) {
                    newMarker.on("click", markerClickHandler);
                }

                return newMarker;
            };

            /**
             * Set the clicked point to the target of the given Leaflet event.
             * @param e Leaflet (click) event
             */
            var markerClickHandler = function (e) {
                $timeout(function () {
                    scope.clickedPoint["point"] = e.target.getLatLng();
                });
            };
        }
    };
}]);
