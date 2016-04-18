angular.module('yds').directive('ydsMap', ['Data', function(Data){
    return {
        restrict: 'E',
        scope: {
            projectId: '@',     //id of the project that the data belong
            viewType: '@',     //name of the array that contains the visualised data
            lang: '@',          //lang of the visualised data

            zoomControl: '@',   //enable or disable map's zoom control
            elementH: '@',      //set the height of the component

            addToBasket: '@',   //enable or disable "add to basket" functionality, values: true, false
            basketBtnX: '@',    //x-axis position of the basket button
            basketBtnY: '@',    //y-axis position of the basket button

            embeddable: '@',    //enable or disable the embedding of the component
            embedBtnX: '@',     //x-axis position of the embed button
            embedBtnY: '@',     //y-axis position of the embed button
            popoverPos: '@'     //the side of the embed button from which the embed information window will appear
        },
        templateUrl: 'templates/map.html',
        link: function(scope, element) {
            var mapContainer = angular.element(element[0].querySelector('.map-container'));

            //create a random id for the element that will render the chart
            var elementId = "map" + Data.createRandomId();
            mapContainer[0].id = elementId;

            var projectId = scope.projectId;
            var viewType = scope.viewType;
            var lang = scope.lang;
            var zoomControl = scope.zoomControl;
            var elementH = scope.elementH;

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
                zoom: 4,
                zoomControl: (zoomControl === "true")
            });

            //create the default map pins for the start and the end of route
            var mapPins = {
                start : L.icon({
                    iconUrl: 'lib/images/marker-icon-start.png',
                    iconSize:   [26, 41],
                    iconAnchor:   [13, 41]
                }),
                end: L.icon({
                    iconUrl: 'lib/images/marker-icon-end.png',
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

                    //iterate through the different routes and visualize them on the map
                    _.each(response.data.routes, function(routeObj) {
                        //create a polyline layer which will contains the points of each route
                        var polyline = L.polyline([]);
                        //create a featureGroup layer which will contains the polyline and the markers of the route
                        var projectLayer = L.featureGroup([]);
                        //find the title and the points of each route based on the provided view
                        var route = Data.deepObjSearch(routeObj, routePath);
                        var routeTitle = Data.deepObjSearch(routeObj, routeTitlePath);

                        //add the points of each route to the polyline layer
                        _.each(route, function(routePoints){
                            polyline.addLatLng([parseFloat(routePoints.lng), parseFloat(routePoints.lat)]);
                        });

                        //create the start marker of the route and add it to the featureGroup layer
                        var startMarker = L.marker([parseFloat(_.first(route).lng), parseFloat(_.first(route).lat)],{ icon: mapPins.start });
                        startMarker.bindPopup(routeTitle, { offset: new L.Point(0, -33) });
                        projectLayer.addLayer(startMarker);

                        //if the route has more than one point, create the start marker of the route and add it to the featureGroup layer
                        if (route.length!=1) {
                            var endMarker = L.marker([parseFloat(_.last(route).lng), parseFloat(_.last(route).lat)],{ icon: mapPins.end });
                            endMarker.bindPopup(routeTitle, { offset: new L.Point(0, -33) });
                            projectLayer.addLayer(endMarker);
                        }
                        
                        projectLayer.addLayer(polyline);
                        allFeatureGroup.addLayer(projectLayer);
                    });

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
        }
    };
}]);