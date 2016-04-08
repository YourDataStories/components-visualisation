angular.module('yds').factory('Basket', [ 'YDS_CONSTANTS', '$q', '$http', function (YDS_CONSTANTS, $q, $http) {
	var basketCallbacks = [];
	var lastSavedItem = {};

	var notifyObservers = function (observerStack) { //function to trigger the callbacks of observers
		angular.forEach(observerStack, function (callback) {
			callback();
		});
	};

	return {
		registerCallback: function(callback) { basketCallbacks.push(callback); },
		getLastSavedItem: function() { return lastSavedItem; },
		createItem: function(userId) {
			return {
				user_id: userId,
				component_parent_uuid: "",
				title: "",
				tags: [],
				filters: [],
				component_type: "",
				content_type: "",
				type: "",
				is_private: true,
				lang: ""
			};
		},
		initializeItem: function (bskItem) {
			bskItem.title = "";
			bskItem.type = "";
			bskItem.is_private = true;
			bskItem.tags = [];
			bskItem.filters = [];

			return bskItem;
		},
		initializeModalItem: function () {
			return {
				alert: "",
				title: "",
				tags: "",
				type: "Dataset",
				is_private: true
			};
		},
		saveBasketItem: function(bskItem) {
			var deferred = $q.defer();
			lastSavedItem = angular.copy(bskItem);

			$http({
				method: 'POST',
				url: YDS_CONSTANTS.BASKET_URL + "save",
				headers: {'Content-Type': 'application/json'},
				data: JSON.stringify(bskItem)
			})
				.success(function (data) {
					notifyObservers(basketCallbacks);
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