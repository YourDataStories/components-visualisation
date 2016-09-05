angular.module('yds').directive('ydsBar', ['Data', 'CountrySelectionService', function(Data, CountrySelectionService){
    return {
        restrict: 'E',
        scope: {
            projectId: '@',     //id of the project that the data belong
            viewType: '@',      //name of the array that contains the visualised data
            lang: '@',          //lang of the visualised data

            useYearRange: '@',  //use year range from CountrySelectionService for results, values: true, false

            titleX: '@',        //the text of the X-axis title
            titleY: '@',        //the text of the Y-axis title
            showLabelsX: '@',   //show or hide the X-axis label
            showLabelsY: '@',   //show or hide the Y-axis label
            showLegend: '@',    //enable or disable the chart's legend
            exporting: '@',     //enable or disable the export of the chart
            elementH: '@',      //set the height of the component
            titleSize: '@',     //the size of the chart's main title

            addToBasket: '@',   //enable or disable "add to basket" functionality, values: true, false
            basketBtnX: '@',    //x-axis position of the basket button
            basketBtnY: '@',    //y-axis position of the basket button

            embeddable: '@',    //enable or disabled the embedding of the component
            embedBtnX: '@',     //x-axis position of the embed button
            embedBtnY: '@',     //y-axis position of the embed button
            popoverPos: '@'     //the side of the embed button from which the embed information window will appear
        },
        templateUrl: ((typeof Drupal != 'undefined')? Drupal.settings.basePath  + Drupal.settings.yds_project.modulePath  +'/' :'') + 'templates/bar.html',
        link: function (scope, element, attrs) {
            var barContainer = angular.element(element[0].querySelector('.bar-container'));

            //create a random id for the element that will render the chart
            var elementId = "bar" + Data.createRandomId();
            barContainer[0].id = elementId;

            var projectId = scope.projectId;
            var viewType = scope.viewType;
            var lang = scope.lang;
            var useYearRange = scope.useYearRange;
            var titleX = scope.titleX;
            var titleY = scope.titleY;
            var showLabelsX = scope.showLabelsX;
            var showLabelsY = scope.showLabelsY;
            var showLegend = scope.showLegend;
            var exporting = scope.exporting;
            var elementH = scope.elementH;
            var titleSize = scope.titleSize;

            //check if the projectId and the viewType attr is defined, else stop the process
            if (useYearRange != "true" && (_.isUndefined(projectId) || projectId.trim()=="")) {
                scope.ydsAlert = "The YDS component is not properly configured. " +
                    "Please check the corresponding documentation section.";
                return false;
            }

            //check if view-type attribute is empty and assign the default value
            if(_.isUndefined(viewType) || viewType.trim()=="")
                viewType = "default";

            //check if the language attr is defined, else assign default value
            if(_.isUndefined(lang) || lang.trim()=="")
                lang = "en";

            //check if the useYearRange attr is defined, else assign default value
            if (_.isUndefined(useYearRange) || useYearRange.trim()=="")
                useYearRange = "false";

            //check if the x-axis title attr is defined, else assign the default value
            if(_.isUndefined(titleX) || titleX.length==0)
                titleX = "";

            //check if the y-axis title attr is defined, else assign the default value
            if(_.isUndefined(titleY) || titleY.length==0)
                titleY = "";

            //check if the x-axis showLabels attr is defined, else assign default value
            if(_.isUndefined(showLabelsX) || (showLabelsX!="true" && showLabelsX!="false"))
                showLabelsX = "true";

            //check if the y-axis showLabels attr is defined, else assign default value
            if(_.isUndefined(showLabelsY) || (showLabelsY!="true" && showLabelsY!="false"))
                showLabelsY = "true";

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
            barContainer[0].style.height = elementH + 'px';

            var chart = {};

            var visualizeBar = function (response) {
                var barData = response.data.data;
                var barCategories = response.data.categories;
                var barTitleAttr = _.first(response.view).attribute;
                var barTitle = Data.deepObjSearch(response.data, barTitleAttr);

                //check if the component is properly rendered
                if (_.isUndefined(barData) || !_.isArray(barData) || _.isUndefined(barCategories)) {
                    scope.ydsAlert = "The YDS component is not properly configured. " +
                        "Please check the corresponding documentation section.";
                    return false;
                }

                var options = {
                    chart: {
                        type: 'column',
                        renderTo: elementId
                    },
                    title: {
                        text: barTitle,
                        style: {
                            fontSize: titleSize + "px"
                        }
                    },
                    xAxis: {
                        categories: barCategories,
                        crosshair: true,
                        title : { text: titleX },
                        labels: { enabled: (showLabelsX === "true") }
                    },
                    yAxis: {
                        title : { text: titleY },
                        labels: { enabled: (showLabelsY === "true") }
                    },
                    legend: { enabled: (showLegend === "true") },
                    exporting: { enabled: (exporting === "true") },
                    tooltip: {
                        headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
                        pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
                        '<td style="padding:0"><b>{point.y:.0f}</b></td></tr>',
                        footerFormat: '</table>',
                        shared: true,
                        useHTML: true
                    },
                    plotOptions: {
                        column: {
                            pointPadding: 0.2,
                            borderWidth: 0
                        }
                    },
                    series: barData
                };

                if (useYearRange == "true" && !_.isEmpty(chart)) {
                    // Chart exists, update its data
                    if (_.isEmpty(barCategories)) {
                        // New data is empty, destroy the chart
                        chart.destroy();
                    } else {
                        // New data is not empty, update the bar chart
                        chart.xAxis[0].setCategories(barCategories);
                        chart.series[0].setData(barData[0].data);
                    }
                } else if (!_.isEmpty(barCategories)) {
                    // Chart is being created for the first time, create normally
                    chart = new Highcharts.Chart(options);
                }
            };

            var visualizeBarError = function (error) {
                if (_.isNull(error) || _.isUndefined(error) || _.isUndefined(error.message))
                    scope.ydsAlert = "An error has occurred, please check the configuration of the component";
                else
                    scope.ydsAlert = error.message;
            };

            /**
             * Gets the response from the server, keeps only the categories selected via the heatmap
             * and calls visualizeBar with the modified response
             * @param response
             */
            var filterResponse = function(response) {
                var newResponse = response;

                // Get selected countries from heatmap
                var selCountries = CountrySelectionService.getCountries();

                // Get categories, series data and name from the response
                var categories = response.data.categories;
                var data = response.data.data[0].data;
                var seriesName = response.data.data[0].name;

                var newCategories = [];
                var newData = [];

                // For each country (category) if it exists in selected countries, add it to the new data
                _.each(categories, function(category, index) {
                    _.each(selCountries, function(country) {
                        if (country.code == category) {
                            // Add to the new data
                            newCategories.push(category);
                            newData.push(data[index]);
                        }
                    });
                });

                // Add new data to response
                newResponse.data.categories = newCategories;
                newResponse.data.data = [{
                    name: seriesName,
                    data: newData
                }];

                // Visualize bar with modified response
                visualizeBar(newResponse);
            };

            /**
             * Gets the minimum and maximum selected years from the heatmap and if they are not null
             * gets data for that year range from the API, filters it and if any countries are selected
             * the visualization is created
             */
            var visualizeBarWithYearRange = function() {
                var minYear = CountrySelectionService.getMinYear();
                var maxYear = CountrySelectionService.getMaxYear();

                if (!_.isNull(minYear) && !_.isNull(maxYear)) {
                    Data.getProjectVisInYearRange("bar", projectId, viewType, minYear, maxYear, lang)
                        .then(filterResponse, visualizeBarError);
                }
            };

            if (useYearRange == "true") {
                // Create chart with year range
                visualizeBarWithYearRange();

                // Subscribe to be notified of year range changes to update chart
                CountrySelectionService.subscribeYearChanges(scope, visualizeBarWithYearRange);

                // Subscribe to be notified of country selection changes to update chart
                CountrySelectionService.subscribeSelectionChanges(scope, visualizeBarWithYearRange);
            } else {
                Data.getProjectVis("bar", projectId, viewType, lang)
                    .then(visualizeBar, visualizeBarError);
            }
        }
    };
}]);