angular.module('yds').directive('ydsRelatedItems', ['Data',
    function (Data) {
        return {
            restrict: 'E',
            scope: {
                projectId:'@',  // ID of the project to display related items for
                elementH:'@'    // Height of the component in pixels
            },
            templateUrl: ((typeof Drupal != 'undefined')? Drupal.settings.basePath  + Drupal.settings.yds_project.modulePath  +'/' :'') + 'templates/related-items.html',
            link: function (scope, element) {
                var elementH = parseInt(scope.elementH);
                scope.loading = false;

                // Check if project ID is defined
                if (_.isUndefined(scope.projectId) || scope.projectId.trim() == "") {
                    scope.projectId = "none";
                }

                // Check if element height is defined
                if (_.isUndefined(elementH) || _.isNaN(elementH)) {
                    elementH = 150;
                }

                var relatedItemsContainer = angular.element(element[0].querySelector('.related-items-container'));
                relatedItemsContainer[0].style.height = elementH + "px";

                scope.listContainerStyle = {
                    height: (elementH - 42) + "px"
                };

                // Set data about the tabs
                scope.tabs = {
                    news: {
                        title: "News",          // Title of the tab (should be unique)
                        viewType: "news",       // Type of the tab, defines how it is shown in the template
                        apiType: "news",        // Type of items that the tab will show from the API
                        icon: "fa-newspaper-o", // FontAwesome icon for the tab heading
                        data: []                // Array with the tab's data
                    },
                    blogs: {
                        title: "Blog posts",
                        viewType: "news",
                        apiType: "blog",
                        icon: "fa-rss",
                        data: []
                    },
                    tweets: {
                        title: "Tweets",
                        viewType: "tweet",
                        apiType: "tweet",
                        icon: "fa-twitter",
                        data: []
                    }
                };

                // Get initial data for each tab
                _.each(scope.tabs, function(tab) {
                    Data.getRelatedItems(scope.projectId, tab.apiType, 0).then(function(data) {
                        tab.data = data;
                    });
                });

                /**
                 * Load more data for a tab.
                 * Finds the tab by using its name
                 * @param tabTitle  Title of the tab
                 */
                scope.loadMore = function(tabTitle) {
                    if (!scope.loading) {
                        scope.loading = true;

                        // Find the tab object by its name
                        var tab = _.findWhere(scope.tabs, {
                            title: tabTitle
                        });

                        var start = tab.data.length;
                        Data.getRelatedItems(scope.projectId, tab.apiType, start).then(function(data) {
                            // Add new items to the tab
                            _.each(data, function(item) {
                                tab.data.push(item);
                            });

                            // Set loading to false
                            scope.loading = false;
                        });
                    }
                }
            }
        };
    }
]);
