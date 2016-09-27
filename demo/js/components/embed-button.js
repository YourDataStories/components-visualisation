angular.module('yds').directive('ydsEmbed', ['$compile', 'Data', 'Filters', function($compile, Data, Filters) {
	return {
		restrict: 'A',
		link: function (scope, element, attrs) {
			var projectId = scope.projectId;
			var viewType = scope.viewType;

			var elementClass = attrs.class;
			var embedCode = "";
			var visualisationType = "";
			var defaultVisTypes = ["pie", "line", "scatter", "bar", "tree", "map", "grid"];

			//check if the element has one of the accepted IDs: "pie-container", "line-container", "bar-container", "map-container" etc.
			if (!_.isUndefined(elementClass) && elementClass != "") {
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
			} else {
				return false;
			}

			//if projectId or viewType attr is undefined, stop the execution of the directive
			if (_.isUndefined(projectId) || (_.isUndefined(viewType) && visualisationType != "map")) {
				scope.embeddable = false;
				return false;
			}

			//check if the user has enabled the embedding of the selected element
			var embeddable = scope.embeddable;

			if (!_.isUndefined(embeddable) && embeddable=="true"){
				if (!_.isUndefined(projectId) /*&& !isNaN(projectId)*/){
					var popoverPos = scope.popoverPos;		//indicates the position the popover
					var embedBtnX = scope.embedBtnX;		//indicates the x position the embed button
					var embedBtnY = scope.embedBtnY;		//indicates the y position the embed button
					var defaultPos = ["top", "bottom", "left", "right"];

					//if popover position is undefined assign the default value
					if (_.isUndefined(popoverPos) || _.indexOf(defaultPos, popoverPos)==-1)
						popoverPos = "right";

					//if embedBtnX property is undefined assign the default value
					if (_.isUndefined(embedBtnX) || _.isNaN(embedBtnX))
						embedBtnX = 12;

					//if embedBtnY property is undefined assign the default value
					if (_.isUndefined(embedBtnY) || _.isNaN(embedBtnY))
						embedBtnY = 12;

					scope.popoverOpen = false;    //flag that indicates if the embed tooltip is shown
					scope.popover = {
						content: '',
						templateUrl: ((typeof Drupal != 'undefined')? Drupal.settings.basePath  + Drupal.settings.yds_project.modulePath  +'/' :'') + 'templates/embed-popover.html',
						title: 'Embed Code'
					};

					var embedBtnTemplate = '<button type="button"' +
							'class="btn btn-default btn-xs embed-btn"' +
							'ng-click = "requestEmbed(this)"' +
							'popover-trigger = "none"' +
							'popover-is-open="popoverOpen"' +
							'popover-placement="'+ popoverPos + '"' +
							'uib-popover-template="popover.templateUrl">' +
							'<span class="glyphicon glyphicon-log-in" aria-hidden="true"></span>' +
							'</button>';

					//compile the embed button and append it to the element's container
					var compiledTemplate = $compile(embedBtnTemplate)(scope);
					compiledTemplate.css('position', 'absolute');
					compiledTemplate.css('top', embedBtnY + 'px');
					compiledTemplate.css('left', embedBtnX + 'px');
					compiledTemplate.css('z-index', 999);
					compiledTemplate.css('font-size', 11 + 'px');
					compiledTemplate.css('cursor', 'pointer');

					element.parent().append(compiledTemplate);
				} else {
					console.error('The embed extension is not configured properly');
					return false;
				}
			} else
				return false;

			scope.requestEmbed = function () {
				if (embedCode=="") {          //if the request code doesn't exist
					var facets = [{
						facet_type : "",
						facet_values: Filters.get(element[0].id)
					}];
					var lang = (scope.lang || "en");	// if scope.lang is undefined, use English

					Data.requestEmbedCode(projectId, facets, visualisationType, viewType, lang)
					.then(function (response) {
						embedCode = response.generated_hash;
						scope.popover.content = '<iframe src="' +
								'http://ydsdev.iit.demokritos.gr/YDSComponents/#!/embed/'+ embedCode +
								'" style="width:600px; height:300px">' +
								'<p>Your browser does not support iframes.</p>' +
								'</iframe>';
						this.popoverOpen = true;
					}, function (error) {
						console.log('request embed code error:', error);
					});
				} else
					this.popoverOpen = !this.popoverOpen;
			};
		}
	}
}]);
