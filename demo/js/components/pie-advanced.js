angular.module('yds').directive('ydsPieAdvanced', ['$timeout', '$q', 'Data', function ($timeout, $q, Data) {
    return {
        restrict: 'E',
        scope: {
            projectId: '@',     //id of the project that the data belong
            viewType: '@',     //name of the array that contains the visualised data
            lang: '@',          //lang of the visualised data

            showLegend: '@',    //enable or disable the chart's legend
            exporting: '@',     //enable or disable the export of the chart
            elementH: '@',      //set the height of the component
            titleSize: '@',     //the size of the chart's main title

            combobox: '@',			//set the types of the combobox filters (year, country)
            comboboxLabels: '@',	//set the labels that will be used for each combobox
            comboboxAttrs: '@'		//set the parameter each combobox will sent to the the server
        },
        templateUrl: Data.templatePath + 'templates/pie-advanced.html',
        link: function (scope, element, attrs) {
            //reference the dom element in which the yds-pie-advanced is rendered
            var pieContainer = angular.element(element[0].querySelector('.pie-container'));

            //set the variables which will be used for the creation of the pie chart
            var pie = {
                elementId: "pie" + Data.createRandomId(),
                projectId: scope.projectId,
                viewType: scope.viewType,
                lang: scope.lang,
                showLegend: scope.showLegend,
                exporting: scope.exporting,
                elementH: scope.elementH,
                titleSize: scope.titleSize,
                combobox: scope.combobox,
                comboboxLabels: scope.comboboxLabels,
                comboboxAttrs: scope.comboboxAttrs
            };

            //array containing the selected data of the rendered comboboxes
            scope.comboboxFilters = [];
            //object containing the data for each different type of combobox
            scope.comboboxData = {};


            //check if the projectId is defined, else stop the process
            if (angular.isUndefined(pie.projectId) || pie.projectId.trim() === "") {
                scope.ydsAlert = "The YDS component is not properly configured." +
                    "Please check the corresponding documentation section";
                return false;
            }

            //check if view-type attribute is empty and assign the default value
            if (_.isUndefined(pie.viewType) || pie.viewType.trim() === "")
                pie.viewType = "default";

            //check if the language attr is defined, else assign default value
            if (angular.isUndefined(pie.lang) || pie.lang.trim() === "")
                pie.lang = "en";

            //check if the showLegend attr is defined, else assign default value
            if (angular.isUndefined(pie.showLegend) || (pie.showLegend !== "true" && pie.showLegend !== "false"))
                pie.showLegend = "true";

            //check if the exporting attr is defined, else assign default value
            if (angular.isUndefined(pie.exporting) || (pie.exporting !== "true" && pie.exporting !== "false"))
                pie.exporting = "true";

            //check if the component's height attr is defined, else assign default value
            if (angular.isUndefined(pie.elementH) || isNaN(pie.elementH))
                pie.elementH = 200;

            //check if the component's title size attr is defined, else assign default value
            if (angular.isUndefined(pie.titleSize) || isNaN(pie.titleSize))
                pie.titleSize = 18;

            //add the unique id generated for the pie component and set its height
            pieContainer[0].id = pie.elementId;
            pieContainer[0].style.height = pie.elementH + 'px';


            /**
             * function show errors on top of the visualization
             **/
            var showAlert = function (alertMsg, predefined, persistent) {
                if (!predefined)
                    scope.ydsAlert = alertMsg;
                else
                    scope.ydsAlert = "The YDS component is not properly initialized " +
                        "because the projectId or the viewType attribute aren't configured properly." +
                        "Please check the corresponding documentation section";

                if (!persistent)
                    $timeout(function () {
                        scope.ydsAlert = "";
                    }, 2000);
            };


            /**
             * function to get the required data of each different type of combobox
             **/
            var getComboFilterData = function (name, attribute) {
                var deferred = $q.defer();

                Data.getComboboxFilters(pie.projectId, "combobox." + name, attribute, pie.lang)
                    .then(function (response) {
                        scope.comboboxData[attribute] = response.data;

                        //find the filter entry and assign the default value
                        var filterObj = _.findWhere(scope.comboboxFilters, {"attribute": attribute});
                        if (!_.isUndefined(filterObj))
                            filterObj.selected = _.findWhere(response.data, response.default);

                        deferred.resolve(response);
                    }, function (error) {
                        deferred.reject(error);
                    });

                return deferred.promise;
            };


            /**
             * function to extract the combobox values defined on the element's attributes
             **/
            var extractFilters = function () {
                //check if all the required attributes for the rendering of fthe comboboxes are defined
                if (!_.isUndefined(pie.combobox) && !_.isUndefined(pie.comboboxLabels) && !_.isUndefined(pie.comboboxAttrs)) {
                    //extract and trim their values
                    var filterPromises = [];
                    pie.combobox = pie.combobox.replace(/ /g, "").split(",");
                    pie.comboboxAttrs = pie.comboboxAttrs.replace(/ /g, "").split(",");
                    pie.comboboxLabels = pie.comboboxLabels.split(",");

                    //if the different combobox attributes have the same length, extract and save its values
                    if (pie.combobox.length == pie.comboboxLabels.length &&
                        pie.combobox.length == pie.comboboxAttrs.length &&
                        pie.comboboxLabels.length == pie.comboboxAttrs.length) {

                        _.each(pie.combobox, function (value, index) {
                            var newFilter = {
                                selected: "",
                                type: value,
                                label: pie.comboboxLabels[index],
                                attribute: pie.comboboxAttrs[index]
                            };

                            scope.comboboxFilters.push(newFilter);
                            filterPromises.push(getComboFilterData(newFilter.type, newFilter.attribute));
                        });

                        //when the data of all the filters have been returned, create the corresponding visualization
                        $q.all(filterPromises).then(function () {
                            scope.applyComboFilters();
                        }, function (error) {
                            showAlert("", true, true);
                        });
                    } else {
                        showAlert("", true, true);
                    }
                } else
                    showAlert("", true, true);
            };


            /**
             * function to render the pie chart based on the available filters
             **/
            var visualizePieChart = function (filters) {
                //if the pie chart is being initialized for the first time
                //set its options and render the chart without data
                if (_.isUndefined(pie["chart"])) {
                    var options = {
                        chart: {
                            type: 'pie',
                            renderTo: pie.elementId
                        },
                        title: {
                            text: "",
                            style: {fontSize: pie.titleSize + "px"}
                        },
                        tooltip: {pointFormat: '({point.y}) <b>{point.percentage:.1f}%</b>'},
                        legend: {enabled: (pie.showLegend === "true")},
                        exporting: {enabled: (pie.exporting === "true")},
                        plotOptions: {
                            pie: {
                                allowPointSelect: true,
                                cursor: 'pointer',
                                dataLabels: {
                                    enabled: true,
                                    format: '<b>{point.name}</b>: {point.percentage:.1f} %',
                                    style: {
                                        width: '300px',
                                        color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black'
                                    }
                                }
                            }
                        }
                    };

                    pie["chart"] = new Highcharts.Chart(options);
                }

                //if the chart has already been rendered, fetch data from the server and visualize the results
                Data.getProjectVisAdvanced("pie", pie.projectId, pie.viewType, pie.lang, filters)
                    .then(function (response) {
                        //get the title of the chart from the result
                        var titlePath = response.view[0].attribute;
                        var pieTitle = Data.deepObjSearch(response.data, titlePath);

                        //set the chart's title
                        pie["chart"].setTitle({text: pieTitle});

                        //remove the existing pie chart series
                        while (pie["chart"].series.length > 0)
                            pie["chart"].series[0].remove(true);

                        //add the new series to the pie chart
                        pie["chart"].addSeries({
                            name: response.data.series,
                            data: response.data.data,
                            colorByPoint: true
                        });
                    }, function (error) {
                        showAlert(error.message, false, false);
                    });
            };


            /**
             * function called when the 'apply filters' btn is clicked
             **/
            scope.applyComboFilters = function () {
                var appliedFilters = {};

                //iterate through the data of the rendered filters and check which of them are selected
                _.each(scope.comboboxFilters, function (filter) {
                    if (filter.selected != null && !_.isUndefined(filter.selected.value))
                        appliedFilters[filter.attribute] = filter.selected.value;
                });

                ///if at least one of the filters is not selected show an error message
                if (_.keys(appliedFilters).length != scope.comboboxFilters.length) {
                    var errorMsg = "Please select a value for all the available filters";
                    showAlert(errorMsg, false, false);
                } else {
                    //if all the filters is selected update the pie
                    visualizePieChart(appliedFilters);
                }
            };


            /**
             * function called when the 'clear filters' btn is clicked
             **/
            scope.clearComboFilters = function () {
                //clear the filters' error message and initialize the selected value of each filter
                scope.ydsAlert = "";

                _.each(scope.comboboxFilters, function (filter) {
                    filter.selected = "";
                });
            };

            //extract the user provided filters, and render the pie chart
            extractFilters()
        }
    };
}]);