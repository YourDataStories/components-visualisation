angular.module('yds').directive('ydsBrowse', ['Data', '$q', '$window', '$location',
    function(Data, $q, $window, $location){
    return {
        restrict: 'E',
        scope: {
            lang: '@'
        },
        templateUrl:'templates/browse.html',
        link: function(scope, element) {
            var initialCall = true;
            scope.rawData = [];       //array containing the data fetched from the server
            scope.levels = [];        //array containing the data of each level of the browse component

            //check if the language attr is defined, else assign default value
            if(angular.isUndefined(scope.lang) || scope.lang.trim()=="")
                scope.lang = "en";

            //fetch the browse data from the server
            var fetchYDSModelHierarch = function() {
                Data.getBrowseData()
                .then(function (response) {
                    scope. rawData = response;

                    var firstLvl = formatLevel(scope.rawData, -1, -1);
                    scope.levels.push(firstLvl);
                }, function(error) {
                    console.log ("error in get browse data", error);
                });
            };


            //function to show or hide a specific level
            scope.toggleVisibility = function(index) {
                var isVisible = scope.levels[index].visible;
                if (!angular.isUndefined(isVisible))
                    scope.levels[index].visible = !scope.levels[index].visible;
            };


            //function to render the breadcrumbs based on user clicks
            var formatBreadcrumbs = function () {
                var clickedItems = [];
                var breadcrumbs  = [];

                for (var l=0; l<scope.levels.length; l++) {
                    clickedItems = _.where(scope.levels[l].values, {selected: true});

                    for (var m=0; m<clickedItems.length; m++) {
                        var identifier = parseInt(clickedItems[m].uniqueId.split("_"));
                        clickedItems[m].color = Data.getBreadcrumbColor(identifier);
                    }

                    if (clickedItems.length > 0) {
                        breadcrumbs.push({
                            id: l,
                            values: clickedItems
                        });
                    }
                }

                scope.breadcrumbs = angular.copy(breadcrumbs);
            };

            /**
             * function to format the breadcrumps from array to url parameter and trigger the search of concepts
             * @param {Array} breadcrumps, an array containing the selected concepts of each level
             **/
            var prepareSearchQuery = function(breadcrumps) {
                var concepts = [];

                _.each(breadcrumps, function(item){
                   var selectedConcepts = _.where(item.values, { selected: true });
                   concepts = _.union(concepts, selectedConcepts);
                });

                var facets = _.pluck(concepts, 'facet').join();

                if (facets.trim().length ==0)
                    $location.search({q : '*:*'});
                else
                    $location.search({q : '*:*', fq : "type:" + facets});
            };

            // function to initialize the first level of the shown data
            var formatLevel = function(inputData, parId, currentLevel) {
                var newLvl = {};

                if (angular.isUndefined(scope.levels[currentLevel+1])) {              //if level doesn't exist
                    newLvl = {
                        id: currentLevel+2,
                        visible: true,
                        values: []
                    };
                } else {
                    newLvl = angular.copy(_.findWhere (scope.levels, { id: currentLevel+2 }));
                    newLvl.visible = true;
                }

                for (var i=0; i<inputData.length; i++) {
                    if (_.isUndefined(inputData[i].label) || inputData[i].label==null)
                        continue;

                    newLvl.values.push({
                        id: inputData[i].id,
                        facet: inputData[i].facet,
                        uniqueId: inputData[i].id + "",
                        label: inputData[i].label,
                        content: inputData[i].values,
                        count: inputData[i].values.length
                    });

                    if (parId != -1) {
                        _.last(newLvl.values).uniqueId = parId + "_" + inputData[i].id;
                    }
                }

                return newLvl;
            };

            // function to render the selected folder of the user.
            scope.addLevel = function(index, position, objId) {
                //if the selected element has not been clicked
                if (angular.isUndefined(scope.levels[index].values[position].selected)) {
                    scope.levels[index].values[position].selected = true;
                    formatBreadcrumbs();
                    prepareSearchQuery(scope.breadcrumbs);
                } else {        //if element has already been manipulated
                    scope.levels[index].values[position].selected = !scope.levels[index].values[position].selected;
                    formatBreadcrumbs();

                    if (!scope.levels[index].values[position].selected) {  //already selected
                        var parentUniqueId = scope.levels[index].values[position].uniqueId;

                        //search all levels for items with uniqueId starting with their parent id
                        for(var j=index+1; j<scope.levels.length; j++) {
                            //get a copy of the current level without the values that have
                            var cleanLvlValues  = _.reject(scope.levels[j].values, function(obj){ return obj.uniqueId.indexOf(parentUniqueId) == 0; });

                            //if no values left, remove the entire level, else copy the updated values of the level
                            if (cleanLvlValues.length == 0)
                                scope.levels.splice(j, 1);
                            else
                                scope.levels[j].values = angular.copy(cleanLvlValues);
                        }

                        formatBreadcrumbs();
                        prepareSearchQuery(scope.breadcrumbs);
                        return false;
                    }
                }

                //get the content of the new level and check if is empty
                var nextLvlValues = scope.levels[index].values[position].content;

                //if empty, no action needed
                if (angular.isUndefined(nextLvlValues) || nextLvlValues.length == 0)
                    return false;

                //format the content of the new level in order to be added in the list
                var formatted = formatLevel(nextLvlValues, objId, index);

                //make visible only the levels which are after the level clicked
                for (var k=0; k<scope.levels.length; k++) {
                    if (k < index)
                        scope.levels[k].visible = false;
                    else
                        scope.levels[k].visible = true;
                }

                if (angular.isUndefined(_.findWhere(scope.levels, { id: formatted.id })))
                    scope.levels.push(formatted);
                else
                    scope.levels[formatted.id-1] = formatted;
            };

            //fetch the YDS Model data from the server
            fetchYDSModelHierarch();

            //initialize results for the first time
            if(initialCall) {
                $location.search({q : '*:*'});
                initialCall = false;
            }
        }
    };
}]);