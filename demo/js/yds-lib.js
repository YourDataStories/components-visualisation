var app = angular.module('yds', ['ui.bootstrap', 'rzModule', 'ui.checkbox', 'oc.lazyLoad', 'ngTextTruncate']);

var host="http://ydsdev.iit.demokritos.gr:8085";
var geoRouteUrl = host+"/YDSAPI/yds/geo/route";

// Defining global variables for the YDS lib
app.constant("YDS_CONSTANTS", {
    "PROXY": "/",
    "API_YDS_MODEL_HIERARCHY":"platform.yourdatastories.eu/api/json-ld/model/YDSModelHierarchy.json",
    "API_BAR": "platform.yourdatastories.eu/api/json-ld/component/barchart.tcl",
    "API_GRID": "platform.yourdatastories.eu/api/json-ld/component/grid.tcl",
    "API_HEATMAP": "platform.yourdatastories.eu/api/json-ld/component/heatmap.tcl",
    "API_INFO": "platform.yourdatastories.eu/api/json-ld/component/info.tcl",
    "API_LINE": "platform.yourdatastories.eu/api/json-ld/component/linechart.tcl",
    "API_MAP": "platform.yourdatastories.eu/api/json-ld/component/map.tcl",
    "API_PIE": "platform.yourdatastories.eu/api/json-ld/component/piechart.tcl",
    "API_PLOT_INFO": "platform.yourdatastories.eu/api/json-ld/component/plotinfo.tcl",
    "API_INTERACTIVE_LINE": "platform.yourdatastories.eu/api/json-ld/component/linechart.tcl/interactive",
    "API_SEARCH": "platform.yourdatastories.eu/api/json-ld/component/search.tcl",
    "API_COMBOBOX_FILTER": "platform.yourdatastories.eu/api/json-ld/component/filter.tcl",
    "API_YDS_STATISTICS": "platform.yourdatastories.eu/api/json-ld/component/statistics.tcl",
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
    var dataService = {};

    dataService.getYearMonthFromTimestamp = function(timestamp, yearToMonth) {
        var d = new Date(timestamp*1000);
        var month = ("0" + (d.getMonth() + 1)).slice(-2);
        var year = d.getFullYear();

        if (yearToMonth)
            return year + "-" + month;
        else
            return month + "/" + year;
    };

    dataService.getTimestampFromDate = function(date) {
        return parseInt(new Date(date).getTime() / 1000);
    };

    dataService.hashFromObject = function(inputObj) {
        var str = JSON.stringify(inputObj);
        return calcMD5(str);
    };

    dataService.deepObjSearch = function(obj, path){
        //function to get the value of an object property, by defining its path
        for (var i=0, path=path.split('.'), len=path.length; i<len; i++){
            if(_.isUndefined(obj)) {
                obj = "";
                break;
            }

            obj = obj[path[i]];
        }

        return obj;
    };

    dataService.transform = function(data) {
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
    };

    dataService.getRoutePoints = function(start, end, via) {
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
    };

    dataService.saveGeoObj = function(projectId,geoObj) {
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
    };

    dataService.getGeoObj = function(projectId) {
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
    };

    dataService.requestEmbedCode = function(projectId, facets, visType) {
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
    };

    dataService.recoverEmbedCode = function(embedCode) {
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
    };

    dataService.getBreadcrumbColor = function(index) {
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
    };

    dataService.getBrowseData = function() {
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
    };

    dataService.createRandomId = function() {
        return '_' + Math.random().toString(36).substr(2, 9);
    };

    dataService.prepareGridColumns = function(gridView) {
        var gridColumns = [];

        for (var i=0; i<gridView.length; i++) {
            var columnInfo = {
                headerName: gridView[i].header,
                field: gridView[i].attribute
            };

            if (!_.isUndefined(gridView[i].style)) {
                columnInfo.cellStyle = gridView[i].style;
            }

            if (!_.isUndefined(gridView[i]["column-width"])) {
                columnInfo.width = parseInt(gridView[i]["column-width"]);
            }

            //if it is not string add number filtering
            if (gridView[i].type.indexOf("string")==-1 && gridView[i].type.indexOf("url")==-1) {
                columnInfo.filter = 'number';
            }

            //if it is 'amount', apply custom filter to remove the currency and sort them
            if (gridView[i].type=="amount") {
                columnInfo.comparator = function (value1, value2) {
                    if(_.isUndefined(value1) || value1==null)
                        value1 = "-1";

                    if(_.isUndefined(value2) || value2==null)
                        value2 = "-1";

                    value1 = parseInt(String(value1).split(" "));
                    value2 = parseInt(String(value2).split(" "));

                    return value1-value2;
                }
            }

            gridColumns.push(columnInfo);
        }

        return gridColumns;
    };


    dataService.prepareGridData = function(newData, newView) {
        for (var i=0; i<newData.length; i++) {
            _.each(newView, function(viewVal) {
                var attributeTokens = viewVal.attribute.split(".");

                //if the data row has this attribute and it is nested..
                if (_.has(newData[i], attributeTokens[0]) && attributeTokens.length>1) {
                    newData[i][viewVal.attribute] = dataService.deepObjSearch(newData[i], viewVal.attribute);
                }

                if (_.isUndefined(newData[i][viewVal.attribute]) || String(newData[i][viewVal.attribute]).length==0) {
                    newData[i][viewVal.attribute] = "";
                }
            });
        }

        return newData;
    };

    dataService.getYdsStatistics = function() {
        var deferred = $q.defer();

        $http({
            method: 'GET',
            url: "http://" + YDS_CONSTANTS.API_YDS_STATISTICS,
            headers: {'Content-Type': 'application/json; charset=UTF-8'}
        }).success(function (data) {
            deferred.resolve(data);
        }).error(function (error) {
            deferred.reject(error);
        });

        return deferred.promise;
    };

    dataService.getProjectVis = function(type, resourceId, viewType, lang) {
        var deferred = $q.defer();
        var visualizationUrl = "";

        switch(type) {
            case "bar":
                visualizationUrl="http://" + YDS_CONSTANTS.API_BAR;
                break;
            case "info":
                visualizationUrl="http://" + YDS_CONSTANTS.API_INFO;
                break;
            case "grid":
                visualizationUrl="http://" + YDS_CONSTANTS.API_GRID;
                break;
            case "pie":
                visualizationUrl="http://" + YDS_CONSTANTS.API_PIE;
                break;
            case "line":
                visualizationUrl="http://" + YDS_CONSTANTS.API_LINE;
                break;
            case "map":
                visualizationUrl="http://" + YDS_CONSTANTS.API_MAP;
                break;
            case "heatmap":
                visualizationUrl="http://"+ YDS_CONSTANTS.API_HEATMAP;
                break;
            default:
                deferred.reject({
                    success: false,
                    message: "Error, unknown component type"
                });

                return deferred.promise;
        }

        $http({
            method: 'GET',
            url: visualizationUrl,
            headers: {'Content-Type': 'application/json; charset=UTF-8'},
            params: {
                id: resourceId,
                type: viewType,
                lang: lang,
                context: 0
            }
        }).success(function (data) {
            deferred.resolve(data);
        }).error(function (error) {
            deferred.reject(error);
        });

        return deferred.promise;
    };

    dataService.getProjectVisAdvanced = function(type, resourceId, viewType, lang, comboFilters, start) {
        var deferred = $q.defer();
        var visualizationUrl = "";

        var inputParams = {
            "id": resourceId,
            "type": viewType,
            "lang": lang,
            "context": 0
        };

        if(!_.isUndefined(start))
            inputParams["start"] = start;

        _.extendOwn(inputParams, comboFilters);
        
        switch(type) {
            case "grid":
                visualizationUrl="http://" + YDS_CONSTANTS.API_GRID;
                break;
            case "line":
                visualizationUrl="http://" + YDS_CONSTANTS.API_LINE;
                break;
            case "pie":
                visualizationUrl="http://" + YDS_CONSTANTS.API_PIE;
                break;
            default:
                deferred.reject({
                    success: false,
                    message: "Error, unknown component type"
                });

                return deferred.promise;
        }

        $http({
            method: 'GET',
            url: visualizationUrl,
            headers: {'Content-Type': 'application/json; charset=UTF-8'},
            params: inputParams
        }).success(function (data) {
            deferred.resolve(data);
        }).error(function (error) {
            deferred.reject(error);
        });

        return deferred.promise;
    };

    dataService.getComboboxFilters = function(resourceId, filterType, filterAttr, lang) {
        var deferred = $q.defer();

        $http({
            method: 'GET',
            url: "http://"+ YDS_CONSTANTS.PROXY + YDS_CONSTANTS.API_COMBOBOX_FILTER,
            headers: {'Content-Type': 'application/json; charset=UTF-8'},
            params: {
                id: resourceId,
                type: filterType,
                attribute: filterAttr,
                lang: lang,
                context: 0
            }
        }).success(function (data) {
            deferred.resolve(data);
        }).error(function (error) {
            deferred.reject(error);
        });

        return deferred.promise;
    };

    return dataService;
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