angular.module('yds').directive('ydsResults', ['YDS_CONSTANTS', '$window', '$templateCache', '$location', '$compile', '$ocLazyLoad', 'Search',
    function(YDS_CONSTANTS, $window, $templateCache, $location, $compile, $ocLazyLoad, Search){
        
    return {
        restrict: 'E',
        scope: {
            lang:'@'
        },
        templateUrl:'templates/results.html',
        link: function(scope, element, attrs) {
            scope.results = [];
            var resultsContainer = angular.element(element[0].querySelector('.results-content'));

            //precompile the js templates for faster rendering
            _.templateSettings.variable = "rc";
            var compiledTemplates = {};
            
            $ocLazyLoad.load ({
                files: ['/templates/search/subsidy.html', '/templates/search/decision.html'],
                cache: true
            }).then(function() {
                compiledTemplates = {
                    Subsidy : _.template($templateCache.get("Subsidy.html")),
                    Project : _.template($templateCache.get("Subsidy.html")),
                    FinancialDecision : _.template($templateCache.get("FinancialDecision.html")),
                    NonFinancialDecision : _.template($templateCache.get("FinancialDecision.html")),
                    CommittedItem : _.template($templateCache.get("FinancialDecision.html"))
                };
            });


            //watch location hash change in order to perform search query
            scope.$watch(function () { return location.hash }, function (value) {
                var searchTerm = "";
                var urlComponents = [];

                //get the original search term from the url
                if(!angular.isUndefined(value)) {
                    urlComponents = value.split('q=');

                    if (!angular.isUndefined(urlComponents[1]))
                        searchTerm = decodeURIComponent(urlComponents[1]);
                }

                //if search term is empty, stop the execution
                if (searchTerm == "")
                    return false;

                //save the keyword and perform search
                Search.setKeyword(searchTerm);
                Search.performSearch(searchTerm)
                .then(function (response) {
                    scope.results = angular.copy(response.data.response.docs);

                    //iterate through the results and get the template based on the type of the result
                    _.each(scope.results, function(result, i) {
                        var templateData = {
                            attrHeaders: translations,
                            lang: scope.lang,
                            result: scope.results[i]
                        };

                        //fill the data of the template and append it to the result list
                        var content = compiledTemplates[result.type[0]](templateData);
                        resultsContainer.append(content);
                    });
                }, function (error) {
                    console.log('error', error);
                });
            });

            scope.$on("$destroy", function() {
                Search.clearKeyword();
            });
        },
        controller: function($scope) {
            $scope.resultsPreview = function (project, vizType) {
                // firing an event downwards from the parent scope
                $scope.$parent.$broadcast('previsualiseResult', {
                    projectId : project.attributes['project-id'],
                    projectTitle : project.attributes.title,
                    vizType : vizType
                });
            };

            $scope.visitResult = function(project) {
                debugger;
                var redirectURL = YDS_CONSTANTS.PROJECT_DETAILS_URL + '?id=' + project.attributes['project-id'];
                $window.location.href = redirectURL;
            }
        }
    };
}]);