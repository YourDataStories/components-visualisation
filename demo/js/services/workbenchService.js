angular.module('yds').factory('Workbench', [ 'YDS_CONSTANTS', '$q', '$http', 'Data',
	function (YDS_CONSTANTS, $q, $http, Data) {
		var slides = [{
			id:0,
			images : [ {
				src: "img/thumbnails/line_chart.png",
				name: "Line Chart",
				type: "linechart",
				visible: false
			}, {
				src: "img/thumbnails/bar_chart.png",
				name: "Grid",
				type: "grid",
				visible: false
			}, {
				src: "img/thumbnails/pie_chart.png",
				name: "Pie Chart",
				type: "pie",
				visible: false
			}]
		}
		];

		return {
			generateLinechart: function(viewType, xAxis, yAxis, basketIds) {
				var deferred = $q.defer();

				//call the service with POST method
				$http({
					method: 'POST',
					url: "http://"+ YDS_CONSTANTS.API_INTERACTIVE_LINE + "?type=" + viewType + "&axis-x=" + xAxis + "&axis-y=" + yAxis,
					headers: {'Content-Type': 'application/x-www-form-urlencoded'},
					data: Data.transform(JSON.stringify(basketIds))
				}).success(function (data) {
					deferred.resolve(data);
				}).error(function (error) {
					deferred.reject(error);
				});

				return deferred.promise;
			}, getAvailableVisualisations: function(lang, basketIds) {
				var deferred = $q.defer();

				//call the service with POST method
				$http({
					method: 'POST',
					url: "http://"+ YDS_CONSTANTS.API_PLOT_INFO + "?lang=" + lang ,
					headers: {'Content-Type': 'application/x-www-form-urlencoded'},
					data: Data.transform(JSON.stringify(basketIds))
				}).success(function (data) {
					deferred.resolve(data);
				}).error(function (error) {
					deferred.reject(error);
				});

				return deferred.promise;
			},
			getSlides : function() { return slides; },
			checkVisAvailability: function (slideId, visType) {
				return _.findWhere(slides[slideId].images, {type: visType}).visible;
			}
		}
	}]);