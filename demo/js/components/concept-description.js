angular.module('yds').directive('ydsConceptDescription', ['Search', 'Data', 'Translations',
    function (Search, Data, Translations) {
        return {
            restrict: 'E',
            scope: {
                lang:'@',               // Language of the description
                conceptId: '@'          // ID of concept for making requests to API
            },
            templateUrl: ((typeof Drupal != 'undefined')? Drupal.settings.basePath  + Drupal.settings.yds_project.modulePath  +'/' :'') + 'templates/concept-description.html',
            link: function (scope) {
                Data.getConceptDescription(scope.conceptId, scope.lang).then(function(response) {
                    var prefLang = scope.lang;
                    var langs = Search.geti18nLangs();

                    var formattedResponse = {};

                    // Label
                    formattedResponse.label = response.data.label[prefLang];
                    if (_.isUndefined(formattedResponse.label) || formattedResponse.label.trim().length == 0) {
                        // Try getting label for the other language
                        formattedResponse.label = response.data.label[_.first(_.without(langs, prefLang))];
                    }

                    // Description
                    formattedResponse.description = response.data.description[prefLang];
                    if (_.isUndefined(formattedResponse.description) || formattedResponse.description.trim().length == 0) {
                        // Try getting description for the other language
                        formattedResponse.description = response.data.description[_.first(_.without(langs, prefLang))];
                    }

                    // Set scope variables to be shown on the page
                    scope.labelText = formattedResponse.label;
                    scope.descriptionText = formattedResponse.description;
                });
            }
        };
    }
]);