/**
 * YDS Editor (modification of Highcharts Editor's normal editor)
 * @param parent                Parent DOM element to put Editor in
 * @param attributes            Attributes of the Editor
 * @param createViewSelector    Function to call for creating the view/axes selection tab content
 * @returns {*}
 * @constructor
 */
highed.YDSEditor = function (parent, attributes, createViewSelector) {
    var events = highed.events(),

        properties = highed.merge({
            defaultChartOptions: {},
            on: {},
            plugins: {},
            features: 'welcome import export templates customize',
            includeSVGInHTMLEmbedding: true,
            importer: {},
            exporter: {},
            availableSettings: false,
            useContextMenu: true,
            useHeader: true
        }, attributes),

        container = highed.dom.cr('div', 'highed-container'),
        expandContainer = highed.dom.cr('div', 'highed-expand-container'),

        wizbody = highed.dom.cr('div'),

        mainToolbar = highed.Toolbar(container, {
            additionalCSS: ['highed-header']
        }),

        splitter = highed.HSplitter(container, {
            leftWidth: 60,
            rightClasses: 'highed-chart-preview-bar',
            allowResize: false,
            leftMax: 800
        }),

        wizbar = highed.WizardBar(container, splitter.left),

        welcomeStep = wizbar.addStep({title: highed.getLocalizedStr('stepStart')}),

        dataImpStep = wizbar.addStep({title: highed.getLocalizedStr('stepImport')}),
        dataImp = highed.DataImporter(dataImpStep.body, properties.importer),

        dataTableStep = wizbar.addStep({title: highed.getLocalizedStr('stepData')}),
        dataTable = highed.DataTable(dataTableStep.body),

        viewTypeStep = wizbar.addStep({title: "Axes"}),
        viewTypeSelector = createViewSelector(viewTypeStep.body),

        templateStep = wizbar.addStep({title: highed.getLocalizedStr('stepTemplates')}),
        chartTemplateSelector = highed.ChartTemplateSelector(templateStep.body),

        chartContainer = highed.dom.cr('div', 'highed-box-size highed-chart-container'),
        chartPreview = highed.ChartPreview(chartContainer, {
            defaultChartOptions: properties.defaultChartOptions,
            expandTo: expandContainer
        }),

        customizerStep = wizbar.addStep({title: highed.getLocalizedStr('stepCustomize'), id: 'customize'}),
        chartCustomizer = highed.ChartCustomizer(customizerStep.body, {
            availableSettings: properties.availableSettings
        }),

        dataExpStep = wizbar.addStep({title: highed.getLocalizedStr('stepExport'), id: 'export'}),
        dataExp = highed.Exporter(dataExpStep.body, properties.exporter),

        doneBtn = highed.dom.cr('div', 'highed-ok-button', highed.getLocalizedStr('doneCaption')),
        doneStep = wizbar.addStep({title: highed.getLocalizedStr('stepDone')}),

        chartIcon = highed.dom.cr('div', 'highed-chart-container-icon'),

        cmenu = highed.DefaultContextMenu(chartPreview)
        ;

    cmenu.on('NewChart', function () {
        dataImpStep.activate();
    });

    properties.features = highed.arrToObj(properties.features.split(' '));

    ////////////////////////////////////////////////////////////////////////

    function updateToolbarIcon() {
        if (highed.onPhone()) {
            highed.dom.style(chartIcon, {
                'background-image': 'url("data:image/svg+xml;utf8,' +
                encodeURIComponent(chartPreview.export.svg()) +
                '")'
            });
        }
    }

    //Hide features that are disabled
    function applyFeatures() {
        var things = properties.features;

        if (!things.export) {
            dataExpStep.hide();
        }

        if (!things.import) {
            dataImpStep.hide();
        }

        if (!things.templates) {
            templateStep.hide();
        }

        if (!things.customize) {
            customizerStep.hide();
        }

        if (!things.welcome) {
            welcomeStep.hide();
        }

        if (!things.done) {
            doneStep.hide();
        }

        if (!things.data) {
            dataTableStep.hide();
        }

        wizbar.selectFirst();
    }

    /**
     * Force a resize of the editor
     * @memberof highed.YDSEditor
     */
    function resize() {
        var cs = highed.dom.size(container),
            ms = highed.dom.size(mainToolbar.container),
            wb = highed.dom.size(wizbar.container)
            ;

        if (!properties.useHeader) {
            ms = {
                w: 0,
                h: 0
            };
        }

        //wizbar.resize(undefined, cs.h - ms.h - wb.h);
        chartCustomizer.resize(undefined, cs.h - ms.h - wb.h);
        chartTemplateSelector.resize(undefined, cs.h - ms.h - wb.h);
        splitter.resize(cs.w, cs.h - ms.h - wb.h);
        dataExp.resize(cs.w, cs.h - ms.h - wb.h);
        chartPreview.resize();
        dataImp.resize(cs.w, cs.h - ms.h - wb.h);
        dataTable.resize();
        events.emit('Resized');


        highed.dom.style(chartContainer, {
            'max-height': (cs.h - ms.h - wb.h) + 'px'
        });
    }

    function destroy() {
        if (container.parentNode) {
            container.parentNode.removeChild(container);
        }
    }

    ///////////////////////////////////////////////////////////////////////////

    highed.dom.on(doneBtn, 'click', function () {
        events.emit('Done');
    });

    //Attach to parent node
    highed.ready(function () {
        parent = highed.dom.get(parent);
        if (parent) {
            highed.dom.ap(parent,
                highed.dom.ap(container,
                    expandContainer
                )
            );

            highed.dom.ap(splitter.right,
                chartContainer
            );

            highed.dom.style(splitter.right, {
                //    overflow: 'hidden'
            });

            doneStep.body.className += ' highed-done-pane';

            highed.dom.ap(doneStep.body,
                highed.dom.cr('div', '', [
                    '<h2>All done? Great!</h2>',
                    'Click the button below to close the editor'
                ].join('<br/>')),
                doneBtn
            );

            highed.dom.ap(mainToolbar.left,
                highed.dom.style(highed.dom.cr('div', 'highed-logo'), {
                    'background-image': 'url("data:image/svg+xml;utf8,' +
                    encodeURIComponent(highed.resources.logo) +
                    '")'
                })
            );

            resize();

            if (!highed.onPhone()) {
                highed.dom.on(window, 'resize', resize);
            }
        } else {
            highed.log(1, 'no valid parent supplied to editor');
        }

        highed.dom.style(welcomeStep.body, {padding: '0 20px'});

        highed.dom.ap(welcomeStep.body,
            highed.dom.cr('h2', '', 'Welcome'),
            highed.dom.cr('div', '', 'This wizard will take you through the process of creating your very own chart.'),
            highed.dom.cr('br'),
            highed.dom.cr('div', '', 'Follow the steps below to get started!')
        );
    });

    ////////////////////////////////////////////////////////////////////////

    chartTemplateSelector.on('Select', chartPreview.loadTemplate);
    chartCustomizer.on('PropertyChange', chartPreview.options.set);
    dataImp.on('ImportCSV', chartPreview.data.csv);
    dataImp.on('ImportJSON', chartPreview.data.json);
    dataImp.on('ImportChartSettings', chartPreview.data.settings);

    chartPreview.on('RequestEdit', function (event, x, y) {
        chartCustomizer.focus(event, x, y);
    });

    if (properties.features.data) {
        dataTable.on('Change', function (headers, data) {
            if (data.length) {
                var d = dataTable.toDataSeries();

                chartPreview.options.set('xAxis-categories', d.categories, 0);

                chartPreview.loadSeries(d.series);
            }
        });
    }

    ///////////////////////////////////////////////////////////////////////////

    wizbar.on('Step', function (step, count, thing) {
        if (thing.id === 'export') {
            dataExp.init(
                chartPreview.export.json(),
                chartPreview.export.html(properties.includeSVGInHTMLEmbedding),
                chartPreview.export.svg(),
                chartPreview
            );
            dataExp.buildPluginUI();
        } else if (thing.id === 'customize') {
            chartCustomizer.init(chartPreview.options.customized, chartPreview.options.chart);
        }
    });

    //Route preview events
    chartPreview.on('ChartChange', function (newData) {
        events.emit('ChartChange', newData);

    });

    chartPreview.on('ChartChangeLately', function (newData) {
        events.emit('ChartChangeLately', newData);
    });

    ///////////////////////////////////////////////////////////////////////////

    //Attach event listeners defined in the properties
    if (!highed.isBasic(properties.on)) {
        Object.keys(properties.on).forEach(function (event) {
            if (highed.isFn(properties.on[event])) {
                events.on(event, properties.on[event]);
            } else {
                highed.log(2, 'tried attaching a non-function to' + event);
            }
        });
    } else {
        highed.log(2, 'on object in editor properties is not a valid object');
    }

    //Activate plugins
    properties.plugins = highed.arrToObj(properties.plugins);
    Object.keys(properties.plugins).forEach(function (name) {
        highed.plugins.use(name, properties.plugins[name] || {});
    });

    // //Dispatch change events to the active plugins
    // chartPreview.on('ChartChangeLately', function (options) {
    //
    //     updateToolbarIcon();
    //
    //     Object.keys(activePlugins).forEach(function (key) {
    //         var plugin = activePlugins[key];
    //         if (highed.isFn(plugin.definition.chartchange)) {
    //             plugin.definition.chartchange.apply(plugin.options, [{
    //                 json: highed.merge({}, chartPreview.options.customized)
    //             }, plugin.options]);
    //         }
    //     });
    // });

    applyFeatures();

    chartCustomizer.init(chartPreview.options.customized, chartPreview.options.chart);

    mainToolbar.addIcon({
        css: 'fa-bar-chart',
        click: function () {
            chartPreview.expand();
        }
    });

    if (properties.useContextMenu) {
        mainToolbar.addIcon({
            css: 'fa-gear',
            click: function (e) {
                cmenu.show(e.clientX, e.clientY);
            }
        });
    }

    updateToolbarIcon();

    highed.ready(function () {
        resize();
        window.scrollTo(0, 1);
    });

    if (!properties.useHeader) {
        highed.dom.style(mainToolbar.container, {
            display: 'none'
        });
    }

    chartPreview.on('RequestResize', resize);

    ///////////////////////////////////////////////////////////////////////////

    //Public interface
    return {
        on: events.on,
        /* Force a resize of the editor */
        resize: resize,
        /* Get embeddable javascript */
        getEmbeddableHTML: chartPreview.export.html,
        /* Get embeddable json */
        getEmbeddableJSON: chartPreview.export.json,
        /* Get embeddable SVG */
        getEmbeddableSVG: chartPreview.export.svg,
        /* Destroy the editor */
        destroy: destroy,
        /** The main toolbar
         *  @memberof highed.YDSEditor
         *  @type {highed.Toolbar}
         */
        toolbar: mainToolbar,
        /** The chart preview attached to the editor
         *  @memberof highed.YDSEditor
         *  @type {highed.ChartPreview}
         */
        chart: chartPreview,
        /** The data importer instance attached to the editor
         *  @memberof highed.YDSEditor
         *  @type {highed.DataImporter}
         */
        importer: dataImp
    };
};
