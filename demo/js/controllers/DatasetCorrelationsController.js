angular.module("yds").controller("DatasetCorrelationsController", ["$scope", "$ocLazyLoad", "$timeout", "PValues",
    function ($scope, $ocLazyLoad, $timeout, PValues) {
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
                    $timeout(function () {
                        // window.dataHeadings variable should be available by now...
                        PValues.calculate(window.dataHeadings, controller.model.getData());
                    });

                    // Do other things that this function did before..
                    // this.view.suManipTools(this.model.getCategorical(), self.finToolSU);
                };
            } else {
                //todo: Show error...
            }
        });
    }
]);
