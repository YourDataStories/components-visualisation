angular.module('yds').directive('ydsMap', ['Data', function(Data){
    return {
        restrict: 'E',
        scope: {
            projectId: '@',     //id of the project that the data belong
            viewType: '@',      //name of the array that contains the visualised data
            lang: '@',          //lang of the visualised data

            zoomControl: '@',   //enable or disable map's zoom control
            elementH: '@',      //set the height of the component

            addToBasket: '@',   //enable or disable "add to basket" functionality, values: true, false
            basketBtnX: '@',    //x-axis position of the basket button
            basketBtnY: '@',    //y-axis position of the basket button

            embeddable: '@',    //enable or disable the embedding of the component
            embedBtnX: '@',     //x-axis position of the embed button
            embedBtnY: '@',     //y-axis position of the embed button
            popoverPos: '@',    //the side of the embed button from which the embed information window will appear

            enableRating: '@'   // Enable rating buttons for this component
        },
        templateUrl: ((typeof Drupal != 'undefined')? Drupal.settings.basePath  + Drupal.settings.yds_project.modulePath  +'/' :'') + 'templates/map.html',
        link: function (scope, element) {
            var mapContainer = angular.element(element[0].querySelector('.map-container'));

            //create a random id for the element that will render the chart
            var elementId = "map" + Data.createRandomId();
            mapContainer[0].id = elementId;

            var projectId = scope.projectId;
            var viewType = scope.viewType;
            var lang = scope.lang;
            var zoomControl = scope.zoomControl;
            var elementH = scope.elementH;

            // When the points are more than the number here, clustering will be used
            var clusterThreshold = 100;

            //check if the projectId is defined, else stop the process
            if (_.isUndefined(projectId) || projectId.trim()=="") {
                scope.ydsAlert = "The YDS component is not properly configured." +
                    "Please check the corresponding documentation section";
                return false;
            }

            //check if info-type attribute is empty and assign the default value
            if(_.isUndefined(viewType) || viewType.trim()=="")
                viewType = "default";

            //check if the language attr is defined, else assign default value
            if(angular.isUndefined(lang))
                lang = "en";

            //check if the zoom-control attr is defined, else assign default value
            if(angular.isUndefined(zoomControl) || (zoomControl!="true" && zoomControl!="false"))
                zoomControl = "true";

            //check if the component's height attr is defined, else assign default value
            if(angular.isUndefined(elementH) || isNaN(elementH))
                elementH = 200 ;

            //set the height of the chart
            mapContainer[0].style.height = elementH + 'px';

            /***************************************/
            /**** UPDATED CODE FOR ALL PROJECTS ****/
            /***************************************/
            var map = L.map(elementId, {
                center: [37.9833333,23.7333333],
                zoom: 5,
                zoomControl: (zoomControl === "true")
            });

            //create the default map pins for the start and the end of route
            var mapPins = {
                start : L.icon({
                    iconUrl: ((typeof Drupal != 'undefined')? Drupal.settings.basePath  + Drupal.settings.yds_project.modulePath  +'/' :'') + 'lib/images/marker-icon-start.png',
                    iconSize:   [26, 41],
                    iconAnchor:   [13, 41]
                }),
                end: L.icon({
                    iconUrl: ((typeof Drupal != 'undefined')? Drupal.settings.basePath  + Drupal.settings.yds_project.modulePath  +'/' :'') + 'lib/images/marker-icon-end.png',
                    iconSize:   [26, 41],
                    iconAnchor:   [13, 41]
                })
            };

            L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 18,
                attribution: 'Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
            }).addTo(map);

            // Create a general Feature Group to add each project layer
            var allFeatureGroup = L.featureGroup([]);

            Data.getProjectVis("map", projectId, viewType, lang)
            .then(function (response) {
                //extract the required objects from the view
                var routePointsView = _.findWhere(response.view, {type: "geo-route"});
                var routeTitleView = _.findWhere(response.view, {type: "string-i18n"});

                if (!_.isUndefined(routePointsView)) {
                    //create a separate leaflet featureGroup for each route
                    var routePath = _.rest(routePointsView.attribute.split("."), 1).join(".");
                    var routeTitlePath = _.rest(routeTitleView.attribute.split("."), 1).join(".");

                    var routes = response.data.routes;

                    // Check if we should cluster the markers (if # of routes exceeds the threshold)
                    var shouldCluster = routes.length > clusterThreshold;
                    var clusterGroup = L.markerClusterGroup();

                    //iterate through the different routes and visualize them on the map
                    _.each(routes, function(routeObj) {
                        //create a polyline layer which will contain the points of each route
                        var polyline = L.polyline([]);
                        //create a featureGroup layer which will contain the polyline and the markers of the route
                        var projectLayer = L.featureGroup([]);
                        //find the title and the points of each route based on the provided view
                        var route = Data.deepObjSearch(routeObj, routePath);
                        var routeTitle = Data.deepObjSearch(routeObj, routeTitlePath);

                        if (shouldCluster && route.length == 1) {
                            // If we should cluster and route length is 1, add the single marker to the cluster group
                            clusterGroup.addLayer(makeMarker(routeTitle, _.first(route), mapPins.start));
                        } else {
                            //add the points of each route to the polyline layer
                            _.each(route, function(routePoints){
                                polyline.addLatLng([parseFloat(routePoints.lng), parseFloat(routePoints.lat)]);
                            });

                            //create the start marker of the route and add it to the featureGroup layer
                            var startMarker = makeMarker(routeTitle, _.first(route), mapPins.start);
                            projectLayer.addLayer(startMarker);

                            //if the route has more than one point, create the end marker of the route and add it to the featureGroup layer
                            if (route.length!=1) {
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

                    // zoom the map to the layerGroup
                    map.fitBounds(allFeatureGroup.getBounds(), {
                        padding: new L.Point(21, 21)
                    });
                }
            }, function (error) {
                if (error==null || _.isUndefined(error) || _.isUndefined(error.message))
                    scope.ydsAlert = "An error was occurred, please check the configuration of the component";
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
            var makeMarker = function(title, point, icon) {
                var newMarker = L.marker([parseFloat(point.lng), parseFloat(point.lat)],{ icon: icon });
                newMarker.bindPopup(title, { offset: new L.Point(0, -33) });

                return newMarker;
            }
        }
    };
}]);