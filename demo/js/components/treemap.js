angular.module('yds').directive('ydsTreeMap', ['Data', 'Filters', function(Data, Filters) {
    return {
        restrict: 'E',
        scope: {
            projectId: '@',     // ID of the project that the data belong
            viewType: '@',      // Name of the array that contains the visualised data
            lang: '@',          // Lang of the visualised data

            extraParams: '=',   // Extra attributes to pass to the API, if needed

            exporting: '@',     // Enable or disable the export of the plot
            elementH: '@',      // Set the height of the component
            titleSize: '@',     // The size of the chart's main title

            addToBasket: '@',   // Enable or disable "add to basket" functionality, values: true, false
            basketBtnX: '@',    // X-axis position of the basket button
            basketBtnY: '@',    // Y-axis position of the basket button

            embeddable: '@',    // Enable or disable the embedding of the component
            embedBtnX: '@',     // X-axis position of the embed button
            embedBtnY: '@',     // Y-axis position of the embed button
            popoverPos: '@',    // The side of the embed button from which the embed information window will appear

            enableRating: '@'   // Enable rating buttons for this component
        },
        templateUrl: ((typeof Drupal != 'undefined')? Drupal.settings.basePath  + Drupal.settings.yds_project.modulePath  +'/' :'') + 'templates/treemap.html',
        link: function (scope, element, attrs) {
            var treemapContainer = angular.element(element[0].querySelector('.treemap-container'));

            //create a random id for the element that will render the plot
            var elementId = "treemap" + Data.createRandomId();
            treemapContainer[0].id = elementId;

            var projectId = scope.projectId;
            var viewType = scope.viewType;
            var lang = scope.lang;
            var exporting = scope.exporting;
            var elementH = scope.elementH;
            var titleSize = scope.titleSize;
            var extraParams = scope.extraParams;

            // If extra params exist, add them to Filters
            if (!_.isUndefined(extraParams) && !_.isEmpty(extraParams)) {
                Filters.addExtraParamsFilter(elementId, extraParams);
            }

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
            if(_.isUndefined(lang) || lang.trim()=="")
                lang = "en";

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

            //set the height of the plot
            treemapContainer[0].style.height = elementH + 'px';

            Data.getProjectVis("treemap", projectId, viewType, lang, extraParams)
                .then(function (response) {
                    // Check that the component has not been destroyed
                    if (scope.$$destroyed)
                        return;

                    var series = response.data;
                    var chartTitle = response.data.title;
                    chartTitle.style = {
                        fontSize: titleSize + "px"
                    };

                    // Check if the component is properly rendered
                    if (_.isUndefined(series) || !_.isArray(series.data) || _.isUndefined(series)) {
                        scope.ydsAlert = "The YDS component is not properly configured." +
                            "Please check the corresponding documentation section";
                        return false;
                    }

                    var options = {
                        chart: {
                            renderTo: elementId
                        },
                        title: chartTitle,
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
                        series: [
                            series
                        ]
                    };

                    new Highcharts.Chart(options);

                    // Remove loading animation
                    scope.loading = false;
                }, function (error) {
                    if (error==null || _.isUndefined(error) || _.isUndefined(error.message))
                        scope.ydsAlert = "An error was occurred, please check the configuration of the component";
                    else
                        scope.ydsAlert = error.message;

                    // Remove loading animation
                    scope.loading = false;
                });
        }
    };
}]);