angular.module("yds").directive("ydsMap", ["Data", "$timeout", "DashboardService", function (Data, $timeout, DashboardService) {
    return {
        restrict: "E",
        scope: {
            projectId: "@",         // ID of the project that the data belong
            viewType: "@",          // Name of the array that contains the visualised data
            lang: "@",              // Lang of the visualised data

            clickedPoint: "=",      // Set this to an existing object, to make the map add the clicked point's ID to it
            selectionMode: "@",     // Selection mode. Can be "single" or "multiple".

            zoomControl: "@",       // Enable or disable map's zoom control
            elementH: "@",          // Set the height of the component

            addToBasket: "@",       // Enable or disable "add to basket" functionality, values: true, false
            basketBtnX: "@",        // X-axis position of the basket button
            basketBtnY: "@",        // Y-axis position of the basket button

            embeddable: "@",        // Enable or disable the embedding of the component
            embedBtnX: "@",         // X-axis position of the embed button
            embedBtnY: "@",         // Y-axis position of the embed button
            popoverPos: "@",        // The side of the embed button from which the embed information window will appear

            dashboardId: "@",       // Dashboard ID to listen for changes and refresh map
            selectionId: "@",       // Selection ID (only used to remove own filter for now)
            enableRating: "@",      // Enable rating buttons for this component
            disableClustering: "@", // Set to true to disable the point clustering
            maxClusterRadius: "@",  // Maximum radius that a cluster will cover from the central marker in pixels.
            disableExplanation: "@" // Set to true to disable the explanation button
        },
        templateUrl: Data.templatePath + "templates/visualisation/map.html",
        link: function (scope, element) {
            var mapContainer = _.first(angular.element(element[0].querySelector(".map-container")));

            // Create a random id for the element that will render the chart
            var elementId = "map" + Data.createRandomId();
            mapContainer.id = elementId;

            var projectId = scope.projectId;
            var viewType = scope.viewType;
            var lang = scope.lang;
            var selectionMode = scope.selectionMode;
            var zoomControl = scope.zoomControl;
            var disableClustering = scope.disableClustering;
            var maxClusterRadius = parseInt(scope.maxClusterRadius);
            var elementH = scope.elementH;
            var dashboardId = scope.dashboardId;
            var selectionId = scope.selectionId;

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

            // Check if the language attribute is defined, else assign default value
            if (_.isUndefined(lang))
                lang = "en";

            // Check if the selectionMode attribute is defined, else assign default value
            if (_.isUndefined(selectionMode) || (selectionMode !== "single" && selectionMode !== "multiple"))
                selectionMode = "single";

            // Check if the zoom-control attribute is defined, else assign default value
            if (_.isUndefined(zoomControl) || (zoomControl !== "true" && zoomControl !== "false"))
                zoomControl = "true";

            // Check if the disableClustering attribute is defined, else assign default value
            if (_.isUndefined(disableClustering) || (disableClustering !== "true" && disableClustering !== "false"))
                disableClustering = "false";

            // Check if the component's height attribute is defined, else assign default value
            if (_.isUndefined(elementH) || _.isNaN(elementH))
                elementH = 200;

            // Check if the component's maxClusterRadius attribute is defined, else assign default value
            if (_.isUndefined(maxClusterRadius) || _.isNaN(maxClusterRadius))
                maxClusterRadius = 80;

            // Set the height of the chart
            mapContainer.style.height = elementH + "px";

            // Initialize the array for (multiple) selected points
            var selectedPoints = [];
            var markersDict = {};               // Dictionary with mapping from marker ID -> leaflet marker object

            // Create the default map pins for the start and the end of route, and selected points
            var mapPins = {
                start: L.icon({
                    iconUrl: Data.templatePath + "lib/images/marker-icon-start.png",
                    iconSize: [26, 41],
                    iconAnchor: [13, 41]
                }),
                end: L.icon({
                    iconUrl: Data.templatePath + "lib/images/marker-icon-end.png",
                    iconSize: [26, 41],
                    iconAnchor: [13, 41]
                }),
                selected: L.icon({
                    iconUrl: Data.templatePath + "lib/images/marker-icon-via.png",
                    iconSize: [26, 41],
                    iconAnchor: [13, 41]
                })
            };

            /**
             * Clear all selected points
             */
            var clearSelection = function () {
                // Hide the button
                clearBtnElement.style.display = "none";

                // Clear selection
                selectedPoints = [];
                $timeout(function () {
                    scope.clickedPoint["point"] = null;
                });

                // Make all markers green again
                _.each(markersDict, function (marker) {
                    marker.setIcon(mapPins.start);
                });

                markersDict = {};
            };

            // Create map
            var map = L.map(elementId, {
                center: [37.9833333, 23.7333333],
                zoom: 5,
                zoomControl: (zoomControl === "true")
            });

            // Add clear points button if multiple point selection is enabled
            var clearBtnElement = null;
            if (pointSelection && selectionMode === "multiple") {
                // Add button for clearing all selected buttons
                var ClearPointsBtn = L.Control.extend({
                    options: {
                        position: "topright"
                    },
                    onAdd: function (map) {
                        var container = L.DomUtil.create("div", "leaflet-bar leaflet-control leaflet-clear-points-btn");

                        container.innerHTML = "Clear selected points";
                        container.onclick = clearSelection;

                        return container;
                    }
                });

                // Add a new clear points button to the map
                var clearBtn = new ClearPointsBtn();
                map.addControl(clearBtn);

                // Get the clear button element
                clearBtnElement = clearBtn.getContainer();
                clearBtnElement.style.display = "none";
            }

            // Add OpenStreetMap tile layer
            L.tileLayer("http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                maxZoom: 18,
                attribution: "Map data © <a href='http://openstreetmap.org'>OpenStreetMap</a> contributors"
            }).addTo(map);

            // Create a general Feature Group to add each project layer
            var allFeatureGroup = L.featureGroup([]);
            allFeatureGroup.addTo(map);

            /**
             * Get map data and add points and routes to the map
             * @param extraParams   (optional) Extra parameters to send to the API
             */
            var createMap = function (extraParams) {
                Data.getProjectVis("map", projectId, viewType, lang, extraParams)
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
                            var shouldCluster = disableClustering !== "true" && (routes.length > clusterThreshold);
                            var clusterGroup = L.markerClusterGroup({
                                maxClusterRadius: maxClusterRadius
                            });

                            // Iterate through the different routes and visualize them on the map
                            _.each(routes, function (routeObj) {
                                // Create a polyline layer which will contain the points of each route
                                var polyline = L.polyline([]);

                                // Create a featureGroup layer which will contain the polyline and the markers of the route
                                var projectLayer = L.featureGroup([]);

                                // Find the title and the points of each route based on the provided view
                                var route = Data.deepObjSearch(routeObj, routePath);
                                var routeTitle = Data.deepObjSearch(routeObj, routeTitlePath);

                                // Get ID & title of route (if it exists...)
                                var markerData = {
                                    id: routeObj.id,
                                    title: routeObj["title_txt"]
                                };

                                if (shouldCluster && route.length === 1) {
                                    // If we should cluster & route length is 1, add the single marker to the cluster group
                                    clusterGroup.addLayer(makeMarker(routeTitle, _.first(route), mapPins.start, markerData));
                                } else {
                                    // Add the points of each route to the polyline layer
                                    _.each(route, function (routePoints) {
                                        polyline.addLatLng([parseFloat(routePoints.lng), parseFloat(routePoints.lat)]);
                                    });

                                    // Create the start marker of the route and add it to the featureGroup layer
                                    var startMarker = makeMarker(routeTitle, _.first(route), mapPins.start, markerData);
                                    projectLayer.addLayer(startMarker);

                                    // If the route has more than one point, create the end marker of the route and add it to the featureGroup layer
                                    if (route.length > 1) {
                                        var endMarker = makeMarker(routeTitle, _.last(route), mapPins.end, markerData);
                                        projectLayer.addLayer(endMarker);
                                    }

                                    projectLayer.addLayer(polyline);
                                    allFeatureGroup.addLayer(projectLayer);
                                }
                            });

                            if (shouldCluster) {
                                allFeatureGroup.addLayer(clusterGroup);
                            }

                            // Zoom the map to the layerGroup
                            map.fitBounds(allFeatureGroup.getBounds(), {
                                padding: new L.Point(21, 21)
                            });
                        }

                        // In multiple selection mode, refresh the selected items in the scope in case any of them
                        // do not exist anymore with the new filters
                        if (pointSelection && selectionMode === "multiple") {
                            selectedPoints = _.keys(markersDict);
                            scope.clickedPoint["point"] = selectedPoints.join(",");
                        }
                    }, function (error) {
                        if (_.isNull(error) || _.isUndefined(error) || _.isUndefined(error.message))
                            scope.ydsAlert = "An error has occurred, please check the configuration of the component.";
                        else
                            scope.ydsAlert = error.message;
                    });
            };

            /**
             * Create a marker with a specific icon, which shows a popup with the specified
             * title when clicked.
             * @param title         Title to show on popup
             * @param point         Point object
             * @param icon          Icon to use for new point
             * @param markerData    (optional) An object with data for the marker, such as ID & title.
             */
            var makeMarker = function (title, point, icon, markerData) {
                var newMarker = L.marker([parseFloat(point.lng), parseFloat(point.lat)], {icon: icon});
                newMarker.bindPopup(title, {offset: new L.Point(0, -33)});

                // If point selection is enabled, add click event
                if (pointSelection && !_.isUndefined(markerData)) {
                    newMarker.on("click", markerClickHandler);  // Add click handler
                    newMarker.data = markerData;                // Add ID
                }

                // Since we are creating a marker, if another marker with the same ID exists in the markers object,
                // we must update the reference with the new one (because it was selected) and also change its icon
                // if (_.has(markersDict, markerData.id)) {
                if (_.contains(selectedPoints, markerData.id)) {
                    markersDict[markerData.id] = newMarker;

                    newMarker.setIcon(mapPins.selected);

                    // Make clear button visible
                    clearBtnElement.style.display = "block";
                }

                return newMarker;
            };

            /**
             * Set the clicked point to the target of the given Leaflet event.
             * @param e Leaflet (click) event
             */
            var markerClickHandler = function (e) {
                var selectionData = null;

                if (selectionMode === "single") {
                    // Single selection mode, just add the point
                    selectionData = e.target.data;
                } else {
                    // Multiple selection. Check if the clicked point is already in the selected points array
                    if (_.contains(selectedPoints, e.target.data.id)) {
                        // The point was selected already, we need to deselect it
                        selectedPoints = _.without(selectedPoints, e.target.data.id);    // Remove from the array
                        markersDict = _.omit(markersDict, e.target.data.id);

                        e.target.setIcon(mapPins.start);
                    } else {
                        // The point should be selected
                        selectedPoints.push(e.target.data.id);
                        markersDict[e.target.data.id] = e.target;

                        e.target.setIcon(mapPins.selected);
                    }

                    selectionData = selectedPoints.join(",");

                    if (selectedPoints.length > 0) {
                        // Show the clear points button
                        clearBtnElement.style.display = "block";
                    }
                }

                // Add the data to the scope in a timeout so Angular will see it
                $timeout(function () {
                    scope.clickedPoint["point"] = selectionData;
                });
            };

            // Before creating the map, get cookie data from Dashboard. If it exists, restore saved points
            if (pointSelection && !_.isUndefined(selectionId) && selectionId.length > 0) {
                var cookieData = DashboardService.getCookieObject(selectionId);
                if (!_.isNull(cookieData) && _.isString(cookieData)) {
                    selectedPoints = cookieData.split(",");
                }
            }

            // Create the map
            createMap();

            // Listen for changes to the filters and refresh points if needed
            var oldFilters = {};
            if (!_.isUndefined(dashboardId) && dashboardId.trim().length > 0) {
                DashboardService.subscribeObjectChanges(scope, function () {
                    var newFilters = _.omit(DashboardService.getApiOptions(dashboardId), selectionId);

                    if (!_.isEqual(oldFilters, newFilters)) {
                        allFeatureGroup.clearLayers();
                        markersDict = {};

                        createMap(newFilters);
                        oldFilters = newFilters;
                    }
                });
            }
        }
    };
}]);
