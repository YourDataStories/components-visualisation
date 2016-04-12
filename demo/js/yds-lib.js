var app = angular.module('yds', ['ui.bootstrap', 'rzModule', 'ui.checkbox', 'oc.lazyLoad', 'ngTextTruncate']);

var host="http://ydsdev.iit.demokritos.gr:8085";
var visualizationUrl = host+"/YDSAPI/yds/api/couch/visualization/";
var espaProjectURL = host+"/YDSAPI/yds/api/couch/espa/";
var geoRouteUrl = host+"/YDSAPI/yds/geo/route";

// Defining global variables for the YDS lib
app.constant("YDS_CONSTANTS", {
    "PROXY": "/",
    //"PROXY": "localhost:9292/",
    "API_YDS_MODEL_HIERARCHY":"platform.yourdatastories.eu/api/json-ld/model/YDSModelHierarchy.json",
    "API_GRID": "platform.yourdatastories.eu/api/json-ld/component/grid.tcl",
    "API_INFO": "platform.yourdatastories.eu/api/json-ld/component/info.tcl",
    "API_LINE": "platform.yourdatastories.eu/api/json-ld/component/linechart.tcl",
    "API_MAP": "platform.yourdatastories.eu/api/json-ld/component/map.tcl",
    "API_PIE": "platform.yourdatastories.eu/api/json-ld/component/piechart.tcl",
    "API_PLOT_INFO": "platform.yourdatastories.eu/api/json-ld/component/plotinfo.tcl",
    "API_INTERACTIVE_LINE": "platform.yourdatastories.eu/api/json-ld/component/linechart.tcl/interactive",
    "API_SEARCH": "platform.yourdatastories.eu/api/json-ld/component/search.tcl",
    //"SEARCH_RESULTS_URL": "http://yds-lib.dev/#/search",
    //"SEARCH_RESULTS_URL_EL": "http://yds-lib.dev/#/search-el",
    "SEARCH_RESULTS_URL": "http://ydsdev.iit.demokritos.gr/YDSComponents/#/search",
    "SEARCH_RESULTS_URL_EL": "http://ydsdev.iit.demokritos.gr/YDSComponents/#/search-el",
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
    return {
        hashFromObject: function (inputObj) {
            var str = JSON.stringify(inputObj);
            return calcMD5(str);
        },
        deepObjSearch: function(obj, path){
            //function to get the value of an object property, by defining its path
            for (var i=0, path=path.split('.'), len=path.length; i<len; i++){
                if(_.isUndefined(obj)) {
                    obj = "";
                    break;
                }

                obj = obj[path[i]];
            }

            return obj;
        },
        transform: function (data) {
            if (!angular.isObject(data))		    	 // If this is not an object, defer to native stringification.
                return ( ( data == null ) ? "" : data.toString() );

            var buffer = [];
            for (var name in data) {
                if (!data.hasOwnProperty(name))
                    continue;

                var value = data[name];
                buffer.push(encodeURIComponent(name) + "=" + encodeURIComponent(( value == null ) ? "" : value));
            }

            var source = buffer.join("&").replace(/%20/g, "+");
            return source;
        },
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

            $http({
                method: 'GET',
                url: "http://"+ YDS_CONSTANTS.PROXY + YDS_CONSTANTS.API_YDS_MODEL_HIERARCHY,
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
        }, getLine : function(resourceId, lineType, lineLang) {
            var deferred = $q.defer();

            $http({
                method: 'GET',
                url: "http://"+ YDS_CONSTANTS.PROXY + YDS_CONSTANTS.API_LINE,
                headers: {'Content-Type': 'application/json; charset=UTF-8'},
                params: {
                    id: resourceId,
                    type: lineType,
                    lang: lineLang,
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
app.factory('Search', ['$http', '$q', '$location', 'YDS_CONSTANTS', function ($http, $q, $location, YDS_CONSTANTS) {
    var keyword = "";
    var facetsCallbacks = [];
    var facetsView= {};
    var appliedFacets = [];
    var searchResults = [];
    var searchFacets = {};

    /**
    * function to trigger the callbacks of observers
    **/
    var notifyObservers = function (observerStack) {
        angular.forEach(observerStack, function (callback) {
            callback();
        });
    };


    /**
    * function to format the search results returned fromm the search API.
    **/
    var formatResults = function(results, resultsView, resultsViewNames, prefLang) {
        var formattedResults = [];
        //iterate through the results and format its data
        _.each(results, function(result) {
            //iterate through the types of the result
            for (var j=0; j<result.type.length; j++) {
                var viewName = result.type[j];

                //search if the type of the result exists inside the available views
                if (_.contains(resultsViewNames, viewName)) {
                    //create an object for each result
                    var formattedResult = {
                        _hidden: true,
                        id: result.id,
                        type: result.type,
                        rows: []
                    };

                    //get the contents of the result view
                    var resultView = _.find(resultsView, function (view) { return viewName in view })[viewName];

                    //iterate inside the view of the result in order to acquire the required data for each result
                    _.each(resultView, function(view){
                        var resultRow = {};
                        resultRow.header = view.header;
                        resultRow.type = view.type;
                        resultRow.value = result[view.attribute];

                        //if the value of a result doesn't exist
                        if (_.isUndefined(resultRow.value) || String(resultRow.value).trim().length==0) {
                            //extract the last 3 characters of the specific attribute of the result
                            var last3chars = view.attribute.substr(view.attribute.length-3);
            
                            //if it is internationalized
                            if (last3chars == ("." + prefLang)) {
                                //search if the attribute exists without the internationalization
                                var attributeTokens = view.attribute.split(".");
                                var nonInternationalizedAttr = _.first(attributeTokens, attributeTokens.length-1).join(".");
                                resultRow.value = result [nonInternationalizedAttr];
                            }
                        }

                        //if the value is not available assign an empty string, 
                        // else check if it is an array and convert it to comma separated string
                        if(_.isUndefined(resultRow.value))
                            resultRow.value = "";
                        else if (_.isArray(resultRow.value))
                            resultRow.value = resultRow.value.join(", ");
                        else if (resultRow.type == "date") {
                            var formattedDate = new Date(parseFloat(resultRow.value));

                            if (formattedDate != null) {
                                resultRow.value = formattedDate.getDate() + "-" +
                                    (formattedDate.getMonth() + 1) + "-" +
                                    formattedDate.getFullYear();
                            }
                        }

                        //push the formatted row of the result in the array of the corresponding result
                        formattedResult.rows.push(resultRow);
                    });

                    //if the view of the result has been found, don't search further for its view
                    break;
                }
            }

            //push the result in the array containing all the results that will be visible to the user
            formattedResults.push(formattedResult);
        });

        return formattedResults;
    };
    
    /**
     * function to format the applied facets returned fromm the search API.
     * @param {Object | Array} facets, an array or object containing the facets of the API.
     **/
    var formatAppliedFacets = function (facets) {
        appliedFacets = [];

        _.each(facets, function(facet) {
            //if it is a field facet, extract each values
            if ( facet.type.indexOf("field")>-1 ){
               _.each(facet.value, function (facetVal) {
                   appliedFacets.push({
                       type: "field",
                       attribute: facet.attribute,
                       value: facetVal
                   });
               });
           } else if ( facet.type.indexOf("range")>-1 ) {
               //if it is range facet, extract its type, extract and parse its values
               var facetTypeTokens = facet.type.split("-");

               if (facetTypeTokens.length>1 && facetTypeTokens[1]=="float") {
                   if (facet.value.length == 2) {
                       appliedFacets.push({
                           type: "range",
                           attribute: facet.attribute,
                           value: {
                               model: parseFloat(facet.value[0]),
                               high: parseFloat(facet.value[1])
                           }
                       });
                   }
               }
           }
        });
    };

    /**
     * function to format the applied facets located inside the search url
     * @param {String} newKeyword, the search term
     * @param {Integer} pageLimit, the max number of results returned from the API
     * @param {Integer} pageNumber, the page number of the results
     **/
    var performSearch = function (newKeyword, prefLang, pageLimit, pageNumber) {
        var deferred = $q.defer();

        //define an object with the standard params required for the search query
        var searchParameters = {
            lang: prefLang,
            rows: pageLimit,
            start: pageNumber
        };

        //merge the url params with the aforementioned object
        _.extend(searchParameters, $location.search());

        $http({
            method: 'GET',
            url: "http://"+ YDS_CONSTANTS.PROXY + YDS_CONSTANTS.API_SEARCH,
            params: searchParameters,
            headers: {'Content-Type': 'application/json'}
        }).success(function (response) {
            //if the search query is successful, copy the results in a local variable
            searchResults = angular.copy(response);
            //copy the available facets in a local variable
            searchFacets = angular.copy(response.data.facet_counts);
            //get the facet view from the response of the search API
            facetsView  = _.find(response.view , function (view) { return "SearchFacets" in view })["SearchFacets"];
            //format the facets returned from the search API based on the facet view
            formatAppliedFacets(facetsView);
            
            notifyObservers(facetsCallbacks);
            deferred.resolve(searchResults);
        }).error(function (error) {
            deferred.reject(error);
        });

        return deferred.promise;
    };
    
    return {
        setKeyword: function(newKeyword) { keyword = newKeyword },
        getKeyword: function() { return keyword; },
        clearKeyword: function() { keyword = ""; },

        formatResults: formatResults,
        performSearch: performSearch,
        getResults: function () { return searchResults; },
        clearResults: function () { searchResults = []; },
        
        registerFacetsCallback: function(callback) { facetsCallbacks.push(callback); },
        getFacets: function() { return searchFacets; },
        getAppliedFacets: function() { return appliedFacets; },
        getFacetsView: function() { return facetsView; }
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

