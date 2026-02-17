// js/render.js（reagentは「組成フォーム + 調製法フォーム」）
(function () {
  function setActiveTab(tab) {
    document.querySelectorAll(".tabs a").forEach(a => a.classList.remove("active"));
    const el = document.querySelector(`.tabs a[data-tab="${tab}"]`);
    if (el) el.classList.add("active");
  }

  function fmtTime(ts) {
    const d = new Date(ts);
    return d.toLocaleString("ja-JP");
  }

  function label(type) {
    return ({ protocol: "プロトコル", reagent: "試薬", duty: "当番", run: "Run" })[type] || type;
  }

  function escapeHtml(s) {
    return (s || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function escapeAttr(s) {
    return escapeHtml(s).replaceAll('"', "&quot;");
  }

  // wikiリンクのための1行変換
  function wikiInline(text) {
    const esc = (s) => (s || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");

    const safe = esc(text);
    return safe.replace(/\[\[([^\]]+)\]\]/g, (_, name) => {
      const n = name.trim();
      return `<span class="link" data-wiki="${esc(n)}">[[${esc(n)}]]</span>`;
    });
  }

  function pageCard(p) {
    const tags = (p.tags || []).map(t => `<span class="pill">${escapeHtml(t)}</span>`).join("");
    const fav = p.favorite ? "⭐" : "";
    return `
      <div class="card">
        <h3>${fav} <a href="#/page/${p.id}">${escapeHtml(p.title)}</a></h3>
        <div class="meta">
          <span>${label(p.type)}</span>
          <span>更新: ${fmtTime(p.updatedAt)}</span>
        </div>
        <div class="pills">${tags}</div>
      </div>
    `;
  }

  function renderList(type) {
    setActiveTab(type);
    const items = Store.listPages(type);
    return `
      <div class="row">
        <div>
          <h2>${label(type)} 一覧</h2>
          <div class="small">本文に <b>[[試薬名]]</b> と書くとリンクになります。</div>
        </div>
        <div style="text-align:right; min-width:200px;">
          <a class="btn primary" href="#/new?type=${type}">＋ ${label(type)}を追加</a>
        </div>
      </div>
      <hr>
      <div class="list">
        ${items.map(pageCard).join("") || `<div class="small">まだ何もありません</div>`}
      </div>
    `;
  }

  // ===== 試薬のデータをページ内にJSONで持つ（bodyは「調製法」テキストとして使う） =====
  // p.metaReagent = { composition: [{name,amount,location}, ...] }
  // ※StoreはそのままJSON保存できるので、ページオブジェクトに追加してOK
  function getReagentMeta(p) {
    // 後方互換：無ければ空
    const m = p.metaReagent;
    if (!m || typeof m !== "object") return { composition: [] };
    if (!Array.isArray(m.composition)) return { composition: [] };
    return { composition: m.composition };
  }

  function renderCompositionTable(rows) {
    if (!rows.length) return `<div class="small">未登録</div>`;

    return `
      <div style="overflow-x:auto;">
        <table border="1" cellpadding="6">
          <tr>
            <th>薬品</th>
            <th>量</th>
            <th>場所</th>
          </tr>
          ${rows.map(r => `
            <tr>
              <td>${wikiInline(r.name || "")}</td>
              <td>${escapeHtml(r.amount || "")}</td>
              <td>${escapeHtml(r.location || "")}</td>
            </tr>
          `).join("")}
        </table>
      </div>
    `;
  }

  function renderPageDetail(id) {
    const p = Store.getPage(id);
    if (!p) return `<div class="card">見つかりません</div>`;

    setActiveTab(p.type);
    const tags = (p.tags || []).map(t => `<span class="pill">${escapeHtml(t)}</span>`).join("");

    // ===== 試薬：組成→調製法の順で表示 =====
    if (p.type === "reagent") {
      const meta = getReagentMeta(p);
      const methodHtml = p.body ? Link.wikiToHtml(p.body) : `<div class="small">未登録</div>`;

      const html = `
        <div class="row">
          <div>
            <h2>${escapeHtml(p.title)}</h2>
            <div class="meta">
              <span>${label(p.type)}</span>
              <span>更新: ${fmtTime(p.updatedAt)}</span>
            </div>
            <div class="pills">${tags}</div>
          </div>
          <div style="text-align:right; min-width:240px;">
            <button class="btn" id="btnFav">${p.favorite ? "★ お気に入り解除" : "☆ お気に入り"}</button>
            <a class="btn" href="#/edit/${p.id}">編集</a>
            <button class="btn" id="btnDel">削除</button>
          </div>
        </div>

        <hr>

        <div id="pageBody">
          <div class="card">
            <h3>【組成】</h3>
            ${renderCompositionTable(meta.composition)}
          </div>

          <div class="card">
            <h3>【調製法】</h3>
            <div>${methodHtml}</div>
          </div>
        </div>
      `;

      return { html, page: p };
    }

    // ===== それ以外：本文を表示 =====
    const bodyHtml = Link.wikiToHtml(p.body || "");
    const html = `
      <div class="row">
        <div>
          <h2>${escapeHtml(p.title)}</h2>
          <div class="meta">
            <span>${label(p.type)}</span>
            <span>更新: ${fmtTime(p.updatedAt)}</span>
          </div>
          <div class="pills">${tags}</div>
        </div>
        <div style="text-align:right; min-width:240px;">
          <button class="btn" id="btnFav">${p.favorite ? "★ お気に入り解除" : "☆ お気に入り"}</button>
          <a class="btn" href="#/edit/${p.id}">編集</a>
          <button class="btn" id="btnDel">削除</button>
          ${p.type === "protocol" ? `<button class="btn primary" id="btnRun">▶ 実行を開始</button>` : ""}
        </div>
      </div>
      <hr>
      <div class="card">
        <div id="pageBody">${bodyHtml}</div>
      </div>
    `;
    return { html, page: p };
  }

  // ===== 編集画面：試薬だけフォーム =====
  function renderEditor(mode, id, preset) {
    const p = mode === "edit"
      ? Store.getPage(id)
      : ({
          id: Store.uuid(),
          type: preset?.type || "protocol",
          title: preset?.title || "",
          aliases: [],
          tags: [],
          body: "",
          updatedAt: Store.now(),
          favorite: false
        });

    if (!p) return { html: `<div class="card">見つかりません</div>`, page: null };

    setActiveTab(p.type);

    const commonTop = `
      <h2>${mode === "edit" ? "編集" : "新規作成"}</h2>
      <div class="card">
        <div class="row">
          <label>
            種類
            <select id="fType">
              ${["protocol", "reagent", "duty"].map(t => `
                <option value="${t}" ${p.type === t ? "selected" : ""}>${label(t)}</option>
              `).join("")}
            </select>
          </label>

          <label>
            タイトル（=名前）
            <input id="fTitle" value="${escapeAttr(p.title)}" />
          </label>
        </div>

        <div class="row">
          <label>
            別名（カンマ区切り）
            <input id="fAliases" value="${escapeAttr((p.aliases || []).join(", "))}" />
          </label>
          <label>
            タグ（カンマ区切り）
            <input id="fTags" value="${escapeAttr((p.tags || []).join(", "))}" />
          </label>
        </div>
    `;

    const commonBottom = `
        <div class="row">
          <label style="min-width:220px;">
            <input type="checkbox" id="fFav" ${p.favorite ? "checked" : ""} />
            お気に入り
          </label>
          <div style="text-align:right; min-width:240px;">
            <button class="btn primary" id="btnSave">保存</button>
            <a class="btn" href="#/page/${p.id}">キャンセル</a>
          </div>
        </div>
      </div>
    `;

    // ---- 試薬フォーム ----
    if (p.type === "reagent") {
      const meta = getReagentMeta(p);
      const rows = meta.composition || [];

      const compRowsHtml = rows.length
        ? rows.map((r, i) => reagentRowHtml(i, r.name, r.amount, r.location)).join("")
        : reagentRowHtml(0, "", "", "");

      const html = `
        ${commonTop}

        <hr>
        <h3>【組成】</h3>
        <div class="small">薬品 / 量 / 場所を入力（行は追加できます）</div>
        <div class="card" style="border:1px solid var(--bd);">
          <div id="compRows" class="list" style="gap:8px;">
            ${compRowsHtml}
          </div>
          <div style="margin-top:10px; display:flex; gap:8px; justify-content:flex-end;">
            <button class="btn" id="btnAddRow" type="button">＋ 行を追加</button>
          </div>
        </div>

        <h3>【調製法】</h3>
        <div class="small">自由に書いてOK（[[リンク]]も使える）</div>
        <label>
          <textarea id="fMethod">${escapeHtml(p.body || "")}</textarea>
        </label>

        ${commonBottom}
      `;

      return { html, page: p };
    }

    // ---- プロトコル/当番は従来どおり本文 ----
    const html = `
      ${commonTop}

      <label>
        本文（Markdown風 + [[リンク]]）
        <textarea id="fBody">${escapeHtml(p.body || "")}</textarea>
      </label>

      ${commonBottom}
    `;

    return { html, page: p };
  }

  // 試薬の組成行（入力フォーム）
  function reagentRowHtml(i, name, amount, location) {
    return `
      <div class="card" style="padding:10px;">
        <div class="row">
          <label>
            薬品名
            <input class="comp-name" data-i="${i}" value="${escapeAttr(name || "")}" placeholder="例：FBS / [[DMEM]]" />
          </label>
          <label>
            量
            <input class="comp-amount" data-i="${i}" value="${escapeAttr(amount || "")}" placeholder="例：50 mL" />
          </label>
          <label>
            場所
            <input class="comp-location" data-i="${i}" value="${escapeAttr(location || "")}" placeholder="例：-20℃ / 冷蔵庫2段目" />
          </label>
        </div>
        <div style="text-align:right;">
          <button class="btn comp-del" data-i="${i}" type="button">削除</button>
        </div>
      </div>
    `;
  }

  function renderSearch(q) {
    setActiveTab("search");
    const results = q ? Store.search(q) : [];
    return `
      <h2>検索</h2>
      <div class="small">タイトル/別名/タグ/本文を横断検索します。</div>
      <hr>
      <div class="list">
        ${results.map(pageCard).join("") || `<div class="small">${q ? "見つかりません" : "検索語を入力してください"}</div>`}
      </div>
    `;
  }

  function renderRuns() {
    setActiveTab("run");
    const runs = Store.listRuns();
    const rows = runs.map(r => {
      const p = r.protocolId ? Store.getPage(r.protocolId) : null;
      return `
        <div class="card">
          <h3>${p ? escapeHtml(p.title) : "(プロトコル未指定)"}</h3>
          <div class="meta">
            <span>開始: ${fmtTime(r.startedAt)}</span>
            <span>${r.finishedAt ? "終了: " + fmtTime(r.finishedAt) : "進行中"}</span>
          </div>
          <div class="small">${escapeHtml(r.notes || "")}</div>
        </div>
      `;
    }).join("");

    return `
      <div class="row">
        <div>
          <h2>Run（実行ログ）</h2>
          <div class="small">まずは「プロトコル詳細 → ▶実行開始」でログを残せます。</div>
        </div>
      </div>
      <hr>
      <div class="list">${rows || `<div class="small">まだRunがありません</div>`}</div>
    `;
  }

  // app.js側から「今の試薬フォームの入力」を拾うために使う
  function readReagentCompositionFromDOM() {
    const container = document.getElementById("compRows");
    if (!container) return [];

    // 各rowカードごとに拾う（index依存しない）
    const cards = Array.from(container.querySelectorAll(".card"));
    const rows = cards.map(card => {
      const name = card.querySelector(".comp-name")?.value?.trim() || "";
      const amount = card.querySelector(".comp-amount")?.value?.trim() || "";
      const location = card.querySelector(".comp-location")?.value?.trim() || "";
      return { name, amount, location };
    }).filter(r => r.name || r.amount || r.location); // 空行は捨てる

    return rows;
  }

  window.Render = {
    renderList,
    renderPageDetail,
    renderEditor,
    renderSearch,
    renderRuns,
    label,

    // 試薬フォーム用の補助
    reagentRowHtml,
    readReagentCompositionFromDOM
  };
})();
