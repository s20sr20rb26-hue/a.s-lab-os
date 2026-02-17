// store.js（グローバルに Store を生やす）
(function () {
  const KEY = "lab_os_v1";

  /** @typedef {{id:string, type:"protocol"|"reagent"|"duty", title:string, aliases:string[], tags:string[], body:string, updatedAt:number, favorite:boolean}} Page */
  /** @typedef {{id:string, protocolId:string|null, startedAt:number, finishedAt:number|null, notes:string}} Run */

  function uuid() {
    return "id_" + Math.random().toString(16).slice(2) + "_" + Date.now().toString(16);
  }

  function now() { return Date.now(); }

  function load() {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);

    // 初期データ（あなた向けの雛形だけ入れる）
    const seed = {
      pages: /** @type {Page[]} */ ([
        {
          id: uuid(),
          type: "protocol",
          title: "TMZ添加→培養→染色",
          aliases: ["TMZ assay"],
          tags: ["Cell", "Drug"],
          body:
`## 目的
TMZ処理での反応を見る。

## 準備物
- [[TMZ 50mM (DMSO)]]
- 培地、6well、PBS
- 染色液（ここも後で [[染色液]] みたいにページ化OK）

## 手順（概要）
1. 細胞状態確認
2. 濃度系列に合わせてTMZ添加
3. 培養
4. 染色

## 注意
- DMSO vehicleを揃える
- 遮光や毒性の注意
`,
          updatedAt: now(),
          favorite: true
        },
        {
          id: uuid(),
          type: "reagent",
          title: "TMZ 50mM (DMSO)",
          aliases: ["TMZ stock 50mM"],
          tags: ["Drug", "DMSO"],
          body:
`## 保存
- 例：-20℃ / 遮光（あなたのラボルールに合わせて）

## 調製
- 溶媒：DMSO
- ラベル：濃度 / 溶媒 / 作成日 / 作成者 / ロット

## 関連
- [[TMZ添加→培養→染色]]
`,
          updatedAt: now(),
          favorite: true
        },
        {
          id: uuid(),
          type: "duty",
          title: "ピペット洗浄",
          aliases: ["pipette wash"],
          tags: ["Duty"],
          body:
`## 手順（概要）
1. すすぎ
2. 洗浄
3. 乾燥
4. 収納

## 注意
- 研究室ルールがあれば追記
`,
          updatedAt: now(),
          favorite: false
        }
      ]),
      runs: /** @type {Run[]} */ ([])
    };

    localStorage.setItem(KEY, JSON.stringify(seed));
    return seed;
  }

  function save(db) {
    localStorage.setItem(KEY, JSON.stringify(db));
  }

  const db = load();

  function listPages(type) {
    return db.pages
      .filter(p => p.type === type)
      .sort((a,b) => (b.favorite - a.favorite) || (b.updatedAt - a.updatedAt));
  }

  function getPage(id) { return db.pages.find(p => p.id === id) || null; }

  function findPageByTitleOrAlias(name) {
    const key = name.trim().toLowerCase();
    return db.pages.find(p =>
      p.title.toLowerCase() === key ||
      (p.aliases || []).some(a => a.toLowerCase() === key)
    ) || null;
  }

  function upsertPage(page) {
    const i = db.pages.findIndex(p => p.id === page.id);
    page.updatedAt = now();
    if (i >= 0) db.pages[i] = page;
    else db.pages.unshift(page);
    save(db);
    return page;
  }

  function deletePage(id) {
    db.pages = db.pages.filter(p => p.id !== id);
    save(db);
  }

  function search(q) {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    return db.pages.filter(p => {
      const hay = [
        p.title, ...(p.aliases||[]), ...(p.tags||[]), p.body
      ].join("\n").toLowerCase();
      return hay.includes(s);
    }).sort((a,b) => b.updatedAt - a.updatedAt);
  }

  // Run（今回は最低限：記録だけ）
  function addRun(run) {
    db.runs.unshift(run);
    save(db);
  }
  function listRuns() {
    return db.runs.slice().sort((a,b) => b.startedAt - a.startedAt);
  }

  window.Store = {
    uuid, now,
    listPages, getPage, upsertPage, deletePage,
    findPageByTitleOrAlias, search,
    addRun, listRuns
  };
})();
