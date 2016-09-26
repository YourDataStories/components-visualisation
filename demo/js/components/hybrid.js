angular.module('yds').directive('ydsHybrid', ['Data', '$http', '$stateParams', '$location',
	function(Data, $http, $stateParams, $location){
	return {
		restrict: 'E',
		scope: {},
		templateUrl: ((typeof Drupal != 'undefined')? Drupal.settings.basePath  + Drupal.settings.yds_project.modulePath  +'/' :'') + 'templates/hybrid.html',
		compile: function(tElem, tAttrs){
			return {
				pre: function(scope, element, iAttrs) {
					scope.ydsAlert = "";
					var embedCode = $stateParams.embedCode;

					var hybridContainer = angular.element(element[0].querySelector('.hybrid-container'));

					//create a random id for the element that will render the chart
					var elementId = "hybrid" + Data.createRandomId();
					hybridContainer[0].id = elementId;

					// Recover saved object from embed code and visualise it
					Data.recoverEmbedCode(embedCode)
					.then (function (response) {
						var filters = [];
						var facets = response.embedding.facets;
						if (!_.isEmpty(facets)) {
							var facetValues = _.first(facets).facet_values;
							if (!_.isEmpty(facetValues)) {
								filters = _.first(facetValues).attrs;
							}
						}

                        visualiseProject(response.embedding.project_id, response.embedding.type, filters,
							response.embedding.view_type, response.embedding.lang);
					}, function (error) {
						scope.ydsAlert = error.message;
					});

					/**
					 * Get visualization parameters and add them to the scope so the correct
					 * visualization is shown
					 * @param projectId Project ID
					 * @param vizType   Type of visualization to show (pie, grid, bar etc.)
					 * @param filters   Any extra parameters for the component (countries, year range etc.)
					 * @param viewType  View type of compoennt
					 * @param lang      Language of component
					 */
					var visualiseProject = function (projectId, vizType, filters, viewType, lang) {
						// Set scope variables that will be used by the embedded component
						scope.projectId = projectId;
						scope.lang = lang;
						scope.extraParams = filters;
						scope.viewType = viewType;
						if (_.isUndefined(scope.viewType) || scope.viewType == "undefined") {
							scope.viewType = "default";
						}

						// Set visualization type so the ng-switch shows the component
						scope.vizType = vizType.toLowerCase();
					};
				}
			}
		}
	}
}]);
