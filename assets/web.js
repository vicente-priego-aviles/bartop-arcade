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
