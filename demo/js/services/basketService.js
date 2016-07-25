angular.module('yds').factory('Basket', [ 'YDS_CONSTANTS', '$q', '$http', '$uibModal',
function (YDS_CONSTANTS, $q, $http, $uibModal) {
	var basketCallbacks = [];
	var lastSavedItem = {};
	var modalInstance = {};

	var notifyObservers = function (observerStack) { //function to trigger the callbacks of observers
		angular.forEach(observerStack, function (callback) {
			callback();
		});
	};

	//private function accessible only through the BasketModalCtrl in order to close the modalInstance
	var closeModal = function () {
		modalInstance.close();
	};

	return {
		registerCallback: function(callback) { basketCallbacks.push(callback); },
		getLastSavedItem: function() { return lastSavedItem; },
		openModal: function(basketInput, modalRestrictions) {
			var modalInput = {
				title: "Add to Basket",
				closeModal: closeModal,
				modalRestrict: modalRestrictions
			};

			modalInstance = $uibModal.open({
				animation: false,
				controller: 'BasketModalCtrl',
				templateUrl: ((typeof Drupal != 'undefined')? Drupal.settings.basePath  + Drupal.settings.yds_project.modulePath  +'/' :'') + 'templates/basket-modal.html',
				size: 'md',
				resolve: {
					basketInput: function () {
						return basketInput;
					},
					modalInput: function() {
						return modalInput;
					}
				}
			});

			return modalInstance;
		},
		formatBasketTags : function (tagsString) {
			//tokenize the basket item tags and save them to the basket item obj
			//if not tag is available, assign the default value "untagged"
			var basketTags = [];
			tagsString = tagsString.trim();
			if (tagsString.length>0) {
				var tmpTags = tagsString.split(',');

				_.each(tmpTags, function(tag){
					basketTags.push(tag.trim());
				});
			} else {
				basketTags.push("untagged");
			}

			return basketTags;
		},
		checkIfItemExists: function(bskItem){
			var deferred = $q.defer();

			$http({
				method: 'GET',
				url: YDS_CONSTANTS.BASKET_URL + "exists_item",
				headers: {'Content-Type': 'application/json; charset=UTF-8'},
				params: bskItem
			}).success(function (data) {
				deferred.resolve(data);
			}).error(function (error) {
				deferred.reject(error);
			});

			return deferred.promise;
		},
		saveBasketItem: function(bskItem) {
			var deferred = $q.defer();
			lastSavedItem = angular.copy(bskItem);

			$http({
				method: 'POST',
				url: YDS_CONSTANTS.BASKET_URL + "save",
				headers: {'Content-Type': 'application/json'},
				data: JSON.stringify(bskItem)
			}).success(function (data) {
				notifyObservers(basketCallbacks);
				deferred.resolve(data);
			}).error(function (error) {
				deferred.reject(error);
			});

			return deferred.promise;
		},
		getBasketItem : function (userId, basketItemId) {
			var deferred = $q.defer();

			$http({
				method: 'GET',
				url: YDS_CONSTANTS.BASKET_URL + "retrieve/" + userId + "/" + basketItemId,
				headers: {'Content-Type': 'application/json'}
			}).success(function (data) {
				deferred.resolve(data);
			}).error(function (error) {
				deferred.reject(error);
			});

			return deferred.promise;
		},
		getBasketItems: function(userId, type) {
			var deferred = $q.defer();

			var contType = "";
			if ( type.toLowerCase() == "dataset" )
				contType = "?basket_type=dataset";
			else if ( type.toLowerCase() == "visualisation" )
				contType = "?basket_type=visualisation";

			$http({
				method: 'GET',
				url: YDS_CONSTANTS.BASKET_URL + "get/" + userId + contType,
				headers: {'Content-Type': 'application/json'}
			}).success(function (data) {
				deferred.resolve(data);
			}).error(function (error) {
				deferred.reject(error);
			});

			return deferred.promise;
		},
		deleteBasketItems: function (userId, bskID) {
			var deferred = $q.defer();

			$http({
				method: 'POST',
				url: YDS_CONSTANTS.BASKET_URL + "remove/" + userId,
				headers: {'Content-Type': 'application/x-www-form-urlencoded'},
				transformRequest: function (obj) {
					var str = [];
					for (var p in obj)
						str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
					return str.join("&");
				},
				data: {
					"basket_item_id": bskID
				}
			}).success(function (data) {
				deferred.resolve(data);
			}).error(function (error) {
				deferred.reject(error);
			});

			return deferred.promise;
		}
	}
}]);


angular.module('yds').controller('BasketModalCtrl', function ($scope, modalInput, basketInput, Basket) {
	//configuration of the shown modal
	$scope.modalConfig = {
		restriction: modalInput.modalRestrict,
		closeModal: modalInput.closeModal,
		title: modalInput.title,
		alert: ""
	};

	//prepare the basket item
	$scope.basketObj = {
		title: "",
		type: basketInput.type,
		filters: basketInput.filters,
		lang: basketInput.lang,
		user_id: basketInput.user_id,
		content_type: basketInput.content_type,
		component_parent_uuid: basketInput.component_parent_uuid,
		component_type: basketInput.component_type,
		is_private: true,
		tags: ""
	};

	//function to save a basket item
	$scope.saveBasketItem = function () {
		if ($scope.basketObj.title.trim().length==0) {
			$scope.modalConfig.alert = "Please provide a title for your item";
			return false;
		} else
			$scope.basketObj.tags = Basket.formatBasketTags($scope.basketObj.tags);

	//call the service to check if basket item exists

		Basket.saveBasketItem($scope.basketObj)
		.then(function(response){
			$scope.clearModalWarnings($scope.modalConfig);
			$scope.dismissModal();
		}, function(error){
			$scope.modalConfig.alert = "An error occurred, please try again";
		});
	};
	
	//function to clear modal warning messages
	$scope.clearModalWarnings = function (modalConfig) {
		if (modalConfig.alert.trim().length>0)
			modalConfig.alert = "";
	};

	//function to be called when the modal's cancel button is pressed
	$scope.dismissModal = function() {
		$scope.modalConfig.closeModal();
	}
});


