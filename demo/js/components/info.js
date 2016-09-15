angular.module('yds').directive('ydsInfo', ['Data', 'Translations', '$sce', function(Data, Translations, $sce){
    return {
        restrict: 'E',
        scope: {
            projectId: '@',     //id of the project that the data belong
            viewType: '@',      //type of the info object
            lang: '@',          //lang of the visualised data
            labelColWidth: '@', //width of the labels column (1-11, using bootstrap's grid)
            extraParams: '='    //extra parameters to send with API call
        },
        templateUrl: ((typeof Drupal != 'undefined')? Drupal.settings.basePath  + Drupal.settings.yds_project.modulePath  +'/' :'') + 'templates/info.html',
        link: function(scope) {
            var projectId = scope.projectId;
            var viewType = scope.viewType;
            var lang = scope.lang;
            var labelColWidth = parseInt(scope.labelColWidth);
            var extraParams = scope.extraParams;

            //check if project id or grid type are defined
            if(_.isUndefined(projectId) || projectId.trim()=="") {
                scope.ydsAlert = "The YDS component is not properly initialized " +
                    "because the projectId or the viewType attribute aren't configured properly." +
                    "Please check the corresponding documentation sertion";
                return false;
            }

            //check if info-type attribute is empty and assign the default value
            if(_.isUndefined(viewType) || viewType.trim()=="")
                viewType = "default";

            //check if the language attr is defined, else assign default value
            if(_.isUndefined(lang) || lang.trim()=="")
                lang = "en";

            if (_.isUndefined(labelColWidth) || _.isNaN(labelColWidth) || labelColWidth > 11 || labelColWidth < 1) {
                labelColWidth = 4;
            }

            scope.labelCol = "col-md-" + labelColWidth;
            scope.infoCol = "col-md-" + (12 - labelColWidth);

            scope.info = {};
            scope.translations = {
                showMore: Translations.get(lang, "showMore"),
                showLess: Translations.get(lang, "showLess")
            };
            
            Data.getProjectVis("info", projectId, viewType, lang, extraParams)
            .then(function (response) {
                _.each(response.view, function(infoValue){
                    if (infoValue.type=="url") {
                        scope.info[infoValue.header] = {
                            value: $sce.trustAsHtml(Data.deepObjSearch(response.data, infoValue.attribute)),
                            type: infoValue.type
                        };
                    } else if (infoValue.type=="country_code_name_array") {
                        var countries = Data.deepObjSearch(response.data, infoValue.attribute);

                        // Create string with all countries and their flag htmls
                        var countriesStr = "";
                        _.each(countries, function(country) {
                            countriesStr += country.code + " " + country.name + ", ";
                        });

                        countriesStr = countriesStr.slice(0, -2);

                        scope.info[infoValue.header] = {
                            value: $sce.trustAsHtml(countriesStr),
                            type: infoValue.type
                        };
                    } else {
                        scope.info[infoValue.header] = {
                            value: Data.deepObjSearch(response.data, infoValue.attribute),
                            type: infoValue.type
                        };
                    }
                    
                    if (_.isArray(scope.info[infoValue.header].value))
                        scope.info[infoValue.header].value = scope.info[infoValue.header].value.join()
                });
            }, function (error) {
                if (error==null || _.isUndefined(error) || _.isUndefined(error.message))
                    scope.ydsAlert = "An error was occurred, please check the configuration of the component";
                else
                    scope.ydsAlert = error.message;
            });
        }
    };
}]);