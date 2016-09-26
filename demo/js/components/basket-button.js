angular.module('yds').directive('ydsBasketBtn', ['$compile', 'Data', 'Basket', 'Filters',
	function($compile, Data, Basket, Filters) {
	return {
		restrict: 'A',
		link: function (scope, element, attrs) {
			var projectId = scope.projectId;
			var viewType = scope.viewType;
			var lang = scope.lang;

			var elementClass = attrs.class;
			var visualisationType = "";
			var defaultVisTypes = ["pie", "line", "scatter", "bar", "map", "grid", "result"];
			
			//if projectId or viewType attr is undefined, stop the execution of the directive
			if (angular.isUndefined(projectId)|| angular.isUndefined(viewType)) {
				scope.addToBasket = false;
				return false;
			}

			//check if the language attr is defined, else assign default value
			if(angular.isUndefined(lang))
				lang = "en";

			//check if the element has id, accepted: "pie-container, line-container, bar-container, map-container"
			if (!angular.isUndefined(elementClass) && elementClass!="") {
				var visTypeFound = false;

				for (var i=0; i<defaultVisTypes.length; i++) {				//check if the main element is a valid yds container
					var visTypeIndex = elementClass.indexOf(defaultVisTypes[i]);

					//if the one of the defaultVisTypes exist in the element id, get the visualisation type
					if (visTypeIndex>-1) {
						visualisationType = defaultVisTypes[i];
						visTypeFound = true;
						break;
					}
				}

				if (!visTypeFound) {
					console.error('The embed extension cannot be applied on the selected element');
					return false;
				}
			} else
				return false;

			//check if the user has enabled the embedding of the selected element
			var enableBasket = scope.addToBasket;

			if (!_.isUndefined(enableBasket) && enableBasket=="true"){
				if (!angular.isUndefined(projectId) /*&& !isNaN(projectId)*/){
					var basketBtnX = scope.basketBtnX;		//indicates the x position the embed button
					var basketBtnY = scope.basketBtnY;		//indicates the y position the embed button

					//if embedBtnX property is undefined assign the default value
					if (angular.isUndefined(basketBtnX) || isNaN(basketBtnX))
						basketBtnX = 12;

					//if embedBtnY property is undefined assign the default value
					if (angular.isUndefined(basketBtnY) || isNaN(basketBtnY))
						basketBtnY = 12;


					var basketBtnTemplate = '<button type="button"' +
						'class="btn btn-default btn-xs embed-btn"' +
						'ng-click = "openBasketModal()">' +
						'<span class="glyphicon glyphicon-paperclip" aria-hidden="true"></span>' +
						'</button>';

					//compile the embed button and append it to the element's container
					var compiledTemplate = $compile(basketBtnTemplate)(scope);
					compiledTemplate.css('position', 'absolute');
					compiledTemplate.css('top', basketBtnY + 'px');
					compiledTemplate.css('left', basketBtnX + 'px');
					compiledTemplate.css('z-index', 999);
					compiledTemplate.css('font-size', 11 + 'px');
					compiledTemplate.css('cursor', 'pointer');

					element.parent().append(compiledTemplate);
				} else {
					console.error('The embed extension is not configured properly');
					return false;
				}
			} else {
				return false;
			}


			/***************************************/
			/******* BASKET'S MODAL FUNCS **********/
			/***************************************/

			//initialize the basket's modal reference;

			
			//function used to open the basket modal
			scope.openBasketModal = function () {
				var userId = Basket.getUserId();

				if (_.isUndefined(userId) || userId.length == 0) {
					console.error("User ID is empty! Using default \"ydsUser\" as user ID...");
					userId = "ydsUser";
				}

				var basketConfig = {
					user_id: userId,
					lang: lang,
					type: "Dataset",
					component_type: visualisationType,
					content_type: viewType,
					component_parent_uuid: projectId,
					filters: Filters.get(element[0].id)
				};

				var modalRestrictions = {
					Dataset: true,
					Visualisation: true
				};
				
				Basket.openModal(basketConfig, modalRestrictions);
			};
		}
	}
}]);