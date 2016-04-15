angular.module('yds').directive('ydsHeatmap', ['Data', '$ocLazyLoad', function (Data, $ocLazyLoad) {
	return {
		restrict: 'E',
		scope: {
			projectId: '@',     //id of the project that the data belong
			viewType: '@',      //name of the array that contains the visualised data
			lang: '@',			//lang of the visualised data
			elementH: '@'		//set the height of the component
		},
		templateUrl: 'templates/heatmap.html',
		link: function (scope, elem, attrs) {
			var projectId = scope.projectId;
			var viewType = scope.viewType;
			var lang = scope.lang;
			var elementH = scope.elementH;

			var heatmapContainer = angular.element(elem[0].querySelector('.heatmap-container'));

			//create a random id for the element that will render the chart
			var elementId = "heatmap" + Data.createRandomId();
			heatmapContainer[0].id = elementId;

			//check if project id or grid type are defined
			if(angular.isUndefined(projectId) || projectId.trim()=="") {
				scope.ydsAlert = "The YDS component is not properly initialized " +
					"because the projectId or the viewType attribute aren't configured properly." +
					"Please check the corresponding documentation sertion";
				return false;
			}

			//check if view-type attribute is empty and assign the default value
			if(_.isUndefined(viewType) || viewType.trim()=="")
				viewType = "default";

			//check if the language attr is defined, else assign default value
			if(angular.isUndefined(lang) || lang.trim()=="")
				lang = "en";

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
				Data.getHeatmap(projectId, viewType, lang)
				.then(function(response) {
					var heatmapOptions = {
						chart : {
							renderTo: elementId,
							borderWidth : 1
						},
						title : { text : '' },
						mapNavigation: { enabled: true },
						legend: { enabled: false },
						series : [{
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