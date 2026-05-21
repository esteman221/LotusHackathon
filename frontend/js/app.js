/**
 * FacturaAI — app.js
 * ─────────────────────────────────────────────────────────────────
 * LÓGICA DE LA APLICACIÓN
 *
 * Este archivo no contiene ningún dato hardcodeado.
 * Toda la información se solicita a través de DataService (data.js).
 *
 * Dependencias:
 *   - data.js  → debe cargarse antes que este archivo en el HTML
 *
 * Para migrar a una API real: modifica únicamente data.js.
 * Este archivo no necesita cambios al hacer esa transición.
 * ─────────────────────────────────────────────────────────────────
 */

// ─────────────────────────────────────────────
// ESTADO INTERNO DEL MÓDULO
// ─────────────────────────────────────────────

/** Configuración activa cargada desde DataService. */
let _config = null;

// ─────────────────────────────────────────────
// UTILIDADES
// ─────────────────────────────────────────────

/**
 * Formatea un monto monetario usando la moneda de la configuración.
 * Requiere que _config esté cargado.
 * @param {number} amount
 * @returns {string}
 */
function formatCurrency(amount) {
  const symbol = _config?.currency ?? "$";
  return `${symbol}${amount.toLocaleString("es-CR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Devuelve el label legible para el estado de una factura.
 * @param {string} status
 * @returns {string}
 */
function getInvoiceStatusLabel(status) {
  const labels = {
    processed: "Procesado",
    pending:   "Pendiente",
    error:     "Error",
  };
  return labels[status] ?? status;
}

/**
 * Devuelve la clase CSS para el estado de una factura.
 * @param {string} status
 * @returns {string}
 */
function getInvoiceStatusClass(status) {
  const classes = {
    processed: "invoice-status--processed",
    pending:   "invoice-status--pending",
    error:     "invoice-status--error",
  };
  return classes[status] ?? "";
}

// ─────────────────────────────────────────────
// BUILDERS DE HTML
// ─────────────────────────────────────────────

/**
 * Construye el HTML de un item de factura reciente.
 * @param {Object} invoice
 * @returns {string}
 */
function buildInvoiceItemHTML(invoice) {
  return `
    <div class="activity-item" data-invoice-id="${invoice.id}">
      <div class="activity-item__left">
        <div class="activity-item__icon">
          <span class="material-symbols-outlined">receipt_long</span>
        </div>
        <div class="activity-item__info">
          <p class="activity-item__title">Factura #${invoice.id}</p>
          <p class="activity-item__meta">${invoice.date} • ${invoice.supplier}</p>
        </div>
      </div>
      <div class="activity-item__right">
        <p class="activity-item__amount">+${formatCurrency(invoice.amount)}</p>
        <span class="invoice-status ${getInvoiceStatusClass(invoice.status)}">
          ${getInvoiceStatusLabel(invoice.status)}
        </span>
      </div>
    </div>
  `;
}

/**
 * Construye el HTML de una fila de producto en la tabla de inventario.
 * @param {Object} product
 * @returns {string}
 */
function buildProductRowHTML(product) {
  const statusConf = DataService.getStatusConfig(product.status);
  const daysText   = product.status === "urgent"
    ? "Agotado"
    : product.daysLeft
      ? `${product.daysLeft} días`
      : "—";

  return `
    <div class="product-row" data-product-id="${product.id}" data-status="${product.status}">
      <div class="product-row__info">
        <span class="status-dot ${statusConf.dotClass}"></span>
        <div>
          <p class="product-row__name">${product.name}</p>
          <p class="product-row__category">${product.category}</p>
        </div>
      </div>
      <div class="product-row__stock">
        <p class="product-row__stock-value">${product.stock}</p>
        <p class="product-row__stock-unit">${product.unit}</p>
      </div>
      <div class="product-row__days">${daysText}</div>
      <span class="badge ${statusConf.badgeClass}">${statusConf.text}</span>
    </div>
  `;
}

// ─────────────────────────────────────────────
// FUNCIONES DE RENDER
// ─────────────────────────────────────────────

/**
 * Rellena los KPI cards del dashboard con datos de DataService.
 */
async function renderKPIs() {
  const grid = document.getElementById("kpi-grid");
  if (!grid) return;

  const kpis = await DataService.getKPIs();

  Object.entries(kpis).forEach(([key, data]) => {
    const countEl = grid.querySelector(`[data-kpi="${key}"] .kpi-count`);
    const trendEl = grid.querySelector(`[data-kpi="${key}"] .kpi-trend`);
    if (countEl) countEl.textContent = data.count;
    if (trendEl) trendEl.textContent = data.trend;
  });
}

/**
 * Rellena la lista de facturas recientes con datos de DataService.
 */
async function renderRecentInvoices() {
  const container = document.getElementById("recent-invoices");
  if (!container) return;

  const invoices = await DataService.getRecentInvoices(3);
  container.innerHTML = invoices.map(buildInvoiceItemHTML).join("");

  container.querySelectorAll(".activity-item").forEach((item) => {
    item.addEventListener("click", () => handleInvoiceClick(item.dataset.invoiceId));
  });
}

/**
 * Rellena la tabla de inventario con datos de DataService.
 * @param {string|null} filterStatus - Estado para filtrar. null = todos.
 */
async function renderInventory(filterStatus = null) {
  const container = document.getElementById("inventory-list");
  if (!container) return;

  const products = await DataService.getProducts(filterStatus);

  if (products.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="material-symbols-outlined">inventory_2</span>
        <p>No hay productos en esta categoría.</p>
      </div>`;
    return;
  }

  container.innerHTML = products.map(buildProductRowHTML).join("");
}

// ─────────────────────────────────────────────
// FILTROS DE INVENTARIO
// ─────────────────────────────────────────────

/**
 * Inicializa los botones de filtro del inventario.
 * Al hacer clic, re-renderiza la lista con el filtro seleccionado.
 */
function initInventoryFilters() {
  const filterBar = document.getElementById("inventory-filters");
  if (!filterBar) return;

  filterBar.querySelectorAll("[data-filter]").forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBar
        .querySelectorAll("[data-filter]")
        .forEach((b) => b.classList.remove("filter-btn--active"));
      btn.classList.add("filter-btn--active");

      const status = btn.dataset.filter === "all" ? null : btn.dataset.filter;
      renderInventory(status);
    });
  });
}

// ─────────────────────────────────────────────
// HANDLERS DE EVENTOS
// ─────────────────────────────────────────────

/**
 * Manejador del botón "Escanear Factura".
 * TODO (producción): abrir cámara / selector de archivo y llamar a la API de OCR.
 */
function handleScanInvoice() {
  window.location.href = "scanner.html";
}

/**
 * Manejador de clic en un item de factura.
 * TODO (producción): navegar a la vista de detalle.
 * @param {string} invoiceId
 */
function handleInvoiceClick(invoiceId) {
  console.log(`Ver detalle de factura #${invoiceId}`);
}

/**
 * Manejador del botón "Ver todo" en actividad reciente.
 * TODO (producción): navegar a la lista completa de facturas.
 */
function handleViewAllInvoices() {
  console.log("Navegar a lista completa de facturas");
}

// ─────────────────────────────────────────────
// MICRO-INTERACCIONES Y ANIMACIONES
// ─────────────────────────────────────────────

/**
 * Aplica efecto táctil de retroalimentación a elementos interactivos.
 */
function initTouchFeedback() {
  document.querySelectorAll("button, a, .activity-item, .product-row").forEach((el) => {
    el.addEventListener("touchstart", () => el.classList.add("opacity-80"),    { passive: true });
    el.addEventListener("touchend",   () => el.classList.remove("opacity-80"), { passive: true });
  });
}

/**
 * Animación de fade-in al cargar la página.
 */
function initPageFadeIn() {
  document.body.style.opacity    = "0";
  document.body.style.transition = "opacity 0.4s ease-out";
  requestAnimationFrame(() => {
    document.body.style.opacity = "1";
  });
}

// ─────────────────────────────────────────────
// INICIALIZACIÓN PRINCIPAL
// ─────────────────────────────────────────────

/**
 * Punto de entrada de la aplicación.
 *
 * Flujo:
 *   1. Carga la configuración global desde DataService.
 *   2. Renderiza todos los componentes con sus datos.
 *   3. Inicializa interacciones y animaciones.
 *
 * Para migrar a una API real: solo modifica data.js.
 * Este archivo no necesita cambios.
 */
async function init() {
  // 1. Cargar configuración antes de cualquier render
  _config = await DataService.getConfig();

  // 2. Render de componentes (en paralelo donde sea posible)
  await Promise.all([
    renderKPIs(),
    renderRecentInvoices(),
    renderInventory(),
  ]);

  // 3. Interacciones
  initInventoryFilters();

  const scanBtn    = document.getElementById("btn-scan-invoice");
  const viewAllBtn = document.getElementById("btn-view-all-invoices");
  if (scanBtn)    scanBtn.addEventListener("click", handleScanInvoice);
  if (viewAllBtn) viewAllBtn.addEventListener("click", handleViewAllInvoices);

  // 4. UX
  initTouchFeedback();
  initPageFadeIn();
}

document.addEventListener("DOMContentLoaded", init);
