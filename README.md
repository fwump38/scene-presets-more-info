# Scene Presets More-Info

Scene presets from [Hypfer/hass-scene_presets](https://github.com/Hypfer/hass-scene_presets), styled to match the
built-in light more-info dialog and applied only to the light / light group being viewed.

Requires the Scene Presets integration to be installed.

## Install (HACS)
1. HACS → ⋮ → **Custom repositories** → add this repository, category **Dashboard**.
2. Install **Scene Presets More-Info**, then reload the browser (HACS adds the resource automatically).

## In the more-info dialog
Once loaded, opening more-info for any `light.*` entity shows the presets below the native controls.
This relies on Home Assistant frontend internals and may need updating after frontend changes. It does nothing if
the dialog isn't found. To disable it, set `window.scenePresetsMoreInfoDisableInject = true` before the module loads.

## As a card
```yaml
type: custom:scene-presets-more-info-card
entity: light.living_room
```

## Modes
- **Static** – `apply_preset`
- **Shuffle / Smart** – `apply_preset` with `shuffle` / `smart_shuffle`
- **Dynamic** – `start_dynamic_scene` (loops at the chosen interval); active scenes are highlighted and can be stopped.

Light groups are expanded client-side to their member lights.
