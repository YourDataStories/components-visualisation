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

            //set marker icons
            var startIcon = L.icon({
                iconUrl: 'lib/images/marker-icon-start.png',
                iconSize:   [26, 41],
                iconAnchor:   [13, 41]
            });

            var endIcon = L.icon({
                iconUrl: 'lib/images/marker-icon-end.png',
                iconSize:   [26, 41],
                iconAnchor:   [13, 41]
            });

            L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 18,
                attribution: 'Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
            }).addTo(map);

            // Create a general Feature Group to add each project layer
            var allFeatureGroup = L.featureGroup([]);

            Data.getProjectVisualization("map", projectId, viewType, lang)
            .then(function (response) {
                var routePoints = _.findWhere(response.view, {type: "geo-route"});
                var routeTitle = _.findWhere(response.view, {type: "string-i18n"});

                if (!_.isUndefined(routePoints)) {
                    var projectLayer = L.featureGroup([]);
                    var routePath = _.rest(routePoints.attribute.split("."), 1).join();

                    _.each(response.data.routes, function(routeObj) {
                        var polyline = L.polyline([]);
                        var route = Data.deepObjSearch(routeObj, routePath);

                        _.each(route, function(routePoints){
                            polyline.addLatLng([parseFloat(routePoints.lng), parseFloat(routePoints.lat)]);
                        });

                        var StartMarker = L.marker(
                            [parseFloat(_.first(route).lng), parseFloat(_.first(route).lat)],{icon: startIcon}
                        );

                        var EndMarker = L.marker(
                            [parseFloat(_.last(route).lng), parseFloat(_.last(route).lat)],{icon: endIcon}
                        );

                        projectLayer.addLayer(StartMarker);
                        projectLayer.addLayer(EndMarker);
                        projectLayer.addLayer(polyline);
                        projectLayer.bindPopup(Data.deepObjSearch(response.data, routeTitle.attribute), {
                            offset: new L.Point(0, -33)
                        });

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