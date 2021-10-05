import * as azmaps from 'azure-maps-control';
import { DynamicLegend, DynamicLegendType } from '../helpers/DynamicLegend';
import { Utils } from '../helpers/Utils';
import { BaseControl, BaseControlEvents, BaseControlOptions } from './BaseControl';

/** Category legend item options. */
export interface CategoryLegendItem {

    /** The fill color of SVG items of an individual category item. Overrides `CategoryLegendType` level `color`. Default: 'transparent' */
    color?: string;

    /** The label to display for the item. */
    label?: string | number;

    /** The shape of the color swatch. Overrides the top level shape setting for this individual item. Supports image urls and SVG strings. **/
    shape?: 'circle' | 'triangle' | 'square' | 'line' | string;

    /** The size of the individual shape in pixels. Used to scale the width of the shape. Overrides `CategoryLegendType` level `shapeSize`. Default: 20 */
    shapeSize?: number;

    /** The thickness of the stroke on SVG shapes in pixels. Overrides `CategoryLegendType` level `strokeWidth`. Default: `1` */
    strokeWidth?: number;

    /** A CSS class added to an individual item. */
    cssClass?: string;
}

/** Category legend type options. */
export interface CategoryLegendType extends LegendType {
    /** The type of legend. */
    type: 'category';

    /** The category items. */
    items?: CategoryLegendItem[];

    /** How all items are laid out. Overrides the CSS `flex-direction` style. Default: 'column' */
    layout?: 'row' | 'row-reverse' | 'column' | 'column-reverse';

    /** How the color swatch and label of each item are laid out. Overrides the CSS `flex-direction` style. Default: 'row' */
    itemLayout?: 'row' | 'row-reverse' | 'column' | 'column-reverse';

    /** The fill color of SVG items in all category items. */
    color?: string;

    /** The shape of the color swatches of all items. Supports image urls and SVG strings. Default: 'circle' */
    shape?: 'circle' | 'triangle' | 'square' | 'line' | string;

    /** The size of the all shapes in pixels. Used to scale the width of the shape. Default: 20 */
    shapeSize?: number;

    /** Specifies if all items should be fit into the largest container created by an item. Default: false */
    fitItems?: boolean;

    /** The thickness of the stroke on SVG shapes in pixels. Default: `1` */
    strokeWidth?: number;

    /** Specifies if the text label should be centered overtop the shapes. Default: `false`  */
    labelsOverlapShapes?: boolean;

    /** The number format options to use when converting a number label to a string. */
    numberFormat?: Intl.NumberFormatOptions;

    /** The number format locales to use when converting a number label to a string. */
    numberFormatLocales?: string | string[];

    /** Specifies if space around the shapes should be collapsed so that items are close together. Default: `false` */
    collapse?: boolean;
}

/** A simple legend where the content is an image. */
export interface ImageLegendType extends LegendType {
    /** The type of legend. */
    type: 'image';

    /** A URL, or inline SVG string for the legend content. */
    url: string;

    /** Accessibility description of the legend image. Falls back to `subtitle` if not specified. */
    altText?: string;

    /** Max height of the image. */
    maxHeight?: number;

    /** Max width of the image. */
    maxWidth?: number;
}

/** A legend where custom HTML is set as the content. */
export interface HtmlLegendType extends LegendType {
    /** The type of legend. */
    type: 'html';

    /** HTML legend content. */
    html: string | HTMLElement;
}

/** Color stop used for gradients and steps. */
export interface ColorStop {
    /** The offset to add the color to the gradient. 0.0 is the offset at one end of the gradient, 1.0 is the offset at the other end. */
    offset: number;

    /** The color to apply at the stop. */
    color: string;

    /** A label to display at this stop. */
    label?: string | number;
}

/** A legend for a sequential gradient scale.  */
export interface GradientLegendType extends LegendType {
    /** The type of legend. */
    type: 'gradient';

    /** The color stops that form the gradient. */
    stops: ColorStop[];

    /** The orientation of the legend. Default: `'horizontal'` */
    orientation?: 'vertical' | 'horizontal';

    /** The length of line ticks for each label. Default: `5` */
    tickSize?: number;

    /** The length of the gradient bar in pixels. Default: `200` */
    barLength?: number;

    /** How thick the gradient bar should be in pixels. Default: `20` */
    barThickness?: number;

    /** The font size used for labels. Default: `12` */
    fontSize?: number;

    /** The font family used for labels. Default: `"'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif"` */
    fontFamily?: string;

    /** The number format options to use when converting a number label to a string. */
    numberFormat?: Intl.NumberFormatOptions;

    /** The number format locales to use when converting a number label to a string. */
    numberFormatLocales?: string | string[];
}

/** Base legend type that all other legend types inherit from. */
export interface LegendType {
    /** The type of legend to create. */
    type: 'category' | 'dynamic' | 'image' | 'html' | 'gradient';

    /** The title for this specific legend. */
    subtitle?: string;

    /** Text to be added at the bottom of the legend. */
    footer?: string;

    /** A CSS class to append to the legend type container. */
    cssClass?: string;

    /** Min zoom level that this legend should appear.  Default: `0` */
    minZoom?: number;

    /** Max zoom level that this legend should appear. Default: `24` */
    maxZoom?: number;
    
    /** Specifies how a legend card should be treated when the map zoom level falls outside of the items min and max zoom range. Default: `'hide'` */
    zoomBehavior?: 'disable' | 'hide';
}

/** Options for a legend control. */
export interface LegendControlOptions extends BaseControlOptions {
    /** The top level title of the legend control. */
    title?: string;

    /** The type of legends to generate. */
    legends?: LegendType[];

    /** Resource strings. */
    resx?: Record<string, string>;
}

/** Events fired by the Legend Control. */
export interface LegendControlEvents extends BaseControlEvents {
    /** Event that fires when a legend is programmatically focused. */
    legendfocused: LegendFocusEventArgs;
}

/** Event args returned when a legend is focused. */
export interface LegendFocusEventArgs {
    /** The index of the legend in the array of legends in the legend control options. */
    legendIdx: number;

    /** The legend that is focused. */
    legend: LegendType;

    /** The event type name. */
    type: 'legendfocused'
}

/** A control that displays legend information on the map. */
export class LegendControl extends BaseControl<LegendControlEvents> {
    /****************************
    * Private Properties
    ***************************/

    private _options: LegendControlOptions = {
        resx: {},
        layout: 'carousel',
        style: <azmaps.ControlStyle>'light',
        visible: true,
        legends: [],
        zoomBehavior: 'hide',
        showToggle: true,
        minimized: false
    };

    private _legendIdx = 0;
    private _currentLegend: LegendType = null;
    private _layerOptCache: Record<string, string> = {};

    /****************************
     * Constructor
     ***************************/

    /**
     * A control that displays a legend.
     * @param options Options for defining how the control is rendered and functions.
     */
    constructor(options?: LegendControlOptions) {
        super(0, 'atlas-legend-control-container', 'atlas-legend-btn');

        this.setOptions(options);
    }

    /****************************
     * Public Methods
     ***************************/

    /** Gets the options of the legend control. */
    public getOptions(): LegendControlOptions {
        return Object.assign({}, this._options);
    }

    /**
     * Sets the style of the legend control.
     * @param options Legend control options.
     */
    public setOptions(options?: LegendControlOptions): void {
        options = options || {};

        const self = this;
        const opt = self._options;

        Object.keys(options).forEach(key => {
            const val = options[key];

            if (val !== undefined) {
                switch (key) {
                    case 'style':
                    case 'visible':
                    case 'container':
                    case 'layout':
                    case 'zoomBehavior':
                        //@ts-ignore
                        opt[key] = val;
                        break;
                    case 'legends':
                        opt[key] = val;
                        //If the current legend isn't in the new set of legends, set the current legend to null and reset the legend index to 0.
                        let idx = 0;

                        if (val !== null && self._currentLegend) {
                            idx = val.indexOf(self._currentLegend);

                            if (idx === -1) {
                                self._currentLegend = null;
                                idx = 0;
                            }
                        } else {
                            //All legends removed.
                            self._currentLegend = null;
                            idx = 0;
                        }

                        self._legendIdx = idx;

                        let hasZoomRange = false;

                        val.forEach(l => {
                            l.minZoom = Utils.getNumber(l, 'minZoom', 0, 0);
                            l.maxZoom = Utils.getNumber(l, 'maxZoom', 0, 24);

                            //Only consider data zoomable if the zoom range is not the max range of 0 to 24.
                            if (l.minZoom !== 0 || l.maxZoom !== 24 || l.type === 'dynamic') {
                                hasZoomRange = true;
                            }
                        });

                        self._hasZoomableContent = hasZoomRange;

                        if (val) {
                            self.setLegendIdx(idx);
                        }
                        self._needsRebuild = true;
                        break;
                    default:
                        opt[key] = val;
                        self._needsRebuild = true;
                        break;
                }
            }
        });

        super.setOptions(options);
    }

    /**
     * Navigates to the specified legend index within a carousel or list.
     * @param idx The legend index in the array of legends in the legend control options.
     * @param focus Specifies if tab focus should move inside of the specified legend.
     */
    public setLegendIdx(idx: number, focus?: boolean): void {
        this._setItemIndex(idx, focus);
    }

    /**
     * Adds a legend to the legend control. If the legend is already in the control, it will update the carousel index to focus on this legend.
     * @param legend The legend to add.
     * @param show A boolean indicating if this legend should be displayed.
     */
    public add(legend: LegendType, show: boolean, skipRebuildFocus?: boolean): void {
        const self = this;
        const idx = self._getLegendIdx(legend);

        //Make sure legend is not already in the legend control.
        if (idx === -1) {
            //Add the legend.
            self._options.legends.push(legend);

            if (focus) {
                self._legendIdx = self._options.legends.length - 1;
                self._currentLegend = legend;
            }

            legend.minZoom = Utils.getNumber(legend, 'minZoom', 0, 0);
            legend.maxZoom = Utils.getNumber(legend, 'maxZoom', 0, 24);

            if (legend.minZoom !== 0 || legend.maxZoom !== 24) {
                self._hasZoomableContent = true;
            }

            if(!skipRebuildFocus){
                //Rebuild the legend control. 
                self._rebuildContainer();
            }
        } else if (show) {
            //If the legend is already added, and they simply want to focus on it, then do that.
            self.setLegendIdx(idx);
        }
    }

    /**
     * Puts the specified legend in view of the user. If in carousel mode, will switch to that legend.
     * @param legend The legend to focus on.
     */
    public focus(legend: LegendType): void {
        const self = this;
        const idx = self._getLegendIdx(legend);

        //Make sure legend is in the legend control.
        if (idx !== -1) {
            //If the legend is already added, and they simply want to focus on it, then do that.
            self.setLegendIdx(idx);
        }
    }

    /**
     * Removes a legend from the legend control.
     * @param legend The legend to remove.
     */
    public remove(legend: LegendType, skipRebuild?: boolean): void {
        const self = this;
        const idx = self._getLegendIdx(legend);
        const legends = self._options.legends;

        //Make sure legend is in the legend control.
        if (idx > -1 && legends.length > idx) {
            //If this is the current legend, move down one legend.
            if (self._legendIdx === idx) {
                if (legends.length > 1) {
                    self._legendIdx = idx - 1;
                    self._currentLegend = legends[idx - 1];
                } else {
                    self._legendIdx = -1;
                    self._currentLegend = null;
                }
            }

            //Remove the legend.
            legends.splice(idx, 1);

            if(!skipRebuild){
                //Rebuild the legend control. 
                self._rebuildContainer();
            }
        }
    }

    public onAdd(map: azmaps.Map, options?: azmaps.ControlOptions): HTMLElement {
        map.events.add('styledata', this._styleDataChanged);
        return super.onAdd(map, options);
    }

    public onRemove(): void {
        if(this._map){
            this._map.events.remove('styledata', this._styleDataChanged);
        }
        super.onRemove();
    }

    /****************************
     * Private Methods
     ***************************/

    public _replaceMany(oldLegends: LegendType[], newLegends: LegendType[]): void {
        const self = this;
        
        if(oldLegends){
            oldLegends.forEach(l => {
                self.remove(l, true);
            });            
        }

        //Remember current legend/idx.
        const currentLegend = self._currentLegend;
        const legendIdx = self._legendIdx;

        if(newLegends){
            newLegends.forEach(l => {
                self.add(l, false, true);
            });    
        }

        if(legendIdx > -1 && currentLegend) {
            self._currentLegend = currentLegend; 
            self._legendIdx = legendIdx; 
        }

        //Rebuild the legend control. 
        self._rebuildContainer();
    }

    private _styleDataChanged = (): void => {
        const self = this;
        const layerOptCache = self._layerOptCache;
        const map = self._map;

        //Loop through monitored layers and if any of their options have changed, rebuild legend.
        let needsRebuild = false;

        Object.keys(layerOptCache).forEach(key => {            
            const l = map.layers.getLayerById(key);

            const opt = layerOptCache[key];
            const opt2 = DynamicLegend.serializeLayerOptions(l);

            if(opt !== opt2) {
                needsRebuild = true;
            }
        });

        if(needsRebuild){
            self._rebuildContainer();
        }
    }

    /**
     * Navigates to the specified legend index within a carousel or list.
     * @param idx The legend index in the array of legends in the legend control options.
     * @param focus Specifies if tab focus should move inside of the specified legend.
     */
    public _setItemIndex(idx: number, focus?: boolean): void {
        const self = this;

        if (self._content) {
            self._setCardIdx(idx, focus);

            idx = self._currentIdx;

            const legends = self._options.legends;

            //Capture the current legend.
            const l = (typeof idx !== 'undefined') ? ((legends.length > idx) ? legends[idx] : null) : null;
            self._currentLegend = l;

            self._invokeEvent('legendfocused', {
                legendIdx: idx,
                legend: l,
                type: 'legendfocused'
            });
        }
    }

    /**
     * Gets the index of a legend within the array of legends in the legend control options.
     * @param legend The legend to get the index for.
     * @returns The index of a legend within the array of legends in the legend control options.
     */
    public _getLegendIdx(legend: LegendType): number {
        return this._options.legends.indexOf(legend);
    }

    /**
     * Creates the legend control content.
     */
    public _createContent(): void {
        const self = this;
        const opt = self._options;
        const resx = opt.resx || {};
        const layout = opt.layout;

        const layerOptCache: any = {};
        self._layerOptCache = layerOptCache;

        let legends = [];

        opt.legends.forEach(l => {
            if (l.type === 'dynamic') {
                const dlg = <DynamicLegendType>l;
                const dynmaicLg = DynamicLegend.parse(dlg, self);

                if(dynmaicLg && dynmaicLg.length > 0){
                    legends = legends.concat(dynmaicLg);

                    dynmaicLg.forEach(d => {
                        if(d.minZoom !== 0 || d.maxZoom !== 24){
                            self._hasZoomableContent = true;
                        }
                    });

                    const mapLayer = Utils.getLayer(dlg.layer, self._map);
                    if(mapLayer['getOptions']){                        
                        layerOptCache[mapLayer.getId()] = DynamicLegend.serializeLayerOptions(mapLayer);
                    }
                }
            } else {
                legends.push(l);
            }
        });

        if (self._content) {
            self._content.remove();
        }

        //Create content container.
        const content = document.createElement('div');
        content.className = 'atlas-legend-control';
        self._content = content;

        //Add top level legend card title.
        Utils.addStringDiv(content, opt.title, 'atlas-legend-title', resx, true);

        //Add legends.
        if (legends && legends.length > 0) {
            const dotContainer = document.createElement('div');
            dotContainer.className = 'atlas-carousel-dot-container';

            let rebuildOnStyleChange = false;

            for (let i = 0; i < legends.length; i++) {
                const lg = legends[i];

                if (lg) {
                    const id = Utils.uuid();
                    const card = document.createElement('div');
                    card.classList.add('atlas-layer-legend-card');

                    card.id = id;

                    card.setAttribute('rel', i + '');

                    let subtitle: string;

                    if (opt.layout === 'accordion') {
                        subtitle = Utils.getString(lg.subtitle, resx);
                    } else {
                        subtitle = Utils.addStringDiv(card, lg.subtitle, 'atlas-legend-subtitle', resx, true);
                    }

                    switch (lg.type) {
                        case 'category':
                            self._createCategoryLegend(card, <CategoryLegendType>lg, resx);
                            break;
                        case 'image':
                            self._createImageLegend(card, <ImageLegendType>lg, resx);
                            break;
                        case 'html':
                            self._createHtmlLegend(card, <HtmlLegendType>lg);
                            break;
                        case 'gradient':
                            rebuildOnStyleChange = true;
                            self._createGradientLegend(card, <GradientLegendType>lg, resx);
                            break;
                    }

                    Utils.addStringDiv(card, lg.footer, 'atlas-legend-footer', resx, false, true);

                    self._addCard(card, dotContainer, lg, subtitle);
                }
            }

            self._rebuildOnStyleChange = rebuildOnStyleChange;

            //Add carousel dots
            if (layout === 'carousel') {
                if (dotContainer.children.length > 1) {
                    Utils.addClearDiv(content);
                    content.appendChild(dotContainer);
                }
                self.setLegendIdx(self._legendIdx);
            }
        }

        const elm = Utils.getElement(opt.container);
        if (elm) {
            elm.appendChild(content);
        } else if (self._container) {
            self._container.appendChild(content);
        }
    }

    /**
     * Create a category type legend.
     * @param legend The HTML element for the content of this legend.
     * @param legendType The legend options.
     * @param resx A resource file for localization of strings.
     */
    private _createCategoryLegend(legend: HTMLElement, legendType: CategoryLegendType, resx: Record<string, string>): void {
        if (legendType.items) {
            const itemContainer = document.createElement('div');
            itemContainer.classList.add('atlas-legend-category-legend');

            if (legendType.cssClass) {
                itemContainer.classList.add(legendType.cssClass);
            }

            if (legendType.layout) {
                itemContainer.style.flexDirection = legendType.layout;
            }

            const fitItemsVertically = (legendType.fitItems && legendType.layout && legendType.layout.startsWith('row') &&
                legendType.itemLayout && legendType.itemLayout.startsWith('column'));

            let maxSize = 0;

            legendType.items.forEach(item => {
                const itemDiv = document.createElement('div');
                itemDiv.classList.add('atlas-legend-category-item');
                itemDiv.style.flexDirection = (legendType.itemLayout) ? legendType.itemLayout : 'row';

                const c = item.color || legendType.color || 'transparent';
                let svg: string;
                let imageSrc: string;

                const shape = item.shape || legendType.shape || 'circle';

                const strokeWidth = Utils.getNumber2(item, legendType, 'strokeWidth', 0, 1);
                const shapeSize = Utils.getNumber2(item, legendType, 'shapeSize', 1, 20);
                const fillSize = shapeSize - strokeWidth * 2;
                const cx = shapeSize * 0.5;

                switch (shape) {
                    case 'line':
                        const y = shapeSize * 0.5;
                        svg = `<line x1="0" y1="${y}" x2="${shapeSize}" y2="${y}" stroke="${c}" stroke-width="${strokeWidth}" />`;
                        break;
                    case 'square':
                        svg = `<rect x="${strokeWidth}" y="${strokeWidth}" height="${fillSize}" width="${fillSize}" fill="${c}" stroke-width="${strokeWidth}"/>`;
                        break;
                    case 'triangle':
                        svg = `<polygon points="${strokeWidth} ${fillSize}, ${fillSize} ${fillSize}, ${(fillSize + strokeWidth) * 0.5} ${strokeWidth}" fill="${c}" stroke-width="${strokeWidth}"/>`;
                        break;
                    case 'circle':
                        svg = `<circle cx="${cx}" cy="${cx}" r="${cx - strokeWidth}" fill="${c}" stroke-width="${strokeWidth}"/>`;
                        break;
                    default:
                        //Is either image URL or inline image string.
                        //Assume an inline svg image string if icon doesn't start with "data:", but does include "<svg"
                        if (/<svg/i.test(shape) && !(/^data:/i.test(shape))) {
                            imageSrc = "data:image/svg+xml;base64," + window.btoa(shape);
                        } else {
                            imageSrc = shape;
                        }
                        break;
                }

                maxSize = Math.max(maxSize, shapeSize);
                const itemShape = document.createElement('div');

                if (svg) {
                    itemShape.innerHTML = `<svg class="atlas-legend-category-shape" style="width:${shapeSize}px;" viewBox="0 0 ${shapeSize} ${shapeSize}" xmlns="http://www.w3.org/2000/svg">${svg}</svg>`;
                } else if (imageSrc) {
                    itemShape.innerHTML = `<img class="atlas-legend-category-shape" style="width:${shapeSize}px;" src="${imageSrc}"/>`;
                }

                if (item.cssClass) {
                    itemDiv.classList.add(item.cssClass);
                }

                if(legendType.collapse) {
                    itemDiv.style.padding = '0px';
                }

                itemDiv.appendChild(itemShape);

                if (fitItemsVertically) {
                    Object.assign(itemShape.style, {
                        position: 'relative'
                    });

                    Object.assign((<HTMLElement>itemShape.firstChild).style, {
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        left: 0,
                        right: 0
                    });
                }

                const stringLabel = Utils.getString(item.label, resx, legendType.numberFormatLocales, legendType.numberFormat);
                const itemLabel = document.createElement('span');
                itemLabel.innerHTML = stringLabel;
                itemLabel.setAttribute('aria-label', stringLabel);
                if (legendType.labelsOverlapShapes) {
                    Object.assign(itemLabel.style, {
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        textAlign: 'center',
                        margin: '0 auto'
                    });
                }
                itemDiv.appendChild(itemLabel);

                itemContainer.appendChild(itemDiv);
            });

            if (legendType.fitItems) {
                const elms = itemContainer.getElementsByClassName('atlas-legend-category-item');

                const size = maxSize + 'px';

                let o: any = {};

                if (fitItemsVertically) {
                    o.height = size;
                } else {
                    o.width = size;
                }

                const retainWidth = fitItemsVertically || (legendType.layout && legendType.layout.startsWith('row') &&
                    legendType.itemLayout && legendType.itemLayout.startsWith('row'))

                Array.prototype.forEach.call(elms, (el: HTMLElement) => {
                    if (retainWidth) {
                        o.width = (<HTMLElement>el.firstChild.firstChild).style.width;
                    }

                    Object.assign((<HTMLElement>el.firstChild).style, o);
                });
            }

            legend.appendChild(itemContainer);
        }
    }

    /**
     * Create an Image type legend.
     * @param legend The HTML element for the content of this legend.
     * @param legendType The legend options.
     * @param resx A resource file for localization of strings.
     */
    private _createImageLegend(legend: HTMLElement, legendType: ImageLegendType, resx: Record<string, string>): void {
        if (legendType.url) {
            const itemContainer = document.createElement('div');
            itemContainer.classList.add('atlas-legend-image-legend');

            if (legendType.cssClass) {
                itemContainer.classList.add(legendType.cssClass);
            }

            const img = document.createElement('img');

            const altText = Utils.getString(legendType.altText || legendType.subtitle, resx);

            if (altText !== '') {
                img.setAttribute('alt', altText);
                img.setAttribute('title', altText);
            }

            img.onerror = () => {
                console.log('Unable to load legend image: ' + legendType.url);
                itemContainer.remove();
            };

            const maxHeight = legendType.maxHeight;
            const maxWidth = legendType.maxWidth;

            if (maxHeight && maxHeight > 0) {
                img.style.maxWidth = maxHeight + 'px';
            }

            if (maxWidth && maxWidth > 0) {
                img.style.maxWidth = maxWidth + 'px';
            }

            let imageSrc = legendType.url;
            if (/<svg/i.test(imageSrc) && !(/^data:/i.test(imageSrc))) {
                imageSrc = "data:image/svg+xml;base64," + window.btoa(imageSrc);
            }

            img.src = imageSrc;

            itemContainer.appendChild(img);

            legend.appendChild(itemContainer);
        }
    }

    /**
     * Create a HTML type legend.
     * @param legend The HTML element for the content of this legend.
     * @param legendType The legend options.
     * @param resx A resource file for localization of strings.
     */
    private _createHtmlLegend(legend: HTMLElement, legendType: HtmlLegendType): void {
        if (legendType.html) {

            const itemContainer = document.createElement('div');

            if (legendType.cssClass) {
                itemContainer.classList.add(legendType.cssClass);
            }

            if (typeof legendType.html === 'string') {
                itemContainer.innerHTML = legendType.html;
            } else {
                itemContainer.appendChild(legendType.html);
            }

            legend.appendChild(itemContainer);
        }
    }

    /**
     * Create a gradient type legend.
     * @param legend The HTML element for the content of this legend.
     * @param legendType The legend options.
     * @param resx A resource file for localization of strings.
     */
    private _createGradientLegend(legend: HTMLElement, legendType: GradientLegendType, resx: Record<string, string>): void {
        if (legendType.stops && legendType.stops.length > 0) {
            const itemContainer = document.createElement('div');
            itemContainer.classList.add('atlas-legend-gradient-legend');

            if (legendType.cssClass) {
                itemContainer.classList.add(legendType.cssClass);
            }

            //Get the font color determined by the control. This is used to color tick lines and labels.
            const fontColor = this._fontColor;

            const getNumber = Utils.getNumber;

            const isVertical = (legendType.orientation === 'vertical');
            const fontSize = getNumber(legendType, 'fontSize', 1, 12);

            let fontFamily = legendType.fontFamily || "'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif";
            fontFamily = fontFamily.replace(/"/g, "'");

            const thickness = getNumber(legendType, 'barThickness', 1, 20);
            const barLength = getNumber(legendType, 'barLength', 1, 200);
            const tickSize = getNumber(legendType, 'tickSize', 0, 5);

            const tickGap = 3;

            const svgStops: string[] = [];
            const tickLines: string[] = [];
            const textItems: string[] = [];
            let width: number;
            let svgWidth: number;
            let height: number;
            let svgHeight: number;
            let gradientDirection: string;
            let textStyle: string;
            let barWidth: number;
            let barHeight: number;

            //Ensure stops are sorted by offset.
            legendType.stops.sort((a, b) => {
                return a.offset - b.offset;
            });

            if (isVertical) {
                gradientDirection = 'x1="0%" y1="0%" x2="0%" y2="100%" gradientTransform="rotate(180,0.5,0.5)"';
                textStyle = `fill:${fontColor};font-size:${fontSize}px;font-family:${fontFamily};text-align:center;text-anchor:start;dominant-baseline:middle;"`;
                barWidth = thickness;
                barHeight = barLength;

                let maxTextWidth = 0;

                const tickStartX = thickness + tickGap;
                const tickEndX = tickStartX + tickSize;
                const textX = tickEndX + tickGap;

                if (tickSize > 0) {
                    tickLines.push(`<line x1="${tickStartX}" y1="0" x2="${tickStartX}" y2="${barLength}" />`);
                }

                legendType.stops.forEach(item => {
                    const c = item.color || 'black';

                    svgStops.push(`<stop offset="${item.offset * 100}%" stop-color="${c}" />`);

                    const stringLabel = Utils.getString(item.label, resx, legendType.numberFormatLocales, legendType.numberFormat);
                    if (stringLabel && stringLabel !== '') {
                        let y1 = barLength * (1 - item.offset);

                        if (item.offset === 0) {
                            y1 -= 1;
                        } else if (item.offset === 1) {
                            y1 += 1;
                        }

                        if (tickSize > 0) {
                            tickLines.push(`<line x1="${tickStartX}" y1="${y1}" x2="${tickEndX}" y2="${y1}" />`);
                        }

                        textItems.push(`<text x="${textX}" y="${y1}">${stringLabel}</text>`);

                        maxTextWidth = Math.max(Utils.measureText(stringLabel, fontSize, fontFamily).width, maxTextWidth);
                    }
                });

                width = Math.ceil(textX + maxTextWidth);
                svgWidth = width;

                height = barLength;
                svgHeight = height + fontSize;
            } else {
                gradientDirection = 'x1="0%" y1="0%" x2="100%" y2="0%"';
                textStyle = `fill:${fontColor};font-size:${fontSize}px;font-family:${fontFamily};text-align:center;text-anchor:middle;dominant-baseline:hanging;`;
                barWidth = barLength;
                barHeight = thickness;

                let maxTextWidth = 0;

                const tickStartY = thickness + tickGap;
                const tickEndY = tickStartY + tickSize;
                const textY = tickEndY + tickGap;

                if (tickSize > 0) {
                    tickLines.push(`<line x1="0" y1="${tickStartY}" x2="${barLength}" y2="${tickStartY}" />`);
                }

                legendType.stops.forEach(item => {
                    const c = item.color || 'black';

                    svgStops.push(`<stop offset="${item.offset * 100}%" stop-color="${c}" />`);

                    const stringLabel = Utils.getString(item.label, resx, legendType.numberFormatLocales, legendType.numberFormat);
                    if (stringLabel && stringLabel !== '') {
                        let x1 = barLength * item.offset;

                        if (item.offset === 1) {
                            x1 -= 1;
                        } else if (item.offset === 0) {
                            x1 += 1;
                        }

                        if (tickSize > 0) {
                            tickLines.push(`<line x1="${x1}" y1="${tickStartY}" x2="${x1}" y2="${tickEndY}" />`);
                        }

                        textItems.push(`<text x="${x1}" y="${textY}">${stringLabel}</text>`);

                        maxTextWidth = Math.max(Utils.measureText(stringLabel, fontSize, fontFamily).width, maxTextWidth);
                    }
                });

                width = barLength;
                svgWidth = maxTextWidth + width;

                height = textY + ((textItems.length > 0) ? fontSize * 1.33 : 0);
                svgHeight = height;
            }

            const id = Utils.uuid();
            const svg = `
                <svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                    <defs>                    
                        <pattern id="atlas-pattern-${id}" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                            <rect x="0" y="0" width="10" height="10" fill="white"/>
                            <rect x="0" y="0" width="5" height="5" fill="#ccc"/>
                            <rect x="5" y="5" width="5" height="5" fill="#ccc"/>
                        </pattern>

                        <linearGradient id="atlas-gradient-${id}" ${gradientDirection}>${svgStops.join('')}</linearGradient>
                    </defs>

                    <rect x="0" y="0" width="${barWidth}" height="${barHeight}" fill="url('#atlas-pattern-${id}')" />  
                    <rect x="0" y="0" width="${barWidth}" height="${barHeight}" fill="url('#atlas-gradient-${id}')" />

                    <g style="stroke:${fontColor};stroke-width:2;">${tickLines.join('')}</g>

                    <g style="${textStyle}">${textItems.join('')}</g>
                </svg>
                `;

            itemContainer.innerHTML = svg;

            legend.appendChild(itemContainer);
        }
    }
}