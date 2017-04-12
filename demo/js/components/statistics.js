angular.module('yds').directive('ydsStatistics', ['Data', '$interval', function (Data, $interval) {
    return {
        restrict: 'E',
        templateUrl: ((typeof Drupal != 'undefined') ? Drupal.settings.basePath + Drupal.settings.yds_project.modulePath + '/' : '') + 'templates/statistics.html',
        link: function (scope) {
            scope.statistics = {
                initialized: false,
                maxIterations: 62,
                iterations: 0,
                stats: {},
                statsLimit: {}
            };

            /**
             * Update the stats counters
             */
            var updateStatistics = function () {
                if (scope.statistics.iterations === scope.statistics.maxIterations - 1) {
                    // It's the last iteration, make sure values are correct
                    scope.statistics.stats = scope.statistics.statsLimit;
                    return;
                }

                _.each(scope.statistics.stats, function (value, key) {
                    var currValue = scope.statistics.stats[key];
                    var maxValue = scope.statistics.statsLimit[key];

                    // Calculate next value, with minimum step of 1
                    var newValue = currValue + _.max([1, Math.floor(maxValue / 60)]);

                    if (newValue <= maxValue) {
                        // New value is valid, set it
                        scope.statistics.stats[key] = newValue;
                    } else {
                        // New value exceeds maximum, set the statistic to its max value
                        scope.statistics.stats[key] = maxValue;
                    }
                });

                scope.statistics.iterations++;
            };

            // Fetch the statistics from the server
            Data.getYdsStatistics()
                .then(function (response) {
                    // Copy the statistics in a new variable
                    scope.statistics.statsLimit = angular.copy(response.data);

                    // Initialize the counter of each statistic
                    _.each(response.data, function (value, key) {
                        scope.statistics.stats[key] = 0;
                    });

                    // Register interval to run every 15ms
                    scope.statistics.initialized = true;
                    $interval(updateStatistics, 16, scope.statistics.maxIterations);
                }, function (error) {
                    console.log(error.message);
                });
        }
    };
}]);
