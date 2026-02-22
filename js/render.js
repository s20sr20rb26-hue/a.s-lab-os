 js/render.js（全文置き換え）
(function () {
  function setActiveTab(tab) {
    document.querySelectorAll(".tabs a").forEach(a => a.classList.remove("active"));
    const el = document.querySelector(`.tabs a[data-tab="${tab}"]`);
    if (el) el.      .replaceAll("&", "&amp;")
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

  // ===== 試薬（組成フォーム） =====
  function getReagentMeta(p) {
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

  function readReagentCompositionFromDOM() {
    const container = document.getElementById("compRows");
    if (!container) return [];
    const cards = Array.from(container.querySelectorAll(".card"));
    return cards.map(card => {
      const name = card.querySelector(".comp-name")?.value?.trim() || "";
      const amount = card.querySelector(".comp-amount")?.value?.trim() || "";
      const location = card.querySelector(".comp-location")?.value?.trim() || "";
      return { name, amount, location };
    }).filter(r => r.name || r.amount || r.location);
  }

  // ===== 詳細 =====
  function renderPageDetail(id) {
    const p = Store.getPage(id);
    if (!p) return `<div class="card">見つかりません</div>`;

    setActiveTab(p.type);
    const tags = (p.tags || []).map(t => `<span class="pill">${escapeHtml(t)}</span>`).join("");

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

  // ===== 編集 =====
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

  // ===== 検索 =====
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

  // ===== Run一覧/詳細 =====
  function runCard(r) {
    const p = r.protocolId ? Store.getPage(r.protocolId) : null;
    const title = p ? p.title : (r.protocolTitleSnapshot || "(プロトコル未指定)");
    const status = r.finishedAt ? "完了" : "進行中";
    return `
      <div class="card">
        <h3><a href="#/run/${r.id}">${escapeHtml(title)}</a></h3>
        <div class="meta">
          <span>${status}</span>
          <span>開始: ${fmtHM(r.startedAt)}</span>
          <span>${r.finishedAt ? "終了: " + fmtHM(r.finishedAt) : ""}</span>
        </div>
        <div class="small">${escapeHtml(r.notes || "")}</div>
      </div>
    `;
  }

  function renderRuns() {
    setActiveTab("run");
    const runs = Store.listRuns();
    return `
      <div class="row">
        <div>
          <h2>Run（実験記録）</h2>
          <div class="small">プロトコル詳細の「▶ 実行を開始」から作れます。</div>
        </div>
      </div>
      <hr>
      <div class="list">${runs.map(runCard).join("") || `<div class="small">まだRunがありません</div>`}</div>
    `;
  }

  function renderRunDetail(runId) {
    setActiveTab("run");
    const run = Store.getRun(runId);
    if (!run) return `<div class="card">Runが見つかりません</div>`;

    const p = run.protocolId ? Store.getPage(run.protocolId) : null;
    const title = p ? p.title : (run.protocolTitleSnapshot || "(プロトコル未指定)");
    const blocks = (run.plan?.blocks || []);

    const blocksHtml = `
      <div class="card">
        <h3>⏳ インキュベート計画</h3>
        ${blocks.length ? `
          <div style="overflow-x:auto;">
            <table border="1" cellpadding="6">
              <tr>
                <th>#</th>
                <th>内容</th>
                <th>開始</th>
                <th>終了</th>
                <th></th>
              </tr>
              ${blocks.map((b, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td>${escapeHtml(b.label || "Incubate")}</td>
                  <td>${fmtHM(b.startAt)}</td>
                  <td>${fmtHM(b.endAt)}</td>
                  <td><button class="btn" data-del-block="${i}">削除</button></td>
                </tr>
              `).join("")}
            </table>
          </div>
        ` : `<div class="small">まだ区間がありません</div>`}
      </div>
    `;

    const html = `
      <div class="row">
        <div>
          <h2>Run</h2>
          <div class="meta">
            <span>プロトコル: ${escapeHtml(title)}</span>
            <span>${run.finishedAt ? "完了" : "進行中"}</span>
          </div>
        </div>
        <div style="text-align:right; min-width:280px;">
          ${p ? `<a class="btn" href="#/page/${p.id}">プロトコルへ</a>` : ""}
          <button class="btn" id="btnFinishRun">${run.finishedAt ? "完了解除" : "完了にする"}</button>
          <button class="btn" id="btnDelRun">Run削除</button>
        </div>
      </div>

      <hr>

      <div class="card">
        <h3>🕒 開始時刻（基準）</h3>
        <div class="row">
          <label>
            開始時刻
            <input id="runStart" type="datetime-local" />
          </label>
          <div style="align-self:end; text-align:right;">
            <button class="btn primary" id="btnSetStart">保存</button>
          </div>
        </div>
        <div class="small">インキュベート区間の開始/終了を、この時刻から積み上げて管理できます。</div>
      </div>

      <div class="card">
        <h3>➕ インキュベート区間を追加</h3>
        <div class="row">
          <label>
            ラベル
            <input id="blkLabel" placeholder="例：培養（TMZ処理）" />
          </label>
          <label>
            継続時間（時間）
            <input id="blkHours" type="number" step="0.1" placeholder="例：24" />
          </label>
        </div>
        <div class="row">
          <label>
            開始時刻（空なら直前の終了 or 開始時刻）
            <input id="blkStart" type="datetime-local" />
          </label>
          <div style="align-self:end; text-align:right;">
            <button class="btn primary" id="btnAddBlock">追加</button>
          </div>
        </div>
      </div>

      ${blocksHtml}

      <div class="card">
        <h3>📝 メモ</h3>
        <textarea id="runNotes" placeholder="結果、トラブル、条件など">${escapeHtml(run.notes || "")}</textarea>
        <div style="text-align:right; margin-top:10px;">
          <button class="btn primary" id="btnSaveNotes">メモ保存</button>
        </div>
      </div>
    `;

    return { html, run };
  }

  window.Render = {
    renderList,
    renderPageDetail,
    renderEditor,
    renderSearch,
    renderRuns,
    renderRunDetail,
    label,

    // reagent form helpers
    reagentRowHtml,
    readReagentCompositionFromDOM
  };
})();

