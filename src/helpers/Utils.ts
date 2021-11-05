import * as azmaps from 'azure-maps-control';
import { at } from 'lodash';
import { BaseControlOptions } from 'src/control/BaseControl';
import { DynamicLayerGroup, LayerGroup, LayerState, LegendType } from '../control';

/** Min/max zoom level range. */
export interface ZoomRange {
    minZoom: number;
    maxZoom: number;
}

export class Utils {
    private static HexCharRx = /&#x[0-9a-zA-Z]+;/g; 

    /**
     * Retrieves a string from a localized resource, the string value passed in, or an empty string.
     * @param val The string value to either retrieve from resources or return as the string.
     * @param resx A localization resource.
     * @param locales Local languages to convert number to a string.
     * @param numberFormat Number format options to use when converting a number to a string.
     * @returns A string.
     */
    public static getString(val: string | number, resx: Record<string, string>, locales?: string | string[], numberFormat?: Intl.NumberFormatOptions): string {
        if (typeof val !== 'undefined') {
            if (typeof val === 'number') {
                return val.toLocaleString(locales, numberFormat);
            }

            if (val !== '') {
                Number.toString()
                return (resx && resx[val]) ? resx[val] : val;
            }
        }
        return '';
    }

    /** Generates a unique GUID. */
    public static uuid(): string {
        //@ts-ignore
        return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
            (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        );
    }

    /** 
     * Gets a layer instance from an id or instance. 
     * @param layer A layer ID or instance.
     * @param map A map instance.
     * @returns A layer instance from an id or instance. 
     */
    public static getLayer(layer: string | azmaps.layer.Layer, map: azmaps.Map): azmaps.layer.Layer {
        if (typeof layer === 'string') {
            return map.layers.getLayerById(layer);
        }

        return layer;
    }

    /**
     * Get the RGBA color values from a color string.
     * @param sColor A color string.
     * @returns The RGBA color values from a color string.
     */
    public static colorToRGBA(sColor: string): number[] {
        const offScreenCanvas = document.createElement('canvas');
        offScreenCanvas.setAttribute('width', '1');
        offScreenCanvas.setAttribute('height', '1');
        const ctx = offScreenCanvas.getContext("2d");
        ctx.fillStyle = sColor; //set fill color
        ctx.fillRect(0, 0, 1, 1);

        const p = ctx.getImageData(0, 0, 1, 1).data;
        return [p[0], p[1], p[2], p[3]];
    }

    /**
     * Gets the theme; 'light', 'dark' from a color string. 
     * @param sColor A color string.
     * @returns The theme; 'light', 'dark' from a color string. 
     */
    public static getColorTheme(sColor: string): 'light' | 'dark' {
        const rgb = Utils.colorToRGBA(sColor);
        const brightness = Math.sqrt(.299 * rgb[0] * rgb[0] + .587 * rgb[1] * rgb[1] + .114 * rgb[2] * rgb[2]);
        return (brightness > 127) ? 'light' : 'dark';
    }

    /**
     * Retrieves an HTMLElement based on ID, query selector string, or HTML Element instance.
     * @param elmInfo An elements ID, query selector string, or HTML Element instance.
     * @returns An HTMLElement based on ID, query selector string, or HTML Element instance.
     */
    public static getElement(elmInfo: string | HTMLElement): HTMLElement {
        if (elmInfo) {
            if (typeof elmInfo === 'string') {
                //Try getting by id.
                var elm = document.getElementById(elmInfo);

                //Try getting by using a query selector.
                if (!elm) {
                    elm = document.querySelector(elmInfo);
                }

                return elm;
            }

            return elmInfo;
        }

        return null;
    }

    /**
     * Replaces a placeholder value within a JSON object. 
     * @param obj The object to replace the placeholder in.
     * @param placeholder The placeholder string.
     * @param value The value to pass into the placeholder.
     * @param removeQutes A boolean indicating if quotes (single or double) around the placeholder should be removed. If false, the value will likely be wrapped with quotes and thus be a string. Setting to true will result in the raw value being exposed.
     * @returns A copy of the object with the placeholders replaced.
     */
    public static replacePlaceholder(obj: any, placeholder: string, value: any, removeQutes: boolean): any {
        if (removeQutes) {
            placeholder = `["']?${placeholder}["']?`;
        }
        const rx = RegExp(placeholder, 'gi');
        return JSON.parse(JSON.stringify(obj).replace(rx, value + ''));
    }

    /**
     * Adds zoom range attributes to an element.
     * @param item The layer group or state to set the elements zoom range on.
     * @param elm The element to set the zoom range on.
     * @param elm2 A secondary element that the min/max zoom info should be added to, such as the dots of a carousel.
     */
    public static setZoomRangeAttr(item: LegendType | LayerState | LayerGroup, baseOptions: BaseControlOptions, elm: HTMLElement, elm2?: HTMLElement): void {        
        const minAttr = 'data-min-zoom';
        const maxAttr = 'data-max-zoom';
        const zoomBehaviorAttr = 'data-zoom-behavior';

        const min = item.minZoom + '';
        const max = item.maxZoom + '';       
        const zoomBehavior = item.zoomBehavior || baseOptions.zoomBehavior || '';

        elm.setAttribute(minAttr, min);
        elm.setAttribute(maxAttr, max);
        elm.setAttribute(zoomBehaviorAttr, zoomBehavior);

        if (elm2) {
            elm2.setAttribute('data-min-zoom', min);
            elm2.setAttribute('data-max-zoom', max);
            elm2.setAttribute(zoomBehaviorAttr, zoomBehavior);
        }
    }

    /**
     * Processes the zoom range attributes of a set of elements based on a zoom level and the desired behavior.
     * @param elms The elements to process.
     * @param zoom The zoom level to process for.
     */
    public static processZoomRangeAttr(elms: NodeListOf<Element>, zoom: number): void {
        const minAttr = 'data-min-zoom';
        const maxAttr = 'data-max-zoom';
        const zoomBehaviorAttr = 'data-zoom-behavior';
        const disabledCss = 'atlas-carousel-disabled-text';

        for (let i = 0; i < elms.length; i++) {
            const elm = elms[i];
            if (elm.hasAttribute(minAttr)) {
                const minZoom = parseInt(elm.getAttribute(minAttr));
                const maxZoom = parseInt(elm.getAttribute(maxAttr));
                const behavior = elm.getAttribute(zoomBehaviorAttr);
                const inRange = (zoom >= minZoom && Math.ceil(zoom) <= maxZoom);

                if (behavior === 'hide') {
                    (<HTMLElement>elm).style.display = inRange ? '' : 'none';
                } else {
                    //Get child items that can be disabled.
                    const children = elm.querySelectorAll('input, option');

                    for (let j = 0; j < children.length; j++) {
                        (<HTMLInputElement>children[j]).disabled = !inRange;
                    }

                    //Set a disabled CSS class on the element which will make text a shaded grey color.
                    if (inRange) {
                        elm.classList.remove(disabledCss);
                    } else {
                        elm.classList.add(disabledCss);
                    }
                }
            }
        }
    }

    /**
     * Gets the zoom level range of a group of layers.
     * @param layers Azure Maps layers to extract zoom level ranges from.
     * @returns The zoom level range of a group of layers.
     */
    public static getZoomRange(layers: azmaps.layer.Layer[]): ZoomRange {

        if (layers && layers.length > 0) {
            const zr = { minZoom: 24, maxZoom: 0 };

            layers.forEach(l => {
                if (l['getOptions']) {
                    const opt = l['getOptions']();

                    zr.minZoom = Math.min(opt.minZoom || 0, zr.minZoom);
                    zr.maxZoom = Math.max(opt.maxZoom || 24, zr.maxZoom);
                }
            });

            if (zr.minZoom > zr.maxZoom) {
                const t = zr.maxZoom;
                zr.maxZoom = zr.minZoom;
                zr.minZoom = t;
            }

            return zr;
        }

        return { minZoom: 0, maxZoom: 24 };
    }

    /**
     * Adds a div with a `clear:both` style to a element container.
     * @param container The container to add the clear div too.
     */
    public static addClearDiv(container: HTMLElement): void {
        const d = document.createElement('div');
        d.className = 'atlas-control-clear';
        container.appendChild(d);
    }

    /**
     * Measures the size of a text string.
     * @param text The text string to measure.
     * @param fontSize The font size.
     * @param font The font family.
     * @returns Text size metrics.
     */
    public static measureText(text: string, fontSize: number, font?: string): TextMetrics {
        const c = document.createElement("canvas");
        const ctx = c.getContext("2d");
        ctx.font = `${fontSize}px ${font || 'Arial'}`;

        //Replace hexadecimal characters with capital W (largest single character) for measuring as special the canvas does not condense these characters.
        if(Utils.HexCharRx.test(text)){
            text = text.replace(Utils.HexCharRx, 'W');        
        }

        return ctx.measureText(text);
    }

    

    /**
    * Wraps text/HTML string with a div, adds it to a container, and adds a clear div underneath.
    * @param container The HTML element to add the text element to.
    * @param text The text/HTML string to add.
    * @param cssClass TA css class to add to the element.
    * @param resx A resource file for localization of strings.
    * @param addClear Specifies is a `clear:both` div should be added at the end.
    */
    public static addStringDiv(container: HTMLElement, text: string, cssClass: string, resx: Record<string, string>, addClear?: boolean, skipMeasure?: boolean): string {
        if (text && text !== '') {
            const self = this;

            //Add legend subtitle.
            text = Utils.getString(text, resx);

            if (text !== '') {
                const textElm = document.createElement('div');
                textElm.className = cssClass;
                textElm.innerHTML = text;
                textElm.setAttribute('aria-label', text);
                container.appendChild(textElm);

                if (!skipMeasure) {
                    //Ensure there is enough space for the title and the expanding button.
                    const size = Utils.measureText(text, 14);
                    textElm.style.minWidth = Math.ceil(size.width + 20) + 'px';
                }

                if (addClear) {
                    Utils.addClearDiv(container);
                }
            }

            return text;
        }

        return '';
    }

    /**
     * Retrieves a number from an object.
     * @param obj Object to get the number from.
     * @param property The property the number value is stored in.
     * @param minValue The min value.
     * @param defaultValue The default value to return if no number found.
     * @returns A number from an object.
     */
    public static getNumber(obj: any, property: string, minValue: number, defaultValue: number): number {
        const val = obj[property];

        if (typeof val === 'number') {
            return Math.max(minValue, val);
        }

        return defaultValue;
    }

    /**
     * Retrieves a number from an object, or a secondary object.
     * @param obj Object to get the number from.
     * @param obj2 Second object to get the number from.
     * @param property The property the number value is stored in.
     * @param minValue The min value.
     * @param defaultValue The default value to return if no number found.
     * @returns A number from an object.
     */
    public static getNumber2(obj: any, obj2: any, property: string, minValue: number, defaultValue: number): number {
        let val = obj[property];

        if (typeof val === 'number') {
            return Math.max(minValue, val);
        }

        val = obj2[property];

        if (typeof val === 'number') {
            return Math.max(minValue, val);
        }

        return defaultValue;
    }

    /**
     * Gets all user defined layers from the map.
     * @param map The map instance.
     * @param layerFiler An array of layers to limit the search to.
     * @returns All user defined layers from the map.
     */
    public static getMapLayers(map: azmaps.Map, layerFilter?: (string | azmaps.layer.Layer)[]): azmaps.layer.Layer[] {
        const userLayers: azmaps.layer.Layer[] = [];

        if (map) {
            const mapLayers = map.layers.getLayers();
            const layers: azmaps.layer.Layer[] = [];


            let filter: string[] = [];
            if (layerFilter && layerFilter.length > 0) {
                layerFilter.forEach(l => {
                    filter.push((typeof l === 'string') ? l : l.getId());
                })
            }

            //Look for a drawing toolbar on the map. If there is one, grab it's drawing manager and filter out it's layers.
            const dt = azmaps.control['DrawingToolbar'];

            if(dt) {
                map.controls.getControls().forEach(c => {
                    if(c instanceof dt) {
                        const l = dt.drawMgr.getLayers();
                        filter.push(l.lineLayer.getId());
                        filter.push(l.pointLayer.getId());
                        filter.push(l.polygonLayer.getId());
                        filter.push(l.polygonOutlineLayer.getId());
                    }
                });
            }

            const simpleDataLayer = azmaps.layer['SimpleDataLayer'];

            mapLayers.forEach(l => {
                //@ts-ignore
                const id = (l.layers && l.layers.length > 0) ? l.layers[0].id : l.getId();

                //Handle simple data layer - filter out it's sublayers.
                if(simpleDataLayer && l instanceof simpleDataLayer){
                    layers.push(l);

                    //Remove/filter out any sub layers.
                    var sublayers = l['getLayers']();
                    Object.keys(sublayers).forEach(key => {
                        const sl = sublayers[key];
                        const idx = layers.indexOf(sl);
                        if(idx > -1){
                            layers.splice(idx, 1);
                        }
                        filter.push(sl.getId());
                    });
                } else if (!id.startsWith('microsoft.maps.')) { //Filter out all microsoft.maps layers.
                    layers.push(l);
                }
            });

            //Finalize filter.
            layers.forEach(l => {
                //@ts-ignore
                const id = (l.layers && l.layers.length > 0) ? l.layers[0].id : l.getId();
                if(filter.indexOf(id) === -1){
                    userLayers.push(l);
                }
            });
        }

        return userLayers;
    }

    /**
     * Determines the number of decimal places in a number.
     * @param num Number to get decimal places for.
     */
    public static decimalPlaces(num: number): number {
        const match = ('' + num).match(/(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/);
        if (!match) { return 0; }
        return Math.max(
            0,
            // Number of digits right of decimal point.
            (match[1] ? match[1].length : 0)
            // Adjust for scientific notation.
            - (match[2] ? +match[2] : 0));
    }

    /**
     * Rounds a number to a specified number of decimal places.
     * @param num The number to round.
     * @param decimals The number of decimal places.
     */
    public static round(num: number, decimals: number): number {
        const factorOfTen = Math.pow(10, decimals);
        return Math.round(num * factorOfTen) / factorOfTen;
    }
}