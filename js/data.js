/**
 * FacturaAI — data.js
 * ─────────────────────────────────────────────────────────────────
 * CAPA DE DATOS MOCK
 *
 * Los datos privados están encapsulados en un IIFE para evitar
 * colisiones de nombres en el scope global.
 * Solo `DataService` se expone en `window`.
 *
 * CÓMO MIGRAR A UNA API REAL:
 *   Reemplaza el cuerpo de cada método con un fetch() real.
 *   app.js no necesita ningún cambio.
 *
 *   Ejemplo:
 *     getKPIs() {
 *       return fetch('/api/inventory/kpis').then(r => r.json());
 *     }
 * ─────────────────────────────────────────────────────────────────
 */

window.DataService = (function () {

  // ── Configuración global ──────────────────
  // Endpoint futuro: GET /api/settings
  var config = {
    businessName:         "Mi Negocio",
    currency:             "$",
    stockResetDays:       30,
    warningThresholdDays: 7,
  };

  // ── KPIs del inventario ───────────────────
  // Endpoint futuro: GET /api/inventory/kpis
  var kpis = {
    ok:        { count: 142, label: "En buen estado",      trend: "+3 esta semana"       },
    warning:   { count: 18,  label: "Pedir pronto",        trend: "↑ 4 vs semana pasada" },
    urgent:    { count: 5,   label: "Sin stock / Urgente", trend: "↑ 2 vs ayer"          },
    overstock: { count: 12,  label: "Sobrestock",          trend: "Sin cambios"           },
    slow:      { count: 31,  label: "Baja rotación",       trend: "↓ 2 esta semana"      },
  };

  // ── Facturas recientes ────────────────────
  // Endpoint futuro: GET /api/invoices?limit=3&sort=date_desc
  var invoices = [
    { id: "78291", supplier: "Distribuidora Central", date: "Hoy, 10:45 AM",  amount: 1240.00, status: "processed" },
    { id: "78250", supplier: "Lácteos del Sur",       date: "Ayer, 04:20 PM", amount: 450.50,  status: "processed" },
    { id: "78112", supplier: "Papelería Global",      date: "12 Oct",         amount: 85.00,   status: "processed" },
  ];

  // ── Productos del inventario ──────────────
  // Endpoint futuro: GET /api/inventory/products
  var products = [
    { id: 1, name: "Arroz Blanco 1kg",      category: "Granos",    stock: 240, unit: "unidades", daysLeft: 22, rotationSpeed: 11,  status: "ok"        },
    { id: 2, name: "Aceite Vegetal 1L",     category: "Abarrotes", stock: 40,  unit: "botellas", daysLeft: 4,  rotationSpeed: 10,  status: "warning"   },
    { id: 3, name: "Frijoles Negros 500g",  category: "Granos",    stock: 0,   unit: "bolsas",   daysLeft: 0,  rotationSpeed: 9,   status: "urgent"    },
    { id: 4, name: "Detergente Líquido 2L", category: "Limpieza",  stock: 180, unit: "galones",  daysLeft: 90, rotationSpeed: 2,   status: "overstock" },
    { id: 5, name: "Papel Higiénico x12",   category: "Higiene",   stock: 95,  unit: "paquetes", daysLeft: 60, rotationSpeed: 1.5, status: "slow"      },
    { id: 6, name: "Leche Entera 1L",       category: "Lácteos",   stock: 60,  unit: "cajas",    daysLeft: 5,  rotationSpeed: 12,  status: "warning"   },
    { id: 7, name: "Azúcar Blanca 2kg",     category: "Granos",    stock: 310, unit: "bolsas",   daysLeft: 30, rotationSpeed: 10,  status: "ok"        },
    { id: 8, name: "Jabón de Baño x3",      category: "Higiene",   stock: 0,   unit: "paquetes", daysLeft: 0,  rotationSpeed: 6,   status: "urgent"    },
  ];

  // ── Configuración visual del semáforo ─────
  // No varía con el backend — es config de UI, no de datos
  var statusConfig = {
    ok:        { label: "OK",         dotClass: "status-dot--ok",        badgeClass: "badge--ok",        text: "Bien"          },
    warning:   { label: "Alerta",     dotClass: "status-dot--warning",   badgeClass: "badge--warning",   text: "Pedir pronto"  },
    urgent:    { label: "Urgente",    dotClass: "status-dot--urgent",    badgeClass: "badge--urgent",    text: "Sin stock"     },
    overstock: { label: "Sobrestock", dotClass: "status-dot--overstock", badgeClass: "badge--overstock", text: "Excedente"     },
    slow:      { label: "Lento",      dotClass: "status-dot--slow",      badgeClass: "badge--slow",      text: "Baja rotación" },
  };

  // ── Interfaz pública (DataService) ────────
  return {

    /** GET /api/settings — Configuración del negocio */
    getConfig: function () {
      return Promise.resolve(Object.assign({}, config));
    },

    /** GET /api/inventory/kpis — KPIs del inventario */
    getKPIs: function () {
      return Promise.resolve(Object.assign({}, kpis));
    },

    /**
     * GET /api/invoices — Facturas recientes
     * @param {number} [limit]
     */
    getRecentInvoices: function (limit) {
      var result = limit ? invoices.slice(0, limit) : invoices.slice();
      return Promise.resolve(result);
    },

    /**
     * GET /api/inventory/products — Productos con filtro opcional
     * @param {string|null} [status]
     */
    getProducts: function (status) {
      var result = status
        ? products.filter(function (p) { return p.status === status; })
        : products.slice();
      return Promise.resolve(result);
    },

    /**
     * Configuración visual de un estado del semáforo (no requiere API)
     * @param {string} status
     */
    getStatusConfig: function (status) {
      return statusConfig[status] || statusConfig.ok;
    },

  };

})();
