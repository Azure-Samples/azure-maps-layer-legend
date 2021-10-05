import atlas, * as azmaps from 'azure-maps-control';
import { LayerGroup, LayerState, LegendType } from '.';
import { Utils } from '../helpers/Utils';

/** Options that all controls that extend the BaseControl class support. */
export interface BaseControlOptions {
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

    /** Specifies how a layer group or state should be treated when the map zoom level falls outside of the items min and max zoom range. Default: `'disable'` */
    zoomBehavior?: 'disable' | 'hide';

    /**	Specifies if a toggle button for minimizing the controls content should be displayed or not when the control within the map. Default: `true` */
    showToggle?: boolean;

    /** When displayed within the map, specifies if the controls content is minimized or not. Default: `false` */
    minimized?: boolean;
}

/** Base control events. */
export interface BaseControlEvents {
    /** Event fired when the control is minimized or expanded. */
    toggled: ControlToggledEventArgs;
}

/** Event args for when the control is toggled (minified/expanded). */
export interface ControlToggledEventArgs {
    /** The event type name. */
    type: 'toggled';

    /** Specifies if the control is minified or not. */
    minimized: boolean;
}

export abstract class BaseControl<T> extends azmaps.internal.EventEmitter<T> implements azmaps.Control {
    /****************************
    * Private Properties
    ***************************/

    public _map: azmaps.Map;
    public _container: HTMLElement;
    public _content: HTMLElement;
    public _needsRebuild = false;
    public _rebuildOnStyleChange = false;

    private _hclStyle: azmaps.ControlStyle;
    private _darkColor = '#011c2c';

    public _fontColor;
    public _bgColor;

    public _baseOptions: BaseControlOptions = {
        layout: 'carousel',
        style: <azmaps.ControlStyle>'light',
        visible: true,
        zoomBehavior: 'hide',
        showToggle: true,
        minimized: false
    };

    private _nameIdx: number;
    private _cssClass: string;

    public _currentIdx: number = 0;
    public _hasZoomableContent: boolean = false;

    private _btn: HTMLButtonElement;
    private _controlPosition: azmaps.ControlPosition;
    private _btnRotation = 0;

    private _btnCSS: string;

    /** 0 - Legend control, 1 - Layer control, 2 - Expand, 3 - Collapse */
    private _localization: string[];

    private _controlCount = 0;
    private _controlWatcher: any;

    /****************************
     * Constructor
     ***************************/

    /**
     * A control that displays a legend.
     * @param nameIdx The localization index of the controls name; 0 - Legend control, 1 - Layer control
     * @param cssClass The root CSS class for the control.
     * @param btnCSS The CSS for the button icon to display when control collapsed into a button.
     */
    constructor(nameIdx: number, cssClass: string, btnCSS: string) {
        super();

        const self = this;
        self._nameIdx = nameIdx;
        self._cssClass = cssClass;
        self._btnCSS = btnCSS;
    }

    /****************************
     * Public Methods
     ***************************/

    /**
     * Action to perform when the control is added to the map.
     * @param map The map the control was added to.
     * @param options The control options used when adding the control to the map.
     * @returns The HTML Element that represents the control.
     */
    public onAdd(map: azmaps.Map, options?: azmaps.ControlOptions): HTMLElement {
        const self = this;

        self._map = map;

        let lang = map.getStyle().language || atlas.getLanguage();

        if (lang && lang.indexOf('-') > 0) {
            lang = lang.substring(0, lang.indexOf('-'));
        }

        const t = BaseControl._translations;
        let localization = t[lang];

        if (!localization) {
            localization = t['en']
        }

        self._localization = localization;

        if (options) {
            self._controlPosition = options.position
        }

        const container = document.createElement('div');
        container.classList.add('azure-maps-control-container');

        if (self._cssClass) {
            container.classList.add(self._cssClass);
        }

        const controlName = localization[self._nameIdx];
        if (controlName) {
            container.setAttribute('aria-label', controlName);
        }

        self._container = container;

        const mcl = map.getMapContainer().classList;
        if (mcl.contains("high-contrast-dark")) {
            self._hclStyle = <azmaps.ControlStyle>'dark';
        } else if (mcl.contains("high-contrast-light")) {
            self._hclStyle = <azmaps.ControlStyle>'light';
        }

        self._setStyle(self._baseOptions.style);

        self._rebuildContainer();

        if (typeof self._baseOptions.visible !== 'undefined') {
            const display = (self._baseOptions.visible) ? '' : 'none';

            if (container) {
                container.style.display = display;
            }

            if (self._content) {
                self._content.style.display = display;
            }
        }

        self._controlWatcher = setInterval(self._checkControlCount, 1000);

        map.events.add('zoomend', self._mapZoomChanged);
        self._mapZoomChanged(null);
        return container;
    }

    /**
    * Action to perform when control is removed from the map.
    */
    public onRemove(): void {
        const self = this;

        if (self._content) {
            self._content.remove();
            self._content = null;
        }

        if (self._container) {
            self._container.remove();
            self._container = null;
        }

        if(self._controlWatcher){
            clearInterval(self._controlWatcher);
            self._controlWatcher = null;
        }

        const map = self._map;

        if (map) {
            if (self._baseOptions.style.startsWith('auto')) {
                map.events.remove('styledata', self._mapStyleChanged);
            }

            map.events.remove('zoomend', self._mapZoomChanged);
        }

        self._map = null;
    }

    /**
     * Sets the base options of the control.
     * @param options The options to set.
     */
    public setOptions(options?: BaseControlOptions): void {
        options = options || {};

        const self = this;
        const opt = self._baseOptions;
        const container = self._container;
        const content = self._content;

        let needsZoomFilter = false;

        if (options.style !== undefined) {
            opt.style = options.style;
            self._setStyle(options.style);
        }

        if (options.zoomBehavior !== undefined) {
            opt.zoomBehavior = options.zoomBehavior;
            self._needsRebuild = true;
        }

        if (options.visible !== undefined) {
            opt.visible = options.visible;
            const display = (options.visible) ? '' : 'none';

            if (container) {
                container.style.display = display;
            }

            if (content) {
                content.style.display = display;
            }

            needsZoomFilter = true;
        }

        if (options.minimized !== undefined && opt.minimized !== options.minimized) {
            opt.minimized = options.minimized;
            self._setBtnState();
        }

        if (options.container !== undefined) {
            opt.minimized = false;
            self._setBtnState();
            opt.container = options.container;
            self._needsRebuild = true;
        }

        if (options.layout !== undefined && opt.layout !== options.layout) {
            opt.layout = options.layout;
            self._needsRebuild = true;
        }

        if (options.showToggle !== undefined && opt.showToggle !== options.showToggle) {
            opt.showToggle = options.showToggle;
            if (!options.showToggle) {
                //If no toggle displayed, don't minimize control.
                options.minimized = false;
            }
            self._setBtnState();
        }

        if (self._needsRebuild && self._map) {
            self._rebuildContainer();
        } else if (needsZoomFilter) {
            self._mapZoomChanged(null);
        }
    }

    /** Method to generate content of control. */
    public abstract _createContent(): void;

    /**
    * Navigates to the specified item index within a carousel, accordion, or list.
    * @param idx The item index in the array of items in the control options.
    * @param focus Specifies if tab focus should move inside of the specified item.
    */
    public abstract _setItemIndex(idx: number, focus?: boolean): void;

    /** Adds a card to the container. */
    public _addCard(card: HTMLElement, dotContainer: HTMLElement, item: LegendType | LayerState | LayerGroup, handleText: string): void {
        const self = this;
        const content = self._content;
        const layout = self._baseOptions.layout;

        let handle: HTMLElement;

        if (layout === 'carousel') {
            handle = document.createElement('button');
            handle.className = 'atlas-carousel-dot';
            dotContainer.appendChild(handle);
            content.appendChild(card);
        } else if (layout === 'accordion') {
            handle = document.createElement('button');
            handle.className = 'atlas-accordion-button';
            handle.innerHTML = handleText;

            content.appendChild(handle);
            content.appendChild(card);
        } else {
            //Ensure to fallback incase user passed in bad value.
            self._baseOptions.layout = 'list';
            content.appendChild(card);
        }

        if (handle) {
            const idx = card.getAttribute('rel');

            handle.setAttribute('rel', idx);
            handle.setAttribute('aria-label', handleText);
            handle.setAttribute('title', handleText);
            handle.setAttribute('aria-controls', card.id);

            handle.onclick = self._handledClicked.bind(self);

            if (self._currentIdx === parseInt(idx)) {
                card.style.display = '';
                handle.setAttribute('aria-expanded', 'true');
                handle.classList.add('active');
            } else {
                handle.setAttribute('aria-expanded', 'false');
                card.style.display = 'none';
            }
        }

        //Store min/max zoom info as attributes.
        Utils.setZoomRangeAttr(item, self._baseOptions, card, handle);
    }

    /****************************
     * Private Methods
     ***************************/

    private _checkControlCount = () => {
        const self = this;
        const map = self._map;
        if(map){
            const cnt = map.controls.getControls().length;

            if(self._controlCount !== cnt) {
                self._controlCount = cnt;

                //Ensure control fits.
                self._adjustSize();
            }
        }
    };

    /**
     * Event handler for when the map zoom level has changed.
     * Layer options are disabled when zoom outside of their min/max zoom level.
     */
    public _mapZoomChanged = (e: azmaps.MapEvent): void => {
        const self = this;
        const content = self._content;
        const opt = self._baseOptions;

        if (content) {
            if (self._hasZoomableContent) {
                const zoom = self._map.getCamera().zoom;

                //Will either be the first visible legend, or the current index.
                let fallbackIdx: number;

                const cards = content.querySelectorAll('.atlas-layer-legend-card');
                const handles = content.querySelectorAll('.atlas-carousel-dot, .atlas-accordion-button');

                for (let i = 0; i < cards.length; i++) {
                    const card = <HTMLElement>cards[i];
                    const idx = parseInt(card.getAttribute('rel'));

                    const minZoom = parseInt(card.getAttribute('data-min-zoom'));
                    const maxZoom = parseInt(card.getAttribute('data-max-zoom'));
                    const zoomBehavior = card.getAttribute('data-zoom-behavior');
                    const inRange = (zoom >= minZoom && Math.ceil(zoom) <= maxZoom);
                    const display = (inRange) ? '' : 'none';

                    if (zoomBehavior === 'hide') {
                        if (opt.layout === 'carousel' || opt.layout === 'accordion') {
                            if (handles.length > 0) {
                                //Handles only exist in carousel and accordion mode.
                                (<HTMLElement>handles[i]).style.display = display;
                            }
                        } else {
                            //Hide cards when list layout. 
                            card.style.display = display;
                        }
                    }

                    if (inRange && (typeof fallbackIdx === 'undefined' || idx === self._currentIdx)) {
                        fallbackIdx = idx;
                    }

                    //Need to apply similar logic to state items which are wrapped as a label or option.
                    const elms = card.querySelectorAll('label, option');
                    Utils.processZoomRangeAttr(elms, zoom);
                }

                if (opt.zoomBehavior === 'hide') {
                    //Case when there is no layers visible, hide the layer control, but only if it is meant to be visible.
                    if (opt.visible && !opt.minimized) {
                        content.style.display = (typeof fallbackIdx === 'undefined') ? 'none' : '';
                    }

                    if (self._currentIdx !== fallbackIdx) {
                        self._setItemIndex(fallbackIdx, true);
                    }
                }
            } else if (opt.visible && !opt.minimized) {
                //Ensure legend if visible.
                content.style.display = '';
            }
        }
    };

    /**
     * Rebuilds the container.
     */
    public _rebuildContainer = (): void => {
        const self = this;
        const opt = self._baseOptions;
        const container = self._container;

        self._createContent();
        self._setStyle(opt.style);

        const content = self._content;

        if (!opt.visible) {
            container.style.display = 'none';
            content.style.display = 'none';
        }

        if (!opt.container) {
            if (self._btn) {
                self._btn.remove();
            }

            //Create expansion button.
            const btnStyle: any = {
                display: opt.showToggle ? '' : 'none',
                backgroundColor: self._bgColor
            };
            let rotation = 90;

            let position = self._controlPosition;

            if (!position || position === 'non-fixed') {
                position = <azmaps.ControlPosition>'top-left';
            }

            const isLeft = position.indexOf('left') > -1;
            const isTop = position.indexOf('top') > -1;

            if (isTop) {
                btnStyle.bottom = '0';
                rotation = isLeft ? 180 : 270;
            } else {
                btnStyle.top = '0';
                rotation = isLeft ? 90 : 0;
            }

            if (isLeft) {
                btnStyle.right = '0';
            } else {
                btnStyle.left = '0';
            }

            btnStyle.transform = `rotate(${rotation}deg)`;
            self._btnRotation = rotation;

            container.onclick = self._contentBtnClicked;

            const btn = document.createElement("button");
            btn.setAttribute('type', 'button');
            btn.classList.add('atlas-layer-legend-expand-btn');
            Object.assign(btn.style, btnStyle);
            btn.addEventListener('click', self._toggle);
            container.appendChild(btn);
            
            const ariaLabel = self._localization[self._nameIdx] + ' - ' + self._localization[3]; //Collapse
            btn.setAttribute('title', ariaLabel);
            btn.setAttribute('alt', ariaLabel);

            self._btn = btn;
            self._setBtnState();
        }

        self._mapZoomChanged(null);
        self._adjustSize();        
    }

    private _adjustSize(): void {
        const self = this;
        const opt = self._baseOptions;
        const container = self._container;

        if (self._map) {
            let maxWidth = 'unset';
            let maxHeight = 'unset';

            //When legend is displayed within the map, need to restrict the size of the legend content.
            if (!opt.container) {
                const rect = self._map.getCanvasContainer().getClientRects()[0];

                //Subtract 20 pixels to account for padding around controls in the map.
                maxWidth = (rect.width - 20) + 'px';

                let maxContainerHeight = rect.height - 20;

                const cp = <string>self._controlPosition;
                if (cp && cp !== '' && cp !== 'non-fixed') {
                    const side = (cp.indexOf('left') > -1)? 'left' : 'right';
                    
                    //Determine how many controls exist in the same position.
                    let cnt = 0;

                    //@ts-ignore
                    const controlContainers = self._map.controls.controlContainer.children;
                    Array.from(controlContainers).forEach(c => {
                        if ((<HTMLElement>c).className.indexOf(side) > -1) {
                            cnt += (<HTMLElement>c).children.length;
                        }
                    });

                    if(cnt > 1) {
                        //Account for this control.
                        cnt--;

                        //Account for legend control which we know uses a non-fixed position but is in the bottom right corner of the map.
                        if(cp.indexOf('right') > -1) {
                            cnt++;
                        }

                        //Give all other controls 35px space (button size), and 20px map padding.
                        maxContainerHeight = Math.min(maxContainerHeight, rect.height - cnt * 35 - 20);
                    }
                }

                //Set the max height of the container to 75% of the maps height, or the height minus 20 pixels, whichever is smaller.
                Object.assign(container.style, {
                    maxHeight: maxContainerHeight + 'px',
                    maxWidth: maxWidth
                });

                if (opt.layout === 'accordion') {
                    //Need to account for additional height to account fro button size. Give 30px per button and 20px for the title.
                    const accordBtns = container.querySelectorAll('.atlas-accordion-button');
                    maxContainerHeight = (maxContainerHeight - accordBtns.length * 30 - 20);
                    maxHeight = maxContainerHeight + 'px';
                } else if (opt.layout === 'carousel') {
                    //Need to account for legend title and dot container height (height - 110px).
                    maxContainerHeight = rect.height - 110;
                    maxHeight = maxContainerHeight + 'px';
                }

                if(maxContainerHeight <= 40){
                    maxHeight = 'unset';
                }

                let cardContainers = container.querySelectorAll('.atlas-layer-legend-card');

                cardContainers.forEach(cc => {
                    Object.assign((<HTMLElement>cc).style, {
                        maxHeight: maxHeight,
                        maxWidth: maxWidth
                    });
                });
            }
        }
    }

    /** Sets the style of the control. */
    private _setStyle(style: azmaps.ControlStyle | 'auto-reverse' | string): void {
        if (style) {
            const self = this;
            const map = self._map;

            if (map) {
                if (style.startsWith('auto') && !self._hclStyle) {
                    map.events.add('styledata', self._mapStyleChanged);
                    self._setColorFromMapStyle();
                } else {
                    map.events.remove('styledata', self._mapStyleChanged);
                    self._setControlColor(style);
                }
            }
        }
    }

    /**
    * An event handler for when the map style changes. Used when control style is set to auto.
    */
    private _mapStyleChanged = () => {
        this._setColorFromMapStyle();

        if (this._rebuildOnStyleChange) {
            this._rebuildContainer();
        }
    };

    /**
     * Retrieves the background color for the button based on the map style. This is used when style is set to auto.
     */
    private _setColorFromMapStyle(): void {
        const self = this;
        let theme: azmaps.ControlStyle = <azmaps.ControlStyle>'light';

        //When the style is dark (i.e. satellite, night), show the dark colored theme.
        if (['satellite', 'satellite_road_labels', 'grayscale_dark', 'night', 'high_contrast_dark'].indexOf(self._map.getStyle().style) > -1) {
            theme = <azmaps.ControlStyle>'dark';
        } else if (['road', 'grayscale_light', 'road_shaded_relief', 'blank', 'blank_accessible', 'high_contrast_light'].indexOf(self._map.getStyle().style) === -1) {
            //If the map style name isn't known.
            //Check the background color style. Typically dark map styles will have a dark background so that there isn't a flash when tiles are loading.
            const styles = self._map['map'].getStyle();

            for (let i = 0; i < styles.length; i++) {
                const s = styles[i];
                if (s.type === 'background') {
                    if (s.paint && typeof s.paint['background-color'] === 'string') {
                        theme = <azmaps.ControlStyle>Utils.getColorTheme(s.paint['background-color']);
                    }
                    break;
                }
            }
        }

        if (self._baseOptions.style === 'auto-reverse') {
            theme = <azmaps.ControlStyle>((theme === 'light') ? 'dark' : 'light');
        }

        self._setControlColor(theme);
    }

    /**
     * Sets the color of the control.
     * @param theme The theme to set.
     */
    private _setControlColor(theme: azmaps.ControlStyle | 'auto-reverse' | string): void {
        const self = this;

        if (self._container || self._content) {
            theme = self._hclStyle || theme;

            const darkColor = self._darkColor;
            let backgroundColor = 'white';
            let color = darkColor;

            //If not a named theme, must be a CSS color. Get it's theme. 
            if (theme !== 'light' && theme !== 'dark' && !theme.startsWith('auto')) {
                backgroundColor = theme;
                theme = Utils.getColorTheme(theme);
                color = (theme === 'dark') ? 'white' : darkColor;
            } else if (theme === 'dark') {
                backgroundColor = darkColor;
                color = 'white';
            }

            const style = {
                backgroundColor: backgroundColor,
                color: color
            };

            if (self._content) {
                Object.assign(self._content.style, style);
            }

            if (self._container) {
                Object.assign(self._container.style, style);
            }

            if (self._btn) {
                self._btn.style.backgroundColor = backgroundColor;
            }

            self._fontColor = color;
            self._bgColor = backgroundColor;
        }
    }

    /**
    * Sets the index of the focused item in the carousel or list.
    * @param idx The index of the item, stored in the 'rel' property.
    * @param focus If the item should have tab focus.
    */
    public _setCardIdx(idx: number, focus?: boolean): void {
        const self = this;

        if (self._content) {
            const cards = self._content.getElementsByClassName('atlas-layer-legend-card');
            let handles = self._content.querySelectorAll('.atlas-carousel-dot, .atlas-accordion-button');
            const layout = self._baseOptions.layout;
            const numCards = cards.length;

            if (handles.length === 0) {
                handles = null;
            }

            if (idx >= numCards) {              
                idx = numCards - 1;
            }

            if (idx < 0 && layout !== 'accordion') {
                idx = 0;
            }

            self._currentIdx = idx;

            for (let i = 0; i < numCards; i++) {
                const card = <HTMLElement>cards[i];
                const rel = parseInt(card.getAttribute('rel'));

                if (layout === 'carousel') {
                    if (rel !== idx) {
                        card.style.display = 'none';

                        if (handles) {
                            handles[i].classList.remove('atlas-carousel-dot-active');
                            handles[i].setAttribute('aria-expanded', 'false');
                        }
                    } else {
                        card.style.display = 'block';

                        if (handles) {
                            handles[i].classList.add('atlas-carousel-dot-active');
                            handles[i].setAttribute('aria-expanded', 'true');
                        }
                        if (focus) {
                            self._setItemFocus(card);
                        }
                    }
                } else if (layout === 'accordion') {
                    if (rel !== idx) {
                        card.style.display = 'none';

                        if (handles) {
                            handles[i].classList.remove('active');
                            handles[i].setAttribute('aria-expanded', 'false');
                        }
                    } else {
                        card.style.display = 'block';

                        if (handles) {
                            handles[i].classList.add('active');
                            handles[i].setAttribute('aria-expanded', 'true');
                        }
                        if (focus) {
                            self._setItemFocus(card);
                        }
                    }
                } else { //List view.
                    if (rel === idx) {
                        card.scrollIntoView();

                        if (focus) {
                            self._setItemFocus(card);
                        }
                        break;
                    }
                }
            }
        }
    }

    /**
     * Sets the focus on the first focusable item within an HTML container.
     * @param container A container to focus on.
     */
    public _setItemFocus(container: HTMLElement): void {
        //Find focusable elements within the container.
        const elms = container.querySelectorAll('input, button, select, a');

        //Focus on the first item.
        if (elms.length > 0) {
            (<HTMLInputElement>elms[0]).focus();
        }
    }

    /**
     * Event handler for a dot in a carousel is clicked.
     * @param e Event args
     */
    public _handledClicked = (e: MouseEvent) => {
        const self = this;
        const elm = <HTMLElement>e.target;
        let idx = parseInt(elm.getAttribute('rel'));

        //If an active accordion button is pressed, closed it.
        if (self._baseOptions.layout === 'accordion' && elm.classList.contains('active')) {
            idx = -1;
        }

        self._setItemIndex(idx, true);
    };

    /**
     * Toggle event handler for expand/collapse button.
     */
    private _toggle = (e) => {
        const self = this;
        const opt = self._baseOptions;
        opt.minimized = !opt.minimized;
        self._setBtnState();
        e.stopPropagation();
        e.preventDefault();
        return false;
    }

    /** Event handler for when collapsed container is clicked. */
    private _contentBtnClicked = (e) => {
        if(this._baseOptions.minimized){
            this._toggle(e);
        }
    };

    /**
     * Sets the minimized state of the expansion button.
     */
    private _setBtnState(): void {
        const self = this;
        const btn = self._btn;
        const opt = self._baseOptions;

        if (btn && !opt.container) {
            const btnCss = self._btnCSS;
            let w = '32px';
            let h = '32px';
            let display = 'none';
            let showBtnBg = false;
            let ariaLabel = self._localization[self._nameIdx];

            //If toggle button isn't being to be displayed, then don't allow minimizing.
            const minimized = (opt.minimized && opt.showToggle);

            if (minimized) {                
                ariaLabel += ' - ' + self._localization[2]; //Expand 
            } else {
                showBtnBg = opt.showToggle;
                display = '';
                h = 'unset';
                w = 'unset';
            }

            btn.setAttribute('aria-expanded', !minimized + '');
            
            const container = self._container;
            if (container) {
                //Hide/show the content.
                if (self._content && opt.visible) {
                    self._content.style.display = display;
                }

                container.setAttribute('aria-expanded', !minimized + '');

                const classList = container.classList;
                if (showBtnBg) {
                    if (!classList.contains(btnCss)) {
                        classList.add(btnCss);
                    }

                    btn.style.display = '';
                    container.style.cursor = '';
                } else {
                    classList.remove(btnCss);
                    btn.style.display = 'none';

                    if(minimized){
                        container.style.cursor = 'pointer';
                    }
                }

                container.setAttribute('title', ariaLabel);
                container.setAttribute('alt', ariaLabel);                

                //Resize the container to be the size of a button.
                Object.assign(container.style, {
                    height: h,
                    width: w
                });
            }

            if (opt.minimized !== minimized) {
                //@ts-ignore
                self._invokeEvent('toggled', {
                    minimized: minimized,
                    type: 'toggled'
                });
            }
        }
    }

    /** 0 - Legend control, 1 - Layer control, 2 - Expand, 3 - Collapse */
    private static _translations = {
        'en': ['Legend control', 'Layer control', 'Expand', 'Collapse'],
        'af': ['Legende beheer', 'Laagbeheer', 'Uitbrei', 'Inval'],
        'ar': ['السيطرة على الأسطورة', 'التحكم في الطبقة', 'وسعت', 'انهيار'],
        'eu': ['Kondaira kontrol', 'Geruzaren kontrola', 'Hedatu', 'Erroiztu'],
        'bg': ['Контрол на легендата', 'Контрол на слоя', 'Разширяване', 'С колапс'],
        'zh': ['传说控制', '层控制', '扩张', '坍塌'],
        'hr': ['Legenda kontrola', 'Kontrola sloja', 'Proširiti', 'Kolaps'],
        'cs': ['Kontrola legendy', 'Řízení vrstvy', 'Rozšířit', 'Kolaps'],
        'da': ['Legend Control.', 'Lagstyring', 'Udvide', 'Falde sammen'],
        'nl': ['Legend Control', 'Laagregeling', 'Uitbreiden', 'Instorten'],
        'et': ['Legendikontroll', 'Kihi juhtimine', 'Laiendama', 'Kollaps'],
        'fi': ['Legend Control', 'Kerrosohjaus', 'Laajentaa', 'Romahdus'],
        'fr': ['Lutte contre la légende', 'Contrôle de couche', 'Développer', 'Effondrer'],
        'gl': ['Control de lendas', 'Control de capa', 'Expandir.', 'Colapso'],
        'de': ['Legend Control.', 'Schichtregelung', 'Expandieren', 'Zusammenbruch'],
        'el': ['Έλεγχος θρύλου', 'Έλεγχος στρώματος', 'Επεκτείνουν', 'Κατάρρευση'],
        'hi': ['पौराणिक नियंत्रण', 'परत नियंत्रण', 'विस्तार करना', 'ढहने'],
        'hu': ['Legenda irányítás', 'Rétegszabályozás', 'Kiterjed', 'Összeomlás'],
        'id': ['Kontrol legenda', 'Kontrol lapisan', 'Mengembangkan', 'Jatuh'],
        'it': ['Controllo della legenda', 'Controllo del livello', 'Espandere', 'Crollo'],
        'ja': ['伝説のコントロール', 'レイヤコントロール', '拡大', '崩壊'],
        'kk': ['Аңызды бақылау', 'Қабатты бақылау', 'Кеңейту', 'Күйреу'],
        'ko': ['전설 제어', '레이어 제어', '확장하다', '무너지다'],
        'es': ['Control de leyenda', 'Control de la capa', 'Expandir', 'Colapso'],
        'lv': ['Leģenda kontrole', 'Slāņa kontrole', 'Paplašināt', 'Sabrukums'],
        'lt': ['Legend Control.', 'Sluoksnio kontrolė', 'Išplėsti', 'Žlugimas'],
        'ms': ['Kawalan Legend.', 'Kawalan lapisan', 'Berkembang', 'Runtuh'],
        'nb': ['Legenden kontrollen', 'Lagkontroll', 'Utvide', 'Kollapse'],
        'pl': ['Kontrola legendy', 'Kontrola warstwy', 'Zwiększać', 'Zawalić się'],
        'pt': ['Controle da legenda', 'Controle de camada', 'Expandir', 'Colapso'],
        'ro': ['Controlul legendei', 'Controlul stratului', 'Extinde', 'Colaps'],
        'ru': ['Легендант контроля', 'Управление слоем', 'Расширять', 'Крах'],
        'sr': ['Контрола легенде', 'Контрола слоја', 'Проширити', 'Колапс'],
        'sk': ['Legenda', 'Ovládanie vrstvy', 'Rozbaľovať', 'Kolaps'],
        'sl': ['Legenda Control.', 'Kontrola plasti', 'Razširi', 'Spanje.'],
        'sv': ['Legendkontroll', 'Lagkontroll', 'Bygga ut', 'Kollaps'],
        'th': ['การควบคุมตำนาน', 'การควบคุมเลเยอร์', 'ขยาย', 'ทรุด'],
        'tr': ['Efsane kontrolü', 'Katman kontrolü', 'Genişletmek', 'Yıkılmak'],
        'uk': ['Легенда контроль', 'Керування шаром', 'Розширювати', 'Розвал'],
        'vi': ['Kiểm soát huyền thoại', 'Lớp kiểm soát', 'Mở rộng', 'Sự sụp đổ']
    };
}