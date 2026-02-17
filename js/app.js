(function () {
  const appEl = document.getElementById("app");
  const searchEl = document.getElementById("globalSearch");
  const btnNew = document.getElementById("btnNew");

  function navigate() {
    const { parts, query } = Router.parseHash();
    const [root, a, b] = parts;

    // 一旦クリア
    appEl.innerHTML = "";

    // タブ: /protocol /reagent /duty
    if (root === "protocol" || root === "reagent" || root === "duty") {
      appEl.innerHTML = Render.renderList(root);
      return;
    }

    // 詳細: /page/:id
    if (root === "page" && a) {
      const out = Render.renderPageDetail(a);
      if (typeof out === "string") {
        appEl.innerHTML = out;
        return;
      }
      appEl.innerHTML = out.html;

      // wikiリンクを有効化
      const body = document.getElementById("pageBody");
      if (body) {
      // プロトコル内リンクで作るのは試薬が多いので、デフォルトはreagentにする
      const defaultNewType = (out.page.type === "protocol") ? "reagent" : out.page.type;
      Link.bindWikiLinks(body, { defaultNewType });
      }


      // お気に入り
      document.getElementById("btnFav")?.addEventListener("click", () => {
        const p = out.page;
        p.favorite = !p.favorite;
        Store.upsertPage(p);
        navigate();
      });

      // 削除
      document.getElementById("btnDel")?.addEventListener("click", () => {
        if (confirm("削除しますか？")) {
          Store.deletePage(out.page.id);
          location.hash = `#/${out.page.type}`;
        }
      });

      // 実行開始（最低限のRunログ）
      document.getElementById("btnRun")?.addEventListener("click", () => {
        Store.addRun({
          id: Store.uuid(),
          protocolId: out.page.id,
          startedAt: Store.now(),
          finishedAt: null,
          notes: ""
        });
        location.hash = "#/run";
      });

      return;
    }

    // 新規: /new?type=...&title=...
    if (root === "new") {
      const preset = { type: query.type || "protocol", title: query.title || "" };
      const out = Render.renderEditor("new", null, preset);
      appEl.innerHTML = out.html;    
        // 試薬フォーム用：行追加/削除
      wireReagentFormButtons();


       document.getElementById("btnSave")?.addEventListener("click", () => {
        const p = out.page;
        p.type = document.getElementById("fType").value;
        p.title = document.getElementById("fTitle").value.trim();
        p.aliases = splitList(document.getElementById("fAliases").value);
        p.tags = splitList(document.getElementById("fTags").value);
        p.favorite = document.getElementById("fFav").checked;

        if (!p.title) return alert("タイトルは必須です");

        if (p.type === "reagent") {
          // 調製法（自由記述）
          p.body = document.getElementById("fMethod")?.value || "";

          // 組成（フォーム入力）
          p.metaReagent = {
            composition: Render.readReagentCompositionFromDOM()
          };
        } else {
          p.body = document.getElementById("fBody")?.value || "";
          delete p.metaReagent;
        }

        Store.upsertPage(p);
        location.hash = `#/page/${p.id}`;
      });

      return;
    }

    // 編集: /edit/:id
    if (root === "edit" && a) {
      const out = Render.renderEditor("edit", a, null);
      appEl.innerHTML = out.html;  
        wireReagentFormButtons();


       document.getElementById("btnSave")?.addEventListener("click", () => {
        const p = out.page;
        p.type = document.getElementById("fType").value;
        p.title = document.getElementById("fTitle").value.trim();
        p.aliases = splitList(document.getElementById("fAliases").value);
        p.tags = splitList(document.getElementById("fTags").value);
        p.favorite = document.getElementById("fFav").checked;

        if (!p.title) return alert("タイトルは必須です");

        if (p.type === "reagent") {
          p.body = document.getElementById("fMethod")?.value || "";
          p.metaReagent = {
            composition: Render.readReagentCompositionFromDOM()
          };
        } else {
          p.body = document.getElementById("fBody")?.value || "";
          delete p.metaReagent;
        }

        Store.upsertPage(p);
        location.hash = `#/page/${p.id}`;
      });

      return;
    }

    // Run: /run
    if (root === "run") {
      appEl.innerHTML = Render.renderRuns();
      return;
    }

    // 検索: /search?q=...
    if (root === "search") {
      const q = query.q || searchEl.value || "";
      appEl.innerHTML = Render.renderSearch(q);
      return;
    }

    // default
    location.hash = "#/protocol";
  }
  
  function wireReagentFormButtons() {
    const addBtn = document.getElementById("btnAddRow");
    const rowsEl = document.getElementById("compRows");

    if (!addBtn || !rowsEl) return; // 試薬編集画面じゃない

    addBtn.addEventListener("click", () => {
      // 新しい空行を追加
      const idx = rowsEl.querySelectorAll(".card").length;
      rowsEl.insertAdjacentHTML("beforeend", Render.reagentRowHtml(idx, "", "", ""));
      // 削除ボタンも効くように張り直し
      bindDeleteButtons(rowsEl);
    });

    bindDeleteButtons(rowsEl);
  }

  function bindDeleteButtons(rowsEl) {
    rowsEl.querySelectorAll(".comp-del").forEach(btn => {
      btn.onclick = () => {
        const card = btn.closest(".card");
        if (card) card.remove();
      };
    });
  }

  function splitList(s) {
    return (s || "")
      .split(",")
      .map(x => x.trim())
      .filter(Boolean);
  }

  // グローバル検索
  searchEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      location.hash = `#/search?q=${encodeURIComponent(searchEl.value)}`;
    }
  });

  // 新規ボタン：今いるタブのtypeで作る
  btnNew.addEventListener("click", () => {
    const { parts } = Router.parseHash();
    const t = parts[0];
    const type = (t === "protocol" || t === "reagent" || t === "duty") ? t : "protocol";
    location.hash = `#/new?type=${type}`;
  });

  window.addEventListener("hashchange", navigate);
  navigate();
})();
