import { BaseControl, BaseControlEvents, BaseControlOptions } from "./BaseControl";
import * as azmaps from 'azure-maps-control';
import { Utils } from "../helpers/Utils";
import { LegendControl, LegendType } from "./LegendControl";
import { DynamicLegendType } from "../helpers/DynamicLegend";
import { OgcMapLayer } from "../internal/TypingsOverrides";

/** States that define style options to be applied to layers when they are enabled/disabled. */
export interface LayerState {
    /** The title of the layer state to display. */
    label?: string;

    /** A boolean indicating if the layer state is enabled or disabled. Default: false */
    enabled?: boolean;

    /** Style options to apply to layer when state is enabled. */
    enabledStyle?: any;

    /** Style options to apply to layer when state is disabled. */
    disabledStyle?: any;

    /** Specifies if color and opacity styles replicated with other layer types that don't have an equivalent style defined. This allows a single style to be used across different types of layers. For example, for a polygon layer, "color" would map to "fillColor". Default: false */
    inflateStyles?: boolean;

    /** One or more legends to display when this state is enabled. These legends will be hidden when state is disabled, or based on zoom level range. */
    legends?: LegendType[];

    /** One or more layers that are impacted by the layer state. */
    layers?: (string | azmaps.layer.Layer)[];

    /** Min zoom level that this state should appear.  Default: `0` */
    minZoom?: number;

    /** Max zoom level that this state should appear. Default: `24` */
    maxZoom?: number;

    /** Specifies how a state should be treated when the map zoom level falls outside of the items min and max zoom range. Default: `'disable'` */
    zoomBehavior?: 'disable' | 'hide';
}

/** States for an input range that defines style options to be applied to layers when a range slider changes. */
export interface RangeLayerState {
    /** The minimum value of the range input. Default: `0` */
    min?: number;

    /** The maximum value of the range input. Default: `1` */
    max?: number;

    /** The incremental step value of the range input. Default: `0.1` */
    step?: number;

    /** The initial value of the range input. Default: `1` */
    value?: number;

    /** Style options to apply to layer when state changes. Use a placeholder of '{rangeValue}' in your expression. This will be replaced with the value from the range. */
    style?: any;

    /** The title of the layer state to display. Default: '{rangeValue}' */
    label?: string;

    /** The number formatting to apply to the value when displaying it in the label.  Default: { maximumSignificantDigits: 2 } */
    numberFormat?: Intl.NumberFormatOptions;

    /** Specifies if color and opacity styles replicated with other layer types that don't have an equivalent style defined. This allows a single style to be used across different types of layers. For example, for a polygon layer, "color" would map to "fillColor". Default: false */
    inflateStyles?: boolean;

    /** One or more layers that are impacted by the layer state. */
    layers?: (string | azmaps.layer.Layer)[];

    /** One or more legends to display when this state is enabled. These legends will be hidden when state is disabled, or based on zoom level range. */
    legends?: LegendType[];

    /** Specifies if the style should be updated when the oninput event fires (while sliding). Warning, this can trigger multiple updates in a very short period of time. Default: `false` */
    updateOnInput?: boolean;

    /** Min zoom level that this state should appear.  Default: `0` */
    minZoom?: number;

    /** Max zoom level that this state should appear. Default: `24` */
    maxZoom?: number;

    /** Specifies how a state should be treated when the map zoom level falls outside of the items min and max zoom range. Default: `'disable'` */
    zoomBehavior?: 'disable' | 'hide';
}

/** A group of layer items. */
export interface LayerGroup {
    /** How the layer state items are presented. Default: 'checkbox' */
    layout: 'dropdown' | 'checkbox' | 'radio' | 'range';

    /** A CSS class to add to the layer group. */
    cssClass?: string;

    /** The title of the layer group. */
    groupTitle?: string;

    /** One or more layers that are impacted by the layer state. */
    layers?: (string | azmaps.layer.Layer)[];

    /** The states of the layer. */
    items?: (RangeLayerState | LayerState)[];

    /** One or more legends to display for the layer group. These legends only hide based on zoom level. */
    legends?: LegendType[];

    /** Min zoom level that this layer group should appear.  Default: `0` */
    minZoom?: number;

    /** Max zoom level that this layer group should appear. Default: `24` */
    maxZoom?: number;

    /** Specifies how a layer group or state should be treated when the map zoom level falls outside of the items min and max zoom range. Default: `'disable'` */
    zoomBehavior?: 'disable' | 'hide';
}

/** Options for a dynamic list of users layers within the map. */
export interface DynamicLayerGroup {
    /** A CSS class to add to the generated layer group. */
    cssClass?: string;

    /** How the layer state items are presented. Default: 'checkbox' */
    layout?: 'dropdown' | 'checkbox' | 'radio';

    /** The title of the layer group. */
    groupTitle?: string;

    /** One or more layers to filter out. By default, all user defined layers added to the map will be loaded. */
    layerFilter?: (string | azmaps.layer.Layer)[];

    /** One or more legends to display for the layer group. These legends only hide based on zoom level. */
    legends?: LegendType[];

    /** Property name of the layers metadata that should be used as a label. If not specified, the layers ID will be used. Values will be passed through the resx option to support localization if specified. */
    labelProperty?: string;

    /** The index to insert this layer group within controls other layer group collections. Default: `0` */
    layerGroupIdx?: number;

    /** Specifies how a layer group or state should be treated when the map zoom level falls outside of the items min and max zoom range. Default: `'disable'` */
    zoomBehavior?: 'disable' | 'hide';
}

/** Layer control options. */
export interface LayerControlOptions extends BaseControlOptions {
    /** The top level title of the layer control. */
    title?: string;

    /** One or more groups of layers and states. */
    layerGroups?: LayerGroup[];

    /** Options for generating a layer group dynamically based off the user defined layers within the map. */
    dynamicLayerGroup?: DynamicLayerGroup;

    /** Resource strings. The dynamic layer state will check for alternative names for layer ID's. */
    resx?: Record<string, string>;

    /** A legend control to display the layer state legends in. */
    legendControl?: LegendControl;
}

/** Events fired by the Layer Control. */
export interface LayerControlEvents extends BaseControlEvents {
    /** Event fired when a state changes. */
    statechanged: LayerStateChangedEventArgs;
}

/** Event args returned when a layer state changes. */
export interface LayerStateChangedEventArgs {

    /** The layer group the state changed on. */
    layerGroup: LayerGroup,

    /** The new state. */
    newState: (RangeLayerState | LayerState),

    /** The old state. Only returned when the layout is `dropdown` or `radio`. */
    oldState?: LayerState,

    /** The event type name. */
    type: 'statechanged'
}

/** A control for creating a list of layers and actions. */
export class LayerControl extends BaseControl<LayerControlEvents> {
    /****************************
    * Private Properties
    ***************************/

    private _options: LayerControlOptions = {
        resx: {},
        layout: 'list',
        style: <azmaps.ControlStyle>'light',
        visible: true,
        zoomBehavior: 'disable',
        showToggle: true,
        minimized: false
    };

    private _stateCache: Record<string, LayerState> = {};

    private _hasDynamic = false;

    private _dynamicLegends: DynamicLegendType[];

    /****************************
     * Constructor
     ***************************/

    /**
     * A control that displays a legend.
     * @param options Options for defining how the control is rendered and functions.
     */
    constructor(options?: LayerControlOptions) {
        super(1, 'atlas-layer-control-container', 'atlas-layer-btn');
        this.setOptions(Object.assign({}, this._options, options));
    }

    /****************************
     * Public Methods
     ***************************/

    /**
     * Gets the options of the layer control. 
     * @returns The options of the layer control.
     */
    public getOptions(): LayerControlOptions {
        return this._options;
    }

    /**
     * Sets the style of the layer control.
     * @param options The layer control options.
     */
    public setOptions(options?: LayerControlOptions): void {
        options = options || {};

        const self = this;
        const opt = self._options;

        Object.keys(options).forEach(key => {
            const val = options[key];
            if (val !== undefined) {
                switch (key) {
                    //Base options that are handled with the super.setOptions. Capture value for when user gets for options.
                    case 'style':
                    case 'visible':
                    case 'container':
                    case 'layout':
                    case 'zoomBehavior':
                        //@ts-ignore
                        opt[key] = val;
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

    public onAdd(map: azmaps.Map, options?: azmaps.ControlOptions): HTMLElement {
        //Add events to monitor the layers being added and removed.
        map.events.add('layeradded', this._layerChanged);
        map.events.add('layerremoved', this._layerChanged);

        return super.onAdd(map, options);
    }

    public onRemove(): void {
        const self = this;
        const map = self._map;
        if (map) {
            map.events.remove('layeradded', self._layerChanged);
            map.events.remove('layerremoved', self._layerChanged);
        }

        return super.onRemove();
    }

    public refresh(): void {
        this._rebuildContainer();
    }

    /****************************
     * Private Methods
     ***************************/

    /** Event handler for when a layer is added or removed from the map. */
    private _layerChanged = (layer: azmaps.layer.Layer): void => {
        const self = this;

        //If layer control has dynamic layer groups, they will need to be updated.
        self._rebuildContainer();
    }

    /**
    * Navigates to the specified layer index within a carousel or list.
    * @param idx The layer index in the array of layers in the layer control options.
    * @param focus Specifies if tab focus should move inside of the specified layer.
    */
    public _setItemIndex(idx: number, focus?: boolean): void {
        this._setCardIdx(idx, focus);
    }

    /**
     * Creates the content of the layer control.
     */
    public _createContent(): void {
        const self = this;
        const opt = self._options;
        const resx = opt.resx || {};
        const layout = opt.layout;
        let hasZoomRange = false;

        //Clone the layer group array as dynamic layer groups might get appended.
        const layerGroups = (opt.layerGroups) ? opt.layerGroups.map((x) => x) : [];

        const dlg = opt.dynamicLayerGroup;

        //Get the layer groups to render.
        if (dlg) {
            let hasDynamic = false;

            const lg = self._getLayerGroup(dlg)

            if (lg) {
                hasDynamic = true;
                hasZoomRange = true;

                let idx = dlg.layerGroupIdx;

                if (typeof idx !== 'number' || idx < 0 || idx > layerGroups.length) {
                    idx = 0;
                }

                layerGroups.splice(idx, 0, lg);

                if (opt.legendControl) {
                    //Create a dynamic legend type for all layers within layer group.
                    //Each layer should only exist once in a dynamic layer group, and all layers are set at the item level.
                    let legends: DynamicLegendType[] = [];

                    lg.items.forEach(item => {
                        if (item.layers) {
                            item.layers.forEach(l => {
                                legends.push({
                                    type: 'dynamic',
                                    layer: l
                                });
                            });
                        }
                    });

                    opt.legendControl._replaceMany(self._dynamicLegends, legends);
                    self._dynamicLegends = legends;
                }
            }

            self._hasDynamic = hasDynamic;
        }

        if (self._content) {
            self._content.remove();
        }

        //Create content container.
        const content = document.createElement('div');
        content.className = 'atlas-layer-control';
        self._content = content;

        //Add top level legend card title.
        Utils.addStringDiv(content, opt.title, 'atlas-layer-title', resx, true);

        //Create layer groups.
        if (layerGroups && layerGroups.length > 0) {
            const dotContainer = document.createElement('div');
            dotContainer.className = 'atlas-carousel-dot-container';

            for (let i = 0; i < layerGroups.length; i++) {
                const id = Utils.uuid();
                const lg = layerGroups[i];

                //Process zoom range of layer group and underlying states.
                const lgZr = Utils.getZoomRange(self._getAllAzLayers(null, lg));

                lg.minZoom = Utils.getNumber2(lg, lgZr, 'minZoom', 0, 0);
                lg.maxZoom = Utils.getNumber2(lg, lgZr, 'maxZoom', 0, 24);

                //Only consider data zoomable if the zoom range is not the max range of 0 to 24.
                if (lg.minZoom !== 0 || lg.maxZoom !== 24) {
                    hasZoomRange = true;
                }

                if (lg.items) {
                    //Process states within a layer group.
                    (<LayerGroup>lg).items.forEach(state => {
                        //Get all layers the state works with.
                        const layers = self._getAllAzLayers(state, lg);

                        //Inflate the styles for the state.
                        self._inflateLayerStateStyles(state, layers);

                        //Get the zoom level range of the layers within the state.
                        const lZr = Utils.getZoomRange(layers);

                        //Set min/max zoom of state. Prioritize user define values, then layer limits, then layer group limits.
                        state.minZoom = Math.max(Utils.getNumber2(state, lZr, 'minZoom', 0, 0), lg.minZoom);
                        state.maxZoom = Math.min(Utils.getNumber2(state, lZr, 'maxZoom', 0, 24), lg.maxZoom);

                        //Only consider data zoomable if the zoom range is not the max range of 0 to 24.
                        if (state.minZoom !== 0 && state.maxZoom !== 24) {
                            hasZoomRange = true;
                        }
                    });
                }

                const card = document.createElement('div');
                card.classList.add('atlas-layer-legend-card');
                card.id = id;

                if (lg.cssClass) {
                    card.classList.add(lg.cssClass);
                }

                //Add the id to the `rel` attribute.
                card.setAttribute('rel', i + '');

                let titleString: string;
                if (layout === 'accordion') {
                    titleString = Utils.getString(lg.groupTitle, resx);
                } else {
                    titleString = Utils.addStringDiv(card, lg.groupTitle, 'atlas-layer-group-title', resx, true);
                }

                if (lg.legends && opt.legendControl) {
                    for (let i = 0; i < lg.legends.length; i++) {
                        const l = lg.legends[i];
                        l.minZoom = Utils.getNumber2(l, lg, 'minZoom', 0, 0);
                        l.maxZoom = Utils.getNumber2(l, lg, 'maxZoom', 0, 24);
                        opt.legendControl.add(l, (i === 0));
                    }
                }

                const itemLayout = lg.layout || 'checkbox';
                let c: HTMLElement;

                switch (itemLayout) {
                    case 'dropdown':
                        c = self._createDropdown(lg, titleString);
                        break;
                    case 'checkbox':
                    case 'radio':
                        c = self._createChoiceGroup(itemLayout, lg);
                        break;
                    case 'range':
                        c = self._createRange(lg);
                        break;
                }

                if (c) {
                    card.appendChild(c);
                }

                self._addCard(card, dotContainer, lg, titleString);
            }

            self._hasZoomableContent = hasZoomRange;

            //Add carousel dots
            if (layout === 'carousel') {
                if (dotContainer.children.length > 1) {
                    Utils.addClearDiv(content);
                    content.appendChild(dotContainer);
                }
                self._setCardIdx(0);
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
     * Binds a layer state to an element.
     * @param state A layer state.
     * @param layerGroup A layer group.
     * @param elm An element that is being bound to the state.
     */
    private _bindLayerState(state: LayerState | RangeLayerState, layerGroup: LayerGroup, elm: HTMLInputElement | HTMLOptionElement, oninput?: boolean) {
        const self = this;

        //Ensure we have a unique list of layers between the layer group layers and the state level defined layers.
        const layers: azmaps.layer.Layer[] = self._getAllAzLayers(state, layerGroup);

        const event = self._itemChanged.bind(self, state, layers, layerGroup, elm, true);
        if (elm instanceof HTMLOptionElement) {
            (<HTMLOptionElement>elm.parentElement).addEventListener('change', event);
            self._itemChanged(state, layers, layerGroup, elm, false);
        } else {
            elm.onchange = event;

            if (oninput) {
                elm.oninput = event;
            }
            self._itemChanged(state, layers, layerGroup, elm, false);
        }
    }

    /**
     * Event handler for when an item changes. 
     * @param state The new state.
     * @param layers The layers affected.
     * @param layerGroup The related layer group options.
     * @param elm The element the event occurred on.
     * @param focusLegend A option specifying if an associated legend item should come into view.
     */
    private _itemChanged = (state: LayerState | RangeLayerState, layers: azmaps.layer.Layer[], layerGroup: LayerGroup, elm: HTMLInputElement | HTMLOptionElement, focusLegend: boolean): void => {
        if (layers) {
            const self = this;
            const legendControl = self._options.legendControl;

            //Handle range slider
            if (elm instanceof HTMLInputElement && elm.type === 'range') {
                const layerState = <RangeLayerState>state;

                const val = parseFloat(elm.value);

                //Apply styles to layers
                const rangeStyle = layerState.style;

                if (rangeStyle) {
                    const labelString = state.label ? Utils.getString(state.label, self._options.resx) : '{rangeValue}';
                    const formattedVal = labelString.replace('{rangeValue}', new Intl.NumberFormat(undefined, layerState.numberFormat || {}).format(val));

                    //Set the input's label.
                    elm.parentElement.children[1].innerHTML = formattedVal;

                    //Replace placeholder in style.
                    const style = Utils.replacePlaceholder(rangeStyle, '{rangeValue}', val, true);

                    layers.forEach(layer => self._setLayerStyle(layer, style));
                }

                layerState.value = val;
            } else {
                let enabled = (elm['checked'] !== undefined) ? elm['checked'] : elm['selected'];

                if (enabled === undefined) {
                    enabled = false;
                }

                if (elm instanceof HTMLOptionElement) {
                    enabled = (<HTMLSelectElement>elm.parentElement).selectedOptions[0] === elm;
                }

                const layerState = <LayerState>state;

                //Apply styles to layers
                const style = enabled ? layerState.enabledStyle : (layerState.disabledStyle || {});

                if (style) {
                    layers.forEach(layer => self._setLayerStyle(layer, style));
                }

                //Handle new item state.
                if (layerState.legends && legendControl) {
                    for (let i = 0; i < layerState.legends.length; i++) {
                        const l = layerState.legends[i];
                        if (enabled) {
                            l.minZoom = Utils.getNumber2(l, layerState, 'minZoom', 0, 0);
                            l.maxZoom = Utils.getNumber2(l, layerState, 'minZoom', 0, 24);

                            legendControl.add(l, (i === 0) ? focusLegend : false);
                        } else {
                            legendControl.remove(l);
                        }
                    }
                }

                layerState.enabled = enabled;

                //If style changes visibility, ensure associated legends also change. 
                const legend = self._options.legendControl;
                if (typeof style.visible === 'boolean' && legend) {
                    legend._rebuildContainer();
                }
            }

            //Handle old state.
            const oldState = self._updateStateCache(state, layers, (elm instanceof HTMLOptionElement) ? <HTMLSelectElement>elm.parentElement : elm);

            self._invokeEvent('statechanged', {
                type: 'statechanged',
                layerGroup: layerGroup,
                oldState: oldState,
                newState: state
            });
        }
    }

    /**
     * Creates a dropdown for a layer group.
     * @param layerGroup The layer group options.
     * @param title The title to display for the layer group.
     * @returns A dropdown.
     */
    private _createDropdown(layerGroup: LayerGroup, title: string): HTMLElement {
        const self = this;
        const dropdown = document.createElement('select');
        dropdown.className = 'atlas-layer-dropdown';
        dropdown.title = title;

        if (layerGroup.items) {
            dropdown.name = Utils.uuid();
            const items = <LayerState[]>layerGroup.items;
            items.forEach(item => {
                const option = document.createElement('option');
                if (item.label) {
                    option.innerHTML = Utils.getString(item.label, self._options.resx);
                }

                if (item.enabled) {
                    option.selected = true;
                }

                //Store min/max zoom info as attributes.
                Utils.setZoomRangeAttr(item, self._baseOptions, option);

                dropdown.appendChild(option);
                self._bindLayerState(item, layerGroup, option);
            });
        }

        return dropdown;
    }

    /**
     * Creates a container of radio or checkbox buttons.
     * @param type The type of choice group to create, radio or checkbox.
     * @param layerGroup The layer group to create the choice for.
     * @returns A container with a group of radio buttons or checkboxes.
     */
    private _createChoiceGroup(type: 'radio' | 'checkbox', layerGroup: LayerGroup): HTMLElement {
        const self = this;
        const itemContainer = document.createElement('div');

        if (layerGroup.items) {
            const items = <LayerState[]>layerGroup.items;
            const groupName = Utils.uuid();

            items.forEach(item => {
                //<label><input type="checkbox" /><span>Option 1</span></label>
                //<label><input type="radio" name=""/><span>Option 1</span></label>
                const label = document.createElement('label');
                label.className = `atlas-layer-${type}`;

                const input = document.createElement('input');
                input.type = type;

                if (type === 'radio') {
                    input.name = groupName;
                }

                input.checked = item.enabled;

                label.appendChild(input);

                const span = document.createElement('span');
                span.innerHTML = Utils.getString(item.label, self._options.resx);

                label.appendChild(span);

                self._bindLayerState(item, layerGroup, input);

                //Store min/max zoom info as attributes.
                Utils.setZoomRangeAttr(item, self._baseOptions, label);

                itemContainer.appendChild(label);
            });
        }

        return itemContainer;
    }

    /**
     * Creates a slider.
     * @param layerGroup The layer group options. 
     * @returns A slider.
     */
    private _createRange(layerGroup: LayerGroup): HTMLElement {
        const self = this;
        const itemContainer = document.createElement('div');

        if (layerGroup.items) {
            const items = <RangeLayerState[]>layerGroup.items;
            const getNumber = Utils.getNumber;
            const measureText = Utils.measureText;
            const placeholder = '{rangeValue}';

            items.forEach(item => {
                //<label><input type="range" /><span>Option 1</span></label>
                const label = document.createElement('label');
                label.className = 'atlas-layer-range';

                const input = document.createElement('input');
                input.type = 'range';

                const min = getNumber(item, 'min', 0, 0);
                const max = getNumber(item, 'max', 0, 1);
                const step = getNumber(item, 'step', 0, 0.1);
                const value = getNumber(item, 'value', 0, 1);

                input.setAttribute('min', min + '');
                input.setAttribute('max', max + '');
                input.setAttribute('step', step + '');
                input.value = value + '';

                label.appendChild(input);

                const span = document.createElement('span');
                const labelString = item.label ? Utils.getString(item.label, self._options.resx) : placeholder;
                const numberFormat = new Intl.NumberFormat(undefined, item.numberFormat || {});
                span.innerHTML = labelString.replace(placeholder, numberFormat.format(value));

                //Try and determine max width of label. Measure min, max, value, and max minus the step.
                span.style.minWidth = Math.max(
                    measureText(labelString.replace(placeholder, numberFormat.format(value)), 12, 'Arial').width,
                    measureText(labelString.replace(placeholder, numberFormat.format(min)), 12, 'Arial').width,
                    measureText(labelString.replace(placeholder, numberFormat.format(max)), 12, 'Arial').width,
                    measureText(labelString.replace(placeholder, numberFormat.format(max - step)), 12, 'Arial').width
                ) + 'px';

                label.appendChild(span);

                //Store min/max zoom info as attributes.
                Utils.setZoomRangeAttr(item, self._baseOptions, label);

                self._bindLayerState(item, layerGroup, input, item.updateOnInput);
                itemContainer.appendChild(label);
            });
        }

        return itemContainer;
    }

    /**
     * Updates the cached state of an item.
     * @param item The item.
     * @param layers The associated layers.
     * @param elm The element that triggers the state change.
     * @returns The old state.
     */
    private _updateStateCache(item: LayerState | RangeLayerState, layers: azmaps.layer.Layer[], elm: HTMLInputElement | HTMLSelectElement): LayerState {
        const self = this;
        const legendControl = self._options.legendControl;

        //Handle old state of radio buttons.
        if ((elm instanceof HTMLInputElement && elm.type === 'radio') || elm instanceof HTMLSelectElement) {
            const state = <LayerState>item;
            const oldState = <LayerState>self._stateCache[elm.name];

            if (oldState && oldState !== item) {
                //Disable old state.
                oldState.enabled = !state.enabled;

                //Trigger disabled styles.
                const oldStyle = (oldState.enabled) ? oldState.enabledStyle : oldState.disabledStyle;

                if (oldStyle && oldState.layers) {
                    oldState.layers.forEach(layer => self._setLayerStyle(layer, oldStyle));
                }

                //Remove any associated legend.
                if (legendControl && oldState.legends) {
                    oldState.legends.forEach(l => {
                        legendControl.remove(l);
                    });
                }

                if (state.enabled) {
                    self._stateCache[elm.name] = state;
                    return oldState;
                }
            } else if (!oldState && state.enabled) {
                self._stateCache[elm.name] = state;
            }
        }

        return null;
    }

    /**
     * Inflates the styles of a state.
     * @param state The state to inflate the styles on.
     * @param layers The associated layers.
     */
    private _inflateLayerStateStyles(state: LayerState | RangeLayerState, layers: azmaps.layer.Layer[]): void {
        const self = this;
        if (state['enabledStyle']) {
            self._inflateStyle(state['enabledStyle'], layers);
        }

        if (state['disabledStyle']) {
            self._inflateStyle(state['disabledStyle'], layers);
        }

        if (state['style']) {
            self._inflateStyle(state['style'], layers);
        }
    }

    /**
     * Inflates a style such that color/fillColor, opacity/fillOpacity will share their settings unless explicitly set. 
     * This allows a single style to be specified and easily used with different layer types.
     * @param style The style to inflate.
     * @param layers The associated layers.
     */
    private _inflateStyle(style: any, layers: azmaps.layer.Layer[]): void {
        if (style) {
            const enhancedStyles: any = {};
            const keys = Object.keys(style);

            let hasBubble = false;
            let hasLine = false;

            layers.forEach(l => {
                if (l instanceof azmaps.layer.BubbleLayer) {
                    hasBubble = true;
                } else if (l instanceof azmaps.layer.LineLayer) {
                    hasLine = true;
                }
            });

            keys.forEach(key => {
                switch (key) {
                    case 'color':
                        if (!style.fillColor) {
                            enhancedStyles.fillColor = style.color;
                        }
                        break;
                    case 'fillColor':
                        if (!style.color) {
                            enhancedStyles.color = style.fillColor;
                        }

                        if (hasLine && !hasBubble && !style.strokeColor) {
                            enhancedStyles.strokeColor = style.fillColor;
                        }
                        break;
                    case 'opacity':
                        if (!style.fillOpacity) {
                            enhancedStyles.fillOpacity = style.opacity;
                        }
                        break;
                    case 'fillOpacity':
                        if (!style.opacity) {
                            enhancedStyles.opacity = style.fillOpacity;
                        }

                        if (hasLine && !hasBubble && !style.strokeOpacity) {
                            enhancedStyles.strokeOpacity = style.strokeOpacity;
                        }
                        break;
                }
            });

            Object.assign(style, enhancedStyles);
        }
    }

    /**
     * Sets the style on a layer.
     * @param layer The layer name or instance.
     * @param style The style.
     */
    private _setLayerStyle(layer: string | azmaps.layer.Layer, style: any): void {
        if (layer) {
            layer = Utils.getLayer(layer, this._map);

            if (layer['setOptions']) {
                let s = style;
                if (layer instanceof azmaps.layer.LineLayer) {
                    if (!style.strokeColor && style.color) {
                        s = Object.assign({ strokeColor: style.color }, s);
                    }

                    if (!style.strokeOpacity && style.opacity) {
                        s = Object.assign({ strokeOpacity: style.opacity }, s);
                    }
                }

                layer['setOptions'](s);
            }
        }
    }

    /**
     * Gets all Azure Maps layers within a state and layer group.
     * @param state The state.
     * @param layerGroup The layer group.
     * @returns All Azure Maps layers within a state and layer group.
     */
    private _getAllAzLayers(state: LayerState | RangeLayerState, layerGroup: LayerGroup): azmaps.layer.Layer[] {
        const self = this;
        const map = self._map;

        //Ensure we have a unique list of layers between the layer group layers and the state level defined layers.
        const layers: azmaps.layer.Layer[] = [];

        if (map) {
            if (layerGroup && layerGroup.layers) {
                layerGroup.layers.forEach(l => {
                    var tl = Utils.getLayer(l, map);
                    if (tl) {
                        layers.push(tl);
                    }
                });
            }

            if (state) {
                if (state.layers) {
                    state.layers.forEach(l => {
                        const li = Utils.getLayer(l, map);

                        if (layers.indexOf(li) === -1) {
                            layers.push(li);
                        }
                    });
                }
            } else {
                //If state isn't passed in, grab layers for all states.
                layerGroup.items.forEach(s => {
                    if (s.layers) {
                        s.layers.forEach(l => {
                            const li = Utils.getLayer(l, map);

                            if (layers.indexOf(li) === -1) {
                                layers.push(li);
                            }
                        });
                    }
                });
            }
        }

        return layers;
    }

    /**
     * Creates a layer group for a dynamic layer group.
     * @param dynamicLayerGroup A dynamic layer group to process.
     */
    private _getLayerGroup(dynamicLayerGroup: DynamicLayerGroup): LayerGroup {
        if (!dynamicLayerGroup.layout) {
            return;
        }

        const self = this;
        const layerGroup: LayerGroup = {
            cssClass: dynamicLayerGroup.cssClass,
            groupTitle: dynamicLayerGroup.groupTitle,
            legends: dynamicLayerGroup.legends,
            items: [],

            //@ts-ignore
            layout: dynamicLayerGroup.layout || 'checkbox'
        };

        //Get the layers from the map.
        const layers = Utils.getMapLayers(self._map, dynamicLayerGroup.layerFilter);
        const labelProperty = dynamicLayerGroup.labelProperty;

        if (layers && layers.length > 0) {
            //For radio and dropdowns, either select the first visible layer, or make the first visible.
            let hasSelection = false;

            layers.forEach(l => {
                const opt = (l['getOptions']) ? l['getOptions']() : {};
                let enabled = opt.visible;

                if (enabled === undefined) {
                    enabled = true;
                }

                if (layerGroup.layout === 'dropdown' || layerGroup.layout === 'radio') {
                    if (hasSelection) {
                        enabled = false;

                        if (l['setOptions']) {
                            l['setOptions']({ visible: false });
                        }
                    } else if (enabled) {
                        hasSelection = true;
                    }
                }

                let label = Utils.getString((labelProperty && l.metadata && l.metadata[labelProperty] && l.metadata[labelProperty] !== '') ? l.metadata[labelProperty] : l.getId(), self._options.resx);

                const ogcLayer = azmaps.layer['OgcMapLayer'];
                const simpleLayer = azmaps.layer['SimpleDataLayer'];

                if (l.getId() === label && label.indexOf('-') > -1) {
                    //If it is an OGC Map layer, get the label from the capabilities.
                    if (ogcLayer && l instanceof ogcLayer) {
                        const ogc = <OgcMapLayer>l;
                        const client = ogc._client;

                        if (client && client._capabilities) {
                            const cap = client._capabilities;
                            if (cap.title && cap.title !== '' && cap.title.toLowerCase() === 'wms') {
                                label = cap.title;
                            } else {
                                const activeLayers = ogc.getOptions().activeLayers;
                                const sublayers = cap.sublayers;

                                if (activeLayers.length === 1 && sublayers) {
                                    const al = activeLayers[0];

                                    for (var i = 0; i < sublayers.length; i++) {
                                        if ((typeof al === 'string' && al === sublayers[i].id) || al.id === sublayers[i].id) {
                                            const styles = al.styles;

                                            if (styles && styles.length > 0 && styles[0].legendUrl && styles[0].legendUrl !== '') {
                                                label = al.title || al.subtitle || sublayers[i].id || '';
                                            }
                                        }
                                    }
                                }
                            }
                        } else {
                            //If no client or capabilities, reload the capabilities.
                            ogc.getCapabilities().then(cap => {
                                if (cap) {
                                    self._rebuildContainer();
                                }
                            });
                        }
                    } else if (simpleLayer && l instanceof simpleLayer) {
                        const sLayer: any = l;
                        if(sLayer.metadata){
                            label = sLayer.metadata.title || sLayer.metadata.name || '';
                        }
                    }
                }

                layerGroup.items.push({
                    layers: [l],
                    label: label,
                    enabled: enabled,
                    enabledStyle: {
                        visible: true
                    },
                    disabledStyle: {
                        visible: false
                    },
                    minZoom: Utils.getNumber(opt, 'minZoom', 0, 0),
                    maxZoom: Utils.getNumber(opt, 'maxZoom', 0, 24),
                });
            });

            if (!hasSelection && (layerGroup.layout === 'dropdown' || layerGroup.layout === 'radio')) {
                (<LayerState>layerGroup.items[0]).enabled = true;

                if (layers[0]['setOptions']) {
                    layers[0]['setOptions']({ visible: true });
                }
            }
        } else {
            return;
        }

        return layerGroup;
    }
}