angular.module('yds').directive('ydsScatter', ['Data', 'Filters', function(Data, Filters) {
    return {
        restrict: 'E',
        scope: {
            projectId: '@',     //id of the project that the data belong
            viewType: '@',      //name of the array that contains the visualised data
            lang: '@',          //lang of the visualised data

            showNavigator: '@', //enable or disable scatter plot's navigation
            exporting: '@',     //enable or disable the export of the plot
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
        templateUrl: ((typeof Drupal != 'undefined')? Drupal.settings.basePath  + Drupal.settings.yds_project.modulePath  +'/' :'') + 'templates/scatter.html',
        link: function (scope, element, attrs) {
            var scatterContainer = angular.element(element[0].querySelector('.scatter-container'));

            //create a random id for the element that will render the plot
            var elementId = "scatter" + Data.createRandomId();
            scatterContainer[0].id = elementId;

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
                elementH = 200;

            //check if the component's title size attr is defined, else assign default value
            if(angular.isUndefined(titleSize) || isNaN(titleSize))
                titleSize = 18;

            //set the height of the plot
            scatterContainer[0].style.height = elementH + 'px';

            Data.getProjectVis("scatter", projectId, viewType, lang)
                .then(function (response) {
                    var scatterData = response.data.data;
                    var scatterSeries = response.data.series;
                    var scatterTitleAttr = _.first(response.view).attribute;
                    var scatterTitle = Data.deepObjSearch(response.data, scatterTitleAttr);

                    //check if the component is properly rendered
                    if (_.isUndefined(scatterData) || !_.isArray(scatterData) || _.isUndefined(scatterSeries) || _.isUndefined(scatterTitle)) {
                        scope.ydsAlert = "The YDS component is not properly configured." +
                            "Please check the corresponding documentation section";
                        return false;
                    }

                    var options = {
                        chart: {
                            renderTo: elementId,
                            type: "scatter"
                        },
                        title: {
                            text: scatterTitle,
                            style: {
                                fontSize: titleSize + "px"
                            }
                        },
                        exporting: {
                            enabled: (exporting === "true")
                        },
                        navigator: {
                            enabled: (showNavigator === "true")
                        },
                        series: [{
                            name: scatterSeries,
                            data: scatterData,
                            tooltip: {
                                valueDecimals: 2
                            }
                        }]//,
                        // xAxis: {
                        //     type: 'datetime'
                        // }
                    };

                    new Highcharts.Chart(options);
                }, function (error) {
                    if (error==null || _.isUndefined(error) || _.isUndefined(error.message))
                        scope.ydsAlert = "An error was occurred, please check the configuration of the component";
                    else
                        scope.ydsAlert = error.message;
                });
        }
    };
}]);