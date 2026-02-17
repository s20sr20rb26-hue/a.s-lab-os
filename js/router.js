(function () {
  function parseHash() {
    const h = location.hash || "#/protocol";
    const [path, qs] = h.slice(1).split("?");
    const parts = path.split("/").filter(Boolean);
    const query = {};
    if (qs) {
      qs.split("&").forEach(kv => {
        const [k,v] = kv.split("=");
        query[decodeURIComponent(k)] = decodeURIComponent(v || "");
      });
    }
    return { parts, query };
  }

  window.Router = { parseHash };
})();
