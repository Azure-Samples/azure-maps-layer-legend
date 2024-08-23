# azure-maps-layer-legend Changelog

<a name="0.0.3"></a>
## 0.0.3 (2021-10-04)

- Bug fix: Collapsed button icons not showing bug fixed. 
- Bug fix: Dynamic layer control was loading in basemap layers as well as user added layers since v2 release of Azure Maps web SDK (`map.layers.getLayers` function had a breaking change in v2). Now only displays user added layers.
- Added `maxWidth` option for controls to limit how big they get. Previously the legend control could get really width if there was a lot of text in the title, subtitle, or footer.
- Improvement: Ensure gradient stop offet defaults to 0 if not set.
- Improvement: Last focused legend is now maintained when options are updated. 
- Updated dependancies.

<a name="0.0.2"></a>
## 0.0.2 (2021-10-04)

- Added dynamic legend and layer capabilities that auto detect user defined layers in the map and generates legends based on their styles.

<a name="0.0.1"></a>
## 0.0.1 (2021-09-28)

- Initial release.
