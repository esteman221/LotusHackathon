/**
 * FacturaAI — data.js
 * Capa de datos conectada a FastAPI.
 */

window.DataService = (function () {
  const API_BASE_URL = "http://localhost:8000";

  const config = {
    businessName: "Mi Negocio",
    currency: "₡",
    stockResetDays: 30,
    warningThresholdDays: 7,
  };

  const statusConfig = {
    ok: {
      label: "OK",
      dotClass: "status-dot--ok",
      badgeClass: "badge--ok",
      text: "Bien",
    },
    warning: {
      label: "Alerta",
      dotClass: "status-dot--warning",
      badgeClass: "badge--warning",
      text: "Pedir pronto",
    },
    urgent: {
      label: "Urgente",
      dotClass: "status-dot--urgent",
      badgeClass: "badge--urgent",
      text: "Urgente",
    },
    overstock: {
      label: "Sobrestock",
      dotClass: "status-dot--overstock",
      badgeClass: "badge--overstock",
      text: "Excedente",
    },
    slow: {
      label: "Lento",
      dotClass: "status-dot--slow",
      badgeClass: "badge--slow",
      text: "Baja rotación",
    },
  };

  async function request(path, options = {}) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      ...options,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "Error al comunicarse con el backend");
    }

    return response.json();
  }

  function mapTrafficLightToFrontendStatus(status) {
    const normalized = String(status || "").toUpperCase();

    const map = {
      VERDE: "ok",
      AMARILLO: "warning",
      ROJO: "urgent",
      NEGRO: "overstock",
      GRIS: "slow",
    };

    return map[normalized] || "slow";
  }

  function mapInventoryItem(item) {
    const status = mapTrafficLightToFrontendStatus(item.traffic_light_status);

    return {
      id: item.product_id,
      name: item.product,
      category: item.supplier || "Sin proveedor",
      stock: Number(item.current_stock || 0),
      unit: item.unit || "unidades",
      daysLeft: item.remaining_days === null ? null : Number(item.remaining_days),
      rotationSpeed: Number(item.rotation_speed || 0),
      status,
    };
  }

  async function getTrafficLightItems() {
    const data = await request("/inventory/traffic-light");
    return data.items.map(mapInventoryItem);
  }

  function buildKPIsFromProducts(products) {
    const base = {
      ok: {
        count: 0,
        label: "En buen estado",
        trend: "Productos con stock suficiente",
      },
      warning: {
        count: 0,
        label: "Pedir pronto",
        trend: "Productos dentro del umbral de reorden",
      },
      urgent: {
        count: 0,
        label: "Urgente",
        trend: "Productos con riesgo de agotamiento",
      },
      overstock: {
        count: 0,
        label: "Sobrestock",
        trend: "Productos con rotación muy lenta",
      },
      slow: {
        count: 0,
        label: "Baja rotación",
        trend: "Productos sin historial suficiente",
      },
    };

    products.forEach((product) => {
      if (base[product.status]) {
        base[product.status].count += 1;
      }
    });

    return base;
  }

  return {
    getConfig: function () {
      return Promise.resolve({ ...config });
    },

    getKPIs: async function () {
      const products = await getTrafficLightItems();
      return buildKPIsFromProducts(products);
    },

    getRecentInvoices: async function (limit) {
      /**
       * Este endpoint todavía no existe en el backend.
       * Por ahora dejamos datos temporales para que la sección no se rompa.
       * Más adelante hacemos GET /invoices/recent.
       */
      const invoices = [
        {
          id: "API",
          supplier: "PostgreSQL conectado",
          date: "Ahora",
          amount: 0,
          status: "processed",
        },
      ];

      return limit ? invoices.slice(0, limit) : invoices;
    },

    getProducts: async function (status) {
      const products = await getTrafficLightItems();

      if (!status) {
        return products;
      }

      return products.filter((product) => product.status === status);
    },

    getStatusConfig: function (status) {
      return statusConfig[status] || statusConfig.slow;
    },
  };
})();