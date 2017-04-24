var app = angular.module('yds', ['ui.bootstrap', 'rzModule', 'ui.checkbox', 'oc.lazyLoad', 'angularUtils.directives.dirDisqus', 'ngTextTruncate', 'ngCookies', 'ui.select', 'TreeWidget']);

var host = "http://ydsdev.iit.demokritos.gr:8085";
var geoRouteUrl = host + "/YDSAPI/yds/geo/route";

// Defining global variables for the YDS lib
app.constant("YDS_CONSTANTS", {
    "PROXY": "/",
    "API_YDS_MODEL_HIERARCHY": "platform.yourdatastories.eu/api/json-ld/model/YDSModelHierarchy.json",
    "API_BAR": "platform.yourdatastories.eu/api/json-ld/component/barchart.tcl",
    "API_GRID": "platform.yourdatastories.eu/api/json-ld/component/grid.tcl",
    "API_HEATMAP": "platform.yourdatastories.eu/api/json-ld/component/heatmap.tcl",
    "API_INFO": "platform.yourdatastories.eu/api/json-ld/component/info.tcl",
    "API_LINE": "platform.yourdatastories.eu/api/json-ld/component/linechart.tcl",
    "API_SCATTER": "platform.yourdatastories.eu/api/json-ld/component/scatterchart.tcl",
    "API_BUBBLE": "platform.yourdatastories.eu/api/json-ld/component/bubblechart.tcl",
    "API_TREEMAP": "platform.yourdatastories.eu/api/json-ld/component/treemap.tcl",
    "API_MAP": "platform.yourdatastories.eu/api/json-ld/component/map.tcl",
    "API_PIE": "platform.yourdatastories.eu/api/json-ld/component/piechart.tcl",
    "API_PLOT_INFO": "platform.yourdatastories.eu/api/json-ld/component/plotinfo.tcl",
    "API_INTERACTIVE_BAR": "platform.yourdatastories.eu/api/json-ld/component/barchart.tcl/interactive",
    "API_INTERACTIVE_LINE": "platform.yourdatastories.eu/api/json-ld/component/linechart.tcl/interactive",
    "API_INTERACTIVE_SCATTER": "platform.yourdatastories.eu/api/json-ld/component/scatterchart.tcl/interactive",
    "API_INTERACTIVE_GENERIC": "platform.yourdatastories.eu/api/json-ld/component/genericchart.tcl",
    "API_SEARCH": "platform.yourdatastories.eu/api/json-ld/component/search.tcl",
    "API_SEARCH_SUGGESTIONS": "platform.yourdatastories.eu/api/json-ld/component/suggest.tcl",
    "API_FILTER_SUGGESTIONS": "platform.yourdatastories.eu/api/json-ld/component/suggest_field.tcl",
    "API_SEARCH_TABS": "platform.yourdatastories.eu/api/json-ld/model/searchtabs.tcl",
    "API_ADVANCED_SEARCH": "platform.yourdatastories.eu/api/json-ld/component/searchadvanced.tcl",
    "API_ADVANCED_SEARCH_RULES": "platform.yourdatastories.eu/api/json-ld/model/advancedsearchrules.tcl",
    "API_COMBOBOX_FILTER": "platform.yourdatastories.eu/api/json-ld/component/filter.tcl",
    "API_YDS_STATISTICS": "platform.yourdatastories.eu/api/json-ld/component/statistics.tcl",
    "API_HUMAN_READABLE_DESCRIPTION": "platform.yourdatastories.eu/api/json-ld/model/human_readable_description.tcl",
    "API_CACHE_INFO": "platform.yourdatastories.eu/api/json-ld/cache/cache_info.tcl",
    "API_CACHE_TRUNCATE": "platform.yourdatastories.eu/api/json-ld/cache/truncate.tcl",
    "API_AGGREGATE": "platform.yourdatastories.eu/api/json-ld/component/aggregate.tcl",
    "API_TYPE2SOLRQUERY": "platform.yourdatastories.eu/api/json-ld/component/type2solrquery.tcl",
    "API_TYPE2_ADVANCED_QUERY": "platform.yourdatastories.eu/api/json-ld/component/type2advancedquery.tcl",
    "API_RELATED_ITEMS": "platform.yourdatastories.eu/api/json-ld/social/relateditems.tcl",
    "API_GEOJSON_GR": "platform.yourdatastories.eu/api/json-ld/geo/greece",

    "SEARCH_RESULTS_URL": "http://ydsdev.iit.demokritos.gr/YDSComponents/#!/search",
    "SEARCH_RESULTS_URL_EL": "http://ydsdev.iit.demokritos.gr/YDSComponents/#!/search-el",
    "SEARCH_RESULTS_URL_TABBED": "http://ydsdev.iit.demokritos.gr/YDSComponents/#!/search-tabbed",
    // "SEARCH_RESULTS_URL": "http://yds-lib.dev/#!/search",
    // "SEARCH_RESULTS_URL_EL": "http://yds-lib.dev/#!/search-el",
    // "SEARCH_RESULTS_URL_TABBED": "http://yds-lib.dev/#!/search-tabbed",

    "API_PERSONALIZATION": "http://dev.yourdatastories.eu/personalaiz/recommendation/",

    "PROJECT_DETAILS_URL": "http://platform.yourdatastories.eu/project-details",
    "API_EMBED": "http://dev.yourdatastories.eu/api/tomcat/YDSAPI/yds/embed/",
    "API_RATINGS": "http://dev.yourdatastories.eu/api/tomcat/YDSAPI/yds/rating/",
    "BASKET_URL": "http://dev.yourdatastories.eu/api/tomcat/YDSAPI/yds/basket/"
});

app.directive('clipboard', ['$document', function () {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            element.on('click', function (e) {
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


app.factory('Data', ['$http', '$q', '$window', 'DashboardService', 'YDS_CONSTANTS', function ($http, $q, $window, DashboardService, YDS_CONSTANTS) {
    var dataService = {};

    //function to convert date to timestamp
    var monthToComparableNumber = function (date) {
        if (date === undefined || date === null || date.length !== 10) {
            return null;
        }

        var yearNumber = date.substring(6, 10);
        var monthNumber = date.substring(3, 5);
        var dayNumber = date.substring(0, 2);

        var result = (yearNumber * 10000) + (monthNumber * 100) + dayNumber;
        return result;
    };

    dataService.getYearMonthFromTimestamp = function (timestamp, yearToMonth) {
        var d = new Date(timestamp * 1000);
        var month = ("0" + (d.getMonth() + 1)).slice(-2);
        var year = d.getFullYear();

        if (yearToMonth)
            return year + "-" + month;
        else
            return month + "/" + year;
    };

    dataService.getTimestampFromDate = function (date) {
        return parseInt(new Date(date).getTime() / 1000);
    };

    dataService.hashFromObject = function (inputObj) {
        var str = JSON.stringify(inputObj);
        return calcMD5(str);
    };

    dataService.deepObjSearch = function (obj, path) {
        //function to get the value of an object property, by defining its path
        for (var i = 0, path = path.split('.'), len = path.length; i < len; i++) {
            if (_.isUndefined(obj)) {
                obj = "";
                break;
            }

            obj = obj[path[i]];
        }

        return obj;
    };

    dataService.transform = function (data) {
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

    /**
     * Transform request parameters object to "x-www-form-urlencoded" format
     * @param obj
     * @returns {string}
     */
    var customRequestTransform = function (obj) {
        var str = [];
        for (var p in obj)
            str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
        return str.join("&");
    };

    /**
     * Get the ID of a Highcharts Editor template, based on its configuration
     * @param template
     * @returns {*}
     */
    dataService.getTemplateId = function (template) {
        // Stringify the template's configuration, and return its MD5
        return calcMD5(JSON.stringify(template.config));
    };

    /**
     * Get the ID of an axis for the Personalization API, based on X or Y axis and its field_id attribute
     * @param axis      Axis type ("x" or "y")
     * @param fieldId   Field ID of the axis ("field_id" attribute)
     * @returns {string}
     */
    dataService.getAxisId = function (axis, fieldId) {
        return "axis_" + axis + "_" + calcMD5(fieldId);
    };

    dataService.getRoutePoints = function (start, end, via) {
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
            transformRequest: customRequestTransform,
            data: {geoData: angular.toJson(inputData)}
        }).success(function (data) {
            deferred.resolve(data);
        }).error(function (error) {
            deferred.reject(error);
        });

        return deferred.promise;
    };

    dataService.saveGeoObj = function (projectId, geoObj) {
        var deferred = $q.defer();

        $http({
            method: 'POST',
            url: geoRouteUrl + "/save/" + projectId,
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            transformRequest: customRequestTransform,
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

    dataService.getGeoObj = function (projectId) {
        var deferred = $q.defer();

        $http({
            method: 'GET',
            url: geoRouteUrl + "/" + projectId,
            headers: {'Content-Type': 'application/x-www-form-urlencoded'}
        }).success(function (data) {
            deferred.resolve(data);
        }).error(function (error) {
            deferred.reject(error);
        });

        return deferred.promise;
    };

    dataService.requestEmbedCode = function (projectId, facets, visType, viewType, lang) {
        var deferred = $q.defer();

        $http({
            method: 'POST',
            url: YDS_CONSTANTS.API_EMBED + "save",
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            transformRequest: customRequestTransform,
            data: {
                "project_id": projectId,
                "facets": JSON.stringify(facets),
                "viz_type": visType,
                "view_type": viewType,
                "lang": lang
            }
        }).success(function (data) {
            deferred.resolve(data);
        }).error(function (error) {
            deferred.reject(error);
        });

        return deferred.promise;
    };

    dataService.recoverEmbedCode = function (embedCode) {
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

    /**
     * Save a user's rating
     * @param params
     * @returns {*|promise|s|d}
     */
    dataService.saveRating = function (params) {
        var deferred = $q.defer();

        // Remove undefined values from the parameters
        params = _.omit(params, function (value) {
            return _.isUndefined(value);
        });

        $http({
            method: "POST",
            url: YDS_CONSTANTS.API_RATINGS + "save",
            headers: {"Content-Type": "application/x-www-form-urlencoded"},
            transformRequest: customRequestTransform,
            data: params
        }).then(function (response) {
            deferred.resolve(response.data);
        }, function (error) {
            deferred.reject(error);
        });

        return deferred.promise;
    };

    dataService.getBreadcrumbColor = function (index) {
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

    dataService.getBrowseData = function () {
        var deferred = $q.defer();

        $http({
            method: 'GET',
            url: "http://" + YDS_CONSTANTS.PROXY + YDS_CONSTANTS.API_YDS_MODEL_HIERARCHY,
            headers: {'Content-Type': 'application/json'}
        }).success(function (data) {
            deferred.resolve(data);
        }).error(function (error) {
            deferred.reject(error);
        });

        return deferred.promise;
    };

    dataService.createRandomId = function () {
        return '_' + Math.random().toString(36).substr(2, 9);
    };

    dataService.prepareGridColumns = function (gridView) {
        var gridColumns = [];

        for (var i = 0; i < gridView.length; i++) {
            var columnInfo = {
                headerName: gridView[i].header,
                field: gridView[i].attribute
            };

            // Enable sorting only if sortable attribute is true
            if (_.has(gridView[i], "sortable")) {
                columnInfo.suppressSorting = !gridView[i].sortable;
            }

            if (!_.isUndefined(gridView[i].style)) {
                columnInfo.cellStyle = gridView[i].style;
            }

            if (!_.isUndefined(gridView[i]["column-width"])) {
                columnInfo.width = parseInt(gridView[i]["column-width"]);
            }

            //if it is not string add number filtering
            if (gridView[i].type.indexOf("string") == -1 && gridView[i].type.indexOf("url") == -1 && gridView[i].type.indexOf("date") == -1) {
                columnInfo.filter = 'number';
            }

            //if it is 'amount', apply custom filter to remove the currency and sort them
            if (gridView[i].type == "amount") {
                columnInfo.comparator = function (value1, value2) {
                    if (_.isUndefined(value1) || value1 == null)
                        value1 = "-1";

                    if (_.isUndefined(value2) || value2 == null)
                        value2 = "-1";

                    value1 = parseFloat(String(value1).split(" ")[0].replace(/,/g, ""));
                    value2 = parseFloat(String(value2).split(" ")[0].replace(/,/g, ""));

                    return value1 - value2;
                }
            } else if (gridView[i].type == "date") {
                columnInfo.comparator = function (date1, date2) {
                    var date1Number = monthToComparableNumber(date1);
                    var date2Number = monthToComparableNumber(date2);

                    if (date1Number === null && date2Number === null)
                        return 0;

                    if (date1Number === null)
                        return -1;

                    if (date2Number === null)
                        return 1;

                    return date1Number - date2Number;
                }
            }

            gridColumns.push(columnInfo);
        }

        return gridColumns;
    };

    /**
     * Function to create a nested object and assign a value to it
     * credit: http://stackoverflow.com/a/11433067
     * @param base  the object on which to create the hierarchy
     * @param names an array of strings containing the names of the objects
     * @param value (optional) if given, will be the last object in the hierarchy
     * @returns {*} the last object in the hierarchy
     */
    dataService.createNestedObject = function (base, names, value) {
        // Keep original item, in case it is needed
        var originalBase = base;

        // If a value is given, remove the last name and keep it for later:
        var lastName = arguments.length === 3 ? names.pop() : false;

        // Walk the hierarchy, creating new objects where needed.
        // If the lastName was removed, then the last object is not set yet:
        for (var i = 0; i < names.length; i++) {
            var newVal = base[names[i]] || {};

            // If newVal is a String, something went wrong (it should be an object)
            if (_.isString(newVal) && lastName) {
                // Find the previous "base" object
                var baseBefore = undefined;
                if (i > 1) {
                    baseBefore = dataService.deepObjSearch(originalBase, _.first(names, i).join("."));
                } else {
                    baseBefore = originalBase;
                }

                // Make the current attribute an object instead of a string
                // (since we know the value we need to give, because lastName != false in here)
                baseBefore[names[i]] = {};
            }

            base = base[names[i]] = base[names[i]] || {};
        }

        // If a value was given, set it to the last name:
        if (lastName) base = base[lastName] = value;

        // Return the last object in the hierarchy:
        return base;
    };


    /**
     * Function to find a value in the data even if the attribute name in the view doesn't match exactly
     * @param result        The result
     * @param attribute        The name of the attribute to find (from the view)
     * @param langs         Available languages
     * @param prefLang        Preferred language
     * @returns {*}            The value, if found
     */
    dataService.findValueInResult = function (result, attribute, langs, prefLang) {
        var value = result[attribute];

        //if the value of a result doesn't exist
        if (_.isUndefined(value) || String(value).trim().length == 0) {
            //extract the last 3 characters of the specific attribute of the result
            var last3chars = attribute.substr(attribute.length - 3);

            //if it is internationalized
            if (last3chars == ("." + prefLang)) {
                //split the attribute in tokens
                var attributeTokens = attribute.split(".");
                //extract the attribute without the i18n tokens
                var nonInternationalizedAttr = _.first(attributeTokens, attributeTokens.length - 1).join(".");
                //find the opposite language of the component
                var alternativeLang = _.first(_.without(langs, prefLang));

                //assign the value of the opposite language
                value = result [nonInternationalizedAttr + "." + alternativeLang];

                //if no value was acquired from the i18n attributes, try with non-internationalized attribute
                if (_.isUndefined(value) || String(value).trim().length == 0)
                    value = result [nonInternationalizedAttr];
            }
        }

        return value;
    };

    /**
     * Formats an ISO-8601 date string to "DD/MM/YYYY" format
     * @param dateToFormat  ISO-8601 date string
     * @returns {string}    "DD/MM/YYYY" formatted date
     */
    var formatDateToDDMMYYYY = function (dateToFormat) {
        var date = new Date(dateToFormat);

        var dd = date.getDate();
        var mm = date.getMonth() + 1;
        var yyyy = date.getFullYear();

        // Return the formatted string, adding zeroes if the month or day is less than 10
        return ((dd < 10) ? "0" : "") + dd + "/" + ((mm < 10) ? "0" : "") + mm + "/" + yyyy;
    };

    /**
     * Like deepObjSearch, but for each attribute token checks also if it is an array, and if it is
     * it tries to get the values for all items in it and return them separated with commas. Does not search arrays.
     * @param item
     * @param attribute
     * @returns {*}
     */
    var arraySearch = function (item, attribute) {
        var tokens = attribute.split(".");

        var itemPart = item[_.first(tokens)];

        if (_.isArray(itemPart)) {
            // It is array
            var str = "";
            _.each(itemPart, function (item) {
                var attrStr = _.rest(tokens, 1).join(".");
                str += arraySearch(item, attrStr) + ", ";
            });

            // Return the total string, removing last comma
            return str.substring(0, str.length - 2);
        } else if (_.isString(itemPart)) {
            // It is string, return as is
            return itemPart;
        }
    };

    dataService.prepareGridData = function (newData, newView) {
        for (var i = 0; i < newData.length; i++) {
            _.each(newView, function (viewVal) {
                // Find value of attribute
                var attrValue = newData[i][viewVal.attribute];
                var attributeTokens = viewVal.attribute.split(".");
                if (_.isUndefined(attrValue) || (_.isString(attrValue) && attrValue.trim().length == 0)) {
                    // If the attribute is empty, maybe it is a nested attribute, so try deep object search
                    attrValue = dataService.deepObjSearch(newData[i], viewVal.attribute);
                }

                if (_.isUndefined(attrValue) && viewVal.attribute.length > 0) {
                    // Value still undefined, as a last resort try to look for arrays in each attribute token
                    attrValue = arraySearch(newData[i], viewVal.attribute);
                }

                // If the column type is year, date or amount of money, format it accordingly
                if (viewVal.type == "year") {
                    attrValue = new Date(attrValue).getFullYear();
                } else if (viewVal.type == "date" && !_.isUndefined(attrValue) && attrValue.indexOf("/") == -1) {
                    // Format date to DD/MM/YYYY format (if it contains "/" it was already formatted)
                    attrValue = formatDateToDDMMYYYY(attrValue);
                } else if (viewVal.type == "format_to_amount" && !_.isUndefined(attrValue)) {
                    // Make attribute a string so we can do more checks
                    var attrStr = attrValue.toString().trim();

                    // Format the amount only if it's not empty, and doesn't contain dollar or euro sign
                    if (attrStr.length > 0) {
                        attrValue = attrValue.toLocaleString(undefined, {minimumFractionDigits: 2});

                        // Try to find and add currency symbol
                        var lastTokenLength = _.last(attributeTokens).length;
                        var attrLength = viewVal.attribute.length;

                        // Create string which is the attribute to look at for currency notation
                        // (currently: newVal.attribute without last part + "hasCurrency.notation")
                        var currNotAttr = viewVal.attribute.substr(0, attrLength - lastTokenLength) + "hasCurrency.notation";

                        // If currency is USD or EUR add their symbols, otherwise add the notation as it is in the data
                        var currNotation = _.first(newData[i][currNotAttr]);
                        if (!_.isUndefined(currNotation)) {
                            switch (currNotation) {
                                case "USD":
                                    attrValue = "$" + attrValue;
                                    break;
                                case "EUR":
                                    attrValue += " €";
                                    break;
                                default:
                                    attrValue += " " + currNotation;
                            }
                        }
                    }
                }

                // If the column should have a url, make the attribute a link
                if (_.has(viewVal, "url")) {
                    // Find the url
                    var url = newData[i][viewVal.url];
                    if (_.isUndefined(url) || (_.isString(url) && url.trim().length === 0)) {
                        // If the url is empty, maybe it is a nested attribute, so try deep object search
                        url = dataService.deepObjSearch(newData[i], viewVal.url);
                    }

                    // In case the found URL is an array, keep the first value
                    if (_.isArray(url) && !_.isEmpty(url)) {
                        url = _.first(url);
                    }

                    // Only continue to make the cell a link if a URL was found
                    if (!_.isUndefined(url) && _.isString(url) && url.trim().length > 0) {
                        if (viewVal.attribute === "id") {
                            // If the viewVal specifies the "id" as its attribute and is a link,
                            // save it because it might be needed and the original value will be modified
                            newData[i].id_original = attrValue;
                        }

                        // If addbase attribute is true, we need to create the full URL using the type
                        if (viewVal.addbase == true && _.has(viewVal, "urltype")) {
                            url = YDS_CONSTANTS.PROJECT_DETAILS_URL + "?id=" + url + "&type=" + viewVal.urltype;
                        }

                        // Make attribute link to the url
                        attrValue = "<a href=\"" + url + "\" target=\"_blank\">" + attrValue + "</a>";
                    }
                }

                // Add the new attribute to the data so ag grid can find it
                dataService.createNestedObject(newData[i], attributeTokens, attrValue);
            });
        }

        return newData;
    };

    dataService.getYdsStatistics = function () {
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

    /**
     * Returns a human readable description for a specific concept
     * @param conceptId     ID of concept to get description for
     * @param lang          Language of the description
     * @returns {d|s|a}
     */
    dataService.getConceptDescription = function (conceptId, lang) {
        var deferred = $q.defer();

        $http({
            method: "GET",
            url: "http://" + YDS_CONSTANTS.API_HUMAN_READABLE_DESCRIPTION,
            params: {
                id: conceptId,
                lang: lang
            },
            headers: {'Content-Type': 'application/json; charset=UTF-8'}
        }).success(function (data) {
            deferred.resolve(data);
        }).error(function (error) {
            deferred.reject(error);
        });

        return deferred.promise;
    };

    /**
     * Get rules for QueryBuilder that will set it up with the specified parameters, eg. year range, countries
     * @param viewType      Type to get rules for
     * @param apiOptions    Options from ODA Dashboard (eg. year, selected countries...)
     * @returns {*|d.promise|promise|d|s}
     */
    dataService.getQueryBuilderRules = function (viewType, apiOptions) {
        var deferred = $q.defer();

        var params = _.extend({
            type: viewType
        }, apiOptions);

        $http({
            method: "GET",
            url: "http://" + YDS_CONSTANTS.API_TYPE2_ADVANCED_QUERY,
            params: params,
            headers: {'Content-Type': 'application/json; charset=UTF-8'}
        }).then(function (response) {
            deferred.resolve(response.data);
        }, function (error) {
            deferred.reject(error);
        });

        return deferred.promise;
    };

    /**
     * Gets the Solr query that should be used with the Search API to get results with the specified parameters
     * @param type      View type
     * @param params    Parameters object
     * @returns {*|d.promise|promise|d|s}
     */
    dataService.getType2SolrQuery = function (type, params) {
        var deferred = $q.defer();

        params.type = type;

        // Remove any string values that contain "null"
        params = _.omit(params, function (param) {
            if (_.isString(param)) {
                return param.indexOf("null") != -1;
            } else {
                return false;
            }
        });

        $http({
            method: "GET",
            url: "http://" + YDS_CONSTANTS.API_TYPE2SOLRQUERY,
            headers: {'Content-Type': 'application/json; charset=UTF-8'},
            params: params
        }).success(function (data) {
            deferred.resolve(data);
        }).error(function (error) {
            deferred.reject(error);
        });

        return deferred.promise;
    };

    /**
     * Merge the view type of tabbed search with facets, because the view type for tabbed search tabs is sent
     * to the server as a facet
     * @param viewType
     * @param facets
     * @returns {*}
     */
    var mergeFacetsAndViewType = function (viewType, facets) {
        var newFacet = "{!tag=TYPE}type:" + viewType;

        if (_.isArray(facets)) {
            // facets is an array, add new facet to it (if it exists, union will not add it again)
            facets = _.union(facets, [newFacet]);
        } else if (_.isString(facets) && newFacet != facets) {
            // facets is a single facet and is not an array, so make it an array with both facets
            facets = [facets, newFacet];
        } else if (_.isUndefined(facets)) {
            // Facets is undefined, only facet is the view type
            facets = [newFacet];
        }

        return facets;
    };

    /**
     * Format sort options like the server wants them
     * @param sortModel     Sort model as given by ag-grid
     * @returns {{sort, sortdir}}
     */
    dataService.formatAgGridSortParams = function (sortModel) {
        return {
            sort: _.pluck(sortModel, "colId"),
            sortdir: _.pluck(sortModel, "sort")
        };
    };

    /**
     * Gets the results for a tabbed search
     * @param query     Search query
     * @param facets    Array with facets
     * @param viewType  Concept (eg. TradeActivity, AidActivity...)
     * @param start     Starting row
     * @param rows      Result rows to fetch
     * @param lang      Language of results
     * @param sortModel Parameters for how the server should sort the data
     * @returns {d|a|s}
     */
    dataService.getGridResultData = function (query, facets, viewType, start, rows, lang, sortModel) {
        var deferred = $q.defer();

        var sortParams = dataService.formatAgGridSortParams(sortModel);

        var params = _.extend({
            q: query,
            lang: lang,
            rows: rows,
            start: start
        }, sortParams);

        if (!_.isUndefined(viewType) && viewType.length > 0) {
            // Before merging viewType with facets, check that it's not a Dashboard type (if it is, ignore it)
            if (_.isNull(DashboardService.getProjectConceptForType(viewType))) {
                facets = mergeFacetsAndViewType(viewType, facets);
            }
        }

        // Add facets to the parameters of the request
        params.fq = facets;

        $http({
            method: 'GET',
            url: "http://" + YDS_CONSTANTS.API_SEARCH,
            headers: {'Content-Type': 'application/json; charset=UTF-8'},
            params: params
        }).success(function (data) {
            deferred.resolve(data);
        }).error(function (error) {
            deferred.reject(error);
        });

        return deferred.promise;
    };

    /**
     * Gets the results for an advanced tabbed search
     * @param query     Search query
     * @param facets    Array with facets
     * @param rules     Query Builder rules
     * @param viewType  Concept (eg. TradeActivity, AidActivity...)
     * @param start     Starting row
     * @param rows      Result rows to fetch
     * @param lang      Language of results
     * @param sortModel Parameters for how the server should sort the data
     * @returns {d|a|s}
     */
    dataService.getGridResultDataAdvanced = function (query, facets, rules, viewType, start, rows, lang, sortModel) {
        var deferred = $q.defer();

        // Create facets array
        var fq = mergeFacetsAndViewType(viewType, facets);

        var sortParams = dataService.formatAgGridSortParams(sortModel);

        var searchParameters = _.extend({
            q: query,
            rules: rules,
            fq: fq,
            lang: lang,
            rows: rows,
            start: start
        }, sortParams);

        $http({
            method: "POST",
            url: "http://" + YDS_CONSTANTS.API_ADVANCED_SEARCH,
            data: searchParameters,
            headers: {'Content-Type': 'application/x-www-form-urlencoded'}
        }).then(function successCallback(response) {
            deferred.resolve(response.data);
        }, function errorCallback(error) {
            deferred.reject(error);
        });

        return deferred.promise;
    };

    /**
     * Download grid results as a CSV file
     * @param query
     * @param facets
     * @param rules
     * @param viewType
     * @param lang
     */
    dataService.downloadGridResultDataAsCsv = function (query, facets, rules, viewType, lang) {
        // Create facets array
        var fq = facets;
        if (!_.isUndefined(viewType)) {
            // If there is a viewType, merge it with the facets
            fq = mergeFacetsAndViewType(viewType, facets);
        }
        // The server expects fq to always be an array, so if it's a string we make it an array with 1 string in it
        if (!_.isArray(fq) && !_.isUndefined(fq)) {
            fq = [fq];
        }

        // Create parameters object
        var params = {
            q: query,
            fq: fq,
            lang: lang,
            start: 0,   // this is ignored by the server
            rows: 100   // this is ignored by the server
        };

        if (!_.isUndefined(rules)) {
            // Advanced search
            params.rules = rules;
            params.export = "csv";

            $http({
                method: "POST",
                url: "http://" + YDS_CONSTANTS.API_ADVANCED_SEARCH,
                data: params,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            }).then(function (response) {
                // Download the received CSV data as a file
                var csvData = response.data;
                var filename = "YourDataStories-Export.csv";

                var blob = new Blob([csvData], {type: 'text/csv'});
                if (window.navigator.msSaveOrOpenBlob) {
                    window.navigator.msSaveBlob(blob, filename);
                } else {
                    var elem = window.document.createElement('a');
                    elem.href = window.URL.createObjectURL(blob);
                    elem.download = filename;
                    document.body.appendChild(elem);
                    elem.click();
                    document.body.removeChild(elem);
                }
            }, function (error) {
                console.error("An error occured while exporting the data!", error);
            });
        } else {
            // Normal search
            var url = "http://" + YDS_CONSTANTS.API_SEARCH + "?export=csv";

            _.each(params, function (value, key) {
                if (key == "fq") {
                    _.each(value, function (value) {
                        url += "&" + key + "=" + encodeURIComponent(value);
                    });
                } else {
                    url += "&" + key + "=" + encodeURIComponent(value);
                }
            });

            // console.log(url);
            $window.open(url, "_blank");
        }
    };

    /**
     * Gets the aggregate data
     * @param resourceId    Resource ID
     * @param viewType      View type
     * @param lang          Language
     * @param extraParams   Extra parameters to send with request
     * @returns {promise|d.promise|*|d|s}
     */
    dataService.getAggregate = function (resourceId, viewType, lang, extraParams) {
        var deferred = $q.defer();

        var params = {
            id: resourceId,
            type: viewType,
            lang: lang
        };

        // If there are extra parameters to send to the API, add them to params
        if (!_.isUndefined(extraParams)) {
            _.extend(params, extraParams);
        }

        $http({
            method: 'GET',
            url: "http://" + YDS_CONSTANTS.API_AGGREGATE,
            headers: {'Content-Type': 'application/json; charset=UTF-8'},
            params: params
        }).then(function (response) {
            deferred.resolve(response.data);
        }, function (error) {
            deferred.reject(error);
        });

        return deferred.promise;
    };

    dataService.getProjectVis = function (type, resourceId, viewType, lang, extraParams) {
        var deferred = $q.defer();

        // Setup request parameters
        var params = {
            id: resourceId,
            type: viewType,
            lang: lang
        };

        // If there are extra parameters to send to the API, add them to params
        if (!_.isUndefined(extraParams)) {
            _.extend(params, extraParams);
        }

        var visualizationUrl = "";
        switch (type) {
            case "bar":
                visualizationUrl = "http://" + YDS_CONSTANTS.API_BAR;
                break;
            case "info":
                visualizationUrl = "http://" + YDS_CONSTANTS.API_INFO;
                params.context = 0;
                break;
            case "grid":
                visualizationUrl = "http://" + YDS_CONSTANTS.API_GRID;
                params.context = 0;
                break;
            case "pie":
                visualizationUrl = "http://" + YDS_CONSTANTS.API_PIE;
                break;
            case "scatter":
                visualizationUrl = "http://" + YDS_CONSTANTS.API_SCATTER;
                break;
            case "bubble":
                visualizationUrl = "http://" + YDS_CONSTANTS.API_BUBBLE;
                break;
            case "treemap":
                visualizationUrl = "http://" + YDS_CONSTANTS.API_TREEMAP;
                break;
            case "line":
                visualizationUrl = "http://" + YDS_CONSTANTS.API_LINE;
                break;
            case "map":
                visualizationUrl = "http://" + YDS_CONSTANTS.API_MAP;
                params.baseurl = YDS_CONSTANTS.PROJECT_DETAILS_URL;
                break;
            case "heatmap":
                visualizationUrl = "http://" + YDS_CONSTANTS.API_HEATMAP;
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
            params: params
        }).success(function (data) {
            deferred.resolve(data);
        }).error(function (error) {
            deferred.reject(error);
        });

        return deferred.promise;
    };

    dataService.getProjectVisAdvanced = function (type, resourceId, viewType, lang, comboFilters, start) {
        var deferred = $q.defer();
        var visualizationUrl = "";

        var inputParams = {
            id: resourceId,
            type: viewType,
            lang: lang
        };

        if (!_.isUndefined(start))
            inputParams.start = start;

        _.extendOwn(inputParams, comboFilters);

        switch (type) {
            case "grid":
                visualizationUrl = "http://" + YDS_CONSTANTS.API_GRID;
                inputParams.context = 0;
                break;
            case "bar":
                visualizationUrl = "http://" + YDS_CONSTANTS.API_BAR;
                break;
            case "line":
                visualizationUrl = "http://" + YDS_CONSTANTS.API_LINE;
                break;
            case "pie":
                visualizationUrl = "http://" + YDS_CONSTANTS.API_PIE;
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

    dataService.getComboboxFilters = function (resourceId, filterType, filterAttr, lang) {
        var deferred = $q.defer();

        $http({
            method: 'GET',
            url: "http://" + YDS_CONSTANTS.PROXY + YDS_CONSTANTS.API_COMBOBOX_FILTER,
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

    /**
     * Gets cache info from the API. If the tableToTruncate parameter is defined,
     * then it sends it via GET in order for the table with that name to be truncated
     * @param tableToTruncate   Table to be truncated (leave undefined for just getting info)
     * @returns {*|d.promise|promise|s|d|a}
     */
    dataService.getCacheInfo = function (tableToTruncate) {
        var deferred = $q.defer();

        var params = {};
        if (!_.isUndefined(tableToTruncate)) {
            params.table = tableToTruncate;
        }

        var url = "http://" + (_.isUndefined(tableToTruncate) ? YDS_CONSTANTS.API_CACHE_INFO : YDS_CONSTANTS.API_CACHE_TRUNCATE);

        $http({
            method: 'GET',
            url: url,
            headers: {'Content-Type': 'application/json; charset=UTF-8'},
            params: params
        }).success(function (data) {
            deferred.resolve(data);
        }).error(function (error) {
            deferred.reject(error);
        });

        return deferred.promise;
    };

    /**
     * Return related items of a specific type, for a specific project
     * @param projectId     ID of project to return items for
     * @param type          Type of related items to return (can be "news", "blog" or "tweet")
     * @param period        Period of items ("before", "during" or "after")
     * @param start         Item to start from, for paging
     * @param rows          Number of rows to return
     * @returns {promise|*|s|d}
     */
    dataService.getRelatedItems = function (projectId, type, period, start, rows) {
        var deferred = $q.defer();

        var params = {
            id: projectId,
            type: type,
            period: period,
            rows: rows,
            start: start
        };

        $http({
            method: 'GET',
            url: "http://" + YDS_CONSTANTS.API_RELATED_ITEMS,
            headers: {'Content-Type': 'application/json; charset=UTF-8'},
            params: params
        }).then(function (response) {
            // Transform the data to the format expected by the component
            var formattedData = [];
            var results = response.data.data.response.docs;
            var totalResults = response.data.data.response.numFound;

            if (_.isArray(results)) {
                switch (type) {
                    case "news":
                    case "blog":
                        formattedData = results.map(function (item) {
                            return {
                                text: item.title,
                                url: item.entry_url
                            }
                        });
                        break;
                    case "tweet":
                        formattedData = results.map(function (item) {
                            return {
                                text: item.clean_text,
                                url: item.entry_url
                            }
                        });
                        break;
                }
            }

            deferred.resolve({
                data: formattedData,
                total: totalResults
            });
        }, function (error) {
            deferred.reject(error);
        });

        return deferred.promise;
    };

    /**
     * Get the GeoJSON for Greece, in high detail for a region or low detail for the entire country.
     * @param detailLevel   Map detail level
     * @param region        Region to get high detail map for
     * @returns {promise|*|s|d}
     */
    dataService.getGeoJSON = function (detailLevel, region) {
        var deferred = $q.defer();

        var url = "http://" + YDS_CONSTANTS.API_GEOJSON_GR + "/";

        if (detailLevel == "high") {
            url += region + ".json";
        } else {
            url += "greece_low_detail.json";
        }

        $http({
            method: 'GET',
            url: url,
            headers: {'Content-Type': 'application/json; charset=UTF-8'}
        }).success(function (data) {
            deferred.resolve(data);
        }).error(function (error) {
            deferred.reject(error);
        });

        return deferred.promise;
    };

    return dataService;
}]);

app.factory('Filters', [function () {
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
        addLineFilter: function (compId, lineChart) {
            chartFilters = [];
            var lineExtremes = lineChart.xAxis[0].getExtremes();

            //define which axis has range ? is needed ?
            chartFilters.push({
                applied_to: "x",
                attrs: {
                    min: lineExtremes.min,
                    max: lineExtremes.max
                }
            });

            chartFilters.push({
                applied_to: "y",
                attrs: {
                    attrName: ""
                }
            });

            updateFilters(chartFilters, compId, filters);
        },
        addExtraParamsFilter: function (compId, params) {
            // Create array with params as filters
            var newFilters = [{
                attrs: _.clone(params)
            }];

            updateFilters(newFilters, compId, filters);
        },
        addGridResultsFilter: function (compId, gridFilters) {
            var newFilters = [{
                applied_to: "search",
                attrs: gridFilters
            }];

            updateFilters(newFilters, compId, filters);
        },
        addGridFilter: function (compId, gridFilters) {
            var chartFilters = [];

            for (property in gridFilters) {
                var filterVal = gridFilters[property];

                if (gridFilters.hasOwnProperty(property)) {
                    if (property == "_ydsQuickFilter_") {		//quick filter applied on grid
                        var tmpAttrs = {};

                        if (filterVal.length > 0) {
                            tmpAttrs[filterVal] = true;

                            chartFilters.push({
                                applied_to: '_quick_bar_',
                                attrs: tmpAttrs
                            });
                        }
                    } else if (_.isArray(filterVal) && filterVal.length > 0) {	//string filter applied on grid
                        var attrsArray = [];

                        for (var j = 0; j < filterVal.length; j++) {
                            attrsArray.push(filterVal[j]);
                        }

                        var tmpAttr = {'rows': attrsArray};

                        chartFilters.push({
                            applied_to: property,
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

                        chartFilters.push({
                            applied_to: property,
                            attrs: tmpAttrs
                        });
                    }
                }
            }

            updateFilters(chartFilters, compId, filters);
        },
        get: function (compId) {
            var filterFound = _.findWhere(filters, {componentId: compId})

            if (!angular.isUndefined(filterFound))
                return filterFound.filters;
            else
                return [];
        },
        remove: function (compId) {
            filters = _.reject(filters, function (d) {
                return d.componentId === compId;
            });
        }
    }
}]);
