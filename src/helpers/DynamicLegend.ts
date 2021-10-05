import * as azmaps from 'azure-maps-control';
import { OgcMapLayer } from '../internal/TypingsOverrides';
import { CategoryLegendItem, CategoryLegendType, ColorStop, GradientLegendType, ImageLegendType, LegendControl, LegendType } from '../control';
import { Utils } from './Utils';

/** A legend that dynamically generated from a layers style. */
export interface DynamicLegendType extends LegendType {
    /** The type of legend to create. */
    type: 'dynamic';

    /** The layer to generate the legend(s) for. */
    layer: string | azmaps.layer.Layer;

    /** A CSS class added to all legend cards.  */
    cssClass?: string,

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
    footerFallback?: 'auto' | 'none' | string,
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

/** Tools for processing dynamic legends. */
export class DynamicLegend {

    /**
     * Serializes the options of a layer used by dynamic legends as a string.
     * @param layer Layer serialize options for.
     */
    public static serializeLayerOptions(layer: azmaps.layer.Layer): string {
        if (layer['getOptions']) {
            const opt = layer['getOptions']();
            const o = {
                radius: opt.radius,
                color: opt.color,
                fillColor: opt.fillColor,
                fillPattern: opt.fillPattern,
                strokeColor: opt.strokeColor,
                strokeWidth: opt.strokeWidth,
                strokeGradient: opt.strokeGradient,
                image: (opt.iconOptions) ? opt.iconOptions.image : 0,
                minZoom: opt.minZoom,
                maxZoom: opt.maxZoom,
                visible: opt.visible,

                //OgcMapLayer
                activeLayers: opt.activeLayers
            };

            if (azmaps.layer['SimpleDataLayer'] && layer instanceof azmaps.layer['SimpleDataLayer']) {
                const s: any = [o];

                const subLayers = layer['getLayers']();
                const subLayerTypes = ['bubbleLayer', 'extrudedPolygonLayer', 'lineLayer', 'polygonLayer', 'symbolLayer'];

                subLayerTypes.forEach(sl => {
                    const l = subLayers[sl];
                    const isExtrusion = sl === 'extrudedPolygonLayer';
                    if (l && (!isExtrusion || (isExtrusion && opt.allowExtrusions))) {
                        s.push(DynamicLegend.serializeLayerOptions(l));
                    }
                });

                return JSON.stringify(s);
            }

            return JSON.stringify(o);
        }

        return;
    }

    /**
     * Parses a dynamic legend type into one or more simple legend types (Category, Gradient, or Image).
     * @param legendType The legend type settings.
     * @param legendControl The legend control the legend type is being used with.
     * @returns An array of legend types
     */
    public static parse(legendType: DynamicLegendType, legendControl: LegendControl): LegendType[] {
        const self = DynamicLegend;
        let legends: LegendType[] = [];
        const layer = Utils.getLayer(legendType.layer, legendControl._map);

        if (layer) {
            const azLayers = azmaps.layer;
            const parseStyle = self._parseStyle;
            const overrideCategoryValue = self._overrideCategoryValue;

            let opt: any = {};

            if (layer['getOptions']) {
                opt = layer['getOptions']();
            }

            if (opt.visible) {
                //Only create legends when there are multiple possible values for a style property (expression).
                if (layer instanceof azLayers.BubbleLayer) {
                    //color
                    parseStyle(layer, 'color', 'color', legendType, legendControl, legends);

                    //radius
                    const radiusLegend = parseStyle(layer, 'radius', 'scale', legendType, legendControl, legends);

                    //If a scale legend was created for radius, double the scale size since thats a diameter.
                    if (radiusLegend) {
                        if (radiusLegend.type === 'category') {
                            (<CategoryLegendType>radiusLegend).items.forEach(item => {
                                item.shapeSize *= 2;
                            });
                        }

                        //If there is a single color string set on the layer, modify the color of category.
                        if (typeof opt.color === 'string') {
                            overrideCategoryValue(radiusLegend, 'color', opt.color);
                        }
                    }
                } else if (layer instanceof azLayers.LineLayer) {
                    //strokeGradient
                    const strokeGradientLegend = parseStyle(layer, 'strokeGradient', 'color', legendType, legendControl, legends, true)

                    //If stroke gradient is specified, stroke color is ignored by Azure Maps.
                    if (strokeGradientLegend) {
                        overrideCategoryValue(strokeGradientLegend, 'shape', 'line');
                    } else {
                        //strokeColor
                        overrideCategoryValue(parseStyle(layer, 'strokeColor', 'color', legendType, legendControl, legends, true), 'shape', 'line');
                    }

                    //strokeWidth
                    const strokeWidthLegend = parseStyle(layer, 'strokeWidth', 'scale', legendType, legendControl, legends)
                    overrideCategoryValue(strokeWidthLegend, 'shape', 'line');

                    if (strokeWidthLegend && !strokeGradientLegend && typeof opt.strokeColor === 'string') {
                        overrideCategoryValue(strokeWidthLegend, 'color', opt.strokeColor);
                    }
                } else if (layer instanceof azLayers.PolygonLayer || layer instanceof azLayers.PolygonExtrusionLayer) {
                    //fillPattern
                    const fillPatternLegend = parseStyle(layer, 'fillPattern', 'image', legendType, legendControl, legends);

                    //If fill pattern is specified, fill color is ignored by Azure Maps.
                    if (fillPatternLegend) {
                        overrideCategoryValue(fillPatternLegend, 'shape', 'square');
                    } else {
                        //fillColor - If category legend, override shape with square if not already specified.
                        overrideCategoryValue(parseStyle(layer, 'fillColor', 'color', legendType, legendControl, legends), 'shape', 'square');
                    }
                } else if (layer instanceof azLayers.HeatMapLayer) {
                    //color
                    parseStyle(layer, 'color', 'color', legendType, legendControl, legends, true);
                } else if (layer instanceof azLayers.SymbolLayer) {
                    const iconOptions = opt.iconOptions;
                    if (iconOptions) {
                        //If the image is a string, then there is only one image for the layer. 
                        if (typeof iconOptions.image === 'string') {
                            //Check to see if the image is scaled.
                            if (iconOptions.size && Array.isArray(iconOptions.size)) {
                                //Try retrieving the image.
                                const img = self._getValue(iconOptions.image, 'image', legendControl);

                                if (img && img.shape) {
                                    overrideCategoryValue(parseStyle(layer, 'size', 'scale', legendType, legendControl, legends), 'shape', img.shape);
                                }
                            }
                        } else {
                            //image
                            parseStyle(layer, 'image', 'image', legendType, legendControl, legends);
                        }
                    }
                } else if (azLayers['OgcMapLayer'] && layer instanceof azLayers['OgcMapLayer']) {
                    //https://docs.microsoft.com/en-us/azure/azure-maps/spatial-io-add-ogc-map-layer
                    //https://github.com/Azure-Samples/AzureMapsCodeSamples/blob/master/AzureMapsCodeSamples/Spatial%20IO%20Module/OGC%20Web%20Map%20Service%20explorer.html

                    const l = <OgcMapLayer>layer;

                    //Monitor for when the active layers change.
                    l.onActiveLayersChanged = (ogcLayer) => {
                        if (!ogcLayer._client._capabilities) {
                            ogcLayer.getCapabilities().then(cap => {
                                if (cap) {
                                    legendControl._rebuildContainer();
                                }
                            });
                        } else {
                            legendControl._rebuildContainer();
                        }
                    };

                    const defaultImage = legendType.defaultImage || {};

                    const activeLayers = opt.activeLayers;
                    const client = l._client;

                    //If there is no client or capabilities, these need to be loaded.
                    if (client && client._capabilities && activeLayers) {
                        const sublayers = client._capabilities.sublayers;
                        if (sublayers) {
                            activeLayers.forEach(al => {
                                for (var i = 0; i < sublayers.length; i++) {
                                    if ((typeof al === 'string' && al === sublayers[i].id) || al.id === sublayers[i].id) {
                                        const styles = al.styles;

                                        if (styles && styles.length > 0 && styles[0].legendUrl && styles[0].legendUrl !== '') {
                                            legends.push(<ImageLegendType>{
                                                type: 'image',
                                                url: styles[0].legendUrl.replace(/\&amp;/g, '&'),
                                                subtitle: al.title || al.subtitle || sublayers[i].id || '',
                                                footer: al.description || al.abstract || '',
                                                minZoom: al.minZoom,
                                                maxZoom: al.maxZoom,
                                                maxHeight: defaultImage.maxHeight,
                                                maxWidth: defaultImage.maxWidth
                                            });
                                        }
                                    }
                                }
                            });
                        }
                    }
                } else if (azLayers['SimpleDataLayer'] && layer instanceof azLayers['SimpleDataLayer']) {
                   //Do nothing as there isn't enough details in these to generate a legend as styles are stored as properties on individual features.
                }
            }
        }

        return legends;
    }

    /**
     * Generates a legend type settings for a layers style property.
     * @param property The style property to parse.
     * @param type The type of style property being parsed.
     * @param legendType The parent legend type.
     * @param legendControl The legend control.
     * @param legends The array of legends that have been created.
     * @param overrideLabels Specifies if labels should be overriden
     * @returns The generated legend incase any post-processing is needed.
     */
    private static _parseStyle(layer: azmaps.layer.Layer, property: string, type: 'color' | 'scale' | 'image', legendType: DynamicLegendType, legendControl: LegendControl, legends: LegendType[], overrideLabels?: boolean): LegendType {
        if (layer['getOptions']) {
            const self = DynamicLegend;

            const opt = layer['getOptions']();
            let exp = opt[property];

            if (!exp && opt.iconOptions && property === 'image' && type === 'image') {
                exp = opt.iconOptions[property];
            }

            if (self._isExp(exp)) {

                let l: LegendType;

                switch (exp[0]) {
                    case 'step':
                        l = self._parseStep(layer, exp, type, legendType, legendControl);
                        break;
                    case 'match':
                        l = self._parseMatch(layer, exp, type, legendType, legendControl);
                        break;
                    case 'interpolate': //color, scale
                        l = self._parseInterpolation(layer, exp, type, legendType);
                        break;
                }

                if (l) {
                    switch (l.type) {
                        case 'category':
                            if (legendType.defaultCategory) {
                                Object.assign(l, legendType.defaultCategory);
                            }
                            break;
                        case 'gradient':
                            if (overrideLabels) {
                                const lg = (<GradientLegendType>l);
                                lg.stops.forEach(stop => {
                                    stop.label = undefined;
                                });
                                lg.stops[0].label = 'low';
                                lg.stops[lg.stops.length - 1].label = 'high';
                            }

                            if (legendType.defaultGradient) {
                                Object.assign(l, legendType.defaultGradient);
                            }
                            break;
                        case 'image':
                            if (legendType.defaultImage) {
                                Object.assign(l, legendType.defaultImage);
                            }
                            break;
                    }

                    if (typeof opt.minZoom === 'number') {
                        l.minZoom = opt.minZoom;
                    }

                    if (typeof opt.maxZoom === 'number') {
                        l.maxZoom = opt.maxZoom;
                    }

                    l.cssClass = legendType.cssClass;

                    legends.push(l);

                    return l;
                }
            }
        }

        return;
    }

    /**
      * Parses a `step` expression into a legend type.
      * @param exp Expression to parse.
      * @param type The type of style property the expression is for.
      * @param legendType The dynamic legend type settings.
      * @param legendControl The legend control the legend is for.
      * @returns A legend type or null.
      */
    private static _parseStep(layer: azmaps.layer.Layer, exp: any, type: 'color' | 'scale' | 'image', legendType: DynamicLegendType, legendControl: LegendControl): LegendType {
        /*
         ["step",
            input: number,
            base_output: number | string,
            stop_input_1: number, stop_output_1: number | string,
            stop_input_n: number, stop_output_n: number | string, ...
        ]

        [
            'step',
            ['get', 'traffic_level'],
            '#6B0512', //Dark red
            0.01, '#EE2F53', //Red
            0.8, 'orange', //Orange
            1, "#66CC99" //Green
        ]
        */

        //type == color -> stepped gradient, type == scale -> category, type == image -> category  

        if (exp.length >= 5 && exp.length % 2 === 1) {
            const self = DynamicLegend;
            const getString = Utils.getString;

            //Category legend.
            const items: CategoryLegendItem[] = [];
            const len = exp.length;

            const base = exp[2];

            const opt = legendControl.getOptions();
            const resx = opt.resx;

            if (((type === 'color' || type === 'image') && typeof base !== 'string') ||
                (type === 'scale' && typeof base !== 'number')) {
                return;
            }

            //Base item.
            const baseItem = self._getValue(base, type, legendControl);

            if (!baseItem) {
                return;
            }

            const defaultCategory = legendType.defaultCategory;

            let numberFormat: Intl.NumberFormatOptions;
            let numberFormatLocales: string | string[];

            if (defaultCategory) {
                numberFormat = defaultCategory.numberFormat;
                numberFormatLocales = defaultCategory.numberFormatLocales;
            }

            let lastLabel = getString(exp[3], resx, numberFormatLocales, numberFormat);
            baseItem.label = '<' + lastLabel;
            items.push(baseItem);

            //Stop items.
            for (var i = 3; i < len; i += 2) {

                const stop = self._getValue(exp[i + 1], type, legendControl);

                if (!stop) {
                    return;
                }

                stop.label = getString(exp[i], resx, numberFormatLocales, numberFormat);

                if (i === len - 2) {
                    stop.label = '>' + lastLabel;
                } else {
                    const l = getString(exp[i + 2], resx, numberFormatLocales, numberFormat);
                    stop.label = `${lastLabel} - ${l}`;
                    lastLabel = l;
                }

                items.push(stop);
            }

            return <CategoryLegendType>{
                type: 'category',
                items: items,
                subtitle: legendType.subtitle || self._getSubtitle(legendType.subtitleFallback, exp[1], layer),
                footer: legendType.footer || self._getFooter(legendType.footerFallback, layer),

                //Prefer descending order when displaying colors or scales, as it looks nicer.
                layout: type !== 'image' ? 'column-reverse' : 'column',

                //Prefer to collapse the space around the shapes when displaying color.
                collapse: type === 'color'
            };
        }
    }

    /**
     * Parses a `match` expression into a legend type.
     * @param exp Expression to parse.
     * @param type The type of style property the expression is for.
     * @param legendType The dynamic legend type settings.
     * @param legendControl The legend control the legend is for.
     * @returns A legend type or null.
     */
    private static _parseMatch(layer: azmaps.layer.Layer, exp: any, type: 'color' | 'scale' | 'image', legendType: DynamicLegendType, legendControl: LegendControl): LegendType {
        /*
            Partial, labels with number/string arrays not supported.

            "no data" value will be used as label for fallback. Add a "no data" key to the resx to override label text.

            [
                'match',
                input: number | string,
                label1: number | string, 
                output1: value,
                label2: number | string, 
                output2: value,
                ...,
                fallback: value
            ] 
    
            [
                'match',
                ['get', 'magnitude'],
                1, 'green',	    
                2, 'orange',	
                3, 'red',		
                'gray'			
            ]
    
            [
                'match',
    
                ['get', 'EntityType'],
    
                //For each entity type, specify the icon name to use.
                'Gas Station', 'gas_station_icon',
                'Grocery Store', 'grocery_store_icon',
                'Restaurant', 'restaurant_icon',
                'School', 'school_icon',
    
                //Default fallback icon.
                'marker-blue'
            ]
        */

        if (exp.length >= 5 && exp.length % 2 === 1) {
            //Category legend for all types.

            const self = DynamicLegend;
            const items: CategoryLegendItem[] = [];

            //Stop items.
            for (let i = 2, len = exp.length - 1; i < len; i += 2) {
                const stop = self._getValue(exp[i + 1], type, legendControl);

                if (!stop) {
                    return;
                }

                stop.label = exp[i];
                items.push(stop);
            }

            //Fallback item.
            const fallback = self._getValue(exp[exp.length - 1], type, legendControl);

            if (!stop) {
                return;
            }

            fallback.label = 'no data';
            items.push(fallback);

            return <CategoryLegendType>{
                type: 'category',
                items: items,
                subtitle: legendType.subtitle || self._getSubtitle(legendType.subtitleFallback, exp[1], layer),
                footer: legendType.footer || self._getFooter(legendType.footerFallback, layer),

                //Prefer to collapse the space around the shapes when displaying color.
                collapse: type === 'color'
            };
        }
    }

    /**
     * Parses an `interpolation` expression into a legend type.
     * @param exp Expression to parse.
     * @param type The type of style property the expression is for.
     * @param legendType The dynamic legend type settings.
     * @returns A legend type or null.
     */
    private static _parseInterpolation(layer: azmaps.layer.Layer, exp: any, type: 'color' | 'scale' | 'image', legendType: DynamicLegendType): LegendType {
        /*
            Supports only linear and exponential interpolation. "cubic-bezier" interpolation not supported.

            type == color -> gradient
            type == scale -> category

            ["interpolate",
                interpolation: ["linear"] | ["exponential", base],
                input: number,
                stop_input_1: number, stop_output_1: OutputType,
                stop_input_n: number, stop_output_n: OutputType, ...
            ]

            [
                'interpolate',
                ['linear'],
                ['get', 'PopChange' + i],
                -maxScale, 'rgb(255,0,255)',       // Magenta
                -maxScale / 2, 'rgb(0,0,255)',     // Blue
                0, 'rgb(0,255,0)',                 // Green
                maxScale / 2, 'rgb(255,255,0)',    // Yellow
                maxScale, 'rgb(255,0,0)'           // Red
            ]
    
             [
                'interpolate',
                ['linear'],
                ['get', 'mag'],
                0, 'green',
                5, 'yellow',
                6, 'orange',
                7, 'red'
            ]
        */

        if (exp.length >= 7 && exp.length % 2 === 1) {
            const self = DynamicLegend;
            const subtitle = legendType.subtitle || self._getSubtitle(legendType.subtitleFallback, exp[2], layer);
            const footer = legendType.footer || self._getFooter(legendType.footerFallback, layer);

            const minLabel = exp[3];
            const maxLabel = exp[exp.length - 2];

            if (type === 'color') { //Gradient legend
                const interpFn = self._getInterpFn(exp[1], minLabel, maxLabel);

                if (interpFn) {
                    const stops: ColorStop[] = [];

                    let lastOffset = -1;

                    //The minimum offset space required between labels. Doing this to reduce label collision.
                    const minLabelOffset = 0.05;

                    for (let i = 3, len = exp.length; i < len; i += 2) {
                        //Get a value between 0 and 1.
                        let label = exp[i];
                        const output = exp[i + 1];

                        if (typeof output !== 'string') {
                            return;
                        }

                        const offset = interpFn(label);

                        //If the space between offsets is too small, don't add the label.
                        if (offset - lastOffset < minLabelOffset) {
                            label = undefined;
                            lastOffset = offset;
                        }

                        stops.push({
                            offset: offset,
                            label: label,
                            color: output
                        });
                    }

                    return <GradientLegendType>{
                        type: 'gradient',
                        stops: stops,
                        subtitle: subtitle,
                        footer: footer
                    };
                }
            } else if (type === 'scale') { //Category legend
                const items: CategoryLegendItem[] = [];

                for (let i = 3, len = exp.length; i < len; i += 2) {

                    //Get a value between 0 and 1.
                    const label = exp[i];
                    const output = exp[i + 1];

                    if (typeof output !== 'number') {
                        return;
                    }

                    items.push({
                        shapeSize: (output === 0) ? 0.01 : output,
                        label: label
                    });
                }

                //When there are only two items in the scale, add a mid-point otherwise there is no way to know the difference between linear and exponential.
                if (exp.length === 7) {
                    //Calculate mid-point.
                    const dx = maxLabel - minLabel;
                    let midLabel = minLabel + dx / 2;

                    const interpFn = self._getInterpFn(exp[1], minLabel, maxLabel);

                    const minOutput = exp[4];
                    const maxOutput = exp[6];
                    const midOutput = interpFn(midLabel) * (maxOutput - minOutput) + minOutput;

                    //Allow one extra decimal place from existing labels since we divided by two earlier.
                    midLabel = Utils.round(midLabel, Math.max(Utils.decimalPlaces(minLabel), Utils.decimalPlaces(maxLabel)) + 1);

                    //Insert before last item.
                    items.splice(items.length - 1, 0, {
                        shapeSize: midOutput,
                        label: midLabel
                    });
                }

                //Prefer that when displaying scales, should in descending order as it looks nicer.
                return <CategoryLegendType>{
                    type: 'category',
                    items: items,
                    layout: 'column-reverse',
                    subtitle: subtitle,
                    footer: footer,
                    fitItems: true
                };
            }

            //type = image - not supported.
        }

        return;
    }

    /**
     * Parses a simple input getter of an expression. 
     * @param input The input expression.
     * @returns The getter property name.
     */
    private static _parseInputGetter(input: any[]): string {
        if (Array.isArray(input) && input[0] === 'get' && typeof input[1] === 'string') {
            return input[1];
        }

        return;
    }

    /**
     * Returns a function that processes an interpolation on a value.
     * @param interpExp The interpolation expression.
     * @param values The data range values.
     * @returns A function that processes an interpolation on a value.
     */
    private static _getInterpFn(interpExp: any[], minValue: number, maxValue: number): NumberConverter {
        //["linear"] | ["exponential", base] | ["cubic-bezier", x1, y1, x2, y2]
        const type = interpExp[0];
        const difference = maxValue - minValue;

        if (difference === 0) {
            return (x: number) => {
                return 0;
            };
        }

        if (type === 'linear') {
            return (x: number) => {
                let progress = (x - minValue);
                return progress / difference;
            };
        } else if (type === 'exponential') {
            const base = interpExp[1];

            return (x: number) => {
                let progress = (x - minValue);
                return (Math.pow(base, progress) - 1) / (Math.pow(base, difference) - 1);
            };
        }

        return;
    }

    /**
     * Determines if an object is possibly an expression. 
     * @param obj An object to check.
     * @returns Boolean indicating if object likely an expression or not.
     */
    private static _isExp(obj: any): boolean {
        return (obj && Array.isArray(obj) && obj.length > 0 && typeof obj[0] === 'string');
    }

    /**
     * Overrides a property on a category legend type.
     * @param legend The legend type.
     * @param property The property of the legend type to override.
     * @param value The value to set.
     */
    private static _overrideCategoryValue(legend: LegendType, property: string, value: string): void {
        //Check if legend exists, is category type, and doesn't already have the property value defined.
        if (legend && legend.type === 'category' && !(<CategoryLegendType>legend)[property]) {
            (<CategoryLegendType>legend)[property] = value;
        }
    }

    /**
     * Takes a raw value, validates, and sets it correctly on the appropriate CategoryItem property depending on the type of style property the value is for. 
     * @param val The raw value to retrieve.
     * @param type The type of style property the value is for.
     * @param legendControl The legend control.
     * @returns A simple CategoryItem or null.
     */
    private static _getValue(val: number | string, type: 'color' | 'scale' | 'image', legendControl: LegendControl): any {
        let value;
        const isString = typeof val === 'string';
        if (type === 'color' && isString) {
            value = { color: val };
        } else if (type === 'scale' && typeof val === 'number') {
            value = { shapeSize: val === 0 ? 0.01 : val };
        } else if (type === 'image' && isString && legendControl._map) {
            const img = this._getImage(legendControl._map, <string>val);
            if (img) {
                value = { shape: img };
            }
        }
        return value;
    }

    /**
     * Tries to retrieve the image source for an image in the maps image sprite.
     * @param map A map instance.
     * @param imgName The name of the image.
     * @returns Image source string, or null.
     */
    private static _getImage(map: azmaps.Map, imgName: string): string {
        if (map && imgName !== 'none') {
            //Check user defined images.
            if (map.imageSprite.hasImage(imgName)) {
                //@ts-ignore
                return map.imageSprite.userImages.get(imgName).src;
            }

            //Try built in images. 
            let template: string;
            let color: string;

            if (imgName.startsWith('marker')) {
                template = 'marker';
                color = imgName.replace('marker-', '');
            } else if (imgName.startsWith('pin-round')) {
                template = 'pin-round';
                color = imgName.replace('pin-round-', '');
            } else if (imgName.startsWith('pin')) {
                template = 'pin';
                color = imgName.replace('pin-', '');
            }

            if (template) {
                const defaultColors = {
                    'black': '#231f20',
                    'blue': '#1a73aa',
                    'darkblue': '#003963',
                    'red': '#ef4c4c',
                    'yellow': '#f2c851'
                };

                color = defaultColors[color];
                if (color) {
                    return azmaps.getImageTemplate(template, 1).replace(/{color}/g, color).replace(/{secondaryColor}/g, '#fff').replace(/{text}/g, '');
                }
            }
        }

        return;
    }

    /**
     * Gets a subtitle string value.
     * @param method The extraction method.
     * @param expression An expression to try and extract the property name from.
     * @param layer The layer.
     * @returns 
     */
    private static _getSubtitle(method: string, exp: any[], layer: azmaps.layer.Layer): string {
        method = method || 'auto';
        if (method === 'none') {
            return;
        }

        const metadata = layer.metadata || {};
        const id = layer.getId();

        if (method === 'auto') {
            return metadata['title'] || metadata['subtitle'] || id;
        } else if (method === 'expression') {
            return this._parseInputGetter(exp) || id;
        }

        return metadata[method] || '';
    }

    /**
     * Gets a footer string value.
     * @param method The extraction method.
     * @param layer The layer.
     */
    private static _getFooter(method: string, layer: azmaps.layer.Layer): string {
        method = method || 'auto';
        const metadata = layer.metadata || {};

        if (method === 'auto') {
            return metadata['footer'] || metadata['description'] || metadata['abstract'] || '';
        } else if (method !== 'none') {
            return metadata[method] || '';
        }

        return;
    }
}

interface NumberConverter {
    (x: number): number;
}
