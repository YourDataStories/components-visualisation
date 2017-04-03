angular.module("yds").factory("Personalization", ["$http", "$q", "YDS_CONSTANTS", "Data",
    function ($http, $q, YDS_CONSTANTS, Data) {
        // Map which keeps the ID -> template mappings in order to be able to get a template object from its ID
        var templateIdMap = {};

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
         * Get the suggested templates for a specific user and their selected concept
         * @param userId        ID of user
         * @param concept       Selected concept
         * @returns {promise|*|d|s}
         */
        var getSuggestedTemplates = function (userId, concept) {
            var deferred = $q.defer();

            // Get the available templates
            var templateIds = getAllTemplateIDs();

            var allTemplates = _.map(templateIds, function (template) {
                return {
                    "id": template,
                    "language": "en",
                    "recommended": "true",
                    "text": [
                        template
                    ]
                }
            });

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

            // Add the user
            var addUser = $http({
                method: "POST",
                url: YDS_CONSTANTS.API_PERSONALIZATION + "user/" + userId,
                headers: {"Content-Type": "application/x-www-form-urlencoded"},
                data: {
                    "name": userId,
                    "type": "user"
                }
            });

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

            // Feed the user with data
            var feedUser = $http({
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
            });

            // Feed the dataset with data
            var feedDataset = $http({
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
            });

            // Prepare requests array
            //todo: take weight into account
            var promises = [
                addUser,
                // addTemplate,
                // addConcept,
                feedUser,
                feedDataset
            ];

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
            getTemplateById: getTemplateById,
            feed: feed
        }
    }
]);
