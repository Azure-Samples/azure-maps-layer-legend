# Image legend examples

Image legends let you use a simple image as the legend. The following creates an image legend from a URL. Inline SVG strings and data URI can also be used.

```javascript
 {
    type: 'image',
    subtitle: 'Image legend',

    //URL to legend image.
    url: 'https://i0.wp.com/gisgeography.com/wp-content/uploads/2016/05/Map-Example-Legend.png',

    //Alt text should always be provided for legend images.
    altText: 'A legend for the icons on the map.',

    //Optionally specify a max width or height for the image.
    maxHeight: 200,

    footer: 'This legend was created using an image.'
}
```

The above HTML legend type options will generate a legend that looks like the following.

![Simple image legend](images/image-legend.jpg)

## Next steps

- [Image legend type interface](legend_control.md#imagelegendtype-interface)
