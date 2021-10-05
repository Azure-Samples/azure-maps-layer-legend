# Dynamic legends

The `DynamicLegendType` of the legend control analyzes the style settings of layer and generates one or more legend cards of type `CategoryLegendType`, `GradientLegendType`, or `ImageLegendType`.

## Supported layer style properties

The following layers style properties will be used to generate legend cards if they have a supported style expression set on them.

| Layer type | Style Property | Note |
|------------|----------------|------|
| `BubbleLayer` | `color` | |
| `BubbleLayer` | `radius` | If a `CategoryLegendType` is generated and `color` property is a string, it will be used for the shape color of this legend. |
| `HeatMapLayer` | `color` | Generates a `GradientLegendType` that has two labels, `'low'` and `'high`. Use the legend controls `resx` option to override these with localized values. |
| `LineLayer` | `strokeColor` | |
| `LineLayer` | `strokeGradient` | |
| `LineLayer` | `strokeWidth` | If a `CategoryLegendType` is generated, no `strokeGradient` property is set on the layer, and `strokeColor` property is a string, it will be used for the shape color of this legend. |
| `PolygonLayer` | `fillColor` | |
| `PolygonLayer` | `fillPattern` | |
| `PolygonExtrusionLayer` | `fillColor` | |
| `PolygonExtrusionLayer` | `fillPattern` | |
| `SymbolLayer` | `iconOptions.image` | |
| `SymbolLayer` | `iconOptions.size` | If a `CategoryLegendType` is generated and `iconOptions.image` property is a string, it will be used for the shape of this legend. |
| [OgcMapLayer](https://docs.microsoft.com/en-us/azure/azure-maps/spatial-io-add-ogc-map-layer) | | The legend in the style of active layers will be rendered as an `ImageLegendType`. The subtitle will be set to the active layers `title`, `subtitle` or `id`. The footer will be set to the `description` or `abstract` property of the active layer. **NOTE** The `onActiveLayersChanged` will be overwritten and used by the legend control. |

**Not supported**

- [HTML marker layer](https://github.com/Azure-Samples/azure-maps-html-marker-layer)
- [SimpleDataLayer](https://docs.microsoft.com/en-us/azure/azure-maps/spatial-io-add-simple-data-layer) - Styles are defined at the feature level, not the layer level.

## Supported style expressions

| Expression type | Legend type |
|-----------------|-------------|
| `step`          | `CategoryLegendType`  |
| `match`         | `CategoryLegendType`  |
| `interpolate`   | `GradientLegendType` is used for `color` styles. `CategoryLegendType` is used for scale type styles (`radius`, `size`, `strokeWidth`). `image` styles are not supported with the interpolate expression. If a scale type style only has two stops are in the expression, a third mid-point stop will be added so users can tell the difference between a linear and exponential interpolation. |

If the input value of an expression a simple `get` expression, for example `['get', 'revenue']`, it will be extracted and used as the legends `subtitle` value. This value can be overridden by using the legend controls `resx` option to override these with localized values. Alternately, you can exclude this extraction, but setting the `extractSubtitles` to `false`.

Only simple expressions are supported as calculations are not evaluated. The output values within the expressions must be a `number` or `string`, and must not be an expression that requires evaluation. The following is the schema and limitations of the supported style expressions.

**Step expression**

```javascript
[
    'step',
    input: number,
    base_output: number | string,
    stop_input_1: number, stop_output_1: number | string,
    stop_input_n: number, stop_output_n: number | string, 
    ...
]
```

For example:

```javascript
[
    'step',
    ['get', 'traffic_level'],
    '#6B0512', 
    0.01, '#EE2F53',
    0.8, 'orange',
    1, "#66CC99"
]
```

**Match expression**

Labels with arrays instead of `string` or `number` values are not supported. A `"no data"` value will be used as the legends `label` for fallback. Add a `"no data"` key to the legend controls `resx` option to override these with localized values.

```javascript
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
```

For example:

Matching string values:

```javascript
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
```

Matching numbers:

```javascript
[
    'match',
    ['get', 'magnitude'],
    1, 'green',    
    2, 'orange',
    3, 'red',
    'gray'
]
```

**Interpolate expression**

Only `linear` and `exponential` interpolations are supported, `cubic-bezier` interpolations are not supported.

```javascript
[
    'interpolate',
    interpolation: ['linear'] | ['exponential', base],
    input: number,
    stop_input_1: number, stop_output_1: string | number
    stop_input_n: number, stop_output_n: string | number 
    ...
]
```

For example:

```javascript
[
    'interpolate',
    ['linear'],
    ['get', 'mag'],
    0, 'green',
    5, 'yellow',
    6, 'orange',
    7, 'red'
]
```
