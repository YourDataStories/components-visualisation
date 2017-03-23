angular.module('yds').directive('ydsBasketPreview', ['Data', '$compile', '$timeout', 'Basket', 'DashboardService',
    function (Data, $compile, $timeout, Basket, DashboardService) {
        return {
            restrict: 'E',
            scope: {
                userId: '@'
            },
            replace: true,
            templateUrl: ((typeof Drupal != 'undefined') ? Drupal.settings.basePath + Drupal.settings.yds_project.modulePath + '/' : '') + 'templates/basket-preview.html',
            link: function (scope, element) {
                scope.basketType = "Dataset";
                scope.results = [];
                scope.searchText = "";

                var prevElement = angular.element(element[0]);

                scope.changeBasketView = function (bskType) {
                    scope.basketType = bskType;
                    scope.getBasketItem(bskType);
                };

                var showSidebar = function () {
                    $timeout(function () {
                        if (!prevElement.hasClass('slide-in') && !prevElement.hasClass('slide-out')) {
                            prevElement.addClass('slide-in');
                        } else if (prevElement.hasClass('slide-out')) {
                            prevElement.addClass('slide-in');
                            prevElement.toggleClass('slide-out');
                        }
                    }, 200);
                };

                scope.toggleVisibility = function () {
                    if (prevElement.hasClass('slide-in')) {
                        prevElement.addClass('slide-out');
                        prevElement.toggleClass('slide-in');
                    } else if (prevElement.hasClass('slide-out')) {
                        prevElement.addClass('slide-in');
                        prevElement.toggleClass('slide-out');
                    } else
                        prevElement.addClass('slide-in');
                };


                //function to retrieve the basket items of the user
                scope.getBasketItem = function (type) {
                    Basket.getBasketItems(scope.userId, type)
                        .then(function (response) {
                            scope.results = angular.copy(response.items);
                        }, function (error) {
                            console.log('error', error);
                        });
                };

                //function to delete the basket items from user's basket
                scope.deleteBasketItem = function (bskId) {
                    Basket.deleteBasketItems(scope.userId, bskId).then(function (response) {
                        scope.getBasketItem(scope.basketType);
                    }, function (error) {
                        console.log('error', error);
                    });
                };

                //custom filter for searching in basket tags or title
                scope.customBasketFilter = function (term) {
                    return function (item) {
                        if (item.title.toLowerCase().indexOf(term.toLowerCase()) > -1 ||
                            (_.has(item, "tags") && item.tags.join().toLowerCase().indexOf(term.toLowerCase()) > -1)) {
                            return item;
                        }
                    };
                };

                /**
                 * Restore the parameters for a specified Dashboard using the DashboardService
                 * @param dashboard
                 * @param parameters
                 */
                scope.restoreFilters = function (dashboard, parameters) {
                    DashboardService.restoreCookies(dashboard, parameters);
                };

                //function to update basket items after a new one has been inserted
                var updateBasketItems = function () {
                    var lastBskItem = Basket.getLastSavedItem();

                    if (scope.basketType.toLowerCase() == lastBskItem.type.toLowerCase()) {
                        scope.getBasketItem(scope.basketType);
                    }
                };

                scope.getBasketItem(scope.basketType);
                Basket.registerCallback(updateBasketItems);
                Basket.setUserId(scope.userId);
            }
        };
    }]);