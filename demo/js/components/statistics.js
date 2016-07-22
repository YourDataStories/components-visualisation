angular.module('yds').directive('ydsStatistics', ['Data', '$interval', function(Data, $interval){
	return {
		restrict: 'E',
		templateUrl: ((typeof Drupal != 'undefined')? Drupal.settings.basePath  + Drupal.settings.yds_project.modulePath  +'/' :'') + 'templates/statistics.html',
		link: function (scope) {
			scope.statistics = {
				initialized: false,
				maxIterations: 0,
				stats: {},
				statsLimit: {}
			};

			//function to update the stats counters
			var updateStatistics = function() {
				_.each(scope.statistics.stats, function(value, key) {
					if (scope.statistics.stats[key] < scope.statistics.statsLimit[key])
						scope.statistics.stats[key]++;
				});
			};

			//fetch the statistics from the server
			Data.getYdsStatistics()
			.then(function(response){
				//copy the statistics in a new variable and find the max number of iterations required
				scope.statistics.statsLimit = angular.copy(response.data);
				scope.statistics.maxIterations = _.max(_.values(response.data));

				//initialize the counter of each statistic
				_.each(response.data, function(value, key){
					scope.statistics.stats[key] = 0;
				});

				//register interval to run every 15ms
				scope.statistics.initialized = true;
				$interval(updateStatistics, 15, scope.statistics.maxIterations);
			}, function(error){
				console.log(error.message);
			});
		}
	};
}]);