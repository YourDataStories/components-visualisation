angular.module('yds').directive('ydsScatter', ['Data', function (Data) {
    return {
        restrict: 'E',
        scope: {
            projectId: '@',     // Id of the project that the data belong
            viewType: '@',      // Name of the array that contains the visualised data
            lang: '@',          // Lang of the visualised data

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
        templateUrl: ((typeof Drupal != 'undefined') ? Drupal.settings.basePath + Drupal.settings.yds_project.modulePath + '/' : '') + 'templates/scatter.html',
        link: function (scope, element, attrs) {
            var scatterContainer = angular.element(element[0].querySelector('.scatter-container'));

            //create a random id for the element that will render the plot
            var elementId = "scatter" + Data.createRandomId();
            scatterContainer[0].id = elementId;

            var projectId = scope.projectId;
            var viewType = scope.viewType;
            var lang = scope.lang;
            var exporting = scope.exporting;
            var elementH = scope.elementH;
            var titleSize = scope.titleSize;

            //check if the projectId and the viewType attr is defined, else stop the process
            if (angular.isUndefined(projectId) || projectId.trim() == "") {
                scope.ydsAlert = "The YDS component is not properly configured." +
                    "Please check the corresponding documentation section.";
                return false;
            }

            //check if view-type attribute is empty and assign the default value
            if (_.isUndefined(viewType) || viewType.trim() == "")
                viewType = "default";

            //check if the language attr is defined, else assign default value
            if (angular.isUndefined(lang) || lang.trim() == "")
                lang = "en";

            //check if the exporting attr is defined, else assign default value
            if (angular.isUndefined(exporting) || (exporting != "true" && exporting != "false"))
                exporting = "true";

            //check if the component's height attr is defined, else assign default value
            if (angular.isUndefined(elementH) || isNaN(elementH))
                elementH = 200;

            //check if the component's title size attr is defined, else assign default value
            if (angular.isUndefined(titleSize) || titleSize.length == 0 || isNaN(titleSize))
                titleSize = 18;

            //set the height of the plot
            scatterContainer[0].style.height = elementH + 'px';

            Data.getProjectVis("scatter", projectId, viewType, lang)
                .then(function (response) {
                    var options = response.data;

                    // Set title size
                    options.title.style = {
                        fontSize: titleSize + "px"
                    };

                    // Set exporting options
                    options.exporting = {
                        buttons: {
                            contextButton: {
                                symbol: 'url(' + ((typeof Drupal != 'undefined') ? Drupal.settings.basePath + Drupal.settings.yds_project.modulePath + '/' : '') + 'img/fa-download-small.png)',
                                symbolX: 19,
                                symbolY: 19
                            }
                        },
                        enabled: (exporting === "true")
                    };

                    new Highcharts.Chart(elementId, options);
                }, function (error) {
                    if (error == null || _.isUndefined(error) || _.isUndefined(error.message))
                        scope.ydsAlert = "An error has occurred, please check the configuration of the component.";
                    else
                        scope.ydsAlert = error.message;
                });
        }
    };
}]);