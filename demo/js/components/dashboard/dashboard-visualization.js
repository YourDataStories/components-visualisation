angular.module("yds").directive("ydsDashboardVisualization", ["DashboardService", "Data", "$ocLazyLoad", "$timeout",
    function (DashboardService, Data, $ocLazyLoad, $timeout) {
        return {
            restrict: "E",
            scope: {
                projectId: "@",             // Project ID of chart
                dashboardId: "@",           // ID used for getting selected year range from DashboardService
                addToBasket: "@",           // If true, the save to basket button will appear in visualizations
                disableColor: "@",          // If true, the component will ignore the color of the selected aggregate type
                defaultChart: "@",          // Chart to show on initialization of the component. Default is "bar".
                type: "@",                  // View type of component. If not set, will get it from DashboardService
                lang: "@",                  // Language of charts
                baseUrl: "@",               // Base URL to send to API
                title: "@",                 // Title of component
                elementH: "@",              // Height of component
                dynamicDashboard: "@",      // Set to true if you are using this in a Dashboard with dynamic filters

                numberOfItems: "@",         // Number of items that the charts are expected to show. If too big, will use paging
                pagingThreshold: "@",       // Number of items that when exceeded, components with paging should be used

                disableAggregates: "@",     // If true, will disable the extra filters for amount/count
                disableNormalisation: "@",  // If true, will disable the extra filters for GDP/per capita

                enableRating: "@"           // Enable rating buttons for this component
            },
            templateUrl: Data.templatePath + "templates/dashboard/dashboard-visualization.html",
            link: function (scope) {
                var dashboardId = scope.dashboardId;
                var disableColor = scope.disableColor;
                var defaultChart = scope.defaultChart;
                var type = scope.type;
                scope.usePaging = false;    // Paging disabled by default

                scope.aggregateRadio = {
                    value: "amount"
                };

                scope.normaliseRadio = {
                    value: "gdp"
                };

                scope.enableBudget = false;         // Budget button disabled by default

                // Set the amount/count button translations and, if needed, the default title
                if (scope.lang === "el") {
                    scope.title = scope.title || "Λεπτομέρειες";
                    scope.translations = {
                        amount: "Ποσό",
                        budget: "Προϋπολογισμός",
                        count: "Αριθμός",
                        tooltip: "Επιλέξτε αν τα γραφήματα θα παρουσιάζουν ποσά ή αριθμούς αντικειμένων.",
                        prompt: "Προβολή:",
                        gdp: "GDP",
                        pcap: "Per capita",
                        normalisePrompt: "Normalise:"
                    };
                } else {
                    scope.title = scope.title || "Details";
                    scope.translations = {
                        amount: "Amount",
                        budget: "Budget",
                        count: "Number",
                        tooltip: "Select whether visualisations will present amounts or counts over items.",
                        prompt: "Show:",
                        gdp: "GDP",
                        pcap: "Per capita",
                        normalisePrompt: "Normalise:"
                    };
                }

                // Enable the Budget button only for Aid Activities
                if (dashboardId === "aidactivity") {
                    scope.enableBudget = true;

                    // Set amount button to "Spending"
                    scope.translations.amount = (scope.lang === "el") ? "Δαπάνες" : "Spending";
                }

                // If the pagingThreshold is set, watch for changes in the number of items
                scope.pagingThreshold = parseInt(scope.pagingThreshold);

                if (!_.isUndefined(scope.pagingThreshold) && !_.isNaN(scope.pagingThreshold)) {
                    scope.$watch("numberOfItems", function () {
                        // Check if paging should be used
                        scope.usePaging = parseInt(scope.numberOfItems) >= scope.pagingThreshold;
                    });
                }

                // Check if the component's height attribute is defined, else assign default value
                if (_.isUndefined(scope.elementH) || scope.elementH.trim() === "")
                    scope.elementH = 300;

                // If dashboardId is undefined, show error
                if (_.isUndefined(dashboardId) || dashboardId.trim() === "")
                    dashboardId = "default";

                // If disableColor is undefined, show error
                if (_.isUndefined(disableColor) || (disableColor !== "true" && disableColor !== "false"))
                    disableColor = "false";

                // If disableAggregates is undefined, set it to false
                if (_.isUndefined(scope.disableAggregates) || (scope.disableAggregates !== "true" && scope.disableAggregates !== "false"))
                    scope.disableAggregates = "false";

                // If defaultChart is undefined, show bar chart
                if (_.isUndefined(defaultChart)) {
                    defaultChart = "bar";
                }

                // Set minimum height of details panel body
                scope.panelBodyStyle = {
                    "min-height": (parseInt(scope.elementH) + 30) + "px"
                };

                scope.selectedVis = DashboardService.getSelectedVisType();

                // Set the first type as default selected one
                scope.selProjectId = scope.projectId;
                scope.selViewType = "";

                // Variables for previous values, to check that something really changed before re-rendering component
                var prevViewType = "";
                var updateVis = false;

                /**
                 * Re-render the selected visualization
                 */
                var updateVisualization = function () {
                    if (updateVis) {
                        var selectedVis = defaultChart;
                        if (scope.selectedVis.length > 0) {
                            selectedVis = scope.selectedVis;
                        }

                        // Make selectedVis empty in order for the component to re-render
                        scope.selectedVis = "";

                        // Postpone to end of digest queue
                        $timeout(function () {
                            scope.selectVis(selectedVis);

                            updateVis = false;
                        });
                    }
                };

                /**
                 * Update the view type from the DashboardService
                 * Also sets the Visualization panel's color
                 */
                var updateViewType = function () {
                    prevViewType = scope.selViewType;
                    var viewType = DashboardService.getViewType(dashboardId);

                    if (!_.isUndefined(type) && type.length > 0) {
                        // Use view type from attribute
                        viewType = {
                            type: type
                        };
                    }

                    if (!_.isUndefined(viewType) && !_.isEqual(prevViewType, viewType.type)) {
                        scope.selViewType = viewType.type;

                        if (disableColor !== "true") {
                            scope.panelStyle = viewType.panelStyle;
                            scope.panelHeadingStyle = _.omit(viewType.panelHeadingStyle, "min-height");
                        }

                        updateVis = true;
                    }
                };

                /**
                 * Handle view type selection changes
                 */
                var viewTypeChangeHandler = function () {
                    updateViewType();
                    updateVisualization();
                };

                if (_.isUndefined(type) || type.length === 0) {
                    // Subscribe to year selection and view type changes
                    DashboardService.subscribeViewTypeChanges(scope, viewTypeChangeHandler);
                }

                /**
                 * Change selected visualization type
                 * @param visType
                 */
                scope.selectVis = function (visType) {
                    scope.selectedVis = visType;

                    DashboardService.setVisType(visType);
                };

                // Initialize component
                viewTypeChangeHandler();
            }
        };
    }
]);
