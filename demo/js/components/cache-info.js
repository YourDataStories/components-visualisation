angular.module('yds').directive('ydsCacheInfo', ['Data', '$timeout', function(Data, $timeout){
    return {
        restrict: 'E',
        scope: {},
        templateUrl: ((typeof Drupal != 'undefined')? Drupal.settings.basePath  + Drupal.settings.yds_project.modulePath  +'/' :'') + 'templates/cache-info.html',
        link: function (scope, element, attrs) {
            scope.truncateCache = function(tableName) {
                Data.getCacheInfo(tableName)
                    .then(function(response) {
                        // Update cache info
                        updateCacheInfo();

                        // Show message that truncation was successful
                        if (tableName == "all") {
                            scope.msg = "All tables truncated successfully!";
                        } else {
                            scope.msg = "Table \"" + tableName + "\" truncated successfully!";
                        }

                        // Clear message after 4 seconds
                        $timeout(function () { scope.msg = ""; }, 4000);
                    }, function(error) {
                        console.error("Error when truncating cache: " + error);
                    });
            };

            var updateCacheInfo = function() {
                // Get cache info from the server to display on page
                Data.getCacheInfo()
                    .then(function(response) {
                        scope.tables = response.data;
                    }, function(error) {
                        console.error("Error when getting cache info: " + error);
                    });
            };

            // Get cache info when component loads
            updateCacheInfo();
        }
    };
}]);
