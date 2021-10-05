import * as azmaps from 'azure-maps-control';

//Typings from potential external libraries that may also include some internal overrides.

export interface OgcMapLayer extends azmaps.layer.Layer {
    getOptions: () => any;
    getCapabilities: () => Promise<OgcMapLayerCapabilities>;

    metadata: any;

    onActiveLayersChanged: (layer: OgcMapLayer) => void;

    _client: any;

    _loadingClient: boolean;
}

export interface OgcMapLayerCapabilities {
    /** The bounds in which the service is available in EPSG:4326. */
    bounds: number[];

    /** A description or abstract for the service. */
    description: string;

    /** Details of all sublayers available in the service. */
    sublayers: OgcSublayer[];

    /** The title of the OGC service. */
    title: string;
}

export interface OgcSublayer {
    /** The bounding box of the layer. */
    bounds: number[];

    /** A description or abstract for the layer. */
    description: string;

    /** Unique identifier for the layer. */
    id: string;

    /** An integer specifying the maximum zoom level to render the layer at. */
    maxZoom: number;

    /** An integer specifying the minimum zoom level to render the layer at. */
    minZoom: number;

    /** A list of the supported styles. */
    styles: OgcStyle[];

    /** The title for the layer. */
    title: string;
}

export interface OgcStyle {
    /** The identifier of the style. */
    id: string;

    /** Indicates if the style is the default. */
    isDefault: boolean;

    /** A URL to the legend graphic. */
    legendUrl: string;

    /** The title of the style. */
    title: string;
}