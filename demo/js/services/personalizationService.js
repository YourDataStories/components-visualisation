angular.module('yds').factory('Personalization', ['$http', '$q', 'YDS_CONSTANTS', 'Data',
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
            templates = _.map(templates, function(template) {
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
         * @param conceptId     ID of concept
         * @returns {promise|*|d|s}
         */
        var getSuggestedTemplates = function (userId, conceptId) {
            var deferred = $q.defer();

            // Get the available templates
            var allTemplates = getAllTemplateIDs();

            // Keep 10 random templates
            var suggestedTemplates = _.first(_.shuffle(allTemplates), 10);
            deferred.resolve(suggestedTemplates);

            //todo: Get templates from personalisation API

            return deferred.promise;
        };

        return {
            getSuggestedTemplates: getSuggestedTemplates,
            getTemplateById: getTemplateById
        }
    }
]);
