angular.module("yds").directive("ydsRelatedItems", ["Data",
    function (Data) {
        return {
            restrict: "E",
            scope: {
                projectId: "@",     // ID of the project to display related items for
                period: "@",        // Set period of related items ("before", "during" or "after" the project)
                elementH: "@",      // Height of the component in pixels,
                totalItems: "="     // The related items component will set the total number of items to this value
            },
            templateUrl: Data.templatePath + "templates/social/related-items.html",
            link: function (scope, element) {
                var elementH = parseInt(scope.elementH);
                scope.totalItems = 0;
                scope.loading = false;
                var pageSize = 10;

                // Check if project ID is defined
                if (_.isUndefined(scope.projectId) || scope.projectId.trim() === "") {
                    scope.projectId = "none";
                }

                // Check if period is defined
                if (_.isUndefined(scope.period) || scope.period.trim() === "") {
                    scope.period = "during";
                }

                // Check if element height is defined
                if (_.isUndefined(elementH) || _.isNaN(elementH)) {
                    elementH = 150;
                }

                var relatedItemsContainer = angular.element(element[0].querySelector(".related-items-container"));
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
                        data: []                // Array with the tab"s data
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

                /**
                 * Add data to a tab and perform other necessary functions
                 * @param tab       Tab object
                 * @param response  Response with new data and total number of items
                 */
                var addData = function (tab, response) {
                    // Add data to the array and set the total items number
                    tab.data = tab.data.concat(response.data);
                    tab.total = response.total;

                    // If there are no more results, hide the "Load more" button
                    tab.hasMore = (tab.data.length < tab.total);

                    // Set loading to false
                    scope.loading = false;
                };

                // Get initial data for each tab
                _.each(scope.tabs, function (tab) {
                    Data.getRelatedItems(scope.projectId, tab.apiType, scope.period, 0, pageSize)
                        .then(function (response) {
                            scope.totalItems += response.total;
                            addData(tab, response);
                        });
                });

                /**
                 * Load more data for a tab.
                 * Finds the tab by using its name
                 * @param tabTitle  Title of the tab
                 */
                scope.loadMore = function (tabTitle) {
                    if (!scope.loading) {
                        scope.loading = true;

                        // Find the tab object by its name
                        var tab = _.findWhere(scope.tabs, {
                            title: tabTitle
                        });

                        Data.getRelatedItems(scope.projectId, tab.apiType, scope.period, tab.data.length, pageSize)
                            .then(function (response) {
                                addData(tab, response);
                            });
                    }
                }
            }
        };
    }
]);
