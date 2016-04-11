angular.module('yds').directive('ydsResults', ['YDS_CONSTANTS', '$window', '$templateCache', '$location','$compile', '$ocLazyLoad', 'Search',
    'Basket', 'Translations', 'Data', function(YDS_CONSTANTS, $window, $templateCache, $location, $compile, $ocLazyLoad, Search, Basket, Translations, Data){
    return {
        restrict: 'E',
        scope: {
            lang:'@',
            userId:'@'
        },
        templateUrl:'templates/results.html',
        link: function(scope, element, attrs) {
            var resultsContainer = angular.element(element[0].querySelector('.results-content'));
            var compiledTemplates = {};

            scope.basketEnabled = false;
            scope.showNoResultsMsg = false;
            scope.translations = {};

            //check if the language attr is defined, else assign default value
            if(angular.isUndefined(scope.lang) || scope.lang.trim()=="")
                scope.lang = "en";
            
            if (!_.isUndefined(scope.userId) && scope.userId.trim()!="") {
                scope.basketEnabled = true;
            }

            //configure pagination options
            scope.pagination = {
                hidden: true,
                total: 0,
                maxSize: 5,
                perPage: 10,
                current: 1,
                firstText: Translations.get(scope.lang, "paginationFirstText"),
                lastText: Translations.get(scope.lang, "paginationLastText"),
                nextText: Translations.get(scope.lang, "paginationNextText"),
                previousText: Translations.get(scope.lang, "paginationPreviousText"),

                show: function() {
                    if (scope.pagination.hidden)
                        scope.pagination.hidden = false;

                    scope.showNoResultsMsg = false;
                },
                hide: function() {
                    if (!scope.pagination.hidden)
                        scope.pagination.hidden = true;

                    scope.showNoResultsMsg = true;
                },
                getCurrent: function() { return (scope.pagination.current - 1)*10; },
                setCurrent: function(pageNum) { scope.pagination.current = pageNum; },
                setTotal: function(resultsCount) { scope.pagination.total = resultsCount; }
            };

            //function to prepare the templates used in search results 
            var prepareTemplates = function(){
                //precompile the js templates for faster rendering
                _.templateSettings.variable = "rc";
                scope.translations = Translations.getAll(scope.lang);

                $ocLazyLoad.load ({
                    files: ['templates/search-result.html'],
                    cache: true
                }).then(function() {
                    compiledTemplates = {
                        SearchResult : _.template($templateCache.get("search-result.html"))
                    };
                });
            };

            var formatResults = function(results, resultsView, resultsViewNames) {
                var formattedResults = [];
                //iterate through the results and format its data
                _.each(results, function(result) {
                    //iterate through the types of the result
                    for (var j=0; j<result.type.length; j++) {
                        var viewName = result.type[j];

                        //search if the type of the result exists inside the available views
                        if (_.contains(resultsViewNames, viewName)) {
                            //create an object for each result
                            var formattedResult = {
                                _hidden: true,
                                id: result.id,
                                type: result.type,
                                rows: []
                            };

                            //get the contents of the result view
                            var resultView = _.find(resultsView, function (view) { return viewName in view })[viewName];

                            //iterate inside the view of the result in order to acquire the required data for each result
                            _.each(resultView, function(view){
                                var resultRow = {};
                                resultRow.header = view.header;
                                resultRow.type = view.type;
                                resultRow.value = result[view.attribute];

                                //if the value of a result doesn't exist
                                if (_.isUndefined(resultRow.value) || String(resultRow.value).trim().length==0) {
                                    //extract the last 3 characters of the specific attribute of the result
                                    var last3chars = view.attribute.substr(view.attribute.length-3);

                                    //if it is internationalized
                                    if (last3chars == ("." + scope.lang)) {
                                        //search if the attribute exists without the internationalization
                                        var attributeTokens = view.attribute.split(".");
                                        var nonInternationalizedAttr = _.first(attributeTokens, attributeTokens.length-1).join(".");
                                        resultRow.value = result [nonInternationalizedAttr];
                                    }
                                }

                                //if the value is not available assign an empty string, 
                                // else check if it is an array and convert it to comma separated string
                                if(_.isUndefined(resultRow.value))
                                    resultRow.value = "";
                                else if (_.isArray(resultRow.value))
                                    resultRow.value = resultRow.value.join(", ");
                                else if (resultRow.type == "date") {
                                    var formattedDate = new Date(parseFloat(resultRow.value));

                                    if (formattedDate != null) {
                                        resultRow.value = formattedDate.getDate() + "-" +
                                                          (formattedDate.getMonth() + 1) + "-" +
                                                          formattedDate.getFullYear();
                                    }
                                }
                                
                                //push the formatted row of the result in the array of the corresponding result
                                formattedResult.rows.push(resultRow);
                            });

                            //if the view of the result has been found, don't search further for its view
                            break;
                        }
                    }
                    
                    //push the result in the array containing all the results that will be visible to the user
                    formattedResults.push(formattedResult);
                });

                return formattedResults;
            };

            var performSearch = function(searchTerm, pageLimit, pageNumber) {
                //save the keyword and perform search
                Search.setKeyword(searchTerm);
                scope.pagination.setCurrent(pageNumber);
                
                Search.performSearch(searchTerm, scope.lang, 10, scope.pagination.getCurrent())
                .then(function (response) {
                    var results = angular.copy(response.data.response.docs);
                    var resultsCount = response.data.response.numFound;
                    var resultsView = response.view;

                    //get the names of all the available views
                    var resultsViewNames = [];
                    _.each(resultsView, function (view) {
                        resultsViewNames = resultsViewNames.concat( _.keys(view) );
                    });

                    //clear the existing results
                    resultsContainer[0].innerHTML = "";
                    scope.pagination.setTotal(resultsCount);
                    scope.formattedResults = formatResults(results, resultsView, resultsViewNames);
                    
                    //check if the length of the results is greater than 0, and handle pagination
                    if (resultsCount>0) {
                        scope.pagination.show();
                    } else {
                        scope.pagination.hide();
                        return false;
                    }

                    var templateData = {
                        results: scope.formattedResults,
                        translations: {
                            saveResultSet: Translations.get(scope.lang, "saveResultSet"),
                            saveResult: Translations.get(scope.lang, "saveResult"),
                            visitResultText: Translations.get(scope.lang, "viewResult"),
                            showMoreText: Translations.get(scope.lang, "showMoreTxt"),
                            showLessText: Translations.get(scope.lang, "showLessTxt")
                        }
                    };

                    var resultTemplate = compiledTemplates["SearchResult"];
                    var content = $compile(resultTemplate(templateData))(scope);
                    resultsContainer.append(content);
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


            //function to add a specific result in the user's basket
            scope.addToBasket = function(resourceId) {
                //initialize the basket's modal reference;
                var userId ="ydsUser";
                var basketConfig = {
                    lang: scope.lang,
                    type: "Dataset",
                    component_type: "result",
                    content_type: "default",
                    component_parent_uuid: resourceId,
                    user_id: userId,
                    filters: []
                };

                var modalRestrictions = {
                    Dataset: true,
                    Visualisation: false
                };

                Basket.checkIfItemExists(basketConfig)
                .then(function (response) {
                    debugger;
                    if(!_.isUndefined(response.status) && response.status=="NOT_EXISTS") {
                        Basket.openModal(basketConfig, modalRestrictions)
                    } else {
                        alert('item already exists')
                    }
                   debugger;
                }, function(error) {
                    debugger;
                    console.log ("error in get browse data", error);
                });
            };

            
            //watch location hash change in order to perform search query
            scope.$watch(function () { return $location.search() }, function (urlParams) {
                //get the original search term from the url
                var keyword = urlParams.q;

                if (!_.isUndefined(keyword)) {
                    //if search term is empty, stop the execution
                    if (keyword.trim() == "")
                        return false;

                    performSearch(keyword, 10, 1);
                }
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
            
            $scope.showMore = function (projectIndex) {
                var selectedItem = $scope.formattedResults[parseInt(projectIndex)];
                selectedItem._hidden = !selectedItem._hidden;
            };

            $scope.visitResult = function(projectId) {
                var resourceTypes = _.findWhere($scope.formattedResults, {id: projectId}).type.join();
          
                if (resourceTypes!=null || !_.isUndefined(resourceTypes)) {
                    $window.location.href = YDS_CONSTANTS.PROJECT_DETAILS_URL + '?id=' + projectId + '&type=' + resourceTypes;
                }
            };
        }
    };
}]);