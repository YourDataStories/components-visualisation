angular.module("yds").factory("Workbench", ["YDS_CONSTANTS", "$q", "$http", "Data",
    function (YDS_CONSTANTS, $q, $http, Data) {
        return {
            getWorkbenchVisualisation: function (viewType, xAxis, yAxis, basketIds, lang) {
                var deferred = $q.defer();

                $http({
                    method: "POST",
                    url: "http://" + YDS_CONSTANTS.API_INTERACTIVE_GENERIC,
                    headers: {"Content-Type": "application/x-www-form-urlencoded"},
                    data: {
                        lang: lang,
                        type: viewType,
                        basket_ids: basketIds,
                        axis_x: xAxis,
                        axis_y: yAxis
                    }
                }).then(function (response) {
                    deferred.resolve(response.data);
                }, function (error) {
                    deferred.reject(error);
                });

                return deferred.promise;
            },
            getAvailableVisualisations: function (lang, basketIds) {
                var deferred = $q.defer();

                // Call the service with POST method
                $http({
                    method: "POST",
                    url: "http://" + YDS_CONSTANTS.API_PLOT_INFO + "?lang=" + lang,
                    headers: {"Content-Type": "application/x-www-form-urlencoded"},
                    data: Data.transform(JSON.stringify(basketIds))
                }).then(function (response) {
                    deferred.resolve(response.data);
                }, function (error) {
                    deferred.reject(error);
                });

                return deferred.promise;
            }
        }
    }
]);
