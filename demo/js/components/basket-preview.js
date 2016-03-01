angular.module('yds').directive('ydsBasketPreview', ['Data' , '$compile', '$timeout','Basket',
	function(Data, $compile, $timeout,Basket){
	return {
		restrict: 'E',
		scope: {
			userId:'@'
		},
		replace: true,
		templateUrl:'templates/basket-preview.html',
		link: function(scope, element) {

			scope.results = [];

			var prevElement = angular.element(element[0]);

			var showSidebar = function(){
				$timeout(function(){
					if (!prevElement.hasClass('slide-in') && !prevElement.hasClass('slide-out')) {
						prevElement.addClass('slide-in');
					} else if (prevElement.hasClass('slide-out')) {
						prevElement.addClass('slide-in');
						prevElement.toggleClass('slide-out');
					}
				}, 200);
			};

			scope.toggleVisibility = function() {
				if (prevElement.hasClass('slide-in')) {
					prevElement.addClass('slide-out');
					prevElement.toggleClass('slide-in');
				} else if (prevElement.hasClass('slide-out')) {
					getBasketItem();
					prevElement.addClass('slide-in');
					prevElement.toggleClass('slide-out');
				} else
					getBasketItem();
					prevElement.addClass('slide-in');
			};


			var getBasketItem = function(){
				Basket.getBasketItems(scope.userId).then(function (response) {
					scope.results = angular.copy(response.items);
				}, function (error) {
					console.log('error', error);
				});
			}

			scope.deleteBasketItem = function(bskId){
				debugger;
				//Basket.getBasketItems(scope.userId).then(function (response) {
				//	scope.results = angular.copy(response.items);
				//}, function (error) {
				//	console.log('error', error);
				//});
			}
		}
	};
}]);