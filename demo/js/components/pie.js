angular.module('yds').directive('ydsPie', ['Data', function(Data){
    return {
        restrict: 'E',
        scope: {
            projectId: '@',     //id of the project that the data belong
            viewType: '@',     //name of the array that contains the visualised data
            lang: '@',          //lang of the visualised data

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
        templateUrl: 'templates/pie.html',
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

            //check if the projectId is defined, else stop the process
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

            //check if the showLegend attr is defined, else assign default value
            if(angular.isUndefined(showLegend) || (showLegend!="true" && showLegend!="false"))
                showLegend = "true";

            //check if the exporting attr is defined, else assign default value
            if(angular.isUndefined(exporting) || (exporting!="true" && exporting!="false"))
                exporting = "true";

            //check if the component's height attr is defined, else assign default value
            if(angular.isUndefined(elementH) || isNaN(elementH))
                elementH = 200 ;

            //check if the component's title size attr is defined, else assign default value
            if(angular.isUndefined(titleSize) || isNaN(titleSize))
                titleSize = 18 ;

            //set the height of the chart
            pieContainer[0].style.height = elementH + 'px';

            //get the pie data from the server
            Data.getPie(scope.projectId, viewType, lang)
            .then(function (response) {
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
                        pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
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
                            cursor: 'pointer',
                            dataLabels: {
                                enabled: false
                            },
                            showInLegend: true
                        }
                    },
                    series: [{
                        name: pieSeries,
                        colorByPoint: true,
                        data: pieData
                    }]
                };

                var chart = new Highcharts.Chart(options);
            }, function (error) {
                if (error==null || _.isUndefined(error) || _.isUndefined(error.message))
                    scope.ydsAlert = "An error was occurred, please check the configuration of the component";
                else
                    scope.ydsAlert = error.message;
            });
        }
    };
}]);