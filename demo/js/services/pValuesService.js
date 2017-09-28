angular.module("yds").factory("PValues", [
    function () {
        const CATEGORICAL = "c";
        const NUMERETICAL = "n";

        /**
         * Optimal histogram bin size calculation (???)
         * @param dataA
         * @param typeA
         * @param dataB
         * @param typeB
         * @param algorithm
         * @returns {[number,number]}
         */
        var binOptimizer = function (dataA, typeA, dataB, typeB, algorithm) {

            return [0, 0];
        };

        /**
         * Calculate the PValues
         */
        var calculatePValues = function (variables, data) {
            var varNames = variables.map(_.first);
            var varsNum = varNames.length;

            // Gather the types of the variables into an object instead of an array as given
            var varTypes = {};
            _.each(variables, function (varArray) {
                varTypes[varArray[0]] = varArray[1];
            });

            // Initialize the two-dimensional array with -1 as values
            var pValues = new Array(varsNum);
            for (var i = 0; i < varsNum; i++) {
                pValues[i] = new Array(varsNum);
                pValues[i].fill(-1);
            }

            // Extract the data for each variable, since we will need all of them
            var count = data.length;
            var varData = {};
            _.each(varNames, function (name) {
                varData[name] = _.pluck(data, name);
            });

            // Calculate the p values
            _.each(varNames, function (varA, i) {
                // Get variable data & type
                var dataA = varData[varA];
                var typeA = varTypes[varA];

                _.each(varNames, function (varB, j) {
                    // Get variable data & type
                    var dataB = varData[varB];
                    var typeB = varTypes[varB];

                    // Gamma correlation
                    var res = binOptimizer(dataA, typeA, dataB, typeB, "??");

                    console.log("Finding correlation of", varA, "and", varB);
                });
            });
        };

        return {
            calculate: calculatePValues
        }
    }
]);
