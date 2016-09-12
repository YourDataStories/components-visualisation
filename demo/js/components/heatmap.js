angular.module('yds').directive('ydsHeatmap', ['Data', '$ocLazyLoad', 'DashboardService',
	function (Data, $ocLazyLoad, DashboardService) {
		return {
			restrict: 'E',
			scope: {
				projectId: '@',         // ID of the project that the data belong
				viewType: '@',          // Name of the array that contains the visualised data
				lang: '@',			    // Lang of the visualised data
				colorAxis: '@',         // Enable or disable colored axis of chart
				colorType: '@',			// Axis color type (linear or logarithmic)
				legend: '@',            // Enable or disable chart legend
				legendVAlign: '@',      // Vertical alignment of the chart legend (top, middle, bottom)
				legendHAlign: '@',      // Horizontal alignment of the chart legend (left, center, right)
				legendLayout: '@',      // Layout of the chart legend (vertical, horizontal)
                useYearRange: '@',      // If true will watch the selected year range of DashboardService to update map
				countrySelection: '@',  // Allow selecting countries on the map
				noBorder: '@',			// If true, the component will have no border
				exporting: '@',         // Enable or disable the export of the chart
				elementH: '@'		    // Set the height of the component
			},
			templateUrl: ((typeof Drupal != 'undefined')? Drupal.settings.basePath  + Drupal.settings.yds_project.modulePath  +'/' :'') + 'templates/heatmap.html',
			link: function (scope, elem, attrs) {
				var projectId = scope.projectId;
				var viewType = scope.viewType;
				var lang = scope.lang;
				var colorAxis = scope.colorAxis;
				var colorType = scope.colorType;
				var legend = scope.legend;
				var legendVAlign = scope.legendVAlign;
				var legendHAlign = scope.legendHAlign;
				var legendLayout = scope.legendLayout;
				var useYearRange = scope.useYearRange;
				var countrySelection = scope.countrySelection;
				var noBorder = scope.noBorder;
				var exporting = scope.exporting;
				var elementH = scope.elementH;

				var heatmapContainer = angular.element(elem[0].querySelector('.heatmap-container'));

				//create a random id for the element that will render the chart
				var elementId = "heatmap" + Data.createRandomId();
				heatmapContainer[0].id = elementId;

				//check if project id or grid type are defined
				if(angular.isUndefined(projectId) || projectId.trim()=="") {
					scope.ydsAlert = "The YDS component is not properly initialized " +
						"because the projectId attribute isn't configured properly." +
						"Please check the corresponding documentation section";
					return false;
				}

				//check if view-type attribute is empty and assign the default value
				if(_.isUndefined(viewType) || viewType.trim()=="")
					viewType = "default";

				//check if the language attr is defined, else assign default value
				if(angular.isUndefined(lang) || lang.trim()=="")
					lang = "en";

				//check if colorAxis attr is defined, else assign default value
				if (_.isUndefined(colorAxis) || colorAxis.trim()=="")
					colorAxis = "false";

				//check if colorType attr is defined, else assign default value
				if (_.isUndefined(colorType) || colorType.trim()=="")
					colorType = "linear";

				//check if legend attr is defined, else assign default value
				if (_.isUndefined(legend) || legend.trim()=="")
					legend = "false";

				//check if legendVAlign attr is defined, else assign default value
				if (_.isUndefined(legendVAlign) || legendVAlign.trim()=="")
					legendVAlign = "top";

				//check if legendVAlign attr is defined, else assign default value
				if (_.isUndefined(legendHAlign) || legendHAlign.trim()=="")
					legendHAlign = "center";

				//check if legendLayout attr is defined, else assign default value
				if (_.isUndefined(legendLayout) || legendLayout.trim()=="")
					legendLayout = "horizontal";

				//check if watchYearRange attr is defined, else assign default value
				if (_.isUndefined(useYearRange) || useYearRange.trim()=="")
                    useYearRange = "false";

				//check if countrySelection attr is defined, else assign default value
				if (_.isUndefined(countrySelection) || countrySelection.trim()=="")
					countrySelection = "false";

				//check if the noBorder attr is defined, else assign default value
				if(_.isUndefined(noBorder) || (noBorder!="true" && noBorder!="false"))
					noBorder = "false";

				//check if the exporting attr is defined, else assign default value
				if(_.isUndefined(exporting) || (exporting!="true" && exporting!="false"))
					exporting = "true";

				//check if the component's height attr is defined, else assign default value
				if(_.isUndefined(elementH) || _.isNaN(elementH))
					elementH = 300;

				// Setup base heatmap options
				var heatmapOptions = {
					initialized: false,
					chart : {
						renderTo: elementId,
						borderWidth: (noBorder == "true") ? 0 : 1
					},
					title : { text : '' },
					mapNavigation: {
						enabled: true,
						buttonOptions: {
							style: {display: 'none'}
						}
					},
					legend: { enabled: false },
					exporting: { enabled: (exporting === "true") },
					series: []
				};

				// Add default color axis to heatmap options
				if (colorAxis == "true") {
					heatmapOptions.colorAxis = {
						min: 1,
						type: colorType,
						minColor: '#EEEEFF',
						maxColor: '#000022',
						stops: [
							[0, '#EFEFFF'],
							[0.67, '#4444FF'],
							[1, '#000022']
						]
					};
				}

				// Add chart legend to heatmap options
				if (legend == "true") {
					heatmapOptions.legend = {
						layout: legendLayout,
						borderWidth: 0,
						backgroundColor: 'rgba(255,255,255,0.85)',
						floating: true,
						verticalAlign: legendVAlign,
						align: legendHAlign
					}
				}

				//set the height of the chart
				heatmapContainer[0].style.height = elementH + 'px';

				// Load map data from highcharts and create the heatmap
				$ocLazyLoad.load ({
					files: ['https://code.highcharts.com/mapdata/custom/world.js'],
					cache: true
				}).then(function() {
					if (useYearRange == "true") {
						DashboardService.subscribeYearChanges(scope, createHeatmap);
					}

					createHeatmap();
				});

				/**
				 * Function that takes array of points from Highmaps and keeps only the
				 * country names, codes and values
				 * @param points
				 * @returns {*}
				 */
				var formatPoints = function(points) {
					return points.map(function(p) {
						return {
							name: p.name,
							code: p.code,
							value: p.value
						};
					});
				};

				/**
				 * Creates the heatmap on the page if it doesn't exist, or updates it
				 * with the new data if it is initialized already
				 * @param response	Server response from heatmap API
				 */
				var visualizeHeatmap = function(response) {
					// Initialize heatmap if it's not initialized
					if (!heatmapOptions.initialized) {
						// Create empty heatmap
						scope.heatmap = new Highcharts.Map(heatmapOptions);

						heatmapOptions.initialized = true;
					} else if (!_.isEmpty(scope.heatmap.series)) {
						// If heatmap has a series, remove it
						scope.heatmap.series[0].remove();

                        DashboardService.clearCountries();
                    }

					// If view has color axis use that instead of default one
					if (colorAxis == "true") {
						var view = _.first(response.view);

						if (_.has(view, "colorAxis")) {
							scope.heatmap.colorAxis[0].update(view.colorAxis);
						}
					}

					// Create new series object
					var newSeries = {
						name: 'Country',
						mapData: Highcharts.maps['custom/world'],
						data: response.data,
						mapZoom: 2,
						joinBy: ['iso-a2', 'code'],
						dataLabels: {
							enabled: true,
							color: '#FFFFFF',
							formatter: function () {
								if (this.point.value) {
									return this.point.name;
								}
							}
						},
						tooltip: {
							headerFormat: '',
							pointFormat: '{point.name}'
						}
					};

					// Allow selecting countries
					if (countrySelection == "true") {
						newSeries.allowPointSelect = true;
						newSeries.cursor = "pointer";

						newSeries.states = {
							select: {
								color: '#a4edba',
								borderColor: 'black',
								dashStyle: 'shortdot'
							}
						};

						newSeries.point = {
							events: {
								select: function () {
									// Get selected points
									var points = scope.heatmap.getSelectedPoints();
									points.push(this);

									points = formatPoints(points);

									// Give new selected countries to the service
									DashboardService.setCountries(points);
								},
								unselect: function(event) {
									// Get selected points
									var points = scope.heatmap.getSelectedPoints();

									// Remove unselected points from points
									var pIndex = points.indexOf(this);
									if (pIndex > -1 ) {
										points.splice(pIndex, 1);
									}

									points = formatPoints(points);

									// Give new selected countries to the service
									DashboardService.setCountries(points);
								}
							}
						};
					}

					// Add new series to the heatmap
					scope.heatmap.addSeries(newSeries);
				};

				/**
				 * Shows an error to the user (for when heatmap API returns error)
				 * @param error
				 */
				var createHeatmapError = function(error) {
					if (error==null || _.isUndefined(error) || _.isUndefined(error.message))
						scope.ydsAlert = "An error has occurred, please check the configuration of the component";
					else
						scope.ydsAlert = error.message;
				};

				/**
				 * Get extra parameters if needed, fetch data and call the function to render the heatmap component
				 */
				var createHeatmap = function() {
					if (useYearRange == "true") {
                        var minYear = DashboardService.getMinYear();
                        var maxYear = DashboardService.getMaxYear();

                        // Create extra parameters object with year
						if (!_.isNaN(minYear) && !_.isNaN(maxYear)) {
							var extraParams = {
								year: "[" + minYear + " TO " + maxYear + "]"
							};
						}
                    }

					// Get heatmap data
					Data.getProjectVis("heatmap", projectId, viewType, lang, extraParams)
						.then(visualizeHeatmap, createHeatmapError);
				};
			}
		}
	}
]);
