angular.module('yds').directive('ydsLine', ['Data', function(Data){
    return {
        restrict: 'E',
        scope: {
            projectId: '@',
            embeddable: '@',
            embedBtnX: '@',
            embedBtnY: '@',
            popoverPos: '@',
            showNavigator: '@',
            exporting: '@',
            elementH: '@',
            titleSize: '@'
        },
        templateUrl: 'templates/line.html',
        link: function (scope, element, attrs) {
            scope.enableEmbed = false;  //flag that indicates if the embed functionality is enabled

            var lineContainer = angular.element(element[0].querySelector('.line-container'));

            //create a random id for the element that will render the chart
            var elementId = "line" + Data.createRandomId();
            lineContainer[0].id = elementId;

            var embeddable = scope.embeddable;
            var showNavigator = scope.showNavigator;
            var exporting = scope.exporting;
            var elementH = scope.elementH;
            var titleSize = scope.titleSize;

            //check if the user has enabled the embed functionality
            if (!angular.isUndefined(embeddable) && embeddable=="true")
                scope.enableEmbed = true;

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
            if(angular.isUndefined(titleSize) || isNaN(titleSize))
                titleSize = 18 ;

            //set the height of the chart
            lineContainer[0].style.height = elementH + 'px';

            Data.projectVisualization(scope.projectId,"line")
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
                        renderTo: elementId
                    },
                    rangeSelector : {
                        selected : 1
                    },
                    title : {
                        text : response.title,
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
                    series : [{
                        name : response.series,
                        data : response.data,
                        tooltip: {
                            valueDecimals: 2
                        }
                    }]
                };

                var chart = new Highcharts.StockChart(options);
            }, function (error) {
                console.log('error', error);
            });
        }
    };
}]);