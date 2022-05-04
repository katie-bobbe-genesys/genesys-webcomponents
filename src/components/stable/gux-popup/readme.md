# gux-input



<!-- Auto Generated Below -->


## Properties

| Property   | Attribute  | Description | Type      | Default |
| ---------- | ---------- | ----------- | --------- | ------- |
| `disabled` | `disabled` |             | `boolean` | `false` |
| `expanded` | `expanded` |             | `boolean` | `false` |


## Slots

| Slot       | Description              |
| ---------- | ------------------------ |
| `"popup"`  | Required slot for popup  |
| `"target"` | Required slot for target |


## Dependencies

### Used by

 - [gux-action-button](../gux-action-button)
 - [gux-action-button-legacy](../../legacy/gux-action-button-legacy)
 - [gux-button-multi](../../beta/gux-button-multi)
 - [gux-button-multi-legacy](../../legacy/gux-button-multi-legacy)
 - [gux-dropdown-v2-beta](../../beta/gux-dropdown-v2)

### Graph
```mermaid
graph TD;
  gux-action-button --> gux-popup
  gux-action-button-legacy --> gux-popup
  gux-button-multi --> gux-popup
  gux-button-multi-legacy --> gux-popup
  gux-dropdown-v2-beta --> gux-popup
  style gux-popup fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*