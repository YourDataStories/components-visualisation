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

                scope.data = {
                    news: [],
                    blogs: [],
                    tweets: []
                };

                Data.getRelatedItems(scope.projectId, "news").then(function(data) {
                    scope.data.news = data;
                });

                Data.getRelatedItems(scope.projectId, "blog").then(function(data) {
                    scope.data.blogs = data;
                });

                Data.getRelatedItems(scope.projectId, "tweet").then(function(data) {
                    scope.data.tweets = data;
                });
            }
        };
    }
]);
