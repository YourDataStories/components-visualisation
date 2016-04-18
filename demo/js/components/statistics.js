angular.module('yds').directive('ydsStatistics', ['Data', '$interval', '$timeout', function(Data, $interval, $timeout){
	return {
		restrict: 'E',
		scope: {
			projectId: '@'
		},
		templateUrl: 'templates/statistics.html',
		link: function (scope, element, attrs) {
			var intervalIterations=0;
			scope.statCounter = 0;
			scope.statsLimit = {};
			scope.stats = {
				datasets: 0,
				locations: 0,
				sources: 0
			};

			var updateStatistics = function() {
				angular.forEach(scope.stats, function(value, key) {
					if (scope.stats[key] < scope.statsLimit[key])
						scope.stats[key]++;
					else
						scope.statCounter++;
				});
			};

			//TODO replace with the object received from server
			scope.statsLimit = angular.copy({
				datasets: 62,
				locations: 58,
				sources: 110
			});

			angular.forEach(scope.statsLimit, function(value, key) {
				scope.statCounter++;

				if (value>intervalIterations)		//find the greatest value of the object returned from the server
					intervalIterations=value;
			});

			$interval(updateStatistics, 30, intervalIterations);
		}
	};
}]);