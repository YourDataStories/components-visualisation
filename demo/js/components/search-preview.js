angular.module('yds').directive('ydsSearchPreview', ['Data' , '$compile', '$timeout', function(Data, $compile, $timeout){
	return {
		restrict: 'E',
		scope: {},
		replace: true,
		templateUrl:'templates/search-preview.html',
		link: function(scope, element) {
			var prevElement = angular.element(element[0]);
			var innerPrevElement = angular.element(element[0].querySelector('.yds-search-prev-inner'));

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
					prevElement.addClass('slide-in');
					prevElement.toggleClass('slide-out');
				} else
					prevElement.addClass('slide-in');
			};


			//listener for previsualiseResult event fired from the results
			scope.$on('previsualiseResult', function (event, data) {
				var inputData = data;
				var projectId = inputData.projectId;
				scope.projectTitle = inputData.projectTitle

				//remove all charts from the element, if they exist
				if (innerPrevElement[0].hasChildNodes()) {
					var fc = innerPrevElement[0].firstChild;

					while( fc ) {
						innerPrevElement[0].removeChild( fc );
						fc = innerPrevElement[0].firstChild;
					}
				}

				var componentH = 190;
				var barChart = $compile(
					'<yds-bar project-id="' + projectId + '" ' +
						'element-h="' + componentH + '"' +
						'exporting="false"  ' +
						'show-labels-Y="false" ' +
						'show-labels-X="false" ' +
						'title-size="14" ' +
						'show-legend="false">' +
					'</yds-bar>')(scope);

				var lineChart = $compile(
					'<yds-line project-id="' + projectId + '" ' +
					'element-h="' + componentH + '"' +
					'exporting="false"  ' +
					'title-size="14" ' +
					'show-navigator="false">' +
					'</yds-line>')(scope);

				var pieChart = $compile(
					'<yds-pie project-id="' + projectId + '" ' +
					'element-h="' + componentH + '"' +
					'exporting="false"  ' +
					'title-size="14" ' +
					'show-legend="false">' +
					'</yds-pie>')(scope);

				var mapProjectId = 200122;
				var mapChart = $compile(
					'<yds-map project-id="' + mapProjectId + '" ' +
					'zoom-control="false" ' +
					'element-h="' + componentH + '">' +
					'</yds-map>')(scope);

				innerPrevElement.append(lineChart);
				innerPrevElement.append(barChart);
				innerPrevElement.append(pieChart);
				innerPrevElement.append(mapChart);

				showSidebar();
			});


		}
	};
}]);