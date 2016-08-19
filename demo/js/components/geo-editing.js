angular.module('yds').directive('ydsGeoEditing', ['Data', '$timeout', function(Data, $timeout){
    return {
        restrict: 'E',
        scope: {
            projectId: '@',     // Project ID
            embedded: '@'       // If the component is embedded then it will not send the annotation to the API
        },
        templateUrl: ((typeof Drupal != 'undefined')? Drupal.settings.basePath  + Drupal.settings.yds_project.modulePath  +'/' :'') + 'templates/geo-editing.html',
        link: function(scope, elem, attrs) {
            scope.annotationType="line";
            scope.routeService=false;

            if (_.isUndefined(scope.embedded) || (scope.embedded != "true" && scope.embedded != "false")) {
                scope.embedded = "false";
            }

            //function to retrieved saved route from server
            //Data.getGeoObj(scope.projectId).then(function(response){ debugger;
            //    console.log('function to retrieved saved route from server', JSON.stringify(response));
            //
            //    if (!_.isEmpty(response)) {
            //        scope.geoObj = angular.copy(response);
            //        $timeout(function(){
            //            drawMarkers();                              //draw markers
            //            //drawRoute();                                //draw route
            //            drawPolygon();
            //        }, 0);
            //    }
            //}, function(error) {
            //    console.log('an error occurred', error);
            //});

            //function to check if an object is empty
            scope.isEmpty = function (obj) {
                for (var i in obj) if (obj.hasOwnProperty(i)) return false;
                return true;
            };

            //function to count the number of markers on the map
            var countMapMarkers = function () {
                var markerCounter = 0;
                if (!scope.isEmpty(scope.geoObj.startPoint)) markerCounter++;
                if (!scope.isEmpty(scope.geoObj.endPoint)) markerCounter++;
                markerCounter += (scope.geoObj.viaPoints).length;

                return markerCounter;
            };

            //function to call openRouteService and visualise the route on map
            var visualiseRoute = function () {
                //Check if route service is on
                if(scope.routeService){
                    Data.getRoutePoints(scope.geoObj.startPoint, scope.geoObj.endPoint, scope.geoObj.viaPoints)
                        .then(function(response){
                            //console.log('function to call openRouteService', JSON.stringify(response));
                            scope.geoObj.route = angular.copy(response.route);
                            //Check type of annotation. Line or polygon
                            if(scope.annotationType==="line"){
                                drawRoute();
                            }else{
                                drawPolygon();
                            }
                        });
                }else{
                    scope.geoObj.route=[]; //clean route
                    if(!scope.isEmpty(scope.geoObj.startPoint)){ //add start point as first point
                        scope.geoObj.route.push(scope.geoObj.startPoint);
                    }

                    if(!scope.isEmpty(scope.geoObj.viaPoints)){//add via points
                        for (var i=0; i<scope.geoObj.viaPoints.length; i++){
                            scope.geoObj.route.push(scope.geoObj.viaPoints[i]);
                        }
                    }

                    if(!scope.isEmpty(scope.geoObj.endPoint)){//add end point as last point
                        scope.geoObj.route.push(scope.geoObj.endPoint);
                    }

                    //Check type of annotation. Line or polygon
                    if(scope.annotationType==="line"){
                        drawRoute();
                    }else{
                        drawPolygon();
                    }
                }
            };

            scope.geoObj = {
                startPoint: {},
                viaPoints: [],
                endPoint: {},
                route: []
            };

            //set Layer Markers
            var startLayerMarker = L.layerGroup([]);
            var endLayerMarker = L.layerGroup([]);
            var viaLayerMarker = L.layerGroup([]);
            var routeLayer = L.layerGroup([]);

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

            var viaIcon = L.icon({
                iconUrl: 'lib/images/marker-icon-via.png',
                iconSize:   [26, 41],
                iconAnchor:   [13, 41]
            });

            var refreshRouteList = function() {     //refresh the data of the route side list
                $timeout(function(){
                    scope.geoObj.startPoint = angular.copy(startPoint);
                    scope.geoObj.viaPoints = angular.copy(viaPoints);
                    scope.geoObj.endPoint = angular.copy(endPoint);
                },0);
            };

            var setStartPoint = function(e){
                scope.geoObj.startPoint=e.latlng;

                if(!scope.isEmpty(scope.geoObj.endPoint) || scope.geoObj.viaPoints.length>0){
                    if(scope.isEmpty(scope.geoObj.endPoint)){   //if endPoint doesn't exist get point from viaPoints stack end set it as endPoint
                        $timeout(function(){
                            scope.geoObj.endPoint = scope.geoObj.viaPoints.pop();       //pop from viaPoints and add it on endPoint
                        },0);
                    }

                    visualiseRoute(); //call route service
                }

                $timeout(function(){
                    drawMarkers();                                //redraw markers
                }, 0);
            };

            var setViaPoint = function(e) {
                scope.geoObj.viaPoints.push(e.latlng);

                if(!scope.isEmpty(scope.geoObj.endPoint) || !scope.isEmpty(scope.geoObj.startPoint) || scope.geoObj.viaPoints.length>1){
                    if(!scope.isEmpty(scope.geoObj.endPoint) && scope.isEmpty(scope.geoObj.startPoint)){    //pop from viaPoints and add it on endPoint
                        scope.geoObj.startPoint = scope.geoObj.viaPoints.pop();
                    }else if(!scope.isEmpty(scope.geoObj.startPoint) && scope.isEmpty(scope.geoObj.endPoint)){ //pop from viaPoints and add it on endPoint
                        scope.geoObj.endPoint = scope.geoObj.viaPoints.pop();
                    }else if(scope.isEmpty(scope.geoObj.startPoint) && scope.isEmpty(scope.geoObj.endPoint)){
                        scope.geoObj.endPoint = scope.geoObj.viaPoints.pop();
                        scope.geoObj.startPoint = scope.geoObj.viaPoints.pop();
                    }

                    visualiseRoute();      //call route service
                }

                $timeout(function(){
                    drawMarkers();                                //redraw markers
                }, 0);
            };

            var setEndPoint = function(e){
                scope.geoObj.endPoint= e.latlng;

                if(!scope.isEmpty(scope.geoObj.startPoint) || scope.geoObj.viaPoints.length>0){
                    if(scope.isEmpty(scope.geoObj.startPoint)){                           //if endPoint doesn't exist get point from viaPoints stack end set it as endPoint
                        scope.geoObj.startPoint = scope.geoObj.viaPoints.pop();     //pop from viaPoints and add it on endPoint
                    }

                    visualiseRoute(); //call route service
                }

                $timeout(function(){
                    drawMarkers();                                //redraw markers
                }, 0);
            };

            var drawMarkers = function(){
                startLayerMarker.clearLayers();                      //Clear startLayerMarker
                if(!scope.isEmpty(scope.geoObj.startPoint)){
                    var newStartMarker = L.marker(
                        scope.geoObj.startPoint,
                        {icon: startIcon, draggable: true}
                    );

                    newStartMarker.on('dragend', function(e) {
                        $timeout(function(){
                            scope.geoObj.startPoint = angular.copy(e.target._latlng);
                            visualiseRoute(); //call route service
                        }, 0)
                    });

                    startLayerMarker.addLayer( newStartMarker ); //add start marker
                }

                endLayerMarker.clearLayers();                       //Clear endLayerMarker
                if(!scope.isEmpty(scope.geoObj.endPoint)) {
                    var newEndMarker = L.marker(
                        scope.geoObj.endPoint,
                        { icon: endIcon, draggable: true }
                    );

                    newEndMarker.on('dragend', function(e) {
                        $timeout(function(){
                            scope.geoObj.endPoint = angular.copy(e.target._latlng);
                            visualiseRoute(); //call route service
                        }, 0)
                    });

                    endLayerMarker.addLayer( newEndMarker );    //add end marker
                }

                viaLayerMarker.clearLayers();                       //Clear viaLayerMarker
                for(var i=0; i < scope.geoObj.viaPoints.length; i++) {
                    var newViaMarker = L.marker(
                        scope.geoObj.viaPoints[i],
                        {icon: viaIcon, draggable: true, viaPointId: i}
                    );

                    newViaMarker.on('dragend', function(e) {
                        var viaPointIndex = e.target.options.viaPointId;

                        $timeout(function(){
                            scope.geoObj.viaPoints[viaPointIndex] = angular.copy(e.target._latlng);
                            visualiseRoute(); //call route service
                        }, 0)
                    });

                    viaLayerMarker.addLayer(newViaMarker); //add via markers
                }
            };

            //function to call openRouteService and visualise the route on map
            var drawRoute = function () {
                    var routeObj = scope.geoObj.route;
                    var polyline = L.polyline([], {color: 'red'});      //create polyline object

                    //demo API output for dev purposes
                    /*var tmp = {};
                     tmp.markerPoints = angular.copy(scope.geoObj);
                     tmp.routePoints = response.route;
                     console.log(JSON.stringify(tmp));*/

                    for (var i=0; i<routeObj.length; i++){
                        polyline.addLatLng([parseFloat(routeObj[i].lat),parseFloat(routeObj[i].lng)]); //add points to polyline
                    }

                    routeLayer.clearLayers();                           //clear exist route layer
                    routeLayer.addLayer(polyline);                      //add polyline to route layer

            };

            //function to call openRouteService and visualise the route on map
            var drawPolygon = function () {

                if(scope.geoObj.route.length>=3){

                var routeObj = scope.geoObj.route;
                var polygon = L.polygon([], {color: 'red'});      //create polyline object

                //demo API output for dev purposes
                /*var tmp = {};
                 tmp.markerPoints = angular.copy(scope.geoObj);
                 tmp.routePoints = response.route;
                 console.log(JSON.stringify(tmp));*/

                for (var i=0; i<routeObj.length; i++){
                    polygon.addLatLng([parseFloat(routeObj[i].lat),parseFloat(routeObj[i].lng)]); //add points to polyline
                }

                routeLayer.clearLayers();                           //clear exist route layer
                routeLayer.addLayer(polygon);                      //add polyline to route layer

                }
            };

            //initialize map
            var map = L.map('geo-edit-map', {
                contextmenu: true,
                contextmenuWidth: 140,
                contextmenuItems: [{
                    text: 'Start Point',
                    callback: setStartPoint
                },
                    {
                        text: 'Via Point',
                        callback: setViaPoint
                    },
                    {
                        text: 'End Point',
                        callback: setEndPoint
                    }]
            }).setView([35.52,23.80], 10);

            //set OSM as map layer
            L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);

            //add layers to map
            startLayerMarker.addTo(map);
            endLayerMarker.addTo(map);
            viaLayerMarker.addTo(map);
            routeLayer.addTo(map);

            //function to clear all layers and markers arrays from the map
            scope.clearMap = function(markersFlag, layersFlag){
                if (markersFlag) {
                    scope.geoObj = angular.copy({
                        startPoint: {},
                        viaPoints: [],
                        endPoint: {},
                        route: []
                    });

                    startLayerMarker.clearLayers();
                    endLayerMarker.clearLayers();
                    viaLayerMarker.clearLayers();
                }

                if (layersFlag) {

                    routeLayer.clearLayers();
                }
            };

            //function to save annotation to server
            scope.saveAnnotation = function(){
                scope.annotationResult = JSON.stringify(scope.geoObj);

                if (scope.embedded != "true") {
                    // Save object to server
                    Data.saveGeoObj(scope.projectId,scope.geoObj).then(function(response){
                        console.log("Object saved");
                    }, function(error) {
                        console.log('An error occurred', error);
                    });
                } else if (!_.isUndefined(scope.$parent.textField) && !_.isUndefined(scope.$parent.setRuleInput)) {
                    // The geo editing component is inside query builder, call the function to set the rule input
                    // (has to be done this way because the component is added with the yds-map-selector jQuery plugin)
                    scope.$parent.setRuleInput(scope.$parent.textField, scope.annotationResult);
                }

            };

            //function to remove a point from the route
            scope.removePoint = function(pointObj, pointType) {
                if (pointType == 0 ) {                  // if user delete the startPoint
                    scope.geoObj.startPoint = {};

                    if (!scope.isEmpty(scope.geoObj.endPoint)) {        //if route has other points
                        if (scope.geoObj.viaPoints.length > 0)          //if route has via points, assign the first via point as route startPoint
                            scope.geoObj.startPoint = angular.copy(scope.geoObj.viaPoints.shift());
                        else {                                          //if route hasn't points, assign the route endPoint as startPoint
                            scope.geoObj.startPoint = angular.copy(scope.geoObj.endPoint);
                            scope.geoObj.endPoint = angular.copy({});
                        }
                    }
                } else if (pointType == 1) {            // if user delete a viaPoint
                    var pointIndex = _.findIndex(scope.geoObj.viaPoints, pointObj);
                    scope.geoObj.viaPoints.splice(pointIndex, 1);
                } else {                                // if user delete the endPoint
                    scope.geoObj.endPoint = {};         // empty the route endPoint

                    if (!scope.isEmpty(scope.geoObj.startPoint)) {      //if route has other points
                        if (scope.geoObj.viaPoints.length > 0)          //if route has via points, assign the last one as route endpoint
                            scope.geoObj.endPoint = angular.copy(scope.geoObj.viaPoints.pop());
                    }
                }

                var totalMarkers = countMapMarkers();

                if (totalMarkers == 1)                  //if only marker on the map, delete the route layer
                    scope.clearMap(false, true);
                else                                    //if more than one marker on the map, redraw markers-layers
                    visualiseRoute(); //call route service

                $timeout(function(){
                    drawMarkers();                                //redraw markers
                }, 0);
            };
        }
    };
}]);