angular.module("yds").factory("PValues", [
    function () {
        const CATEGORICAL = "c";
        const NUMERICAL = "n";

        const MAX_RES_SAMPLE_SIZE = 10;
        const MAX_HIST_BINS = 100;
        const MAX_SEARCH_SAMPLE_SIZE = 1000;
        const MAX_HIST_SAMPLE_SIZE = 10000;

        /**
         * Create a 2D array with the specified initial value
         * @param x Number of rows
         * @param y Number of columns
         * @param defaultValue  Default value
         * @returns {Array}
         */
        var twoDimArray = function (x, y, defaultValue) {
            var array = new Array(x);

            for (var i = 0; i < x; i++) {
                array[i] = new Array(y);
                array[i].fill(defaultValue);
            }

            return array;
        };

        /**
         * Count the different values that appear in an array of items
         * @param data  Array of items
         * @returns {number}    Number of different values
         */
        var countDifferentValues = function (data) {
            var count = 0;
            var seenValues = [];

            _.each(data, function (value) {
                if (seenValues.indexOf(value) === -1) {
                    seenValues.push(value);
                    count++;
                }
            });
            // console.log(seenValues);
            return count;
        };

        var calcRes = function (values) {
            var res = Number.POSITIVE_INFINITY;
            var mod = Math.max(1, parseInt(values.length / MAX_RES_SAMPLE_SIZE));
            // console.log("\tmod:", mod);
            for (var i = 0; i < values.length; i += mod) {
                var valI = values[i];
                for (var j = 0; j < values.length; j++) {
                    var valJ = values[j];

                    var diff = Math.abs(valJ - valI);
                    if (diff > 0) {
                        // var resOld = res;
                        res = Math.min(res, diff);
                        // if (resOld !== res)
                        //     console.log("res is now: ", res, "(diff:", diff, ") vals: ", valI, valJ);
                    }
                }
            }
            return Math.max(res, 1.0 / MAX_HIST_BINS);
        };

        var constrainNumber = function (val, min, max) {
            return (val < min) ? min : ((val > max) ? max : val);
        };

        var hist2D = function (dataA, dataB, bNumX, bNumY) {
            var counts = twoDimArray(bNumX, bNumY, 0.0);
            var valueW = 1; // We don't handle values with weights, assuming all weights as 1.0.

            // Check the assumption that dataA.length == dataB.length
            if (dataA.length !== dataB.length) {
                console.error("Error: Different lengths!");
                return counts;
            }
            var numOfValues = dataA.length;

            var bsizex = 1.0 / bNumX;
            var bsizey = 1.0 / bNumY;
            var mod = Math.max(1.0, numOfValues / MAX_HIST_SAMPLE_SIZE);

            for (var i = 0; i < numOfValues; i += mod) {
                var binx = constrainNumber(dataA[i] / bsizex, 0, bNumX - 1);
                var biny = constrainNumber(dataB[i] / bsizey, 0, bNumY - 1);
                counts[binx][biny] += valueW;
            }

            return counts;
        };

        var countsMeanDev = function (counts) {
            var ni = counts.length;
            var nj = counts[0].length;
            var n = ni * nj;
            var sum = 0;
            var sumsq = 0;
            for (var i = 0; i < ni; i++) {
                for (var j = 0; j < nj; j++) {
                    var count = counts[i][j];
                    sum += count;
                    sumsq += count * count;
                }
            }

            var mean = sum / n;
            var meansq = sumsq / n;
            var dev = Math.max(0, meansq - mean * mean);
            return [mean, dev];
        };

        var poissonCost = function (n, h, counts) {
            var res = countsMeanDev(counts);
            var k = res[0];
            var v = res[1];

            return (2 * k - v) / (n * n * h * h);   // cost
        };

        /**
         * Transform a categorical variable to numbers, ranging from 0 to the number of
         * different values that appear.
         * @param data      Data to transform
         * @returns {Array} Transformed data
         */
        var categoricalToNum = function (data) {
            var newData = [];

            var count = 0;
            var index = {};

            _.each(data, function (value) {
                if (!_.has(index, value)) {
                    index[value] = count;
                    count++;
                }
                newData.push(index[value]);
            });

            return newData;
        };

        /**
         * Normalize an array of numbers so that the maximum value is 1.0.
         * @param array Array of numbers
         */
        var normalizeArray = function (array) {
            var ratio = Math.max.apply(Math, array); // (divided by maximum value, here 1.0)

            return array.map(function (num) {
                return num / ratio;
            });
        };

        /**
         * Optimal histogram bin size calculation (???)
         * @param dataA Variable A data
         * @param typeA Variable A type
         * @param dataB Variable B data
         * @param typeB Variable B type
         * @param algorithm Algorithm to use
         * @returns {[number,number]} Number of bins for each variable
         */
        var binOptimizer = function (dataA, typeA, dataB, typeB, algorithm) {
            var countA = (typeA === CATEGORICAL) ? countDifferentValues(dataA) : Math.max.apply(Math, dataA) + 1;
            var countB = (typeB === CATEGORICAL) ? countDifferentValues(dataB) : Math.max.apply(Math, dataB) + 1;
            // Above seems more correct, but mirador parsing thinks # of tattoos is categorical so results are different
            // var countA = countDifferentValues(dataA);
            // var countB = countDifferentValues(dataB);
            // console.log("counts: ", countA, countB);

            if (typeA === CATEGORICAL && typeB === CATEGORICAL) {
                // Return the number of different answers
                return [countA, countB];
            }

            var size = dataA.length;
            var sqSize = parseInt(Math.sqrt(size / 2));
            var lcount, icount, res;

            var minNBins0, maxNBins0;
            if (typeA === CATEGORICAL || countA < 5) {
                minNBins0 = maxNBins0 = countA;
            } else {
                minNBins0 = 2;
                lcount = countA;
                // console.log("lcount (A)", lcount);
                if (_.has(Number, "MAX_SAFE_INTEGER")) {
                    icount = Number.MAX_SAFE_INTEGER < lcount ? Number.MAX_SAFE_INTEGER : lcount;
                } else {
                    icount = lcount;
                }

                res = calcRes(normalizeArray(dataA));
                maxNBins0 = Math.min(Math.round(1.0 / res), icount, sqSize);
            }

            var minNBins1, maxNBins1;
            if (typeB === CATEGORICAL || countB < 5) {
                minNBins1 = maxNBins1 = countB;
            } else {
                minNBins1 = 2;
                lcount = countB;
                // console.log("lcount (B)", lcount);
                if (_.has(Number, "MAX_SAFE_INTEGER")) {
                    icount = Number.MAX_SAFE_INTEGER < lcount ? Number.MAX_SAFE_INTEGER : lcount;
                } else {
                    icount = lcount;
                }

                res = calcRes(normalizeArray(dataB));
                // console.log("resy", res);
                maxNBins1 = Math.min(Math.round(1.0 / res), icount, sqSize);
            }

            // console.log("Min bins:", minNBins0, "/", minNBins1);
            // console.log("Max bins:", maxNBins0, "/", maxNBins1);

            //todo: check for rice/scott algorithms here?

            var blen0 = maxNBins0 - minNBins0 + 1;
            var blen1 = maxNBins1 - minNBins1 + 1;
            var numValues = blen0 * blen1;

            if (minNBins0 <= 0 || maxNBins0 <= 0 || blen0 <= 0 || minNBins1 <= 0 || maxNBins1 <= 0 || blen1 <= 0) {
                console.error("Unexpected number of bins");
                return [1, 1];
            }

            var minn0 = (minNBins0 + maxNBins0) / 2;
            var minn1 = (minNBins1 + maxNBins1) / 2;
            var minc = Number.MAX_VALUE;
            var mod = Math.max(1, numValues / MAX_SEARCH_SAMPLE_SIZE);

            for (var i = 0; i < numValues; i += mod) {
                var n0 = parseInt(i / blen1) + minNBins0;   // Make sure it's an integer
                var n1 = i % blen1 + minNBins1;

                var bsize0 = 1.0 / n0;
                var bsize1 = 1.0 / n1;
                var barea = bsize0 * bsize1;
                var counts = hist2D(dataA, dataB, n0, n1);

                var c = 0;
                // Poisson method
                c = poissonCost(size, barea, counts);
                //todo: check for crossval algorithm here?

                if (c < minc) {
                    minc = c;
                    minn0 = n0;
                    minn1 = n1;
                }
            }

            return [minn0, minn1];
        };

        /**
         * Round a number to the specified number of places.
         * From: https://stackoverflow.com/a/12830454
         * @param num
         * @param scale
         * @returns {number}
         */
        var roundNumber = function (num, scale) {
            if (!("" + num).includes("e")) {
                return +(Math.round(num + "e+" + scale) + "e-" + scale);
            } else {
                var arr = ("" + num).split("e");
                var sig = "";
                if (+arr[1] + scale > 0) {
                    sig = "+";
                }
                return +(Math.round(+arr[0] + "e" + sig + (+arr[1] + scale)) + "e-" + scale);
            }
        };

        /**
         * Calculate the mutual information
         * @param dataA Data of variable A
         * @param dataB Data of variable B
         * @param nbinx Number of bins for variable A
         * @param nbiny Number of bins for variable B
         * @returns {number}
         */
        var mutualInformation = function (dataA, dataB, nbinx, nbiny) {
            if (nbinx < 2 || nbiny < 2)
                return 0;

            var sbinx = roundNumber(1.0 / nbinx, 8),
                sbiny = roundNumber(1.0 / nbiny, 8);
            // console.log("sbins: ", sbinx, sbiny);

            var countsx = new Array(nbinx),
                countsy = new Array(nbiny),
                counts = twoDimArray(nbinx, nbiny, 0);

            // Fill countsx & countsy with zeros
            countsx.fill(0);
            countsy.fill(0);

            var singlebx = true,
                singleby = true,
                lastbx = -1,
                lastby = -1,
                total = 0,
                valueW = 1.0;   // We don't have weights, using 1.0 as weight always

            var bx, by;
            for (var i = 0; i < dataA.length; i++) {
                var valX = dataA[i];
                var valY = dataB[i];

                bx = Math.floor(Math.min(valX / sbinx, nbinx - 1));
                by = Math.floor(Math.min(valY / sbiny, nbiny - 1));
                // console.log("\tbx, by", bx, by);

                if (bx < 0 || by < 0) {
                    console.error("A bin index is negative:", bx, nbinx, "|", by, nbiny);
                    continue;
                }

                counts[bx][by] += valueW;
                countsx[bx] += valueW;
                countsy[by] += valueW;

                if (lastbx !== -1 && lastbx !== bx) {
                    singlebx = false;
                }
                if (lastby !== -1 && lastby !== by) {
                    singleby = false;
                }

                lastbx = bx;
                lastby = by;
                total += valueW;
            }

            // Pairs with only 1 occupied bin are considered independent
            if (singlebx || singleby) {
                return 0;
            }

            var information = 0;
            var nonzero = 0;
            for (bx = 0; bx < nbinx; bx++) {
                var px = countsx[bx] / total;
                for (by = 0; by < nbiny; by++) {
                    var pxy = counts[bx][by] / total;
                    var py = countsy[by] / total;

                    var ibin = 0;
                    if (pxy > 0 && px > 0 && py > 0) {
                        nonzero++;
                        ibin = pxy * (Math.log(pxy / (px * py)));
                    }

                    information += ibin;
                }
            }

            if (information < 0 || _.isNaN(information)) {
                return 0;
            }

            // Finite size correction
            var correction = (nonzero - nbinx - nbiny + 1) / (2 * total);
            // console.log("Information:", information);
            // console.log("Correction:", correction);
            return Math.max(0, information - correction);
        };

        var gammaTest = function (ixy, binx, biny, count) {
            var shapePar = (binx - 1) * (biny - 1) / 2.0;
            var scalePar = 1.0 / count;

            // Return cumulative probability from Gamma distribution
            return 1 - jStat.gamma.cdf(ixy, shapePar, scalePar);
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
            var pValues = twoDimArray(varsNum, varsNum, -1);

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
                    if (pValues[i][j] > -1) return; // Move on, score exists
                    console.log("\nFinding correlation of", varA, "and", varB);

                    // Get variable data & type
                    var dataB = varData[varB];
                    var typeB = varTypes[varB];

                    // Turn categorical values into numbers, or parse the values of numerical variables as floats
                    if (typeA === CATEGORICAL) {
                        dataA = categoricalToNum(dataA);
                    } else {
                        dataA = dataA.map(parseFloat);
                    }
                    if (typeB === CATEGORICAL) {
                        dataB = categoricalToNum(dataB);
                    } else {
                        dataB = dataB.map(parseFloat);
                    }

                    var res = binOptimizer(dataA, typeA, dataB, typeB, "??");
                    var binx = res[0];
                    var biny = res[1];
                    console.log("Bins:", binx, ",", biny);

                    if (binx < 2 || biny < 2) {
                        // Set pvalue to 1 and continue
                        pValues[i][j] = 1;
                        pValues[j][i] = 1;
                        return;
                    }

                    // Calculate mutual information
                    var ixy = mutualInformation(
                        (typeA === NUMERICAL) ? normalizeArray(dataA) : dataA,
                        (typeB === NUMERICAL) ? normalizeArray(dataB) : dataB,
                        binx,
                        biny);
                    console.log("Mutual info:", ixy);
                    var pval = 0;

                    if (varA === varB) {
                        // Set pvalue to 0 and continue
                        pValues[i][j] = pval;
                        pValues[j][i] = pval;
                        return;
                    }

                    if (_.isNaN(ixy) || !Number.isFinite(ixy)) {
                        pval = 0;
                    } else {
                        // Gamma test
                        pval = gammaTest(ixy, binx, biny, count);
                    }
                    //todo: implement surrogate/surrogateGeneral here?

                    console.log("Final pvalue:", pval);
                    pValues[i][j] = pval;
                    pValues[j][i] = pval;
                });
            });
            console.log("CALCULATIONS DONE!");
            return pValues;
        };

        return {
            calculate: calculatePValues
        }
    }
]);
