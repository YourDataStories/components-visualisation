angular.module('yds').directive('ydsResults', ['YDS_CONSTANTS', '$window', '$templateCache', '$location', '$compile', '$ocLazyLoad', 'Search',
    'Basket', 'Translations', 'Data', function (YDS_CONSTANTS, $window, $templateCache, $location, $compile, $ocLazyLoad, Search, Basket, Translations, Data) {
        return {
            restrict: 'E',
            scope: {
                lang: '@',
                userId: '@'
            },
            templateUrl: Data.templatePath + 'templates/general-purpose/results.html',
            link: function (scope, element, attrs) {
                var resultsContainer = angular.element(element[0].querySelector('.results-content'));
                var compiledTemplates = {};
                scope.basketEnabled = false;
                scope.showNoResultsMsg = false;
                scope.translations = {};
                var basketModalRestrictions = {
                    Dataset: true,
                    Visualisation: false
                };

                //check if the language attr is defined, else assign default value
                if (angular.isUndefined(scope.lang) || scope.lang.trim() == "")
                    scope.lang = "en";

                if (!_.isUndefined(scope.userId) && scope.userId.trim() != "") {
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

                    show: function () {
                        if (scope.pagination.hidden)
                            scope.pagination.hidden = false;

                        scope.showNoResultsMsg = false;
                    },
                    hide: function () {
                        if (!scope.pagination.hidden)
                            scope.pagination.hidden = true;

                        scope.showNoResultsMsg = true;
                    },
                    getCurrent: function () {
                        return (scope.pagination.current - 1) * 10;
                    },
                    setCurrent: function (pageNum) {
                        scope.pagination.current = pageNum;
                    },
                    setTotal: function (resultsCount) {
                        scope.pagination.total = resultsCount;
                    }
                };

                //function to prepare the templates used in search results
                var prepareTemplates = function () {
                    //precompile the js templates for faster rendering
                    _.templateSettings.variable = "rc";
                    scope.translations = Translations.getAll(scope.lang);

                    $ocLazyLoad.load({
                        files: [Data.templatePath + 'templates/search/search-result.html'],
                        cache: true
                    }).then(function () {
                        compiledTemplates = {
                            SearchResult: _.template($templateCache.get("search-result.html"))
                        };
                    });
                };

                //function to prepare the basic configuration of the basket item
                var initializeBasketItem = function (resourceId, componentType) {
                    return {
                        lang: scope.lang,
                        type: "Dataset",
                        component_type: componentType,
                        content_type: "default",
                        component_parent_uuid: resourceId,
                        user_id: scope.userId,
                        filters: []
                    };
                };


                var performSearch = function (searchTerm, pageLimit, pageNumber) {
                    //save the keyword and perform search
                    Search.setKeyword(searchTerm);
                    scope.pagination.setCurrent(pageNumber);

                    Search.performSearch(scope.lang, 10, scope.pagination.getCurrent())
                        .then(function (response) {
                            var results = angular.copy(response.data.response.docs);
                            var resultsCount = response.data.response.numFound;
                            var resultsView = response.view;

                            //get the names of all the available views
                            var resultsViewNames = [];
                            _.each(resultsView, function (view) {
                                resultsViewNames = resultsViewNames.concat(_.keys(view));
                            });

                            //clear the existing results
                            resultsContainer[0].innerHTML = "";
                            scope.pagination.setTotal(resultsCount);
                            scope.formattedResults = Search.formatResults(results, resultsView, resultsViewNames, scope.lang);

                            //check if the length of the results is greater than 0, and handle pagination
                            if (resultsCount > 0) {
                                scope.pagination.show();
                            } else {
                                scope.pagination.hide();
                                return false;
                            }

                            var templateData = {
                                resultBaseUrl: YDS_CONSTANTS.PROJECT_DETAILS_URL,
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
                            //when an error occur, initialize the pagination and clear the results
                            scope.pagination.hide();
                            scope.pagination.setTotal(0);
                            resultsContainer[0].innerHTML = "";
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
                scope.addResultToBasket = function (resourceId) {
                    //initialize the basket's modal reference;
                    var basketConfig = initializeBasketItem(resourceId, "result");


                    Basket.checkIfItemExists(basketConfig)
                        .then(function (response) {
                            if (!_.isUndefined(response.status) && response.status == "NOT_EXISTS") {
                                Basket.openModal(basketConfig, basketModalRestrictions)
                            } else {
                                alert('item already exists')
                            }
                        }, function (error) {
                            console.log("error in get browse data", error);
                        });
                };

                //function to add a specific result in the user's basket
                scope.addResultsetToBasket = function () {
                    //get search parameters from the url
                    var searchFilters = {};
                    var searchParams = $location.search();

                    if (!_.isUndefined(searchParams.q))
                        searchFilters.q = searchParams.q;
                    else
                        return false;

                    if (!_.isUndefined(searchParams.fq)) {
                        searchFilters.fq = searchParams.fq;

                        // If only one facet is selected and it's a string, make it an array like the API expects
                        if (_.isString(searchFilters.fq)) {
                            searchFilters.fq = [searchFilters.fq];
                        }
                    }

                    var resultHashObj = _.extend(searchFilters, {lang: scope.lang});
                    var resultsetUUID = Data.hashFromObject(resultHashObj);

                    //initialize the basket's modal reference;
                    var basketConfig = initializeBasketItem(resultsetUUID, "resultset");

                    basketConfig.filters.push({
                        applied_to: "search",
                        attrs: searchFilters
                    });

                    Basket.checkIfItemExists(basketConfig)
                        .then(function (response) {
                            if (!_.isUndefined(response.status) && response.status == "NOT_EXISTS") {
                                Basket.openModal(basketConfig, basketModalRestrictions)
                            } else {
                                alert('item already exists')
                            }
                        }, function (error) {
                            console.log("error during check if basket item exists", error);
                        });
                };


                //watch location hash change in order to perform search query
                scope.$watch(function () {
                    return $location.search()
                }, function (urlParams) {
                    //get the original search term from the url
                    var keyword = urlParams.q;

                    if (!_.isUndefined(keyword)) {
                        //if search term is empty, stop the execution
                        if (keyword.trim() == "")
                            return false;

                        performSearch(keyword, 10, 1);
                    }
                });

                scope.$on("$destroy", function () {
                    Search.clearKeyword();
                });

                //function to emit results preview event
                scope.resultsPreview = function (project, vizType) {
                    // firing an event downwards from the parent scope
                    scope.$parent.$broadcast('previsualiseResult', {
                        projectId: project.attributes['project-id'],
                        projectTitle: project.attributes.title,
                        vizType: vizType
                    });
                };

                //function for expanding the contents of a result
                scope.showMore = function (projectIndex) {
                    var selectedItem = scope.formattedResults[parseInt(projectIndex)];
                    selectedItem._hidden = !selectedItem._hidden;
                };

                prepareTemplates();
            }
        };
    }]);