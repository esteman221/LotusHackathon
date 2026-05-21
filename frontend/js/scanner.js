/**
 * FacturaAI — scanner.js
 * ─────────────────────────────────────────────────────────────────
 * LÓGICA SIMULADA DE ESCANEO Y EXTRACCIÓN DE FACTURAS
 *
 * Este archivo encapsula toda la lógica del flujo de captura:
 *   1. Gestión de la imagen capturada (preview).
 *   2. Simulación del procesamiento OCR (mock).
 *   3. Renderizado de los resultados extraídos.
 *
 * CÓMO MIGRAR A UNA API REAL:
 *   Reemplaza el cuerpo de `ScannerService.processImage()` con
 *   un fetch() real a tu endpoint de OCR o backend.
 *   El resto del archivo (UI, preview, render) no necesita cambios.
 *
 *   Ejemplo:
 *     processImage(file) {
 *       const form = new FormData();
 *       form.append('invoice', file);
 *       return fetch('/api/ocr/extract', { method: 'POST', body: form })
 *         .then(r => r.json());
 *     }
 * ─────────────────────────────────────────────────────────────────
 */

// ─────────────────────────────────────────────
// DATOS MOCK — reemplazar con respuesta de API
// ─────────────────────────────────────────────

/** Pool de facturas ficticias para simular variedad en cada escaneo. */
var MOCK_INVOICES = [
  {
    comercio:    "Distribuidora Central S.A.",
    fecha:       "2025-10-15",
    numeroFactura: "INV-78291",
    subtotal:    1054.24,
    impuesto:    185.76,
    total:       1240.00,
    productos: [
      { nombre: "Arroz Blanco 1kg",     cantidad: 48, precioUnit: 9.50,  subtotal: 456.00 },
      { nombre: "Frijoles Negros 500g", cantidad: 36, precioUnit: 6.80,  subtotal: 244.80 },
      { nombre: "Aceite Vegetal 1L",    cantidad: 24, precioUnit: 14.72, subtotal: 353.44 },
    ],
  },
  {
    comercio:    "Lácteos del Sur",
    fecha:       "2025-10-14",
    numeroFactura: "INV-78250",
    subtotal:    382.91,
    impuesto:    67.59,
    total:       450.50,
    productos: [
      { nombre: "Leche Entera 1L",   cantidad: 60, precioUnit: 4.20, subtotal: 252.00 },
      { nombre: "Queso Turrialba",   cantidad: 15, precioUnit: 6.20, subtotal: 93.00  },
      { nombre: "Yogur Natural 500g",cantidad: 20, precioUnit: 1.90, subtotal: 38.00  },
    ],
  },
  {
    comercio:    "Papelería Global",
    fecha:       "2025-10-12",
    numeroFactura: "INV-78112",
    subtotal:    72.03,
    impuesto:    12.97,
    total:       85.00,
    productos: [
      { nombre: "Papel Bond 500 hojas", cantidad: 5, precioUnit: 8.50, subtotal: 42.50 },
      { nombre: "Bolígrafos x12",       cantidad: 3, precioUnit: 4.80, subtotal: 14.40 },
      { nombre: "Carpetas Manila x10",  cantidad: 2, precioUnit: 7.55, subtotal: 15.10 },
    ],
  },
];

// ─────────────────────────────────────────────
// SERVICIO DE ESCANEO
// ─────────────────────────────────────────────

window.ScannerService = (function () {

  /**
   * Simula el procesamiento OCR de una imagen de factura.
   * Añade un delay artificial para imitar latencia de red.
   *
   * @param {File} file - Archivo de imagen capturado.
   * @returns {Promise<Object>} Datos extraídos de la factura.
   */
  function processImage(file) {
    return new Promise(function (resolve) {
      // Simula latencia de API: entre 1.5 y 2.5 segundos
      var delay = 1500 + Math.random() * 1000;
      setTimeout(function () {
        // Selecciona una factura mock aleatoria para simular variedad
        var idx    = Math.floor(Math.random() * MOCK_INVOICES.length);
        var result = Object.assign({}, MOCK_INVOICES[idx]);
        // Marca el nombre del archivo procesado
        result.archivoOriginal = file ? file.name : "imagen_capturada.jpg";
        resolve(result);
      }, delay);
    });
  }

  /**
   * Formatea un número como moneda local (₡ / $).
   * @param {number} amount
   * @returns {string}
   */
  function formatCurrency(amount) {
    return "$" + amount.toLocaleString("es-CR", {
      minimumFractionDigits:  2,
      maximumFractionDigits:  2,
    });
  }

  return {
    processImage:   processImage,
    formatCurrency: formatCurrency,
  };

})();

// ─────────────────────────────────────────────
// ESTADO DEL MÓDULO DE UI
// ─────────────────────────────────────────────

var _capturedFile    = null;  // Archivo de imagen en memoria
var _extractedData   = null;  // Datos extraídos por el mock OCR

// ─────────────────────────────────────────────
// UTILIDADES DE DOM
// ─────────────────────────────────────────────

function $(id) { return document.getElementById(id); }

/**
 * Transiciona entre fases de la UI mostrando/ocultando secciones.
 * @param {string} phase - "capture" | "processing" | "result"
 */
function showPhase(phase) {
  var phases = ["phase-capture", "phase-processing", "phase-result"];
  phases.forEach(function (p) {
    var el = $(p);
    if (el) el.hidden = (p !== "phase-" + phase);
  });
}

// ─────────────────────────────────────────────
// MANEJO DE IMAGEN
// ─────────────────────────────────────────────

/**
 * Muestra el preview de la imagen seleccionada.
 * @param {File} file
 */
function renderImagePreview(file) {
  var preview = $("image-preview");
  var placeholder = $("capture-placeholder");
  var confirmBtn  = $("btn-confirm-scan");

  if (!preview) return;

  var url = URL.createObjectURL(file);
  preview.src     = url;
  preview.hidden  = false;
  if (placeholder)  placeholder.hidden = true;
  if (confirmBtn)   confirmBtn.disabled = false;
  confirmBtn && confirmBtn.classList.remove("opacity-50", "cursor-not-allowed");
}

/**
 * Handler cuando el usuario selecciona un archivo.
 */
function handleFileSelected(event) {
  var file = event.target.files && event.target.files[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    alert("Por favor selecciona una imagen válida (JPG, PNG, HEIC…)");
    return;
  }
  _capturedFile = file;
  renderImagePreview(file);
}

// ─────────────────────────────────────────────
// PROCESAMIENTO Y RENDER DE RESULTADOS
// ─────────────────────────────────────────────

/**
 * Inicia el flujo de procesamiento:
 *   1. Muestra la fase "processing".
 *   2. Llama al ScannerService (mock o real).
 *   3. Guarda el resultado y muestra la fase "result".
 */
async function startProcessing() {
  showPhase("processing");

  try {
    _extractedData = await ScannerService.processImage(_capturedFile);
    renderResult(_extractedData);
    showPhase("result");
  } catch (err) {
    console.error("Error al procesar la factura:", err);
    alert("Ocurrió un error al procesar la imagen. Intenta nuevamente.");
    showPhase("capture");
  }
}

/**
 * Construye y muestra el HTML con los datos extraídos.
 * @param {Object} data
 */
function renderResult(data) {
  var fmt = ScannerService.formatCurrency;

  // ── Encabezado ──
  var elComercio = $("result-comercio");
  var elFecha    = $("result-fecha");
  var elNumero   = $("result-numero");
  if (elComercio) elComercio.textContent = data.comercio;
  if (elFecha)    elFecha.textContent    = formatDate(data.fecha);
  if (elNumero)   elNumero.textContent   = data.numeroFactura;

  // ── Tabla de productos ──
  var tbody = $("result-productos");
  if (tbody) {
    tbody.innerHTML = data.productos.map(function (p) {
      return [
        '<tr class="border-b border-outline-variant">',
        '  <td class="py-2 pr-2 text-body-md text-on-surface">'   + p.nombre + '</td>',
        '  <td class="py-2 px-2 text-body-md text-center text-on-surface-variant">' + p.cantidad + '</td>',
        '  <td class="py-2 px-2 text-body-md text-right text-on-surface-variant">' + fmt(p.precioUnit) + '</td>',
        '  <td class="py-2 pl-2 text-body-md text-right font-semibold text-on-surface">' + fmt(p.subtotal) + '</td>',
        '</tr>',
      ].join("");
    }).join("");
  }

  // ── Totales ──
  var elSubtotal  = $("result-subtotal");
  var elImpuesto  = $("result-impuesto");
  var elTotal     = $("result-total");
  if (elSubtotal)  elSubtotal.textContent  = fmt(data.subtotal);
  if (elImpuesto)  elImpuesto.textContent  = fmt(data.impuesto);
  if (elTotal)     elTotal.textContent     = fmt(data.total);
}

/**
 * Formatea una fecha ISO a formato legible en español.
 * @param {string} isoDate
 * @returns {string}
 */
function formatDate(isoDate) {
  try {
    var d = new Date(isoDate + "T12:00:00");
    return d.toLocaleDateString("es-CR", { year: "numeric", month: "long", day: "numeric" });
  } catch (e) {
    return isoDate;
  }
}

// ─────────────────────────────────────────────
// HANDLERS DE EVENTOS
// ─────────────────────────────────────────────

/** Guarda la factura extraída y regresa al dashboard. */
function handleSaveInvoice() {
  if (!_extractedData) return;
  // TODO (producción): POST /api/invoices con _extractedData
  console.log("Guardando factura:", _extractedData);

  // Redirige al dashboard con parámetro de éxito para mostrar feedback
  window.location.href = "index.html?scanned=1";
}

/** Reinicia el flujo para escanear otra factura. */
function handleScanAgain() {
  _capturedFile  = null;
  _extractedData = null;

  var preview = $("image-preview");
  var placeholder = $("capture-placeholder");
  var confirmBtn  = $("btn-confirm-scan");
  var fileInput   = $("file-input");

  if (preview)     { preview.src = ""; preview.hidden = true; }
  if (placeholder) placeholder.hidden = false;
  if (confirmBtn)  { confirmBtn.disabled = true; confirmBtn.classList.add("opacity-50", "cursor-not-allowed"); }
  if (fileInput)   fileInput.value = "";

  showPhase("capture");
}

/** Regresa al dashboard sin guardar. */
function handleGoBack() {
  window.location.href = "index.html";
}

// ─────────────────────────────────────────────
// INICIALIZACIÓN
// ─────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", function () {

  // Botón regresar
  var btnBack = $("btn-back");
  if (btnBack) btnBack.addEventListener("click", handleGoBack);

  // Input de archivo
  var fileInput = $("file-input");
  if (fileInput) fileInput.addEventListener("change", handleFileSelected);

  // Botón "Seleccionar imagen" — dispara el input oculto
  var btnSelect = $("btn-select-file");
  if (btnSelect) btnSelect.addEventListener("click", function () {
    fileInput && fileInput.click();
  });

  // Botón "Confirmar y procesar"
  var btnConfirm = $("btn-confirm-scan");
  if (btnConfirm) btnConfirm.addEventListener("click", startProcessing);

  // Botón "Guardar factura"
  var btnSave = $("btn-save-invoice");
  if (btnSave) btnSave.addEventListener("click", handleSaveInvoice);

  // Botón "Escanear otra"
  var btnAgain = $("btn-scan-again");
  if (btnAgain) btnAgain.addEventListener("click", handleScanAgain);

  // Fade in
  document.body.style.opacity    = "0";
  document.body.style.transition = "opacity 0.3s ease-out";
  requestAnimationFrame(function () {
    document.body.style.opacity = "1";
  });

  // Arrancar en fase de captura
  showPhase("capture");
});
