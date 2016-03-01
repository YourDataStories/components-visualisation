angular.module('yds').directive('ydsBasketBtn', ['$compile', 'Data', '$uibModal', 'Basket', 'Filters',
	function($compile, Data, $uibModal, Basket, Filters) {
	return {
		restrict: 'A',
		link: function (scope, element, attrs) {
			var projectId = scope.projectId;
			var tableType = scope.tableType;
			var lang = scope.lang;

			var elementClass = attrs.class;
			var visualisationType = "";
			var defaultVisTypes = ["pie", "line", "bar", "map", "grid"];
			scope.basketItem = Basket.createItem();

			//if projectId or tableType attr is undefined, stop the execution of the directive
			if (angular.isUndefined(projectId)|| angular.isUndefined(tableType)) {
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

			//formulate the basket item based on the element's attributes
			scope.basketItem.lang = lang;
			scope.basketItem.component_type = visualisationType;
			scope.basketItem.content_type = tableType;
			scope.basketItem.component_parent_uuid = projectId;

			//check if the user has enabled the embedding of the selected element
			var enableBasket = scope.addToBasket;

			if (!angular.isUndefined(enableBasket) && enableBasket=="true"){
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
			var basketModal = {};

			//function used to open the basket modal
			scope.openBasketModal = function () {
				//initialize object
				scope.basketItem = Basket.initializeItem(scope.basketItem);
				scope.basketItem.filters = Filters.get(element[0].id);

				scope.modalInput = Basket.initializeModalItem();
				scope.modalOptions = { title: "Add to Basket" };

				basketModal = $uibModal.open({
					animation: false,
					templateUrl: 'templates/basket-modal.html',
					scope: scope,
					size: 'md'
				});
			};

			//function to be called when the modal's cancel button is pressed
			scope.dismissBasketModal = function () { basketModal.dismiss(''); };

			//function to clear basket's modal warnings
			scope.clearModalWarnings = function (inputObj) {
				if (inputObj.alert.length>0)
					inputObj.alert = "";
			};

			//function to be called when save to basket button of the modal is pressed
			scope.insertToBasket = function (inputObj, basketItemObj) {
				if (inputObj.title.length==0) {
					inputObj.alert = "Please provide a title for your item";
					return false;
				}

				//tokenize the basket item tags and save them to the basket item obj
				//if not tag is available, assign the default value "untagged"
				var tmpTags = [];
				inputObj.tags= inputObj.tags.trim();

				if (inputObj.tags.length>0) {
					tmpTags=inputObj.tags.split(',');
				}

				if(tmpTags.length>0){
					for (var j=0; j<tmpTags.length; j++) {
						basketItemObj.tags.push(tmpTags[j].trim());
					}
				} else {
					basketItemObj.tags.push("untagged");
				}

				//save the title, type and public attributes to the basket item obj
				basketItemObj.title = inputObj.title;
				basketItemObj.type = inputObj.type;
				basketItemObj.is_private = inputObj.is_private;

				//TODO: Call Service and save the basket item obj
				Basket.saveBasketItem(basketItemObj)
				.then(function(response){
					inputObj.alert = "";
					basketModal.close();

				}, function(error){
					inputObj.alert = "An error occurred, please try again";
				});
			};
		}
	}
}]);