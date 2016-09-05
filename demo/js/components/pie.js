angular.module('yds').directive('ydsPie', ['Data', 'CountrySelectionService', function(Data, CountrySelectionService){
    return {
        restrict: 'E',
        scope: {
            projectId: '@',     //id of the project that the data belong
            viewType: '@',      //name of the array that contains the visualised data
            lang: '@',          //lang of the visualised data

            useCountriesService: '@',  // if true will use selected countries service to load data instead of API

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
            popoverPos: '@'     //the side of the embed button from which the embed information window will appear
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
            var useCountriesService = scope.useCountriesService;
            var showLegend = scope.showLegend;
            var exporting = scope.exporting;
            var elementH = scope.elementH;
            var titleSize = scope.titleSize;

            //check if the projectId is defined, else stop the process
            if (useCountriesService != "true" && (_.isUndefined(projectId) || projectId.trim()=="")) {
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

            //check if the useCountriesService attr is defined, else assign default value
            if (_.isUndefined(useCountriesService) || useCountriesService.trim()=="")
                useCountriesService = "false";

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
            if(_.isUndefined(titleSize) || _.isNaN(titleSize))
                titleSize = 18;

            //set the height of the chart
            pieContainer[0].style.height = elementH + 'px';

            var chart = {};

            var visualizePie = function(response) {
                var pieData = response.data.data;
                var pieSeries = response.data.series;
                var pieTitleAttr = _.first(response.view).attribute;
                var pieTitle = Data.deepObjSearch(response.data, pieTitleAttr);

                //check if the component is properly rendered
                if (_.isUndefined(pieData) || !_.isArray(pieData) || _.isUndefined(pieSeries) || _.isUndefined(pieTitle)) {
                    scope.ydsAlert = "The YDS component is not properly configured." +
                        "Please check the corresponding documentation section";
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
                        enabled: (exporting === "true")
                    },
                    plotOptions: {
                        pie: {
                            allowPointSelect: true,
                            showInLegend: (showLegend === "true"),
                            cursor: 'pointer',
                            dataLabels: {
                                enabled: true,
                                format: '<b>{point.name}</b>: {point.percentage:.1f} %',
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

                if (!_.isEmpty(chart) && useCountriesService == "true") {
                    // Chart already exists, update its series with the new data
                    if (_.isEmpty(pieData)) {
                        // New data is empty, destroy the pie chart
                        chart.destroy();
                    } else {
                        // New data is not empty, update the pie chart's series
                        chart.series[0].setData(pieData);
                    }
                } else {
                    // Chart is being created for the first time, create normally
                    chart = new Highcharts.Chart(options);
                }
            };

            var visualizePieError = function(error) {
                if (error==null || _.isUndefined(error) || _.isUndefined(error.message))
                    scope.ydsAlert = "An error was occurred, please check the configuration of the component";
                else
                    scope.ydsAlert = error.message;
            };

            /**
             * Gets selected countries from the CountrySelectionService and formats them like a server response
             * from the API so that visualizePie() can read it correctly
             * @returns {{data: {data: *, series: string, title: string}, view: *[]}}
             */
            var getCountrySelectionServiceData = function() {
                var data = CountrySelectionService.getCountries().map(function(c) {
                    return {
                        name: c.name,
                        y: c.value
                    }
                });

                return {
                    data: {
                        data: data,
                        series: "",
                        title: null
                    },
                    view: [{
                        attribute: "title"
                    }]
                };
            };

            if (useCountriesService == "true") {
                // Create chart with data from country service
                var selectedCountryData = getCountrySelectionServiceData();
                if (!_.isEmpty(selectedCountryData.data.data)) {
                    visualizePie(selectedCountryData);
                }

                // Subscribe to be notified of country selection changes to update chart
                CountrySelectionService.subscribeSelectionChanges(scope, function() {
                    visualizePie(getCountrySelectionServiceData());
                });
            } else {
                //get the pie data from the server
                Data.getProjectVis("pie", scope.projectId, viewType, lang)
                    .then(visualizePie, visualizePieError);
            }
        }
    };
}]);