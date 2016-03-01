angular.module('yds').directive('ydsMap', ['Data', function(Data){
    return {
        restrict: 'E',
        scope: {
            projectId: '@',     //id of the project that the data belong
            tableType: '@',     //name of the array that contains the visualised data
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
            var tableType = scope.tableType;
            var lang = scope.lang;
            var zoomControl = scope.zoomControl;
            var elementH = scope.elementH;

            //check if the projectId and the tableType attr is defined, else stop the process
            if (angular.isUndefined(projectId)|| angular.isUndefined(tableType)) {
                scope.ydsAlert = "The YDS component is not properly configured." +
                    "Please check the corresponding documentation section";
                return false;
            }

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

            /*var map = L.map('map-container', {
                center: [35.52,23.80],
                zoom: 5
            });

            L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 18,
                attribution: 'Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
            }).addTo(map);

            var polyline = L.polyline([]).addTo(map);

            Data.projectVisualization(scope.projectId, "map")
            .then(function (response) {
                var route = angular.copy(response.route);
                for (var i=0; i<route.length; i++){
                    polyline.addLatLng([parseFloat(route[i].lng),parseFloat(route[i].lat)]);
                }

                // zoom the map to the polyline
                map.fitBounds(polyline.getBounds());
            }, function (error) {
                console.log('error', error);
            });*/



            /***************************************/
            /**** UPDATED CODE FOR ALL PROJECTS ****/
            /***************************************/
            var map = L.map(elementId, {
                center: [37.9833333,23.7333333],
                zoom: 5,
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

            Data.getVisualizationData(projectId, tableType)
            .then(function (response) {
                for(var i=0; i<response.length; i++) {

                    var projectLayer = L.featureGroup([])
                    //var polyline = L.polyline([]).addTo(map);
                    var polyline = L.polyline([]);

                    var route = angular.copy(response[i].route);
                    for (var j=0; j<route.length; j++){
                        polyline.addLatLng([parseFloat(route[j].lat), parseFloat(route[j].lng)]);
                    }

                    //TODO: add different marker icon
                    var StartMarker = L.marker(
                        [parseFloat(route[0].lat), parseFloat(route[0].lng)],{icon: startIcon}
                    );
                    var EndMarker = L.marker(
                        [parseFloat(route[route.length-1].lat), parseFloat(route[route.length-1].lng)],{icon: endIcon}
                    );


                    projectLayer.addLayer(StartMarker);
                    projectLayer.addLayer(EndMarker);
                    projectLayer.addLayer(polyline);
                    projectLayer.bindPopup(response[i].projectName);

                    allFeatureGroup.addLayer(projectLayer);
                }

                allFeatureGroup.addTo(map);
                // zoom the map to the layerGroup
                map.fitBounds(allFeatureGroup.getBounds());

            }, function (error) {
                scope.ydsAlert = error.message;
                console.error('error', error);
            });
        }
    };
}]);