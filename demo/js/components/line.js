angular.module('yds').directive('ydsLine', ['Data', 'Filters', function(Data, Filters){
    return {
        restrict: 'E',
        scope: {
            projectId: '@',     //id of the project that the data belong
            viewType: '@',      //name of the array that contains the visualised data
            lang: '@',          //lang of the visualised data

            showNavigator: '@', //enable or disable line chart's navigation
            exporting: '@',     //enable or disable the export of the chart
            elementH: '@',      //set the height of the component
            titleSize: '@',     //the size of the chart's main title

            addToBasket: '@',   //enable or disable "add to basket" functionality, values: true, false
            basketBtnX: '@',    //x-axis position of the basket button
            basketBtnY: '@',    //y-axis position of the basket button

            embeddable: '@',    //enable or disable the embedding of the component
            embedBtnX: '@',     //x-axis position of the embed button
            embedBtnY: '@',     //y-axis position of the embed button
            popoverPos: '@',    //the side of the embed button from which the embed information window will appear

            enableRating: '@',  // Enable rating buttons for this component
            ratingBtnX: '@',    // X-axis position of the rating buttons
            ratingBtnY: '@'     // Y-axis position of the rating buttons
        },
        templateUrl: ((typeof Drupal != 'undefined')? Drupal.settings.basePath  + Drupal.settings.yds_project.modulePath  +'/' :'') + 'templates/line.html',
        link: function (scope, element, attrs) {
            var lineContainer = angular.element(element[0].querySelector('.line-container'));

            //create a random id for the element that will render the chart
            var elementId = "line" + Data.createRandomId();
            lineContainer[0].id = elementId;

            var projectId = scope.projectId;
            var viewType = scope.viewType;
            var lang = scope.lang;
            var showNavigator = scope.showNavigator;
            var exporting = scope.exporting;
            var elementH = scope.elementH;
            var titleSize = scope.titleSize;

            //check if the projectId and the viewType attr is defined, else stop the process
            if (angular.isUndefined(projectId) || projectId.trim()=="") {
                scope.ydsAlert = "The YDS component is not properly configured." +
                    "Please check the corresponding documentation section";
                return false;
            }

            //check if pie-type attribute is empty and assign the default value
            if(_.isUndefined(viewType) || viewType.trim()=="")
                viewType = "default";

            //check if the language attr is defined, else assign default value
            if(angular.isUndefined(lang) || lang.trim()=="")
                lang = "en";

            //check if the exporting attr is defined, else assign default value
            if(angular.isUndefined(showNavigator) || (showNavigator!="true" && showNavigator!="false"))
                showNavigator = "true";

            //check if the exporting attr is defined, else assign default value
            if(angular.isUndefined(exporting) || (exporting!="true" && exporting!="false"))
                exporting = "true";

            //check if the component's height attr is defined, else assign default value
            if(angular.isUndefined(elementH) || isNaN(elementH))
                elementH = 200 ;

            //check if the component's title size attr is defined, else assign default value
            if(angular.isUndefined(titleSize) || titleSize.length == 0 || isNaN(titleSize))
                titleSize = 18 ;

            //set the height of the chart
            lineContainer[0].style.height = elementH + 'px';

            Data.getProjectVis("line", projectId, viewType, lang)
            .then(function (response) {
                var chartSeries = response.data.series;
                var chartTitle = "";

                // Find title view in order to search for chart title
                for (var i = 0; i < response.view.length; i++) {
                    if (response.view[i].header == "Title") {
                        var lineTitleAttr = response.view[i].attribute;

                        // Find chart title with deep object search
                        chartTitle = Data.deepObjSearch(response.data, lineTitleAttr);
                        break;
                    }
                }

                // Check if the component is properly rendered
                if (_.isUndefined(chartSeries) || !_.isArray(chartSeries) || _.isUndefined(chartTitle)) {
                    scope.ydsAlert = "The YDS component is not properly configured." +
                        "Please check the corresponding documentation section";
                    return false;
                }

                var options = {
                    chart: {
                        renderTo: elementId,
                        events: {
                            load: function(e) {
                                Filters.addLineFilter(elementId, e.target);
                            }
                        }
                    },
                    rangeSelector : {
                        enabled: (showNavigator === "true"),
                        selected : 1
                    },
                    scrollbar : {
                        enabled: (showNavigator === "true")
                    },
                    title : {
                        text : chartTitle,
                        style: {
                            fontSize: titleSize + "px"
                        }
                    },
                    exporting: {
                        buttons: {
                            contextButton: {
                                symbol: 'url(' + ((typeof Drupal != 'undefined')? Drupal.settings.basePath + Drupal.settings.yds_project.modulePath + '/' :'') + 'img/fa-download-small.png)',
                                symbolX: 12,
                                symbolY: 12
                            }
                        },
                        enabled: (exporting === "true")
                    },
                    navigator: {
                        enabled: (showNavigator === "true")
                    },
                    series : chartSeries,
                    xAxis:{
                        events: {
                            afterSetExtremes: function (e) {
                                Filters.addLineFilter(elementId, e.target.chart);
                            }
                        }
                    }
                };

                new Highcharts.StockChart(options);
            }, function (error) {
                if (error==null || _.isUndefined(error) || _.isUndefined(error.message))
                    scope.ydsAlert = "An error was occurred, please check the configuration of the component";
                else
                    scope.ydsAlert = error.message;
            });
        }
    };
}]);