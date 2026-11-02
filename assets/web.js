// Bartop Arcade · buscador, filtros y vídeos. Sin librerías.
// Lo copia _scripts/generar_web.py a assets/web.js.
(() => {
  document.documentElement.classList.remove("no-js");

  // ── Cabecera: menú de sistemas, menú del móvil y buscador de juegos ──
  const cab = document.querySelector(".cabecera");
  const botonSis = document.querySelector(".nav-sis-boton");
  const panelSis = document.getElementById("panel-sis");
  const botonMenu = document.querySelector(".nav-menu");
  const cerrarSis = () => { if (panelSis) { panelSis.hidden = true; botonSis.setAttribute("aria-expanded", "false"); } };
  if (botonSis && panelSis) {
    botonSis.addEventListener("click", (e) => {
      if (cab.classList.contains("abierto")) return; // en el móvil, el enlace lleva a la portada
      e.preventDefault();
      const abrir = panelSis.hidden;
      panelSis.hidden = !abrir;
      botonSis.setAttribute("aria-expanded", String(abrir));
    });
    document.addEventListener("click", (e) => { if (!e.target.closest(".nav-sis")) cerrarSis(); });
  }
  if (botonMenu) {
    botonMenu.addEventListener("click", () => {
      const abierto = cab.classList.toggle("abierto");
      botonMenu.setAttribute("aria-expanded", String(abierto));
      document.body.classList.toggle("menu-abierto", abierto);
    });
  }

  const dlg = document.getElementById("buscador-global");
  const base = document.body.dataset.base || "";
  let juegosIdx = null;
  const normal = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const abrirBuscador = async () => {
    if (!dlg) return;
    cerrarSis();
    dlg.hidden = false;
    document.body.classList.add("buscando");
    const campo = dlg.querySelector("input");
    campo.value = "";
    campo.focus();
    pintar("");
    if (!juegosIdx) {
      try { juegosIdx = await (await fetch(base + "assets/juegos.json")).json(); } catch { juegosIdx = []; }
      pintar(campo.value);
    }
  };
  const cerrarBuscador = () => { if (dlg) { dlg.hidden = true; document.body.classList.remove("buscando"); } };
  const pintar = (q) => {
    const lista = dlg.querySelector(".bg-resultados");
    const vacio = dlg.querySelector(".bg-vacio");
    const n = normal(q.trim());
    if (!juegosIdx || !n) { lista.innerHTML = ""; vacio.hidden = true; return; }
    const res = juegosIdx.filter((j) => normal(j.n).includes(n)).slice(0, 12);
    lista.innerHTML = res.map((j) =>
      `<li><a href="${base}${j.u}">${j.i ? `<img src="${base}${j.i}" alt="" loading="lazy">` : '<span class="bg-sin-img"></span>'}` +
      `<span><b>${j.n.replace(/[<&]/g, (c) => c === "<" ? "&lt;" : "&amp;")}</b><small>${j.s}</small></span></a></li>`).join("");
    vacio.hidden = res.length > 0;
  };
  document.querySelectorAll(".nav-buscar").forEach((b) => b.addEventListener("click", abrirBuscador));
  if (dlg) {
    const campo = dlg.querySelector("input");
    campo.addEventListener("input", () => pintar(campo.value));
    campo.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { const a = dlg.querySelector(".bg-resultados a"); if (a) location.href = a.href; }
    });
    dlg.querySelector(".bg-cerrar").addEventListener("click", cerrarBuscador);
    dlg.addEventListener("click", (e) => { if (e.target === dlg) cerrarBuscador(); });
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { cerrarBuscador(); cerrarSis(); }
    if (e.key === "/" && dlg && dlg.hidden && !/input|textarea/i.test(document.activeElement.tagName)) { e.preventDefault(); abrirBuscador(); }
  });

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

  // Capítulos: un ▶ del mismo vídeo lo carga (o lo recarga) desde ese segundo.
  document.querySelectorAll("a.salto[data-t]").forEach((a) => {
    a.addEventListener("click", (e) => {
      const sec = a.closest("section");
      const enlace = sec && sec.querySelector("a.video[data-id]");
      const iframe = sec && sec.querySelector("div.video iframe");
      if (!enlace && !iframe) return;
      e.preventDefault();
      if (enlace) enlace.click();
      const f = sec.querySelector("div.video iframe");
      const id = f.src.match(/embed\/([^?]+)/)[1];
      f.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&start=${a.dataset.t}`;
      f.closest(".video").scrollIntoView({ behavior: "smooth", block: "center" });
    });
  });

  // Final oculto: se muestra al pulsar el botón.
  document.querySelectorAll(".spoiler-boton").forEach((b) => {
    b.addEventListener("click", () => {
      b.parentElement.classList.add("visible");
      b.remove();
    });
  });

  // Índice de la página: marca el apartado que se está viendo.
  const enlacesIndice = [...document.querySelectorAll(".indice a")];
  if (enlacesIndice.length && "IntersectionObserver" in window) {
    const ids = [...new Set(enlacesIndice.map((a) => a.hash.slice(1)))];
    const vistos = new Map();
    const marcar = () => {
      const actual = ids.find((id) => vistos.get(id));
      enlacesIndice.forEach((a) => a.classList.toggle("activo", a.hash.slice(1) === actual));
      const activo = document.querySelector(".indice-movil a.activo");
      if (activo) activo.scrollIntoView({ block: "nearest", inline: "center" });
    };
    const obs = new IntersectionObserver((entradas) => {
      entradas.forEach((en) => vistos.set(en.target.querySelector("h2").id, en.isIntersecting));
      marcar();
    }, { rootMargin: "-120px 0px -55% 0px" });
    ids.forEach((id) => {
      const h = document.getElementById(id);
      if (h) obs.observe(h.closest("section"));
    });
  }

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
