angular.module('yds').directive('ydsFacetsNew', ['Data', function(Data){
	return {
		restrict: 'E',
		scope: {},
		templateUrl:'templates/facets-new.html',
		link: function(scope) {
			scope._ = _;           //make underscore.js accessible as scope variable
			scope.facets = [];     //copy the facets returned from the server
			scope.rawAppliedFacets = [];       //array to insert the applied facets in a format that can be used by ng-class

			scope.budgetSlider = {
				minValue: 10,
				maxValue: 10000,
				options: {
					hideLimitLabels: true,
					floor: 10,
					ceil: 10000,
					translate: function(value, sliderId, label) {
						switch (label) {
							case 'model':
								return '€' + value + 'K';
							case 'high':
								return '€' + value + 'K';
							default:
								return '€' + value + 'K';
						}
					}
				}
			};

			scope.completionSlider = {
				minValue: 0,
				maxValue: 100,
				options: {
					hideLimitLabels: true,
					floor: 0,
					ceil: 100,
					translate: function(value, sliderId, label) {
						switch (label) {
							case 'model':
								return '%' + value;
							case 'high':
								return '%' + value;
							default:
								return '%' + value
						}
					}
				}
			}

			scope.checkboxes = [{
				name: "Ανατολική Μακεδονία και Θράκη",
				selected: false
			}, {
				name: "Κεντρική Μακεδονία",
				selected: false
			}, {
				name: "Δυτική Μακεδονία",
				selected: false
			},{
				name: "Ήπειρος",
				selected: false
			},{
				name: "Θεσσαλία",
				selected: false
			},{
				name: "Ιόνιοι Νήσοι",
				selected: false
			},{
				name: "Δυτική Ελλάδα",
				selected: false
			},{
				name: "Στερεά Ελλάδα",
				selected: false
			},{
				name: "Αττική",
				selected: false
			},{
				name: "Πελοπόννησος",
				selected: false
			},{
				name: "Βόρειο Αιγαίο",
				selected: false
			},{
				name: "Νότιο Αιγαίο",
				selected: false
			},{
				name: "Κρήτη",
				selected: false
			}];

			scope.applyFilters = function() {
				//get the selected location from the geographical location facet
				var selLocations = _.where(scope.checkboxes, {selected: true});

				var completionLimits = {
					min: scope.completionSlider.minValue,
					max: scope.completionSlider.maxValue
				};

				var budgetLimits = {
					min: scope.budgetSlider.minValue,
					max: scope.budgetSlider.maxValue
				};

				debugger;
				/*
				 * add code to limit down the
				 * results based on the applied facets
				 *
				 */

			};
		}
	};
}]);