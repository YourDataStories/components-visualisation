angular.module("yds").factory("Personalization", ["$http", "$q", "YDS_CONSTANTS", "Data",
    function ($http, $q, YDS_CONSTANTS, Data) {
        // Map which keeps the ID -> template mappings in order to be able to get a template object from its ID
        var templateIdMap = {};

        // Same, but for axis items
        var axisIdMap = {};

        /**
         * Get a template's object from its ID, using the map object which is created when getAllTemplateIDs() is ran
         * @param templateId
         * @returns {*}
         */
        var getTemplateById = function (templateId) {
            if (_.has(templateIdMap, templateId)) {
                return templateIdMap[templateId];
            } else {
                return -1;
            }
        };

        /**
         * Calculate and return the IDs of all available templates in the Highcharts Editor
         */
        var getAllTemplateIDs = function () {
            if (_.isUndefined(highed)) {
                return null;
            }

            // Get the templates of each template category of the Editor
            var templates = _.pluck(highed.meta.chartTemplates, "templates");

            // Transform each template category (which is an object) into an array with the templates
            templates = _.map(templates, _.values);

            // Merge all arrays into one
            templates = _.flatten(templates);

            // Get ID of each template
            templates = _.map(templates, function (template) {
                // Get the ID
                var id = Data.getTemplateId(template);

                // Save the template to the ID -> template map for later reference
                templateIdMap[id] = template;

                return id;
            });

            return templates;
        };

        /**
         * Transform an item ID into an item used by the personalization API to get recommendations
         * @param id
         * @returns {{id: *, language: string, recommended: string, text: [*]}}
         */
        var idToApiItem = function (id) {
            return {
                "id": id,
                "language": "en",
                "recommended": "true",
                "text": [
                    id
                ]
            }
        };

        /**
         * Return true if the key starts with "axis_x_". Used as a filter to select X or Y (inverted) axis IDs
         * @param value
         * @param key
         * @returns {boolean}
         */
        var xAxisFilter = function (value, key) {
            return key.indexOf("axis_x_") !== -1;
        };

        /**
         * Get the suggested axes for a specific concept
         * @param concept   Concept
         * @param allAxes      The axes, as returned from the JSON-LD API
         * @returns {promise|*|d|s}
         */
        var getSuggestedAxes = function (concept, allAxes) {
            var deferred = $q.defer();

            var axisIds = [];

            // Add the X and Y axis item IDs to the axisIds array
            _.each(allAxes, function (axis, axisKey) {
                _.each(axis, function (axisItem) {
                    // Create this axis item's ID
                    var axisId = Data.getAxisId(axisKey, axisItem.field_id);

                    // Add the ID to the array, and save it in the ID -> axis object map
                    axisIds.push(axisId);
                    axisIdMap[axisId] = axisItem;
                });
            });

            // Create JSON items for the IDs like the personalization API expects them
            var allAxisIds = _.map(axisIds, idToApiItem);

            $http({
                method: "POST",
                url: YDS_CONSTANTS.API_PERSONALIZATION + "getRecommendation/" + concept,
                headers: {"Content-Type": "application/x-www-form-urlencoded"},
                transformRequest: customRequestTransform,
                data: {
                    JSONObjectList: JSON.stringify(allAxisIds)
                }
            }).then(function (response) {
                if (_.has(response.data, "output")) {
                    // Separate X and Y axis item IDs
                    var allItems = response.data.output;

                    var axes = {
                        x: _.pick(allItems, xAxisFilter),
                        y: _.omit(allItems, xAxisFilter)
                    };

                    // Keep top 10 axes
                    _.each(axes, function (axis, key) {
                        var axisIds = _.keys(axis);

                        axis = _.map(axisIds, function (itemId) {
                            return {
                                id: itemId,
                                rank: axis[itemId]
                            }
                        });

                        // Sort by rank, keep top 10, remove items with rank of 0 and keep their field_ids
                        axis = _.chain(axis)
                            .sortBy("rank")
                            .last(10)
                            .reject(function (item) {
                                return item.rank <= 0;
                            })
                            .map(function (item) {
                                return axisIdMap[item.id].field_id;
                            })
                            .value();

                        axes[key] = axis;
                    });

                    deferred.resolve(axes);
                } else {
                    // There was a problem, reject
                    deferred.reject(response.data.outputMessage);
                }
            }, function (error) {
                deferred.reject(error);
            });

            return deferred.promise;
        };

        /**
         * Get the suggested templates for a specific user and their selected concept
         * @param userId        ID of user
         * @param concept       Selected concept
         * @returns {promise|*|d|s}
         */
        var getSuggestedTemplates = function (userId, concept) {
            var deferred = $q.defer();

            // Get the available templates
            var templateIds = getAllTemplateIDs();

            var allTemplates = _.map(templateIds, idToApiItem);

            // Get templates from personalisation API
            $http({
                method: "POST",
                url: YDS_CONSTANTS.API_PERSONALIZATION + "getRecommendation/" + concept,
                headers: {"Content-Type": "application/x-www-form-urlencoded"},
                transformRequest: customRequestTransform,
                data: {
                    JSONObjectList: JSON.stringify(allTemplates)
                }
            }).then(function (response) {
                if (_.has(response.data, "output")) {
                    var templateRanks = response.data.output;

                    // Create array with templates IDs and their rankings
                    var templates = _.map(templateIds, function (t) {
                        return {
                            id: t,
                            rank: templateRanks[t]
                        }
                    });

                    templates = _.sortBy(templates, "rank");

                    // Get last 10 templates (top 10 by ranking) and keep only those with a rank > 0
                    var suggestedTemplates = _.last(templates, 10);

                    suggestedTemplates = _.reject(suggestedTemplates, function (template) {
                        return template.rank <= 0;
                    });

                    var suggestedTemplateIds = _.pluck(suggestedTemplates, "id");

                    deferred.resolve(suggestedTemplateIds);
                } else {
                    // There was a problem, reject
                    deferred.reject(response.data.outputMessage);
                }
            }, function (error) {
                deferred.reject(error);
            });

            return deferred.promise;
        };

        /**
         * Transform request parameters object to "x-www-form-urlencoded" format
         * @param obj
         * @returns {string}
         */
        var customRequestTransform = function (obj) {
            var str = [];
            for (var p in obj)
                str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
            return str.join("&");
        };

        /**
         * Feed the API with the selection of a user
         * @param userId        User
         * @param lang          Language
         * @param templateId    Template that the user selected
         * @param concept       Concept that the template was selected for
         * @param weight        Weight of selection
         * @returns {promise|*|d|s}
         */
        var feed = function (userId, lang, templateId, concept, weight) {
            var deferred = $q.defer();

            // var addTemplate = $http({
            //     method: "POST",
            //     url: YDS_CONSTANTS.API_PERSONALIZATION + "user/" + templateId,
            //     headers: {"Content-Type": "application/x-www-form-urlencoded"},
            //     data: {
            //         "name": templateId,
            //         "type": "template"
            //     }
            // });

            // var addConcept = $http({
            //     method: "POST",
            //     url: YDS_CONSTANTS.API_PERSONALIZATION + "user/" + concept,
            //     headers: {"Content-Type": "application/x-www-form-urlencoded"},
            //     data: {
            //         "name": concept,
            //         "type": "concept"
            //     }
            // });

            // Prepare requests array
            var promises = [
                // addTemplate,
                // addConcept
            ];

            if (!_.isUndefined(userId)) {
                // Add the user
                promises.push($http({
                    method: "POST",
                    url: YDS_CONSTANTS.API_PERSONALIZATION + "user/" + userId,
                    headers: {"Content-Type": "application/x-www-form-urlencoded"},
                    data: {
                        "name": userId,
                        "type": "user"
                    }
                }));
            }

            // Feed the user & dataset a number of times depending on the specified weight
            for (var i = 0; i < weight; i++) {
                // Feed the user with data
                if (!_.isUndefined(userId)) {
                    promises.push($http({
                        method: "POST",
                        url: YDS_CONSTANTS.API_PERSONALIZATION + "feed/" + userId,
                        headers: {"Content-Type": "application/x-www-form-urlencoded"},
                        transformRequest: customRequestTransform,
                        data: {
                            JSONObject: JSON.stringify({
                                "id": templateId,
                                "language": lang,
                                "recommended": "true",
                                "text": [
                                    concept,
                                    templateId
                                ]
                            })
                        }
                    }));
                }

                // Feed the dataset with data
                promises.push($http({
                    method: "POST",
                    url: YDS_CONSTANTS.API_PERSONALIZATION + "feed/" + concept,
                    headers: {"Content-Type": "application/x-www-form-urlencoded"},
                    transformRequest: customRequestTransform,
                    data: {
                        JSONObject: JSON.stringify({
                            "id": templateId,
                            "language": lang,
                            "recommended": "true",
                            "text": [
                                templateId
                            ]
                        })
                    }
                }));
            }

            // Do the requests
            $q.all(promises).then(function (values) {
                deferred.resolve(values);
            }, function (error) {
                deferred.reject(error);
            });

            return deferred.promise;
        };

        return {
            getSuggestedTemplates: getSuggestedTemplates,
            getSuggestedAxes: getSuggestedAxes,
            getTemplateById: getTemplateById,
            feed: feed
        }
    }
]);
