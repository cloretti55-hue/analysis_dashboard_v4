const DATASET_DEFINITIONS = {
  "curve-us": { path: "data/curve-us.json", validate: (payload) => Boolean(payload?.curves) },
  "fed-policy": { path: "data/fed-policy.json", validate: (payload) => Boolean(payload?.targetRange && payload?.marketProbability) },
  "equity-valuation": { path: "data/equity-valuation.json", validate: (payload) => Array.isArray(payload?.items) },
  "sp500-valuation": { path: "data/sp500-valuation.json", validate: (payload) => Boolean(payload?.sp500) },
  "sp500-pe-history": { path: "data/sp500-pe-history.json", validate: (payload) => Array.isArray(payload?.monthly) },
  "mag7-valuation": { path: "data/mag7-valuation.json", validate: (payload) => Array.isArray(payload?.companies) },
  "etf-universe": { path: "data/etf-universe.json", validate: (payload) => Array.isArray(payload?.instruments) },
  "etf-performance": { path: "data/etf-performance.json", validate: (payload) => Array.isArray(payload?.instruments) },
  "fixed-income-performance": { path: "data/fixed-income-performance.json", validate: (payload) => Array.isArray(payload?.instruments) },
  "etf-geography": { path: "data/etf-geography.json", validate: (payload) => Boolean(payload?.instruments) },
};

function datasetDateValue(value) {
  const time = value ? Date.parse(value) : NaN;
  return Number.isFinite(time) ? time : null;
}

function payloadIsNewerThanManifest(data, manifestEntry) {
  if (!manifestEntry) return false;
  const payloadDate = datasetDateValue(data?.asOf || data?.updatedAt || data?.generatedAt);
  const manifestDate = datasetDateValue(manifestEntry.asOf);
  return payloadDate !== null && manifestDate !== null && payloadDate > manifestDate;
}

function deriveDatasetStatus(data, manifestEntry) {
  const instruments = Array.isArray(data?.instruments) ? data.instruments : [];
  if (instruments.length) {
    const errorCount = instruments.filter((item) => item.status === "error").length;
    const staleCount = instruments.filter((item) => item.status === "stale").length;
    if (errorCount > 0) return "partial";
    if (staleCount === instruments.length) return "stale";
    if (staleCount > 0) return "partial";
  }

  const asOf = datasetDateValue(data?.asOf);
  const maxAgeDays = manifestEntry?.maxAgeDays;
  if (asOf !== null && Number.isFinite(maxAgeDays)) {
    const ageDays = Math.floor((Date.now() - asOf) / 86400000);
    if (ageDays > maxAgeDays) return "stale";
  }
  return data?.status || "ok";
}

const DataClient = (() => {
  let manifestPromise = null;
  const datasetPromises = new Map();

  const fetchJson = async (path) => {
    const separator = path.includes("?") ? "&" : "?";
    const response = await fetch(`${path}${separator}v=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const contentType = response.headers.get("content-type") || "";
    if (contentType && !contentType.includes("json")) throw new Error(`unexpected content: ${contentType}`);
    return response.json();
  };

  const loadManifest = () => {
    if (!manifestPromise) {
      manifestPromise = fetchJson("data/manifest.json")
        .then((data) => ({ data, error: null }))
        .catch((error) => ({ data: null, error }));
    }
    return manifestPromise;
  };

  const load = (id) => {
    if (datasetPromises.has(id)) return datasetPromises.get(id);

    const promise = (async () => {
      const definition = DATASET_DEFINITIONS[id];
      if (!definition) {
        return {
          id,
          ok: false,
          data: null,
          meta: { id, path: null, status: "unavailable", asOf: null, source: null, methodology: null, issues: [] },
          error: new Error(`Dataset not registered: ${id}`),
        };
      }

      const manifestResult = await loadManifest();
      const manifestEntry = manifestResult.data?.datasets?.find((item) => item.id === id) || null;
      const path = manifestEntry?.path || definition.path;
      const baseMeta = {
        id,
        path,
        status: manifestEntry?.status || "unknown",
        asOf: manifestEntry?.asOf || null,
        source: manifestEntry?.producer || path,
        methodology: null,
        generatedAt: manifestResult.data?.generatedAt || null,
        maxAgeDays: manifestEntry?.maxAgeDays ?? null,
        issues: manifestEntry?.issues || [],
        manifestAvailable: Boolean(manifestResult.data),
      };

      try {
        const data = await fetchJson(path);
        if (!definition.validate(data)) throw new Error("data structure is incompatible with the dataset contract");
        const newerThanManifest = payloadIsNewerThanManifest(data, manifestEntry);
        return {
          id,
          ok: true,
          data,
          meta: {
            ...baseMeta,
            status: newerThanManifest
              ? deriveDatasetStatus(data, manifestEntry)
              : (manifestEntry?.status || (manifestResult.data ? (data.status || "ok") : "unknown")),
            asOf: data.asOf || manifestEntry?.asOf || null,
            source: data.source || manifestEntry?.producer || path,
            methodology: data.methodology || null,
            generatedAt: data.generatedAt || data.updatedAt || baseMeta.generatedAt,
            issues: newerThanManifest
              ? []
              : manifestResult.error
              ? [{ severity: "warning", code: "manifest_unavailable", message: `Manifest unavailable: ${manifestResult.error.message}` }]
              : baseMeta.issues,
            manifestOutdated: newerThanManifest,
          },
          error: manifestResult.error,
        };
      } catch (error) {
        return {
          id,
          ok: false,
          data: null,
          meta: { ...baseMeta, status: "unavailable" },
          error,
        };
      }
    })();

    datasetPromises.set(id, promise);
    return promise;
  };

  const loadMany = async (ids) => Promise.all(ids.map((id) => load(id)));

  return { load, loadMany, loadManifest };
})();
