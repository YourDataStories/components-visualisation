angular.module('yds').directive('ydsInfo', ['Data', function(Data){
    return {
        restrict: 'E',
        scope: {
            projectId: '@',     //id of the project that the data belong
            infoType: '@',      //type of the info object
            lang: '@'           //lang of the visualised data
        },
        templateUrl:'templates/info.html',
        link: function(scope) {
            var projectId = scope.projectId;
            var infoType = scope.infoType;
            var lang = scope.lang;
            scope.translations = translations;
scope.showMore="dada";
            //check if project id or grid type are defined
            if(_.isUndefined(projectId) || projectId.trim()=="") {
                scope.ydsAlert = "The YDS component is not properly initialized " +
                    "because the projectId or the tableType attribute aren't configured properly." +
                    "Please check the corresponding documentation sertion";
                return false;
            }

            //check if info-type attribute is empty and assign the default value
            if(_.isUndefined(infoType) || infoType.trim()=="")
                infoType = "default";

            //check if the language attr is defined, else assign default value
            if(angular.isUndefined(lang))
                lang = "en";

            scope.info = {};
            Data.getInfo(projectId, infoType, lang)
            .then(function (response) {
                _.each(response.view, function(infoValue){
                    scope.info[infoValue.header] = {
                        value: Data.deepObjSearch(response.data, infoValue.attribute),
                        type: infoValue.type
                    };
                    
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