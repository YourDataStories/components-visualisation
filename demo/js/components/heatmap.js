angular.module('yds').directive('ydsHeatmap', ['Data', '$ocLazyLoad', function (Data, $ocLazyLoad) {
	return {
		restrict: 'E',
		scope: {
			projectId: '@',     //id of the project that the data belong
			viewType: '@',      //name of the array that contains the visualised data
			lang: '@',			//lang of the visualised data
            colorAxis: '@',     //enable or disable colored axis of chart
            legend: '@',        //enable or disable chart legend
            legendVAlign: '@',  //vertical alignment of the chart legend (top, middle, bottom)
            legendHAlign: '@',  //horizontal alignment of the chart legend (left, center, right)
            legendLayout: '@',  //layout of the chart legend (vertical, horizontal)
			exporting: '@',     //enable or disable the export of the chart
			elementH: '@'		//set the height of the component
		},
		templateUrl: ((typeof Drupal != 'undefined')? Drupal.settings.basePath  + Drupal.settings.yds_project.modulePath  +'/' :'') + 'templates/heatmap.html',
		link: function (scope, elem, attrs) {
			var projectId = scope.projectId;
			var viewType = scope.viewType;
			var lang = scope.lang;
            var colorAxis = scope.colorAxis;
            var legend = scope.legend;
            var legendVAlign = scope.legendVAlign;
            var legendHAlign = scope.legendHAlign;
            var legendLayout = scope.legendLayout;
			var exporting = scope.exporting;
			var elementH = scope.elementH;

			var heatmapContainer = angular.element(elem[0].querySelector('.heatmap-container'));

			//create a random id for the element that will render the chart
			var elementId = "heatmap" + Data.createRandomId();
			heatmapContainer[0].id = elementId;

			//check if project id or grid type are defined
			if(angular.isUndefined(projectId) || projectId.trim()=="") {
				scope.ydsAlert = "The YDS component is not properly initialized " +
					"because the projectId attribute isn't configured properly." +
					"Please check the corresponding documentation section";
				return false;
			}

			//check if view-type attribute is empty and assign the default value
			if(_.isUndefined(viewType) || viewType.trim()=="")
				viewType = "default";

			//check if the language attr is defined, else assign default value
			if(angular.isUndefined(lang) || lang.trim()=="")
				lang = "en";

            //check if colorAxis attr is defined, else assign default value
            if (_.isUndefined(colorAxis) || colorAxis.trim()=="")
                colorAxis = "false";

            //check if legend attr is defined, else assign default value
            if (_.isUndefined(legend) || legend.trim()=="")
                legend = "false";

            //check if legendVAlign attr is defined, else assign default value
            if (_.isUndefined(legendVAlign) || legendVAlign.trim()=="")
                legendVAlign = "top";

            //check if legendVAlign attr is defined, else assign default value
            if (_.isUndefined(legendHAlign) || legendHAlign.trim()=="")
                legendHAlign = "center";

            //check if legendLayout attr is defined, else assign default value
            if (_.isUndefined(legendLayout) || legendLayout.trim()=="")
                legendLayout = "horizontal";

			//check if the exporting attr is defined, else assign default value
			if(angular.isUndefined(exporting) || (exporting!="true" && exporting!="false"))
				exporting = "true";

			//check if the component's height attr is defined, else assign default value
			if(angular.isUndefined(elementH) || isNaN(elementH))
				elementH = 300;

			//set the height of the chart
			heatmapContainer[0].style.height = elementH + 'px';
			$ocLazyLoad.load ({
				files: ['https://code.highcharts.com/mapdata/custom/world.js'],
				cache: true
			}).then(function() {
				createHeatmap();
			});

			//function to fetch data and render the heatmap component
			var createHeatmap = function() {
				Data.getProjectVis("heatmap", projectId, viewType, lang)
				.then(function(response) {
					var heatmapOptions = {
						chart : {
							renderTo: elementId,
							borderWidth : 1
						},
						title : { text : '' },
						mapNavigation: { 
							enabled: true,
							buttonOptions: {
								style: {display: 'none'}
							}
						},
						legend: { enabled: false },
						exporting: { enabled: (exporting === "true") },
						series: [{
							name: 'Country',
							mapData: Highcharts.maps['custom/world'],
							data: response.data,
							mapZoom: 2,
							joinBy: ['iso-a2', 'code'],
							dataLabels: {
								enabled: true,
								color: '#FFFFFF',
								formatter: function () {
									if (this.point.value) {
										return this.point.name;
									}
								}
							},
							tooltip: {
								headerFormat: '',
								pointFormat: '{point.name}'
							}
						}]
					};

					// Add color axis
					if (colorAxis == "true") {
                        heatmapOptions.colorAxis = {
                            min: 1,
                            type: 'linear',
                            minColor: '#EEEEFF',
                            maxColor: '#000022',
                            stops: [
                                [0, '#EFEFFF'],
                                [0.5, '#4444FF'],
                                [1, '#000022']
                            ]
                        };
                    }

                    // Add chart legend
                    if (legend == "true") {
                        heatmapOptions.legend = {
                            layout: legendLayout,
                            borderWidth: 0,
                            backgroundColor: 'rgba(255,255,255,0.85)',
                            floating: true,
                            verticalAlign: legendVAlign,
                            align: legendHAlign
                        }
                    }

					new Highcharts.Map(heatmapOptions);
				}, function(error){
					if (error==null || _.isUndefined(error) || _.isUndefined(error.message))
						scope.ydsAlert = "An error was occurred, please check the configuration of the component";
					else
						scope.ydsAlert = error.message;
				});
			}
		}
	}
}]);