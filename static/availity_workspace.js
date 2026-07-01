import { APIS } from "./availity_apis.js";

const API_IDS = [
  "coverages",
  "claim-status",
  "service-reviews",
  "isauthrequired",
  "auth-attachments",
  "payer-list",
];

const SAMPLE_KEYS = {
  coverages: "coverage",
  "claim-status": "claim",
  "service-reviews": "service_review",
  isauthrequired: "isauthrequired",
  "auth-attachments": "attachment",
  "payer-list": "payer_list",
};

const FILTERED_APIS = APIS.filter((api) => API_IDS.includes(api.id));

const state = { apiIndex: 0, opIndex: 0, baseSample: null, lastMeta: null };
let inputRefreshTimer = null;

const el = {
  apiSelect: document.getElementById("apiSelect"),
  apiName: document.getElementById("apiName"),
  apiTxn: document.getElementById("apiTxn"),
  apiBlurb: document.getElementById("apiBlurb"),
  opTabs: document.getElementById("opTabs"),
  form: document.getElementById("requestForm"),
  sendBtn: document.getElementById("sendBtn"),
  response: document.getElementById("responsePanel"),
};

init();

function init() {
  renderApiSelect();
  el.apiSelect.addEventListener("change", () => {
    selectApi(Number(el.apiSelect.value));
  });
  el.sendBtn.addEventListener("click", onSend);

  const hashApi = apiIdFromHash();
  const startIndex = hashApi
    ? Math.max(0, FILTERED_APIS.findIndex((a) => a.id === hashApi))
    : 0;
  selectApi(startIndex >= 0 ? startIndex : 0);
}

function apiIdFromHash() {
  const raw = window.location.hash.replace(/^#/, "");
  if (!raw) return null;
  return raw.startsWith("api-") ? raw.slice(4) : raw;
}

function renderApiSelect() {
  el.apiSelect.innerHTML = FILTERED_APIS.map(
    (api, i) => `<option value="${i}">${api.name}</option>`
  ).join("");
}

function selectApi(i) {
  state.apiIndex = i;
  state.opIndex = 0;
  el.apiSelect.value = String(i);
  const api = FILTERED_APIS[i];
  if (!api) return;

  const nextHash = `#api-${api.id}`;
  if (window.location.hash !== nextHash) {
    history.replaceState(null, "", nextHash);
  }

  el.apiName.textContent = api.name;
  el.apiTxn.innerHTML = api.unavailable
    ? `${api.transaction} <span class="av-badge-warn">Currently Unavailable</span>`
    : api.transaction;
  el.apiBlurb.textContent = api.blurb;
  renderOpTabs();
  renderForm();
  clearResponseState();
  el.response.innerHTML =
    '<div class="av-placeholder">Fill the form and hit <b>Send request</b>.</div>';
}

function clearResponseState() {
  state.baseSample = null;
  state.lastMeta = null;
}

function renderOpTabs() {
  const api = FILTERED_APIS[state.apiIndex];
  el.opTabs.innerHTML = "";
  api.operations.forEach((op, i) => {
    const tab = document.createElement("button");
    tab.type = "button";
    tab.className = "av-op-tab" + (i === state.opIndex ? " active" : "");
    tab.innerHTML = `<span class="av-verb ${op.method}">${op.method}</span>${op.label}`;
    tab.onclick = () => {
      state.opIndex = i;
      renderOpTabs();
      renderForm();
      clearResponseState();
      el.response.innerHTML =
        '<div class="av-placeholder">Fill the form and hit <b>Send request</b>.</div>';
    };
    el.opTabs.appendChild(tab);
  });
}

function currentOp() {
  return FILTERED_APIS[state.apiIndex].operations[state.opIndex];
}

function card(title, bodyNodes) {
  const c = document.createElement("div");
  c.className = "av-card";
  if (title) {
    const h = document.createElement("div");
    h.className = "av-card-title";
    h.textContent = title;
    c.appendChild(h);
  }
  bodyNodes.forEach((n) => c.appendChild(n));
  return c;
}

function gridOf(children) {
  const g = document.createElement("div");
  g.className = "av-grid";
  children.forEach((c) => g.appendChild(c));
  return g;
}

function field(id, label, def, hint, required) {
  const wrap = document.createElement("div");
  wrap.className = "av-field";
  const filled = def != null && String(def) !== "";
  const safe = def != null ? String(def).replace(/"/g, "&quot;") : "";
  wrap.innerHTML =
    `<label>${label}${required ? ' <span class="req">*</span>' : ""}</label>` +
    `<input class="vinput ${filled ? "" : "empty"}" id="${id}" value="${safe}" />` +
    (hint ? `<div class="av-hint">${hint}</div>` : "");
  return wrap;
}

function renderForm() {
  const op = currentOp();
  el.form.innerHTML = "";
  const ov = op.sample || {};

  const pick = (groupObj, name, fb) => {
    if (!groupObj || !(name in groupObj)) return fb;
    const v = groupObj[name];
    if (v === null || v === undefined || String(v).trim() === "") return fb;
    return v;
  };

  const endpointNodes = [];
  const pathWrap = document.createElement("div");
  pathWrap.className = "av-field";
  pathWrap.innerHTML =
    `<label>Endpoint path</label>` +
    `<div class="av-path-edit av-path-readonly"><span class="av-verb ${op.method}">${op.method}</span>` +
    `<input id="pathTemplate" value="${op.path.replace(/"/g, "&quot;")}" readonly tabindex="-1" aria-readonly="true" /></div>`;
  endpointNodes.push(pathWrap);
  el.form.appendChild(card("Endpoint", endpointNodes));

  if (op.pathParams?.length) {
    el.form.appendChild(
      card("Path parameters", [
        gridOf(
          op.pathParams.map((p) =>
            field(
              "path__" + p.name,
              p.name,
              pick(ov.pathParams, p.name, p.default),
              p.hint,
              true
            )
          )
        ),
      ])
    );
  }

  if (op.queryFields?.length) {
    el.form.appendChild(
      card("Query parameters", [
        gridOf(
          op.queryFields.map((f) =>
            field(
              "query__" + f.name,
              f.label || f.name,
              pick(ov.query, f.name, f.default),
              f.hint
            )
          )
        ),
      ])
    );
  }

  if (op.bodyType === "form" && op.fields) {
    el.form.appendChild(
      card("Request body", [
        gridOf(
          op.fields.map((f) =>
            field(
              "body__" + f.name,
              f.label || f.name,
              pick(ov.fields, f.name, f.default),
              f.hint
            )
          )
        ),
      ])
    );
  }

  if (op.bodyType === "json") {
    const wrap = document.createElement("div");
    wrap.className = "av-field";
    const ta = document.createElement("textarea");
    ta.id = "jsonBody";
    ta.value = JSON.stringify(ov.jsonDefault || op.jsonDefault || {}, null, 2);
    wrap.appendChild(ta);
    const hint = document.createElement("div");
    hint.className = "av-hint";
    hint.textContent =
      "Documentation example request (for reference). Sample mode returns the saved response.";
    wrap.appendChild(hint);
    el.form.appendChild(card("Request body (JSON)", [wrap]));
  }

  wireFields();
  updatePathDisplay();
}

function updatePathDisplay() {
  const op = currentOp();
  const pathEl = document.getElementById("pathTemplate");
  if (!pathEl) return;
  let path = op.path;
  if (op.pathParams) {
    for (const p of op.pathParams) {
      const v = (document.getElementById("path__" + p.name)?.value || "").trim();
      if (v) path = path.replace("{" + p.name + "}", v);
    }
  }
  pathEl.value = path;
}

function wireFields() {
  const onInput = () => {
    el.form.querySelectorAll("input.vinput").forEach((input) => {
      input.classList.toggle("empty", input.value.trim() === "");
    });
    updatePathDisplay();
    scheduleResponseRefresh();
  };

  el.form.querySelectorAll("input.vinput").forEach((input) => {
    input.addEventListener("input", onInput);
    input.classList.toggle("empty", input.value.trim() === "");
  });

  const jsonBody = document.getElementById("jsonBody");
  if (jsonBody) {
    jsonBody.addEventListener("input", scheduleResponseRefresh);
  }
}

function scheduleResponseRefresh() {
  if (!state.baseSample || !state.lastMeta) return;
  clearTimeout(inputRefreshTimer);
  inputRefreshTimer = setTimeout(() => {
    try {
      const reqPreview = buildSampleRequest();
      const patched = applyRequestToSample(state.baseSample, collectPayload());
      renderSample(patched, state.lastMeta.file, state.lastMeta.op, reqPreview);
    } catch {
      /* ignore invalid JSON while typing */
    }
  }, 280);
}

function collectPayload() {
  const op = currentOp();
  let basePath = op.path.trim();
  const payload = {
    method: op.method,
    path: basePath,
    bodyType: op.bodyType || null,
    extraHeaders: op.extraHeaders || {},
  };

  if (op.pathParams) {
    payload.pathIds = {};
    for (const p of op.pathParams) {
      const v = (document.getElementById("path__" + p.name)?.value || "").trim();
      if (v) payload.pathIds[p.name] = v;
      payload.path = payload.path.replace(
        "{" + p.name + "}",
        v ? encodeURIComponent(v) : "{" + p.name + "}"
      );
    }
  }
  if (op.queryFields) {
    payload.query = {};
    for (const f of op.queryFields) {
      const v = (document.getElementById("query__" + f.name)?.value || "").trim();
      if (v) payload.query[f.name] = v;
    }
  }
  if (op.bodyType === "form" && op.fields) {
    payload.body = {};
    for (const f of op.fields) {
      const v = (document.getElementById("body__" + f.name)?.value || "").trim();
      if (v) payload.body[f.name] = v;
    }
  } else if (op.bodyType === "json") {
    const raw = document.getElementById("jsonBody").value.trim();
    try {
      payload.body = raw ? JSON.parse(raw) : {};
    } catch (e) {
      throw new Error("Request body is not valid JSON: " + e.message);
    }
  }
  return payload;
}

function encodeFormString(obj) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(obj || {})) {
    if (v === undefined || v === null || v === "") continue;
    if (Array.isArray(v)) {
      for (const i of v) if (i !== "" && i != null) params.append(k, i);
    } else params.append(k, v);
  }
  return params.toString();
}

function buildValueMap(payload) {
  const map = {};
  const put = (key, value) => {
    if (value === undefined || value === null) return;
    const s = String(value).trim();
    if (!s) return;
    map[key] = s;
  };

  for (const [k, v] of Object.entries(payload.query || {})) put(k, v);

  for (const [name, value] of Object.entries(payload.pathIds || {})) {
    if (name === "id") put("transactionId", value);
    else put(name, value);
  }

  if (payload.body && typeof payload.body === "object" && !Array.isArray(payload.body)) {
    for (const [k, v] of Object.entries(payload.body)) {
      put(k, v);
      if (k === "payer.id" || k === "payerId") put("payerId", v);
      if (k === "patient.firstName") put("patientFirstName", v);
      if (k === "patient.lastName") put("patientLastName", v);
      if (k === "patient.birthDate") put("patientBirthDate", v);
      if (k === "subscriber.memberId") put("memberId", v);
      if (k === "providers.npi") put("providerNpi", v);
    }
    flattenJsonValues(payload.body, "", map);
  }

  return map;
}

function flattenJsonValues(obj, prefix, map) {
  if (obj === null || obj === undefined) return;
  if (Array.isArray(obj)) {
    obj.forEach((item, i) => flattenJsonValues(item, `${prefix}[${i}]`, map));
    return;
  }
  if (typeof obj === "object") {
    for (const [k, v] of Object.entries(obj)) {
      const path = prefix ? `${prefix}.${k}` : k;
      if (v !== null && typeof v === "object") flattenJsonValues(v, path, map);
      else if (v !== undefined && v !== null && String(v).trim() !== "") map[path] = String(v);
      if (k === "id" && prefix === "payer") map.payerId = String(v);
      if (k === "memberId" && prefix === "subscriber") map.memberId = String(v);
      if (k === "firstName" && prefix === "patient") map.patientFirstName = String(v);
      if (k === "lastName" && prefix === "patient") map.patientLastName = String(v);
      if (k === "npi" && prefix.includes("Provider")) map.providerNpi = String(v);
    }
  }
}

function applyRequestToSample(sample, payload) {
  const out = JSON.parse(JSON.stringify(sample));
  const map = buildValueMap(payload);
  if (!Object.keys(map).length) return out;

  if (Array.isArray(out.payers) && map.payerId) {
    const label = map.payerId.toUpperCase();
    if (out.payers[0]) {
      out.payers[0].payerId = map.payerId;
      out.payers[0].name = label;
      out.payers[0].displayName = label.replace(/_/g, " ");
    }
  }

  patchObject(out, map, null);
  return out;
}

function patchObject(node, map, parentKey) {
  if (Array.isArray(node)) {
    node.forEach((item) => patchObject(item, map, parentKey));
    return;
  }
  if (!node || typeof node !== "object") return;

  for (const [key, val] of Object.entries(node)) {
    if (val !== null && typeof val === "object") {
      patchObject(val, map, key);
      continue;
    }
    if (typeof val === "string" || typeof val === "number" || typeof val === "boolean") {
      if (key === "id" && parentKey === "payer" && map.payerId) node[key] = map.payerId;
      if (key === "payerId" && map.payerId) node[key] = map.payerId;
      if (key === "firstName" && parentKey === "patient" && map.patientFirstName) {
        node[key] = map.patientFirstName;
      }
      if (key === "lastName" && parentKey === "patient" && map.patientLastName) {
        node[key] = map.patientLastName;
      }
      if (key === "memberId" && map.memberId) node[key] = map.memberId;
      if (key === "birthDate" && parentKey === "patient" && map.patientBirthDate) {
        node[key] = map.patientBirthDate;
      }
      if (key === "npi" && map.providerNpi) node[key] = map.providerNpi;
      if (key === "name" && parentKey === "payer" && map.payerId) node[key] = map.payerId;
      if (key === "id" && parentKey === null && map.transactionId) node[key] = map.transactionId;
    }
  }
}

function buildSampleRequest() {
  const payload = collectPayload();
  let url = "https://api.availity.com" + payload.path;
  const qs = encodeFormString(payload.query || {});
  if (qs) url += (url.includes("?") ? "&" : "?") + qs;

  let body = null;
  if (payload.bodyType === "form") body = encodeFormString(payload.body || {});
  else if (payload.bodyType === "json")
    body = JSON.stringify(payload.body || {}, null, 2);

  return {
    method: payload.method,
    url,
    body,
    headers: payload.extraHeaders || {},
  };
}

async function onSend() {
  const api = FILTERED_APIS[state.apiIndex];
  const op = currentOp();
  const key = SAMPLE_KEYS[api.id];
  if (!key) {
    el.response.innerHTML =
      '<div class="av-placeholder"><b>Not available</b><br>No sample output is saved for this API.</div>';
    return;
  }
  const file = `${key}_${op.method}.json`;

  let reqPreview;
  try {
    reqPreview = buildSampleRequest();
  } catch (e) {
    return renderError(e.message);
  }

  el.sendBtn.disabled = true;
  el.response.innerHTML = '<div class="av-placeholder">Loading sample…</div>';
  try {
    const res = await fetch(`/clearinghouse/samples/${file}`, { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || `Sample ${file} not found`);
    const payload = collectPayload();
    const patched = applyRequestToSample(data, payload);
    state.baseSample = data;
    state.lastMeta = { file, op };
    renderSample(patched, file, op, reqPreview);
  } catch (e) {
    renderError(e.message);
  } finally {
    el.sendBtn.disabled = false;
  }
}

function renderSample(data, file, op, req) {
  const headerLines = Object.entries(req.headers || {})
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");
  const reqText =
    req.method +
    " " +
    req.url +
    (headerLines ? "\n" + headerLines : "") +
    (req.body ? "\n\n" + req.body : "");

  el.response.innerHTML = `
    <div class="av-resp-meta">
      <span class="av-pill av-pill-sample">SAMPLE</span>
      <span class="av-pill">${op.method} ${escapeHtml(op.path)}</span>
      <span class="av-pill">from documentation</span>
    </div>
    <div class="av-resp-block">
      <button type="button" class="av-copy-btn" id="copyResp">copy</button>
      <h4>Response body <span class="av-src">sample_outputs/availity/${escapeHtml(file)}</span></h4>
      <pre class="av-json">${syntaxHighlight(data)}</pre>
    </div>
    <div class="av-resp-block">
      <h4>Request sent <span class="av-src">documentation example</span></h4>
      <pre class="av-json">${escapeHtml(reqText)}</pre>
    </div>`;
  document.getElementById("copyResp").onclick = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
  };
}

function renderError(msg) {
  el.response.innerHTML = `<div class="av-resp-block"><h4>Error</h4><pre class="av-json">${escapeHtml(msg)}</pre></div>`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
}

function syntaxHighlight(obj) {
  let json = JSON.stringify(obj, null, 2);
  json = escapeHtml(json);
  return json.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      let cls = "n";
      if (/^"/.test(match)) cls = /:$/.test(match) ? "k" : "s";
      else if (/true|false|null/.test(match)) cls = "b";
      return `<span class="${cls}">${match}</span>`;
    }
  );
}

window.addEventListener("hashchange", () => {
  const id = apiIdFromHash();
  if (!id) return;
  const idx = FILTERED_APIS.findIndex((a) => a.id === id);
  if (idx >= 0 && idx !== state.apiIndex) selectApi(idx);
});
