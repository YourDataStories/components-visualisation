angular.module("yds").controller("DatasetCorrelationsController", ["$scope", "$ocLazyLoad", "$timeout",
    function ($scope, $ocLazyLoad, $timeout) {
        var scope = $scope;
        scope.loaded = false;
        var controller;

        // Load required files from:
        // http://new.censusatschool.org.nz/resource/using-the-eikosogram-to-teach-conditional-and-joint-probability/
        $ocLazyLoad.load({
            files: [
                "https://www.stat.auckland.ac.nz/~wild/TwoWay/shared/d3.js",
                "https://www.stat.auckland.ac.nz/~wild/TwoWay/probability.js",
                "https://www.stat.auckland.ac.nz/~wild/TwoWay/probModel.js",
                "https://www.stat.auckland.ac.nz/~wild/TwoWay/probView.js",
                "https://www.stat.auckland.ac.nz/~wild/TwoWay/eiko.js"
            ],
            cache: true
        }).then(function () {
            // Show the file selector now that everything is loaded
            scope.loaded = true;

            // Get the controller
            controller = window.mainControl;

            if (!_.isUndefined(controller)) {
                // Set custom functions in the controller
                controller.finishedModelSU = function () {
                    // Get variables (dataHeadings variable should be ready..)
                    calculatePValues(window.dataHeadings);

                    // Do other things that this function did before..
                    // this.view.suManipTools(this.model.getCategorical(), self.finToolSU);
                };
            } else {
                //todo: Show error...
            }
        });

        /**
         * Calculate the PValues
         * @param variables
         */
        var calculatePValues = function (variables) {
            $timeout(function () {
                var varNames = variables.map(_.first);
                var varsNum = varNames.length;

                // Show the list of variables
                scope.varNames = varNames;

                // Initialize the two-dimensional array with -1 as values
                var pValues = new Array(varsNum);
                for (var i = 0; i < varsNum; i++) {
                    pValues[i] = new Array(varsNum);
                    pValues[i].fill(-1);
                }

                // Extract the data for each variable, since we will need all of them
                var data = controller.model.getData();
                var varData = {};
                _.each(varNames, function (name) {
                    varData[name] = _.pluck(data, name);
                });

                // Calculate the p values
                _.each(varNames, function (varA, i) {
                    _.each(varNames, function (varB, j) {
                        console.log("Finding correlation of", varA, "and", varB);

                        var dataA = varData[varA];
                        var dataB = varData[varB];
                        //todo
                    });
                });
            });
        }
    }
]);
