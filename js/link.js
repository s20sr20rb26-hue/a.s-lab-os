// js/link.js（[[リンク]]の新規作成時に type を指定できるようにする）
(function () {
  // [[...]] を <span class="link">...</span> に変換
  function wikiToHtml(text) {
    const esc = (s) => s
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");

    const safe = esc(text);

    return safe
      .replace(/\[\[([^\]]+)\]\]/g, (_, name) => {
        const n = name.trim();
        return `<span class="link" data-wiki="${esc(n)}">[[${esc(n)}]]</span>`;
      })
      .replace(/\n/g, "<br>");
  }

  /**
   * containerEl 内の [[...]] をクリック可能にする
   * @param {HTMLElement} containerEl
   * @param {{defaultNewType?: "protocol"|"reagent"|"duty"}} [opts]
   */
  function bindWikiLinks(containerEl, opts) {
    const defaultNewType = opts?.defaultNewType || "protocol";

    containerEl.querySelectorAll("[data-wiki]").forEach(el => {
      el.addEventListener("click", () => {
        const name = el.getAttribute("data-wiki");
        const page = window.Store.findPageByTitleOrAlias(name);

        if (page) {
          location.hash = `#/page/${page.id}`;
        } else {
          // ★存在しないなら、defaultNewTypeで新規作成へ
          location.hash = `#/new?type=${encodeURIComponent(defaultNewType)}&title=${encodeURIComponent(name)}`;
        }
      });
    });
  }

  window.Link = { wikiToHtml, bindWikiLinks };
})();
