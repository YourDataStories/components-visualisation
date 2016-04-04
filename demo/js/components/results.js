angular.module('yds').directive('ydsResults', ['YDS_CONSTANTS', '$window', '$templateCache', '$location', '$compile', '$ocLazyLoad', 'Search',
    function(YDS_CONSTANTS, $window, $templateCache, $location, $compile, $ocLazyLoad, Search){
        
    return {
        restrict: 'E',
        scope: {
            lang:'@'
        },
        templateUrl:'templates/results.html',
        link: function(scope, element, attrs) {
            var resultsContainer = angular.element(element[0].querySelector('.results-content'));
            var compiledTemplates = {};
            scope.showNoResultsMsg = false;
            scope.results = [];
            scope.pagination = {
                hidden: true,
                total: 0,
                perPage: 2,
                current: 1,
                show: function() {
                    if (scope.pagination.hidden)
                        scope.pagination.hidden = false;
                },
                hide: function() {
                    if (!scope.pagination.hidden)
                        scope.pagination.hidden = true;

                    scope.showNoResultsMsg = true;
                },
                getCurrent: function() { return (scope.pagination.current - 1)*2; },
                setCurrent: function(pageNum) { scope.pagination.current = pageNum; },
                setTotal: function(resultsCount) { scope.pagination.total = resultsCount; }
            };
            
            //function to prepare the templates used in search results 
            var prepareTemplates = function(){
                //precompile the js templates for faster rendering
                _.templateSettings.variable = "rc";
                
                $ocLazyLoad.load ({
                    files: ['templates/search/subsidy.html', 'templates/search/decision.html'],
                    cache: true
                }).then(function() {
                    compiledTemplates = {
                        Subsidy : _.template($templateCache.get("Subsidy.html")),
                        Project : _.template($templateCache.get("Subsidy.html")),
                        Decision : _.template($templateCache.get("FinancialDecision.html")),
                        FinancialDecision : _.template($templateCache.get("FinancialDecision.html")),
                        NonFinancialDecision : _.template($templateCache.get("FinancialDecision.html")),
                        CommittedItem : _.template($templateCache.get("FinancialDecision.html"))
                    };
                });
            };

            var performSearch = function(searchTerm, pageLimit, pageNumber) {
                //save the keyword and perform search
                Search.setKeyword(searchTerm);
                scope.pagination.setCurrent(pageNumber);

               // Search.performSearch(searchTerm, pageLimit, scope.pagination.getCurrent())
                Search.performSearch(searchTerm, 2, scope.pagination.getCurrent())
                .then(function (response) {
                    var resultsCount = response.data.response.numFound;
                    scope.results = angular.copy(response.data.response.docs);

                    //clear the existing results
                    resultsContainer[0].innerHTML = "";

                    //check if the length of the results is greater than 0, and handle pagination
                    if (resultsCount>0) {
                        scope.pagination.setTotal(resultsCount);
                        scope.pagination.show();
                    } else {
                        scope.pagination.hide();
                        return false;
                    }

                    //iterate through the results and get the template based on the type of the result
                    _.each(scope.results, function(result, i) {
                        var templateData = {
                            attrHeaders: translations,
                            lang: scope.lang,
                            result: scope.results[i]
                        };

                        //fill the data of the template and append it to the result list
                        var content = compiledTemplates[_.first(result.type)](templateData);
                        resultsContainer.append(content);
                    });
                }, function (error) {
                    scope.pagination.hide();
                    console.log('error', error);
                });
            };

            //function to handle the clicks of the pagination element
            scope.changePage = function () {
                var newPage = scope.pagination.current;
                var keyword = Search.getKeyword();

                performSearch(keyword, 10, newPage);
                $window.scrollTo(0, 0);
            };

            
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

                performSearch(searchTerm, 10, 1);
            });

            scope.$on("$destroy", function() {
                Search.clearKeyword();
            });
            
            prepareTemplates();
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