// Bartop Arcade · buscador, filtros y vídeos. Sin librerías.
// Lo copia _scripts/generar_web.py a assets/web.js.
(() => {
  document.documentElement.classList.remove("no-js");

  // Vídeo de YouTube: se carga solo al pulsar (más rápido y sin cookies hasta entonces).
  document.querySelectorAll("a.video[data-id]").forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const f = document.createElement("iframe");
      f.src = `https://www.youtube-nocookie.com/embed/${a.dataset.id}?autoplay=1&rel=0`;
      f.title = a.getAttribute("aria-label") || "Vídeo";
      f.allow = "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen";
      f.allowFullscreen = true;
      const caja = document.createElement("div");
      caja.className = "video";
      caja.appendChild(f);
      a.replaceWith(caja);
    });
  });

  // Buscador y filtros de la página de un sistema.
  const lista = document.querySelector(".juegos[data-filtrable]");
  if (!lista) return;
  const items = [...lista.children];
  const campo = document.getElementById("buscar");
  const contador = document.getElementById("resultado");
  const vacio = document.getElementById("sin-resultados");
  const activos = {};
  const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

  const aplicar = () => {
    const q = norm(campo.value.trim());
    let n = 0;
    for (const li of items) {
      const d = li.dataset;
      const ok =
        (!q || norm(d.nombre + " " + d.desarrollador).includes(q)) &&
        Object.entries(activos).every(([k, v]) => !v || d[k] === v);
      li.hidden = !ok;
      if (ok) n++;
    }
    contador.textContent = n === items.length ? `${n} juegos` : `${n} de ${items.length} juegos`;
    vacio.hidden = n !== 0;
  };

  document.querySelectorAll(".chips-grupo").forEach((g) => {
    const clave = g.dataset.filtro;
    g.addEventListener("click", (e) => {
      const b = e.target.closest(".chip");
      if (!b) return;
      g.querySelectorAll(".chip").forEach((c) => c.setAttribute("aria-pressed", String(c === b)));
      activos[clave] = b.dataset.valor;
      aplicar();
    });
  });
  campo.addEventListener("input", aplicar);
  aplicar();
})();
