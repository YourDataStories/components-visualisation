/******************************************************************************

 Copyright (c) 2016, Highsoft

 Permission is hereby granted, free of charge, to any person obtaining
 a copy of this software and associated documentation files (the
 "Software"), to deal in the Software without restriction, including
 without limitation the rights to use, copy, modify, merge, publish,
 distribute, sublicense, and/or sell copies of the Software, and to
 permit persons to whom the Software is furnished to do so, subject to
 the following conditions:

 The above copyright notice and this permission notice shall be
 included in all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
 CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

 ******************************************************************************/

/**
 * Modified ChartTemplateSelector, in order to highlight some templates
 * @param parent
 * @param suggestedTemplates    Object with a "templates" array property, which contains the template objects to highlight
 * @returns {{on: highed.events.on, resize: resize, rebuild: build}}
 * @constructor
 */
highed.YDSChartTemplateSelector = function (parent, suggestedTemplates) {
    var events = highed.events(),
        container = highed.dom.cr('div', 'highed-chart-template-container'),
        splitter = highed.HSplitter(container, {leftWidth: 30}),
        hintNode = highed.dom.cr('div', 'highed-tooltip'),
        list = highed.List(splitter.left),
        templates = splitter.right,
        selected = false
        ;

    highed.dom.style(hintNode, {
        display: 'none'
    });

    highed.dom.ap(parent, container);

    ///////////////////////////////////////////////////////////////////////////

    function showTemplates(templateList, masterID) {
        templates.innerHTML = '';

        Object.keys(templateList).forEach(function (key) {
            var t = templateList[key],
                node = highed.dom.cr('div', 'highed-chart-template-preview'),
                titleBar = highed.dom.cr('div', 'highed-chart-template-title', t.title)
                ;

            if (t.constr === 'StockChart' && typeof Highcharts.StockChart === 'undefined') {
                return;
            }

            if (selected && selected.id === masterID + key + t.title) {
                node.className = 'highed-chart-template-preview highed-chart-template-preview-selected';
                selected.node = node;
            }

            // Check if this template is in the suggested templates (using only its configuration)
            var result = _.findWhere(suggestedTemplates.templates, {
                config: t.config
            });

            // If it is, add the glow class to it
            if (!_.isUndefined(result)) {
                node.className += " template-glow";
            }

            highed.dom.style(node, {
                'background-image': 'url(' + t.urlImg + ')'
            });

            highed.dom.showOnHover(node, titleBar);

            highed.dom.on(node, 'mouseenter', function () {
                if (t.tooltipText) {
                    hintNode.innerHTML = t.tooltipText;
                    highed.dom.style(hintNode, {display: 'block'});
                    events.emit('Hover', t);
                }
            });

            highed.dom.on(node, 'mouseleave', function () {
                hintNode.innerHTML = '';
                highed.dom.style(hintNode, {display: 'none'});
            });

            highed.dom.on(node, 'click', function () {
                if (selected) {
                    selected.node.className = 'highed-chart-template-preview';
                }

                node.className = 'highed-chart-template-preview highed-chart-template-preview-selected';

                selected = {
                    id: masterID + key + t.title,
                    node: node
                };

                events.emit('Select', templateList[key]);
            });

            highed.dom.ap(templates,
                highed.dom.ap(node,
                    titleBar
                )
            );
        });
    }

    /* Force a resize */
    function resize(w, h) {
        var lsize;

        splitter.resize(w, h);
        list.resize();

        lsize = highed.dom.size(list.container);
        highed.dom.style(templates, {
            minHeight: lsize.h + 'px'
        });
    }

    /* Build the UI */
    function build() {
        //Need to check that highstock is included here, and remove things
        //parents that only have highstock templates.

        list.addItems(Object.keys(highed.meta.chartTemplates).map(function (key) {
            return {
                id: key,
                title: highed.meta.chartTemplates[key].title
            };
        }));

        list.selectFirst();
    }

    list.on('Select', function (id) {
        showTemplates(highed.meta.chartTemplates[id].templates, id);
    });

    build();

    highed.dom.ap(splitter.left, hintNode);

    return {
        on: events.on,
        resize: resize,
        rebuild: build
    };
};
