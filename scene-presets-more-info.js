/*
 * scene-presets-more-info
 *
 * <scene-presets-more-info> element + Lovelace card ("custom:scene-presets-more-info-card")
 * that lists all presets from Hypfer/hass-scene_presets and applies them to a single
 * light / light group. Styled to sit alongside the native light more-info controls.
 *
 * Also injects itself into the native light more-info dialog (see bottom of file).
 */

const DOMAIN = "scene_presets";
const DATA_URL = "/assets/scene_presets/scene_presets.json";
const IMG_BASE = "/assets/scene_presets/";
const STORE_KEY = "scene-presets-more-info:options";

const DEFAULT_OPTIONS = {
  mode: "static", // static | shuffle | smart_shuffle | dynamic
  transition: 2,
  interval: 60,
  customBrightness: false,
  brightness: 200,
};

const MODES = [
  { id: "static", label: "Static" },
  { id: "shuffle", label: "Shuffle" },
  { id: "smart_shuffle", label: "Smart" },
  { id: "dynamic", label: "Dynamic" },
];

let presetDataPromise;
const loadPresetData = () => {
  if (!presetDataPromise) {
    presetDataPromise = fetch(DATA_URL)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((raw) => raw?.result ?? raw)
      .catch((err) => {
        presetDataPromise = undefined;
        throw err;
      });
  }
  return presetDataPromise;
};

const loadOptions = () => {
  try {
    return { ...DEFAULT_OPTIONS, ...JSON.parse(localStorage.getItem(STORE_KEY) || "{}") };
  } catch (_) {
    return { ...DEFAULT_OPTIONS };
  }
};

const saveOptions = (options) => {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(options));
  } catch (_) {
    /* storage unavailable */
  }
};

const STYLE = `
  :host {
    display: block;
    color: var(--primary-text-color);
    --sp-radius: var(--ha-border-radius-xl, 12px);
    --sp-muted: var(--secondary-text-color);
    --sp-surface: var(--ha-color-fill-neutral-quiet-resting, rgba(139, 145, 151, 0.1));
  }
  .wrap { display: flex; flex-direction: column; gap: 16px; padding: 8px 0 16px; }
  h3 {
    margin: 0;
    font-size: var(--ha-font-size-l, 16px);
    font-weight: var(--ha-font-weight-medium, 500);
  }
  h4 {
    margin: 0 0 8px;
    font-size: var(--ha-font-size-m, 14px);
    font-weight: var(--ha-font-weight-medium, 500);
    color: var(--sp-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .options {
    display: flex; flex-direction: column; gap: 12px;
    background: var(--sp-surface);
    border-radius: var(--sp-radius);
    padding: 12px;
  }
  .modes { display: flex; gap: 4px; background: var(--sp-surface); border-radius: var(--sp-radius); padding: 4px; }
  .modes button {
    flex: 1; border: none; background: none; color: var(--primary-text-color);
    font: inherit; padding: 8px 4px; border-radius: calc(var(--sp-radius) - 4px);
    cursor: pointer;
  }
  .modes button[selected] { background: var(--primary-color); color: var(--text-primary-color, #fff); }
  .row { display: grid; grid-template-columns: 110px 1fr 56px; align-items: center; gap: 8px; }
  .row label { color: var(--sp-muted); font-size: var(--ha-font-size-m, 14px); }
  .row .value { text-align: right; font-variant-numeric: tabular-nums; }
  .row input[type="range"] { width: 100%; accent-color: var(--primary-color); }
  .toggle { display: flex; align-items: center; gap: 8px; color: var(--sp-muted); }
  .toggle input { accent-color: var(--primary-color); }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)); gap: 8px; }
  .tile {
    position: relative; aspect-ratio: 1; overflow: hidden; cursor: pointer;
    border: 2px solid transparent; padding: 0; background: var(--sp-surface);
    border-radius: var(--sp-radius); color: #fff; font: inherit;
  }
  .tile img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
  .tile span {
    position: absolute; left: 0; right: 0; bottom: 0; padding: 14px 6px 5px;
    font-size: 12px; line-height: 1.2; text-align: center;
    background: linear-gradient(transparent, rgba(0, 0, 0, 0.65));
  }
  .tile[active] { border-color: var(--primary-color); box-shadow: 0 0 0 2px var(--primary-color); }
  .tile[active]::after {
    content: "●"; position: absolute; top: 4px; right: 6px; color: var(--primary-color); font-size: 14px;
    text-shadow: 0 0 3px rgba(0, 0, 0, 0.7);
  }
  .stop {
    border: none; border-radius: var(--sp-radius); padding: 10px;
    background: var(--primary-color); color: var(--text-primary-color, #fff);
    font: inherit; cursor: pointer;
  }
  .msg { color: var(--sp-muted); padding: 8px 0; }
  :host { min-width: 0; max-width: 100%; }
  .wrap > * { min-width: 0; max-width: 100%; }
  /* width:0 + min-width:100% stops the many tabs from widening the card; the row just fills its container. */
  .tabrow { display: flex; align-items: center; gap: 4px; width: 0; min-width: 100%; }
  .tabrow .arrow {
    flex: none; width: 32px; height: 32px; border: none; border-radius: 50%; cursor: pointer;
    background: var(--sp-surface); color: var(--primary-text-color); font-size: 20px; line-height: 1; padding: 0;
  }
  .tabs {
    flex: 1; min-width: 0; position: relative;
    display: flex; gap: 4px; overflow-x: auto; overscroll-behavior-x: contain;
    scrollbar-width: thin; padding-bottom: 6px; -webkit-overflow-scrolling: touch;
  }
  .tabs button {
    flex: none; border: none; font: inherit; cursor: pointer; white-space: nowrap;
    padding: 8px 14px; border-radius: 999px;
    background: var(--sp-surface); color: var(--primary-text-color);
  }
  .tabs button[selected] { background: var(--primary-color); color: var(--text-primary-color, #fff); }
  .hidden { display: none !important; }
`;

class ScenePresetsMoreInfo extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._options = loadOptions();
    this._presets = [];
    this._categories = new Map();
    this._dynamic = [];
    this._error = null;
    this._built = false;
    this._pollTimer = null;
  }

  // --- properties ---------------------------------------------------------
  set hass(hass) {
    const first = !this._hass;
    this._hass = hass;
    if (first) this._init();
  }
  get hass() {
    return this._hass;
  }

  set entityId(id) {
    if (id === this._entityId) return;
    this._entityId = id;
    this._refreshActive();
  }
  get entityId() {
    return this._entityId;
  }

  set areaId(id) {
    if (id === this._areaId) return;
    this._areaId = id;
    this._refreshActive();
  }
  get areaId() {
    return this._areaId;
  }

  // { categories: string[] (empty/undefined = all), tabs: boolean }
  setView({ categories, tabs } = {}) {
    const cats = Array.isArray(categories) && categories.length ? categories : null;
    const useTabs = !!tabs;
    if (JSON.stringify(cats) === JSON.stringify(this._viewCategories) && useTabs === this._viewTabs) return;
    this._viewCategories = cats;
    this._viewTabs = useTabs;
    if (this._built || this._error) this._build();
  }

  connectedCallback() {
    this._startPolling();
  }
  disconnectedCallback() {
    clearInterval(this._pollTimer);
    this._pollTimer = null;
  }

  // --- data ---------------------------------------------------------------
  async _init() {
    try {
      const data = await loadPresetData();
      this._presets = Array.isArray(data?.presets) ? data.presets : [];
      this._buildCategoryMap(data?.categories);
      this._error = null;
    } catch (err) {
      this._error = `Could not load scene presets (${err.message}). Is the Scene Presets integration installed?`;
    }
    this._build();
    this._fetchDynamic();
  }

  _buildCategoryMap(categories) {
    this._categories = new Map();
    const list = Array.isArray(categories) ? categories : Object.values(categories || {});
    list.forEach((c, i) => {
      if (typeof c === "string") this._categories.set(c, c);
      else if (c) this._categories.set(String(c.id ?? c.name ?? i), c.name ?? String(c.id ?? i));
    });
  }

  _categoryName(preset) {
    const raw = preset.category ?? preset.categoryId ?? preset.category_id;
    if (raw == null) return "Other";
    return this._categories.get(String(raw)) ?? String(raw);
  }

  _startPolling() {
    if (this._pollTimer) return;
    this._pollTimer = setInterval(() => this._fetchDynamic(), 5000);
  }

  async _fetchDynamic() {
    if (!this._hass) return;
    try {
      const res = await this._hass.callWS({ type: `${DOMAIN}/get_dynamic_scenes` });
      const payload = res?.response ?? res?.result ?? res;
      this._dynamic = payload?.dynamic_scenes ?? [];
    } catch (_) {
      try {
        const res = await this._hass.callWS({
          type: "call_service",
          domain: DOMAIN,
          service: "get_dynamic_scenes",
          return_response: true,
        });
        this._dynamic = res?.response?.dynamic_scenes ?? [];
      } catch (_) {
        this._dynamic = [];
      }
    }
    this._refreshActive();
  }

  // Expand light groups (nested) to the light entities they contain.
  _targetLights() {
    const states = this._hass?.states ?? {};
    const out = new Set();
    const walk = (id, depth = 0) => {
      if (!id || depth > 5) return;
      const members = states[id]?.attributes?.entity_id;
      if (Array.isArray(members) && members.length) {
        members.forEach((m) => walk(m, depth + 1));
      } else if (id.startsWith("light.")) {
        out.add(id);
      }
    };
    if (this._entityId) {
      walk(this._entityId);
      if (!out.size) out.add(this._entityId);
    } else if (this._areaId && this._hass) {
      // Lights in the area, directly or via their device.
      const { entities = {}, devices = {} } = this._hass;
      for (const [id, ent] of Object.entries(entities)) {
        if (!id.startsWith("light.") || ent.hidden) continue;
        const area = ent.area_id ?? devices[ent.device_id]?.area_id;
        if (area === this._areaId) walk(id);
      }
    }
    return [...out];
  }

  _activeDynamic() {
    const lights = new Set(this._targetLights());
    return this._dynamic.filter((s) => {
      const ids = s?.parameters?.light_entity_ids ?? [];
      return ids.some((id) => lights.has(id));
    });
  }

  _presetIdOf(scene) {
    const known = new Set(this._presets.map((p) => p.id));
    const params = scene?.parameters ?? {};
    if (known.has(params.preset_id)) return params.preset_id;
    return Object.values(params).find((v) => typeof v === "string" && known.has(v));
  }

  // --- actions ------------------------------------------------------------
  async _apply(preset) {
    const lights = this._targetLights();
    if (!this._hass || !lights.length) return;
    const o = this._options;
    const targets = { entity_id: lights };
    const data = { preset_id: preset.id, targets, transition: o.transition };
    if (o.customBrightness) data.brightness = o.brightness;

    try {
      if (o.mode === "dynamic") {
        data.interval = o.interval;
        await this._hass.callService(DOMAIN, "start_dynamic_scene", data);
      } else {
        // Applying a static scene must also stop any dynamic scene on these lights.
        await this._hass.callService(DOMAIN, "stop_dynamic_scenes_for_targets", { targets });
        data.shuffle = o.mode === "shuffle" || o.mode === "smart_shuffle";
        data.smart_shuffle = o.mode === "smart_shuffle";
        await this._hass.callService(DOMAIN, "apply_preset", data);
      }
    } catch (err) {
      console.error("scene-presets-more-info: service call failed", err);
    }
    setTimeout(() => this._fetchDynamic(), 500);
  }

  async _stop() {
    if (!this._hass) return;
    await this._hass.callService(DOMAIN, "stop_dynamic_scenes_for_targets", {
      targets: { entity_id: this._targetLights() },
    });
    setTimeout(() => this._fetchDynamic(), 300);
  }

  // --- rendering ----------------------------------------------------------
  _build() {
    const root = this.shadowRoot;
    root.innerHTML = "";
    const style = document.createElement("style");
    style.textContent = STYLE;
    root.appendChild(style);

    const wrap = document.createElement("div");
    wrap.className = "wrap";
    root.appendChild(wrap);

    if (this._error) {
      wrap.innerHTML = `<div class="msg"></div>`;
      wrap.firstChild.textContent = this._error;
      return;
    }

    const title = document.createElement("h3");
    title.textContent = "Scene presets";
    wrap.appendChild(title);

    wrap.appendChild(this._buildModes());
    wrap.appendChild(this._buildOptions());

    const stop = document.createElement("button");
    stop.className = "stop hidden";
    stop.textContent = "Stop dynamic scene";
    stop.addEventListener("click", () => this._stop());
    this._stopBtn = stop;
    wrap.appendChild(stop);

    let groups = new Map();
    for (const p of this._presets) {
      const name = this._categoryName(p);
      if (this._viewCategories && !this._viewCategories.includes(name)) continue;
      if (!groups.has(name)) groups.set(name, []);
      groups.get(name).push(p);
    }
    // Keep the order the user chose in the editor.
    if (this._viewCategories) {
      groups = new Map(
        this._viewCategories.filter((n) => groups.has(n)).map((n) => [n, groups.get(n)])
      );
    }

    const useTabs = this._viewTabs && groups.size > 1;
    const sections = new Map();
    if (useTabs) {
      if (!groups.has(this._tab)) this._tab = groups.keys().next().value;
      const bar = document.createElement("div");
      bar.className = "tabs";
      for (const name of groups.keys()) {
        const b = document.createElement("button");
        b.textContent = name;
        b.addEventListener("click", () => {
          this._tab = name;
          for (const [n, s] of sections) s.classList.toggle("hidden", n !== name);
          for (const t of bar.children) t.toggleAttribute("selected", t === b);
        });
        b.toggleAttribute("selected", name === this._tab);
        bar.appendChild(b);
      }
      // Vertical mouse wheel scrolls the tab bar sideways.
      bar.addEventListener(
        "wheel",
        (ev) => {
          if (Math.abs(ev.deltaY) > Math.abs(ev.deltaX)) {
            bar.scrollLeft += ev.deltaY;
            ev.preventDefault();
          }
        },
        { passive: false }
      );
      // Arrow buttons for mouse users (overlay scrollbars are often invisible).
      const arrow = (dir, glyph) => {
        const a = document.createElement("button");
        a.className = "arrow";
        a.textContent = glyph;
        a.setAttribute("aria-label", dir < 0 ? "Scroll tabs left" : "Scroll tabs right");
        a.addEventListener("click", () => bar.scrollBy({ left: dir * bar.clientWidth * 0.7, behavior: "smooth" }));
        return a;
      };
      const row = document.createElement("div");
      row.className = "tabrow";
      row.append(arrow(-1, "‹"), bar, arrow(1, "›"));
      wrap.appendChild(row);
      requestAnimationFrame(() => {
        const sel = bar.querySelector("[selected]");
        if (sel) bar.scrollLeft = sel.offsetLeft - (bar.clientWidth - sel.offsetWidth) / 2;
      });
    }

    this._tiles = new Map();
    for (const [name, presets] of groups) {
      const section = document.createElement("section");
      sections.set(name, section);
      if (useTabs && name !== this._tab) section.classList.add("hidden");
      const h = document.createElement("h4");
      h.textContent = name;
      if (useTabs) h.classList.add("hidden");
      const grid = document.createElement("div");
      grid.className = "grid";
      for (const p of presets) {
        const tile = document.createElement("button");
        tile.className = "tile";
        tile.title = p.name ?? p.id;
        if (p.img) {
          const img = document.createElement("img");
          img.loading = "lazy";
          img.alt = "";
          img.src = IMG_BASE + p.img;
          tile.appendChild(img);
        }
        const label = document.createElement("span");
        label.textContent = p.name ?? p.id;
        tile.appendChild(label);
        tile.addEventListener("click", () => this._apply(p));
        this._tiles.set(p.id, tile);
        grid.appendChild(tile);
      }
      section.append(h, grid);
      wrap.appendChild(section);
    }

    this._built = true;
    this._syncOptionVisibility();
    this._refreshActive();
  }

  _buildModes() {
    const bar = document.createElement("div");
    bar.className = "modes";
    this._modeButtons = {};
    for (const m of MODES) {
      const b = document.createElement("button");
      b.textContent = m.label;
      b.addEventListener("click", () => {
        this._options.mode = m.id;
        saveOptions(this._options);
        this._syncOptionVisibility();
      });
      this._modeButtons[m.id] = b;
      bar.appendChild(b);
    }
    return bar;
  }

  _slider(label, key, min, max, unit, formatter) {
    const row = document.createElement("div");
    row.className = "row";
    const l = document.createElement("label");
    l.textContent = label;
    const input = document.createElement("input");
    input.type = "range";
    input.min = min;
    input.max = max;
    input.value = this._options[key];
    const value = document.createElement("span");
    value.className = "value";
    const show = () => (value.textContent = formatter ? formatter(input.value) : `${input.value}${unit}`);
    show();
    input.addEventListener("input", show);
    input.addEventListener("change", () => {
      this._options[key] = Number(input.value);
      saveOptions(this._options);
    });
    row.append(l, input, value);
    return row;
  }

  _buildOptions() {
    const box = document.createElement("div");
    box.className = "options";

    box.appendChild(this._slider("Transition", "transition", 0, 30, "s"));

    this._intervalRow = this._slider("Interval", "interval", 1, 300, "s");
    box.appendChild(this._intervalRow);

    const toggle = document.createElement("label");
    toggle.className = "toggle";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = this._options.customBrightness;
    toggle.append(cb, document.createTextNode("Override brightness"));
    box.appendChild(toggle);

    this._brightnessRow = this._slider("Brightness", "brightness", 1, 255, "", (v) =>
      `${Math.round((v / 255) * 100)}%`
    );
    box.appendChild(this._brightnessRow);

    cb.addEventListener("change", () => {
      this._options.customBrightness = cb.checked;
      saveOptions(this._options);
      this._syncOptionVisibility();
    });
    return box;
  }

  _syncOptionVisibility() {
    if (!this._built) return;
    const o = this._options;
    for (const [id, b] of Object.entries(this._modeButtons)) {
      if (id === o.mode) b.setAttribute("selected", "");
      else b.removeAttribute("selected");
    }
    this._intervalRow.classList.toggle("hidden", o.mode !== "dynamic");
    this._brightnessRow.classList.toggle("hidden", !o.customBrightness);
  }

  _refreshActive() {
    if (!this._built) return;
    const active = this._activeDynamic();
    const activeIds = new Set(active.map((s) => this._presetIdOf(s)).filter(Boolean));
    for (const [id, tile] of this._tiles) {
      if (activeIds.has(id)) tile.setAttribute("active", "");
      else tile.removeAttribute("active");
    }
    this._stopBtn.classList.toggle("hidden", active.length === 0);
  }
}

if (!customElements.get("scene-presets-more-info")) {
  customElements.define("scene-presets-more-info", ScenePresetsMoreInfo);
}

// --- Lovelace card wrapper -------------------------------------------------
class ScenePresetsMoreInfoCard extends HTMLElement {
  static getConfigElement() {
    return document.createElement("scene-presets-more-info-card-editor");
  }
  static getStubConfig(hass) {
    const light = Object.keys(hass?.states ?? {}).find((id) => id.startsWith("light."));
    return light ? { entity: light } : {};
  }
  setConfig(config) {
    if (!config.entity && !config.area) throw new Error("Set either `entity` (a light) or `area`");
    this._config = config;
    if (!this._el) {
      const card = document.createElement("ha-card");
      card.style.padding = "0 16px";
      this._el = document.createElement("scene-presets-more-info");
      card.appendChild(this._el);
      this.appendChild(card);
    }
    this._el.areaId = config.entity ? undefined : config.area;
    this._el.entityId = config.entity;
    this._el.setView({ categories: config.categories, tabs: config.tabs });
    if (this._hass) this._el.hass = this._hass;
  }
  set hass(hass) {
    this._hass = hass;
    if (this._el) this._el.hass = hass;
  }
  getCardSize() {
    return 8;
  }
}

if (!customElements.get("scene-presets-more-info-card")) {
  customElements.define("scene-presets-more-info-card", ScenePresetsMoreInfoCard);
}

// --- Visual editor ----------------------------------------------------------
class ScenePresetsMoreInfoCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = config;
    this._render();
  }
  set hass(hass) {
    this._hass = hass;
    if (this._form) this._form.hass = hass;
    else this._render();
  }

  async _loadCategories() {
    if (this._categoryOptions) return;
    try {
      const data = await loadPresetData();
      const names = new Set();
      const map = new Map();
      (Array.isArray(data?.categories) ? data.categories : Object.values(data?.categories || {})).forEach(
        (c, i) => {
          if (typeof c === "string") map.set(c, c);
          else if (c) map.set(String(c.id ?? c.name ?? i), c.name ?? String(c.id ?? i));
        }
      );
      for (const p of data?.presets ?? []) {
        const raw = p.category ?? p.categoryId ?? p.category_id;
        names.add(raw == null ? "Other" : map.get(String(raw)) ?? String(raw));
      }
      this._categoryOptions = [...names].map((n) => ({ value: n, label: n }));
    } catch (_) {
      this._categoryOptions = [];
    }
    this._render();
  }

  _schema() {
    // `target_type` decides whether the picker shows entity or area; it is editor-only and not saved.
    return [
      {
        name: "target_type",
        selector: {
          select: {
            mode: "box",
            options: [
              { value: "entity", label: "Light / light group" },
              { value: "area", label: "Area" },
            ],
          },
        },
      },
      this._targetType() === "area"
        ? { name: "area", required: true, selector: { area: { entity: { domain: "light" } } } }
        : { name: "entity", required: true, selector: { entity: { domain: "light" } } },
      {
        name: "categories",
        selector: { select: { multiple: true, mode: "dropdown", options: this._categoryOptions ?? [] } },
      },
      { name: "tabs", selector: { boolean: {} } },
    ];
  }

  _targetType() {
    return this._type ?? (this._config?.area && !this._config?.entity ? "area" : "entity");
  }

  _render() {
    if (!this._config) return;
    this._loadCategories();
    if (!this._form) {
      this._form = document.createElement("ha-form");
      this._form.computeLabel = (s) =>
        ({
          target_type: "Target",
          entity: "Light",
          area: "Area",
          categories: "Categories (empty = all)",
          tabs: "Show categories as tabs",
        })[s.name] ?? s.name;
      this._form.addEventListener("value-changed", (ev) => {
        const { target_type, ...value } = ev.detail.value;
        this._type = target_type;
        if (target_type === "area") delete value.entity;
        else delete value.area;
        if (!value.categories?.length) delete value.categories;
        if (!value.tabs) delete value.tabs;
        this._config = { type: this._config.type, ...value };
        this.dispatchEvent(
          new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true })
        );
        this._render();
      });
      this.appendChild(this._form);
    }
    this._form.hass = this._hass;
    this._form.schema = this._schema();
    this._form.data = { ...this._config, target_type: this._targetType() };
  }
}

if (!customElements.get("scene-presets-more-info-card-editor")) {
  customElements.define("scene-presets-more-info-card-editor", ScenePresetsMoreInfoCardEditor);
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: "scene-presets-more-info-card",
  name: "Scene Presets (more-info style)",
  description: "Scene presets for a light, light group or area.",
});

// --- Optional injection into the native light more-info dialog -------------
// Disable with: window.scenePresetsMoreInfoDisableInject = true (before this loads).
if (!window.scenePresetsMoreInfoDisableInject) (() => {
  const TAG = "scene-presets-more-info";
  const MARK = "data-scene-presets-injected";

  const deepFind = (root, selector, depth = 0) => {
    if (!root || depth > 25) return null;
    const hit = root.querySelector?.(selector);
    if (hit) return hit;
    const children = root.querySelectorAll ? root.querySelectorAll("*") : [];
    for (const el of children) {
      if (el.shadowRoot) {
        const found = deepFind(el.shadowRoot, selector, depth + 1);
        if (found) return found;
      }
    }
    return null;
  };

  const getHass = () => document.querySelector("home-assistant")?.hass;

  let current; // { entityId, timer }

  const cleanup = () => {
    if (current) {
      clearInterval(current.timer);
      current.el?.remove();
      current = undefined;
    }
  };

  const mount = (entityId) => {
    cleanup();
    if (!entityId?.startsWith("light.")) return;

    let tries = 0;
    const attempt = setInterval(() => {
      tries += 1;
      const host = deepFind(document.querySelector("home-assistant")?.shadowRoot, "more-info-light");
      if (!host?.shadowRoot) {
        if (tries > 30) clearInterval(attempt); // give up after ~6s
        return;
      }
      clearInterval(attempt);

      const el = document.createElement(TAG);
      el.setAttribute(MARK, "");
      el.style.margin = "0 16px";
      el.setView(window.scenePresetsMoreInfoConfig ?? {});
      el.entityId = entityId;
      el.hass = getHass();
      host.shadowRoot.appendChild(el);

      // Keep hass fresh and detect dialog close (host disconnected).
      const timer = setInterval(() => {
        if (!host.isConnected) return cleanup();
        el.hass = getHass();
        if (!el.isConnected) host.shadowRoot.appendChild(el); // survived a re-render?
      }, 1000);
      current = { entityId, el, timer };
    }, 200);
    current = { entityId, timer: attempt };
  };

  window.addEventListener("hass-more-info", (ev) => {
    const entityId = ev.detail?.entityId;
    if (entityId) mount(entityId);
  });
})();
