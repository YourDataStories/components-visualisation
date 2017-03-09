angular.module('yds').factory('Personalization', ['$http', '$q', 'YDS_CONSTANTS', 'Data',
    function ($http, $q, YDS_CONSTANTS, Data) {
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
            templates = _.map(templates, Data.getTemplateId);

            return templates;
        };

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
            getSuggestedTemplates: getSuggestedTemplates
        }
    }
]);
