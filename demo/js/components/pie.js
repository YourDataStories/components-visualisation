angular.module('yds').directive('ydsPie', ['Data', 'Filters', function(Data, Filters){
    return {
        restrict: 'E',
        scope: {
            projectId: '@',     //id of the project that the data belong
            viewType: '@',      //name of the array that contains the visualised data
            lang: '@',          //lang of the visualised data

            extraParams: '=',   //extra attributes to pass to the API, if needed

            showLegend: '@',    //enable or disable the chart's legend
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
        templateUrl: ((typeof Drupal != 'undefined')? Drupal.settings.basePath  + Drupal.settings.yds_project.modulePath  +'/' :'') +  'templates/pie.html',
        link: function (scope, element, attrs) {
            var pieContainer = angular.element(element[0].querySelector('.pie-container'));

            //create a random id for the element that will render the chart
            var elementId = "pie" + Data.createRandomId();
            pieContainer[0].id = elementId;

            var projectId = scope.projectId;
            var viewType = scope.viewType;
            var lang = scope.lang;
            var showLegend = scope.showLegend;
            var exporting = scope.exporting;
            var elementH = scope.elementH;
            var titleSize = scope.titleSize;
            var extraParams = scope.extraParams;

            // If extra params exist, add them to Filters
            if (!_.isUndefined(extraParams) && !_.isEmpty(extraParams)) {
                Filters.addExtraParamsFilter(elementId, extraParams);
            }

            //check if the projectId is defined, else stop the process
            if (_.isUndefined(projectId) || projectId.trim()=="") {
                scope.ydsAlert = "The YDS component is not properly configured. " +
                    "Please check the corresponding documentation section";
                return false;
            }

            //check if pie-type attribute is empty and assign the default value
            if(_.isUndefined(viewType) || viewType.trim()=="")
                viewType = "default";

            //check if the language attr is defined, else assign default value
            if(_.isUndefined(lang) || lang.trim()=="")
                lang = "en";

            //check if the showLegend attr is defined, else assign default value
            if(_.isUndefined(showLegend) || (showLegend!="true" && showLegend!="false"))
                showLegend = "true";

            //check if the exporting attr is defined, else assign default value
            if(_.isUndefined(exporting) || (exporting!="true" && exporting!="false"))
                exporting = "true";

            //check if the component's height attr is defined, else assign default value
            if(_.isUndefined(elementH) || _.isNaN(elementH))
                elementH = 200;

            //check if the component's title size attr is defined, else assign default value
            if(_.isUndefined(titleSize) || titleSize.length == 0 || _.isNaN(titleSize))
                titleSize = 18;

            // Show loading animation
            scope.loading = true;

            //set the height of the chart
            pieContainer[0].style.height = elementH + 'px';

            //get the pie data from the server
            Data.getProjectVis("pie", scope.projectId, viewType, lang, extraParams)
                .then(function(response) {
                    // Check that the component has not been destroyed
                    if (scope.$$destroyed)
                        return;

                    var pieData = response.data.data;
                    var pieSeries = response.data.series;
                    var pieTitleAttr = _.first(response.view).attribute;
                    var pieTitle = Data.deepObjSearch(response.data, pieTitleAttr);

                    //check if the component is properly rendered
                    if (_.isUndefined(pieData) || !_.isArray(pieData) || _.isUndefined(pieSeries) || _.isUndefined(pieTitle)) {
                        scope.ydsAlert = "The YDS component is not properly configured. " +
                            "Please check the corresponding documentation section";
                        scope.loading = false;
                        return false;
                    }

                    var options = {
                        chart: {
                            plotBackgroundColor: null,
                            plotBorderWidth: null,
                            plotShadow: false,
                            type: 'pie',
                            renderTo: elementId
                        },
                        title: {
                            text: pieTitle,
                            style: {
                                fontSize: titleSize + "px"
                            }
                        },
                        tooltip: {
                            pointFormat: '({point.y}) <b>{point.percentage:.1f}%</b>'
                        },
                        legend: {
                            enabled: (showLegend === "true")
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
                        plotOptions: {
                            pie: {
                                allowPointSelect: true,
                                showInLegend: (showLegend === "true"),
                                cursor: 'pointer',
                                dataLabels: {
                                    enabled: true,
                                    formatter: function() {
                                        if (this.key.length > 45) {
                                            this.key = this.key.substring(0, 45) + "…";
                                        }

                                        return this.key + ": " + this.percentage.toFixed(1) + "%";
                                    },
                                    style: {
                                        color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black'
                                    }
                                }
                            }
                        },
                        series: [{
                            name: pieSeries,
                            colorByPoint: true,
                            data: pieData
                        }]
                    };

                    var chart = new Highcharts.Chart(options);

                    // Remove loading animation
                    scope.loading = false;
                }, function(error) {
                    if (_.isNull(error) || _.isUndefined(error) || _.isUndefined(error.message))
                        scope.ydsAlert = "An error has occurred, please check the configuration of the component";
                    else
                        scope.ydsAlert = error.message;

                    // Remove loading animation
                    scope.loading = false;
                });
        }
    };
}]);