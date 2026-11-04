/* Sección «Pruebas»: marcas guardadas en el propio móvil (localStorage) y envío de resultados como texto. */
(function () {
  "use strict";
  var CLAVE = "bartop-pruebas-";
  var ETIQ = { ok: "ok", mal: "⚠️", luego: "luego" };

  function leer(sis) {
    try { return JSON.parse(localStorage.getItem(CLAVE + sis) || "{}"); } catch (e) { return {}; }
  }
  function guardar(sis, datos) {
    try { localStorage.setItem(CLAVE + sis, JSON.stringify(datos)); } catch (e) { /* sin espacio o modo privado */ }
  }

  // Página de inicio de Pruebas: cuántas hay hechas en cada sistema
  document.querySelectorAll(".pr-sis").forEach(function (a) {
    var datos = leer(a.dataset.sistema);
    var hechas = Object.keys(datos).filter(function (k) { return datos[k].e; }).length;  // solo las marcadas
    var span = a.querySelector(".pr-sis-hechas");
    if (hechas && span) { span.hidden = false; span.textContent = hechas + " de " + a.dataset.total + " marcadas en este móvil"; }
  });

  var raiz = document.querySelector(".pruebas");
  if (!raiz) return;
  var sis = raiz.dataset.sistema;
  var datos = leer(sis);
  var tarjetas = Array.prototype.slice.call(raiz.querySelectorAll(".prueba"));
  var filtro = "";

  function pintar(t) {
    var d = datos[t.dataset.id] || {};
    t.dataset.estado = d.e || "";
    t.querySelectorAll(".pr-estado button").forEach(function (b) {
      b.setAttribute("aria-pressed", b.dataset.e === d.e ? "true" : "false");
    });
    var nota = t.querySelector(".pr-nota");
    // sin nota guardada, el recuadro trae las pistas de los botones (d.n === "" es «la he borrado»)
    if (nota && document.activeElement !== nota) nota.value = d.n !== undefined ? d.n : (nota.dataset.pista || "");
    t.querySelector(".pr-marca").textContent = d.e === "ok" ? "✅" : d.e === "mal" ? "⚠️" : d.e === "luego" ? "⏭️" : "";
  }
  function progreso() {
    var hechas = tarjetas.filter(function (t) { return (datos[t.dataset.id] || {}).e; }).length;
    raiz.querySelector(".pr-hechas").textContent = hechas;
  }
  function filtrar() {
    var visibles = 0;
    tarjetas.forEach(function (t) {
      var e = t.dataset.estado;
      var ver = !filtro || (filtro === "pend" ? !e : e === filtro);
      t.hidden = !ver;
      if (ver) visibles++;
    });
    raiz.querySelectorAll(".pr-lista").forEach(function (l) {
      var titulo = l.previousElementSibling;
      var alguna = l.querySelector(".prueba:not([hidden])");
      l.hidden = !alguna;
      if (titulo && titulo.classList.contains("pr-titulo")) titulo.hidden = !alguna;
    });
    raiz.querySelector(".pr-vacio").hidden = visibles > 0;
  }

  tarjetas.forEach(function (t) {
    pintar(t);
    t.querySelectorAll(".pr-estado button").forEach(function (b) {
      b.addEventListener("click", function () {
        var d = datos[t.dataset.id] || {};
        d.e = d.e === b.dataset.e ? "" : b.dataset.e;  // pulsar otra vez quita la marca
        if (!d.e && d.n === undefined) delete datos[t.dataset.id]; else datos[t.dataset.id] = d;
        guardar(sis, datos); pintar(t); progreso(); filtrar();
      });
    });
    var nota = t.querySelector(".pr-nota");
    nota.addEventListener("input", function () {
      var d = datos[t.dataset.id] || {};
      d.n = nota.value;
      // si vuelve a ser igual que la pista, es como no haber escrito nada
      if (d.n === (nota.dataset.pista || "")) delete d.n;
      if (!d.e && d.n === undefined) delete datos[t.dataset.id]; else datos[t.dataset.id] = d;
      guardar(sis, datos); progreso();
    });
  });

  raiz.querySelectorAll(".pr-filtros .chip").forEach(function (c) {
    c.addEventListener("click", function () {
      filtro = c.dataset.f;
      raiz.querySelectorAll(".pr-filtros .chip").forEach(function (o) { o.setAttribute("aria-pressed", o === c ? "true" : "false"); });
      filtrar();
    });
  });

  function texto() {
    var lineas = [];
    tarjetas.forEach(function (t) {
      var d = datos[t.dataset.id];
      if (!d || (!d.e && !d.n)) return;
      var pista = (t.querySelector(".pr-nota").dataset.pista || "").trim();
      var nota = (d.n || "").trim();
      if (nota === pista) nota = "";  // la pista sin tocar no se envía
      nota = nota.replace(/\s*\n\s*/g, " · ").replace(/\s+/g, " ");
      lineas.push(t.dataset.num + ". " + t.dataset.titulo + ": " + (ETIQ[d.e] || "nota") + (nota ? " — " + nota : ""));
    });
    if (!lineas.length) return "";
    return "Pruebas " + raiz.dataset.nombre + " (" + new Date().toLocaleDateString("es-ES") + ")\n" + lineas.join("\n");
  }
  function aviso(msg) {
    var p = raiz.querySelector(".pr-aviso");
    p.textContent = msg; p.hidden = false;
    clearTimeout(aviso.t); aviso.t = setTimeout(function () { p.hidden = true; }, 4000);
  }
  function copiar(txt) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(txt).then(function () { aviso("Copiado. Pégamelo en el chat."); });
    }
    var a = document.createElement("textarea");
    a.value = txt; a.setAttribute("readonly", ""); a.style.position = "fixed"; a.style.opacity = "0";
    document.body.appendChild(a); a.select();
    try { document.execCommand("copy"); aviso("Copiado. Pégamelo en el chat."); } catch (e) { aviso("No se ha podido copiar."); }
    document.body.removeChild(a);
    return Promise.resolve();
  }

  raiz.querySelector(".pr-enviar").addEventListener("click", function () {
    var txt = texto();
    if (!txt) { aviso("Todavía no has marcado ninguna prueba."); return; }
    if (navigator.share) {
      navigator.share({ title: "Pruebas " + raiz.dataset.nombre, text: txt }).catch(function () { copiar(txt); });
    } else {
      copiar(txt);
    }
  });
  raiz.querySelector(".pr-borrar").addEventListener("click", function () {
    if (!confirm("¿Borrar todas las marcas y notas de " + raiz.dataset.nombre + " en este móvil?")) return;
    datos = {}; guardar(sis, datos);
    tarjetas.forEach(pintar); progreso(); filtrar();
  });

  progreso(); filtrar();
})();
