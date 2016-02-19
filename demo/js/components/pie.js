angular.module('yds').directive('ydsPie', ['Data', function(Data){
    return {
        restrict: 'E',
        scope: {
            projectId: '@',
            embeddable: '@',
            embedBtnX: '@',
            embedBtnY: '@',
            popoverPos: '@',
            showLegend: '@',
            exporting: '@',
            elementH: '@',
            titleSize: '@'
        },
        templateUrl: 'templates/pie.html',
        link: function (scope, element, attrs) {
            scope.enableEmbed = false;  //flag that indicates if the embed functionality is enabled

            var pieContainer = angular.element(element[0].querySelector('.pie-container'));

            //create a random id for the element that will render the chart
            var elementId = "pie" + Data.createRandomId();
            pieContainer[0].id = elementId;

            var embeddable = scope.embeddable;
            var showLegend = scope.showLegend;
            var exporting = scope.exporting;
            var elementH = scope.elementH;
            var titleSize = scope.titleSize;

            //check if the user has enabled the embed functionality
            if (!angular.isUndefined(embeddable) && embeddable=="true")
                scope.enableEmbed = true;

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
            Data.projectVisualization(scope.projectId,"pie")
            .then(function (response) {
                //check if the component is properly rendered
                if (angular.isUndefined(response.data) || !_.isArray(response.data) ||
                    angular.isUndefined(response.title) || angular.isUndefined(response.series)) {

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
                        text: response.title,
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
                        name: response.series,
                        colorByPoint: true,
                        data: response.data
                    }]
                };

                var chart = new Highcharts.Chart(options);
            }, function (error) {
                console.log('error', error);
            });
        }
    };
}]);