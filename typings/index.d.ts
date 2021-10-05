import * as azmaps from 'azure-maps-control';

declare namespace atlas {

    /** Event args for when the control is toggled (minified/expanded). */
    export interface ControlToggledEventArgs {
        /** The event type name. */
        type: 'toggled';

        /** Specifies if the control is minified or not. */
        minimized: boolean;
    }

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

        /** A CSS class added to an individual item.  */
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

        /** Specifies if space around the shapes should be collapsed so that items are close together. Default: `false` */
        collapse?: boolean;

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

        /** Specifies if the text label should overlap the shapes. When set to `true`, the position of the label span will be set to `absolute`. Default: `false`  */
        labelsOverlapShapes?: boolean;

        /** The number format options to use when converting a number label to a string. */
        numberFormat?: Intl.NumberFormatOptions;

        /** The number format locales to use when converting a number label to a string. */
        numberFormatLocales?: string | string[];
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

    /** A legend that dynamically generated from a layers style. */
    export interface DynamicLegendType extends LegendType {
        /** The type of legend to create. */
        type: 'dynamic';

        /** The layer to generate the legend(s) for. */
        layer: string | azmaps.layer.Layer;

        /** A CSS class added to all legend cards.  */
        cssClass?: string;

        /** Default options to apply to category legends. */
        defaultCategory?: CategoryDefaults;

        /** Default options for image legends. */
        defaultImage?: ImageDefaults;

        /** Default options for gradient legends. */
        defaultGradient?: GradientDefaults;

        /**
         * Specifies how subtitles should be set if not explicitly set in the legend type. 
         * - `'auto'` - Looks at the layers metadata for the following properties, in this order `'title'`,  `'subtitle'`. Falls back to the layers ID.
         * - `'expression'` - If a style expression has a simple `get` expression such as `['get', 'revenue']` the property name will be extracted and set as the subtitle of the legend card. Falls back to the layers ID.
         * - `'none'` - No subtitle value is added to the legend.
         * - `string` - The name of a property in the layers metadata to use as the subtitle.
         * Falls back to the layers ID unless set to `'none'`.
         * Default: `'auto'`
         */
        subtitleFallback?: 'auto' | 'expression' | 'none' | string;

        /**
         * Specifies how footer should be set if not explicitly set in the legend type. 
         * - `'auto'` - Looks at the layers metadata for the following properties, in this order `'footer'`,  `'description'`, `'abstract'`.
         * - `'none'` - No footer value is added to the legend.
         * - `string` - The name of a property in the layers metadata to use as the footer.
         * Default: `'auto'`
         */
        footerFallback?: 'auto' | 'none' | string;
    }

    /** Default options to apply to category legends. */
    export interface CategoryDefaults {
        /** How all items are laid out. Overrides the CSS `flex-direction` style. Default: 'column' */
        layout?: 'row' | 'row-reverse' | 'column' | 'column-reverse';

        /** How the color swatch and label of each item are laid out. Overrides the CSS `flex-direction` style. Default: 'row' */
        itemLayout?: 'row' | 'row-reverse' | 'column' | 'column-reverse';

        /** The fill color of SVG items in all category items. */
        color?: string;

        /** The shape of the color swatches of all items. Supports image urls and SVG strings. Default: 'circle' */
        shape?: 'circle' | 'triangle' | 'square' | 'line' | string;

        /** The size of the all shapes in pixels. Used to scale the width of the shape. Default: `20` */
        shapeSize?: number;

        /** Specifies if all items should be fit into the largest container created by an item. Default: `false` */
        fitItems?: boolean;

        /** The thickness of the stroke on SVG shapes in pixels. Default: `1` */
        strokeWidth?: number;

        /** Specifies if the text label should overlap the shapes. When set to `true`, the position of the label span will be set to `absolute`. Default: `false`  */
        labelsOverlapShapes?: boolean;

        /** The number format options to use when converting a number label to a string. */
        numberFormat?: Intl.NumberFormatOptions;

        /** The number format locales to use when converting a number label to a string. */
        numberFormatLocales?: string | string[];

        /** A CSS class added to an individual item.  */
        cssClass?: string;
    }

    /** Default options for image legends. */
    export interface ImageDefaults {
        /** Max height of the image. */
        maxHeight?: number;

        /** Max width of the image. */
        maxWidth?: number;
    }

    /** Default options for gradient legends. */
    export interface GradientDefaults {
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
    export interface LegendControlOptions {
        /** The top level title of the legend control. */
        title?: string;

        /** The type of legend to generate. */
        legends?: LegendType[];

        /** Resource strings. */
        resx?: Record<string, string>;

        /** The ID of an element or HTMLElement instances to append the legend control to. If not defined, legend will be displayed within the map area. */
        container?: string | HTMLElement;

        /** The style of the control. Can be 'light', 'dark', 'auto', 'auto-reverse', or any CSS3 color string. Default: `'light'` */
        style?: azmaps.ControlStyle | 'auto-reverse' | string;

        /** Specifies if the overview map control is visible or not. Default: `true` */
        visible?: boolean;

        /** 
         * How multiple items are laid out. 
         * - 'list' adds items one after another vertically. 
         * - 'carousel' allows the user to page through each item. 
         * - 'accordion' adds each item or group as an accordion panel.
         * Default: `'carousel'` */
        layout?: 'list' | 'carousel' | 'accordion';

        /** Specifies how a layer group or state should be treated when the map zoom level falls outside of the items min and max zoom range. Default: `'hide'` */
        zoomBehavior?: 'disable' | 'hide';

        /**	Specifies if a toggle button for minimizing the controls content should be displayed or not when the control within the map. Default: `true` */
        showToggle?: boolean;

        /** When displayed within the map, specifies if the controls content is minimized or not. Default: `false` */
        minimized?: boolean;
    }

    /** Events fired by the Legend Control. */
    export interface LegendControlEvents {
        /** Event that fires when a legend is programmatically focused. */
        legendfocused: LegendFocusEventArgs;

        /** Event fired when the control is minimized or expanded.  */
        toggled: ControlToggledEventArgs;
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

        /** Specifies how a layer group or state should be treated when the map zoom level falls outside of the items min and max zoom range. Default: `'disable'` */
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

        /** Specifies how a layer group or state should be treated when the map zoom level falls outside of the items min and max zoom range. Default: `'disable'` */
        zoomBehavior?: 'disable' | 'hide';
    }

    /** A group of layer items. */
    export interface LayerGroup {
        /** How the layer state items are presented. Default: 'checkbox' */
        layout: 'dropdown' | 'checkbox' | 'radio' | 'range';

        /** The title of the layer group. */
        groupTitle?: string;

        /** A CSS class to add to the layer group. */
        cssClass?: string;

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
        layout: 'dropdown' | 'checkbox' | 'radio';

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
    export interface LayerControlOptions {
        /** The top level title of the layer control. */
        title?: string;

        /** One or more groups of layers and states. */
        layerGroups?: LayerGroup[];

        /** Options for generating a layer group dynamically based off the user defined layers within the map. */
        dynamicLayerGroup?: DynamicLayerGroup;

        /** Resource strings. */
        resx?: Record<string, string>;

        /** A legend control to display the layer state legends in. */
        legendControl?: control.LegendControl;

        /** The ID of an element or HTMLElement instances to append the legend control to. If not defined, legend will be displayed within the map area. */
        container?: string | HTMLElement;

        /** The style of the control. Can be 'light', 'dark', 'auto', 'auto-reverse', or any CSS3 color string. Default: `'light'` */
        style?: azmaps.ControlStyle | 'auto-reverse' | string;

        /** Specifies if the overview map control is visible or not. Default: `true` */
        visible?: boolean;

        /** 
         * How multiple items are laid out. 
         * - 'list' adds items one after another vertically. 
         * - 'carousel' allows the user to page through each item. 
         * - 'accordion' adds each item or group as an accordion panel.
         * Default: `'list'` */
        layout?: 'list' | 'carousel' | 'accordion';

        /** Specifies how a layer group or state should be treated when the map zoom level falls outside of the items min and max zoom range. Default: `'disable'` */
        zoomBehavior?: 'disable' | 'hide';

        /**	Specifies if a toggle button for minimizing the controls content should be displayed or not when the control within the map. Default: `true` */
        showToggle?: boolean;

        /** When displayed within the map, specifies if the controls content is minimized or not. Default: `false` */
        minimized?: boolean;
    }

    /** Events fired by the Layer Control. */
    export interface LayerControlEvents {
        /** Event fired when a state changes. */
        statechanged: LayerStateChangedEventArgs;

        /** Event fired when the control is minimized or expanded.  */
        toggled: ControlToggledEventArgs;
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

    export module control {

        /** A control that displays legend information on the map. */
        export class LegendControl {
            /****************************
             * Constructor
             ***************************/

            /**
             * A control that displays a legend.
             * @param options Options for defining how the control is rendered and functions.
             */
            constructor(options?: LegendControlOptions);

            /****************************
             * Public Methods
             ***************************/

            /** Gets the options of the legend control. */
            public getOptions(): LegendControlOptions;

            /**
             * Sets the style of the legend control.
             * @param options Legend control options.
             */
            public setOptions(options?: LegendControlOptions): void;

            /**
             * Navigates to the specified legend index within a carousel or list.
             * @param idx The legend index in the array of legends in the legend control options.
             * @param focus Specifies if tab focus should move inside of the specified legend.
             */
            public setLegendIdx(idx: number, focus?: boolean): void;

            /**
             * Adds a legend to the legend control. If the legend is already in the control, it will update the carousel index to focus on this legend.
             * @param legend The legend to add.
             * @param show A boolean indicating if this legend should be displayed.
             */
            public add(legend: LegendType, show: boolean): void;

            /**
             * Puts the specified legend in view of the user. If in carousel mode, will switch to that legend.
             * @param legend The legend to focus on.
             */
            public focus(legend: LegendType): void;

            /**
             * Removes a legend from the legend control.
             * @param legend The legend to remove.
             */
            public remove(legend: LegendType): void;
        }

        /** A control for creating a list of layers and actions. */
        export class LayerControl {
            /****************************
             * Constructor
             ***************************/

            /**
             * A control that displays a legend.
             * @param options Options for defining how the control is rendered and functions.
             */
            constructor(options?: LayerControlOptions);

            /****************************
             * Public Methods
             ***************************/

            /**
             * Gets the options of the layer control. 
             * @returns The options of the layer control.
             */
            public getOptions(): LayerControlOptions;

            /**
             * Sets the style of the layer control.
             * @param options The layer control options.
             */
            public setOptions(options?: LayerControlOptions): void;
        }
    }
}

/**
 * This module partially defines the map control.
 * This definition only includes the features added by using the drawing tools.
 * For the base definition see:
 * https://docs.microsoft.com/javascript/api/azure-maps-control/?view=azure-maps-typescript-latest
 */
declare module "azure-maps-control" {
    /**
     * This interface partially defines the map control's `EventManager`.
     * This definition only includes the method added by using the drawing tools.
     * For the base definition see:
     * https://docs.microsoft.com/javascript/api/azure-maps-control/atlas.eventmanager?view=azure-maps-typescript-latest
     */
    export interface EventManager {
        /**
         * Adds an event to the `legendfocused`.
         * @param eventType The event name.
         * @param target The `legendfocused` to add the event for.
         * @param callback The event handler callback.
         */
        add(eventType: "legendfocused", target: atlas.control.LegendControl, callback: (e: atlas.LegendFocusEventArgs) => void): void;

        /**
         * Adds an event to the `legendfocused` once.
         * @param eventType The event name.
         * @param target The `legendfocused` to add the event for.
         * @param callback The event handler callback.
         */
        addOnce(eventType: "legendfocused", target: atlas.control.LegendControl, callback: (e: atlas.LegendFocusEventArgs) => void): void;


        /**
         * Removes an event listener from the `legendfocused`.
         * @param eventType The event name.
         * @param target The `legendfocused` to remove the event for.
         * @param callback The event handler callback.
         */
        remove(eventType: string, target: atlas.control.LegendControl, callback: (e: atlas.LegendFocusEventArgs) => void): void;

        /**
         * Adds an event to the `statechanged`.
         * @param eventType The event name.
         * @param target The `statechanged` to add the event for.
         * @param callback The event handler callback.
         */
        add(eventType: "statechanged", target: atlas.control.LayerControl, callback: (e: atlas.LayerStateChangedEventArgs) => void): void;

        /**
         * Adds an event to the `statechanged` once.
         * @param eventType The event name.
         * @param target The `statechanged` to add the event for.
         * @param callback The event handler callback.
         */
        addOnce(eventType: "statechanged", target: atlas.control.LayerControl, callback: (e: atlas.LayerStateChangedEventArgs) => void): void;


        /**
         * Removes an event listener from the `statechanged`.
         * @param eventType The event name.
         * @param target The `statechanged` to remove the event for.
         * @param callback The event handler callback.
         */
        remove(eventType: string, target: atlas.control.LayerControl, callback: (e: atlas.LayerStateChangedEventArgs) => void): void;

        /**
        * Adds an event to the `toggled`.
        * @param eventType The event name.
        * @param target The `toggled` to add the event for.
        * @param callback The event handler callback.
        */
        add(eventType: "toggled", target: atlas.control.LegendControl | atlas.control.LayerControl, callback: (e: atlas.ControlToggledEventArgs) => void): void;

        /**
         * Adds an event to the `toggled` once.
         * @param eventType The event name.
         * @param target The `toggled` to add the event for.
         * @param callback The event handler callback.
         */
        addOnce(eventType: "toggled", target: atlas.control.LegendControl | atlas.control.LayerControl, callback: (e: atlas.ControlToggledEventArgs) => void): void;


        /**
         * Removes an event listener from the `toggled`.
         * @param eventType The event name.
         * @param target The `toggled` to remove the event for.
         * @param callback The event handler callback.
         */
        remove(eventType: string, target: atlas.control.LegendControl | atlas.control.LayerControl, callback: (e: atlas.ControlToggledEventArgs) => void): void;
    }
}

export = atlas;