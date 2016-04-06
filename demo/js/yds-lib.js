var app = angular.module('yds', ['ui.bootstrap', 'rzModule', 'ui.checkbox', 'oc.lazyLoad', 'ngTextTruncate']);

var host="http://ydsdev.iit.demokritos.gr:8085";
var visualizationUrl = host+"/YDSAPI/yds/api/couch/visualization/";
var espaProjectURL = host+"/YDSAPI/yds/api/couch/espa/";
var geoRouteUrl = host+"/YDSAPI/yds/geo/route";

// Defining global variables for the YDS lib
app.constant("YDS_CONSTANTS", {
    "PROXY": "/",
    /*"PROXY": "localhost:9292/",*/
    "API_GRID": "platform.yourdatastories.eu/api/json-ld/component/grid.tcl",
    "API_INFO": "platform.yourdatastories.eu/api/json-ld/component/info.tcl",
    "API_MAP": "platform.yourdatastories.eu/api/json-ld/component/map.tcl",
    "API_PIE": "platform.yourdatastories.eu/api/json-ld/component/piechart.tcl",
    "API_SEARCH": "platform.yourdatastories.eu/api/json-ld/component/search.tcl",
    "SEARCH_RESULTS_URL": "http://ydsdev.iit.demokritos.gr/YDSComponents/#/search",
    //"SEARCH_RESULTS_URL": "http://yds-lib.dev/#/search",
    "PROJECT_DETAILS_URL": "http://ydsdev.iit.demokritos.gr/yds/content/project-details",
    "API_EMBED": "http://ydsdev.iit.demokritos.gr:8085/YDSAPI/yds/embed/",
    "BASKET_URL": "http://ydsdev.iit.demokritos.gr:8085/YDSAPI/yds/basket/"
});

app.directive('clipboard', [ '$document', function(){
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            element.on('click', function(e){
                var iframeURL = angular.element(element.parent()[0].getElementsByClassName("well"));

                var range = document.createRange();         // create a Range object
                range.selectNode(iframeURL[0]);             // set the Node to select the "range"

                var selection = document.getSelection();
                selection.addRange(range);                  // add the Range to the set of window selections

                document.execCommand('copy');               // execute 'copy', can't 'cut' in this case
                selection.removeAllRanges();                // clear the selection
            });
        }
    }
}]);


app.factory('Data', ['$http', '$q', 'YDS_CONSTANTS', function ($http, $q, YDS_CONSTANTS) {
    var backButtonUsed = false;

    var notifyObservers = function (observerStack) { //function to trigger the callbacks of observers
        angular.forEach(observerStack, function (callback) {
            callback();
        });
    };

    return {
        deepObjSearch: function(obj, path){
            //function to get the value of an object property, by defining its path
            for (var i=0, path=path.split('.'), len=path.length; i<len; i++){
                obj = obj[path[i]];
            }

            return obj;
        },
        isBackButtonUsed: function() { return backButtonUsed; },
        backButtonUsed : function () { backButtonUsed = true; },
        backButtonNotUsed : function () { backButtonUsed = false; },
        projectVisualization: function (projectId,visualizationType) {
            //param search_obj = {}
            var deferred = $q.defer();

            //call the service with POST method
            $http({
                method: 'POST',
                url: visualizationUrl,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                transformRequest: function (obj) {
                    var str = [];
                    for (var p in obj)
                        str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
                    return str.join("&");
                },
                data: {
                    project_id: projectId,
                    viz_type: visualizationType
                }
            })
            .success(function (data) {
                deferred.resolve(data);
            }).error(function (error) {
                deferred.reject(error);
            });

            return deferred.promise;
        },
        getRoutePoints: function(start, end, via) {
            var deferred = $q.defer();

            var inputData = {
                startPoint: start,
                endPoint: end,
                viaPoints: via
            };
            $http({
                method: 'POST',
                url: geoRouteUrl,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                transformRequest: function (obj) {
                    var str = [];
                    for (var p in obj)
                        str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
                    return str.join("&");
                },
                data: { geoData: angular.toJson(inputData) }
            }).success(function (data) {
                deferred.resolve(data);
            }).error(function (error) {
                deferred.reject(error);
            });

            return deferred.promise;
        },
        saveGeoObj: function(projectId,geoObj) {
            var deferred = $q.defer();

            $http({
                method: 'POST',
                url: geoRouteUrl+"/save/"+projectId,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                transformRequest: function (obj) {
                    var str = [];
                    for (var p in obj)
                        str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
                    return str.join("&");
                },
                data: {
                    geoData: angular.toJson(geoObj)
                }
            }).success(function (data) {
                deferred.resolve(data);
            }).error(function (error) {
                deferred.reject(error);
            });

            return deferred.promise;
        },
        getGeoObj: function(projectId) {
            var deferred = $q.defer();

            $http({
                method: 'GET',
                url: geoRouteUrl+"/"+ projectId,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            }).success(function (data) {
                deferred.resolve(data);
            }).error(function (error) {
                deferred.reject(error);
            });

            return deferred.promise;
        },
        requestEmbedCode: function(projectId, facets, visType) {
            var deferred = $q.defer();

            $http({
                method: 'POST',
                url: YDS_CONSTANTS.API_EMBED + "save",
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                transformRequest: function (obj) {
                    var str = [];
                    for (var p in obj)
                        str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
                    return str.join("&");
                },
                data: {
                    "project_id": projectId,
                    "facets": JSON.stringify(facets),
                    "viz_type": visType
                }
            })
            .success(function (data) {
                deferred.resolve(data);
            }).error(function (error) {
                deferred.reject(error);
            });

            return deferred.promise;
        },
        recoverEmbedCode: function(embedCode) {
            var deferred = $q.defer();

            $http({
                method: 'GET',
                url: YDS_CONSTANTS.API_EMBED + embedCode
            }).success(function (data) {
                deferred.resolve(data);
            }).error(function (error) {
                deferred.reject(error);
            });

            return deferred.promise;
        },
        getVisualizationData: function(projectId, tableType) {
            var deferred = $q.defer();

            $http({
                method: 'GET',
                url: espaProjectURL + projectId + "/" + tableType,
                headers: {'Content-Type': 'application/json'}
            }).success(function (data) {
                deferred.resolve(data);
            }).error(function (error) {
                deferred.reject(error);
            });

            return deferred.promise;
        },
        getBreadcrumbColor: function (index) {
            var colors = [
                "#0000ff", "#a52a2a", "#a020f0", "#ff0000", "#ffc0cd",
                "#ffa500", "#00ff00", "#ffff00", "#C0C000", "#C0C0FF",
                "#C0C0C0", "#800000", "#008000", "#000080", "#808000",
                "#800080", "#008080", "#808080", "#C00000", "#00C000",
                "#0000C0", "#C0C000", "#C000C0", "#00C0C0", "#C0C0C0",
                "#C0DCC0", "#A6CAF0", "#006669", "#FFFF99", "#A0A0A4",
                "#FFCC66", "#CC6600", "#996600", "#66CC3C", "#006699",
                "#FF9900", "#a52a2a", "#0000ff", "#40e0d0", "#5f9ea0",
                "#ff7f50", "#bdb76b", "#ff0000", "#7cfc00", "#f0fff0",
                "#808080", "#ffa500", "#191970", "#d8bfd8", "#adff2f",
                "#000000", "#00bfff", "#696969", "#ff8c00", "#f8f8ff",
                "#4169e1", "#c71585", "#d3d3d3", "#800080", "#ffdead",
                "#fa8072", "#48d1cc", "#4b0082", "#d2b48c", "#00ffff"
            ];

            return colors[index];
        }, getBrowseData: function () {
            var deferred = $q.defer();
            var serverURL = "data/browse_pilot1_new.json";

            $http({
                method: 'GET',
                url: serverURL,
                headers: {'Content-Type': 'application/json'}
            }).success(function (data) {
                deferred.resolve(data);
            }).error(function (error) {
                deferred.reject(error);
            });

            return deferred.promise;
        }, createRandomId : function () {
            return '_' + Math.random().toString(36).substr(2, 9);
        }, getGrid : function(resourceId, gridType, gridLang) {
            var deferred = $q.defer();

            $http({
                method: 'GET',
                url: "http://"+ YDS_CONSTANTS.PROXY + YDS_CONSTANTS.API_GRID,
                headers: {'Content-Type': 'application/json; charset=UTF-8'},
                params: {
                    id: resourceId,
                    type: gridType,
                    lang: gridLang,
                    context: 0  
                }
            }).success(function (data) {
                deferred.resolve(data);
            }).error(function (error) {
                deferred.reject(error);
            });

            return deferred.promise;
        }, getInfo : function(resourceId, infoType, infoLang) {
            var deferred = $q.defer();

            $http({
                method: 'GET',
                url: "http://"+ YDS_CONSTANTS.PROXY + YDS_CONSTANTS.API_INFO,
                headers: {'Content-Type': 'application/json; charset=UTF-8'},
                params: {
                    id: resourceId,
                    type: infoType,
                    lang: infoLang,
                    context: 0
                }
            }).success(function (data) {
                deferred.resolve(data);
            }).error(function (error) {
                deferred.reject(error);
            });

            return deferred.promise;
        }, getMap : function(resourceId, mapType, mapLang) {
            var deferred = $q.defer();

            $http({
                method: 'GET',
                url: "http://"+ YDS_CONSTANTS.PROXY + YDS_CONSTANTS.API_MAP,
                headers: {'Content-Type': 'application/json; charset=UTF-8'},
                params: {
                    id: resourceId,
                    type: mapType,
                    lang: mapLang,
                    context: 0
                }
            }).success(function (data) {
                deferred.resolve(data);
            }).error(function (error) {
                deferred.reject(error);
            });

            return deferred.promise;
        }, getPie : function(resourceId, pieType, pieLang) {
            var deferred = $q.defer();

            $http({
                method: 'GET',
                url: "http://"+ YDS_CONSTANTS.PROXY + YDS_CONSTANTS.API_PIE,
                headers: {'Content-Type': 'application/json; charset=UTF-8'},
                params: {
                    id: resourceId,
                    type: pieType,
                    lang: pieLang,
                    context: 0
                }
            }).success(function (data) {
                deferred.resolve(data);
            }).error(function (error) {
                deferred.reject(error);
            });

            return deferred.promise;
        }
    }
}]);

/**************************************************/
/********* NEW VERSION OF SEARCH SERVICE **********/
/**************************************************/
app.factory('Search', ['$http', '$q', 'YDS_CONSTANTS', function ($http, $q, YDS_CONSTANTS) {
    var keyword = "";
    var facetsCallbacks = [];
    var facetsView= {};
    var searchResults = [];
    var searchFacets = {};
    
    var notifyObservers = function (observerStack) { //function to trigger the callbacks of observers
        angular.forEach(observerStack, function (callback) {
            callback();
        });
    };

    return {
        setKeyword: function(newKeyword) { keyword = angular.copy(newKeyword); },
        getKeyword: function() { return keyword; },
        clearKeyword: function() { keyword = ""; },
        performSearch: function (newKeyword, pageLimit, pageNumber) {
            var deferred = $q.defer();

            $http({
                method: 'GET',
                url: "http://"+ YDS_CONSTANTS.PROXY + YDS_CONSTANTS.API_SEARCH,
                params: {
                    q: newKeyword,
                    rows: pageLimit,
                    start: pageNumber
                },
                headers: {'Content-Type': 'application/json'}
            }).success(function (response) {
                searchResults = angular.copy(response);
                searchFacets = angular.copy(response.data.facet_counts);
                facetsView  = _.find(response.view , function (view) { return "SearchFacets" in view })["SearchFacets"];
               
                notifyObservers(facetsCallbacks);
                deferred.resolve(searchResults);
            }).error(function (error) {
                deferred.reject(error);
            });

            return deferred.promise;
        },
        getResults: function () { return searchResults; },
        clearResults: function () { searchResults = []; },
        
        registerFacetsCallback: function(callback) { facetsCallbacks.push(callback); },
        getFacets: function() { return searchFacets; },
        getFacetsView: function() { return facetsView; }
    }
}]);

app.factory('Basket', [ 'YDS_CONSTANTS', '$q', '$http', function (YDS_CONSTANTS, $q, $http) {
    var basketCallbacks = [];
    var lastSavedItem = {};

    var notifyObservers = function (observerStack) { //function to trigger the callbacks of observers
        angular.forEach(observerStack, function (callback) {
            callback();
        });
    };

    return {
        registerCallback: function(callback) { basketCallbacks.push(callback); },
        getLastSavedItem: function() { return lastSavedItem; },
        createItem: function() {
            return {
                user_id: "ydsUser",
                component_parent_uuid: "",
                title: "",
                tags: [],
                filters: [],
                component_type: "",
                content_type: "",
                type: "",
                is_private: true,
                lang: ""
            };
        },
        initializeItem: function (bskItem) {
            bskItem.title = "";
            bskItem.type = "";
            bskItem.is_private = true;
            bskItem.tags = [];
            bskItem.filters = [];

            return bskItem;
        },
        initializeModalItem: function () {
            return {
                alert: "",
                title: "",
                tags: "",
                type: "Dataset",
                is_private: true
            };
        },
        saveBasketItem: function(bskItem) {
            var deferred = $q.defer();
            lastSavedItem = angular.copy(bskItem);

            $http({
                method: 'POST',
                url: YDS_CONSTANTS.BASKET_URL + "save",
                headers: {'Content-Type': 'application/json'},
                data: JSON.stringify(bskItem)
            })
            .success(function (data) {
                notifyObservers(basketCallbacks);
                deferred.resolve(data);
            }).error(function (error) {
                deferred.reject(error);
            });

            return deferred.promise;
        },
        getBasketItems: function(userId, type) {
            var deferred = $q.defer();

            var contType = "";
            if ( type.toLowerCase() == "dataset" )
                contType = "?basket_type=dataset";
            else if ( type.toLowerCase() == "visualisation" )
                contType = "?basket_type=visualisation";

            $http({
                method: 'GET',
                url: YDS_CONSTANTS.BASKET_URL + "get/" + userId + contType,
                headers: {'Content-Type': 'application/json'}
            }).success(function (data) {
                deferred.resolve(data);
            }).error(function (error) {
                deferred.reject(error);
            });

            return deferred.promise;
        },
        deleteBasketItems: function (userId, bskID) {
            var deferred = $q.defer();

            $http({
                method: 'POST',
                url: YDS_CONSTANTS.BASKET_URL + "remove/" + userId,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                transformRequest: function (obj) {
                    var str = [];
                    for (var p in obj)
                        str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
                    return str.join("&");
                },
                data: {
                    "basket_item_id": bskID
                }
            }).success(function (data) {
                deferred.resolve(data);
            }).error(function (error) {
                deferred.reject(error);
            });

            return deferred.promise;
        }
    }
}]);


app.factory('Filters', [ function () {
    var filters = [];

    var updateFilters = function (newFilter, newCompId, allFilters) {
        //search if the specific component has already an active filter
        var componentFilter = _.findWhere(allFilters, {componentId: newCompId});

        //if the component exists in the filters array-update it, else push a new array item
        if (!angular.isUndefined(componentFilter))
            componentFilter.filters = angular.copy(newFilter);
        else {
            filters.push({
                componentId: newCompId,
                filters: newFilter
            });
        }
    };

    return {
        addLineFilter: function(compId, lineChart) {
            chartFilters = [];
            var lineExtremes = lineChart.xAxis[0].getExtremes();

            //define which axis has range ? is needed ?
            chartFilters.push ({
                applied_to: "x",
                attrs: {
                    min: lineExtremes.min,
                    max: lineExtremes.max
                }
            });

            chartFilters.push ({
                applied_to: "y",
                attrs: {
                    attrName: ""
                }
            });

            updateFilters(chartFilters, compId, filters);
        },
        addGridFilter: function(compId, gridFilters) {
            var chartFilters = [];

            for (property in gridFilters) {
                var filterVal = gridFilters[property];

                if (gridFilters.hasOwnProperty(property)) {
                    if (property == "_ydsQuickFilter_") {		//quick filter applied on grid
                        var tmpAttrs = {};

                        if (filterVal.length>0) {
                            tmpAttrs[filterVal] = true;

                            chartFilters.push ({
                                applied_to: '_quick_bar_' ,
                                attrs: tmpAttrs
                            });
                        }
                    } else if ( _.isArray(filterVal) && filterVal.length>0 ) {	//string filter applied on grid
                        var attrsArray = [];

                        for (var j=0; j<filterVal.length; j++) {
                            attrsArray.push(filterVal[j]);
                        }

                        var tmpAttr = { 'rows': attrsArray };

                        chartFilters.push ({
                            applied_to: property ,
                            attrs: tmpAttr
                        });
                    } else if (filterVal.hasOwnProperty('filter') && filterVal.hasOwnProperty('type')) { //numeric filter applied on grid
                        var tmpAttrs = {};

                        switch (filterVal['type']) {
                            case 1:
                                tmpAttrs["eq"] = filterVal['filter'];
                                break;
                            case 2:
                                tmpAttrs["lte"] = filterVal['filter'];
                                break;
                            case 3:
                                tmpAttrs["gte"] = filterVal['filter'];
                                break;
                        }

                        chartFilters.push ({
                            applied_to: property ,
                            attrs: tmpAttrs
                        });
                    }
                }
            }

            updateFilters(chartFilters, compId, filters);
        },
        get: function (compId) {
            var filterFound = _.findWhere(filters, { componentId: compId })

            if(!angular.isUndefined(filterFound))
                return filterFound.filters;
            else
                return [];
        },
        remove: function (compId) {
            filters = _.reject(filters, function(d){ return d.componentId === compId; });
        }
    }
}]);

