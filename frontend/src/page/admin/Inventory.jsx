import { useContext, useEffect, useState, useMemo } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  Plus,
  Search,
  Edit2,
  PackagePlus,
  History,
  X,
  Trash2,
} from "lucide-react";
import { UserContext } from "../../context/UserContext";

const money = (v) =>
  new Intl.NumberFormat("en-ET", {
    style: "currency",
    currency: "ETB",
    maximumFractionDigits: 0,
  }).format(Number(v || 0));

const empty_form = {
  name: "",
  category: "",
  sku: "",
  description: "",
  costPrice: "",
  sellingPrice: "",
  initialStock: "",
};

const Toggle = ({ checked, onChange, disabled }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={onChange}
    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${checked ? "bg-green-500" : "bg-gray-300"}`}
  >
    <span
      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ${checked ? "translate-x-4" : "translate-x-0"}`}
    />
  </button>
);

const ProductModal = ({ product, onClose, onSave, is_saving }) => {
  const [form, set_form] = useState(
    product
      ? {
          name: product.name,
          category: product.category,
          sku: product.sku,
          description: product.description || "",
          costPrice: product.costPrice,
          sellingPrice: product.sellingPrice,
          initialStock: product.currentStock,
        }
      : empty_form,
  );

  const set = (k, v) => set_form((f) => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-bold text-gray-900">
            {product ? "Edit Product" : "Add Product"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg"
          >
            <X size={18} />
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave(form);
          }}
          className="p-5 space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name *
              </label>
              <input
                required
                value={form.name}
                onChange={(e) => {
                  const value = e.target.value;
                  const cleanedValue = value.replace(/[^a-zA-Z\s]/g, "");
                  const formattedValue = cleanedValue.replace(/\b\w/g, (char) =>
                    char.toUpperCase(),
                  );

                  set("name", formattedValue);
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <input
                required
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SKU *
              </label>
              <input
                required
                value={form.sku}
                onChange={(e) => set("sku", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-900"
                disabled={!!product}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cost Price (ETB) *
              </label>
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={form.costPrice}
                onChange={(e) => set("costPrice", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Selling Price (ETB) *
              </label>
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={form.sellingPrice}
                onChange={(e) => set("sellingPrice", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-900"
              />
            </div>
            {!product && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Initial Stock
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.initialStock}
                  onChange={(e) => set("initialStock", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-900"
                />
              </div>
            )}
            <div className={product ? "col-span-2" : ""}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <input
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-900"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 rounded-lg py-2 text-sm font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={is_saving}
              className="flex-1 bg-gray-900 text-white rounded-lg py-2 text-sm font-medium hover:bg-gray-700 disabled:bg-gray-400"
            >
              {is_saving ? "Saving..." : product ? "Update" : "Add Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const StockInModal = ({ product, onClose, onSave, is_saving }) => {
  const [qty, set_qty] = useState("");
  const [notes, set_notes] = useState("");

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-bold text-gray-900">Stock In — {product.name}</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg"
          >
            <X size={18} />
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!qty || parseInt(qty) <= 0)
              return toast.error("enter a valid quantity");
            onSave({ quantity: parseInt(qty), notes });
          }}
          className="p-5 space-y-4"
        >
          <p className="text-sm text-gray-500">
            Current stock:{" "}
            <span className="font-semibold text-gray-900">
              {product.currentStock}
            </span>
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity to Add *
            </label>
            <input
              required
              type="number"
              min="1"
              value={qty}
              onChange={(e) => set_qty(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <input
              value={notes}
              onChange={(e) => set_notes(e.target.value)}
              placeholder="e.g. Supplier delivery"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-900"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 rounded-lg py-2 text-sm font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={is_saving}
              className="flex-1 bg-green-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-green-700 disabled:bg-gray-400"
            >
              {is_saving ? "Adding..." : "Add Stock"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const HistoryModal = ({ product, history, onClose }) => (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl max-h-[80vh] flex flex-col">
      <div className="flex items-center justify-between p-5 border-b">
        <h2 className="font-bold text-gray-900">
          Stock History — {product.name}
        </h2>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-gray-100 rounded-lg"
        >
          <X size={18} />
        </button>
      </div>
      <div className="overflow-y-auto flex-1 p-5">
        {history.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No history</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 border-b">
                <th className="text-left py-2">Type</th>
                <th className="text-right py-2">Qty</th>
                <th className="text-right py-2">Before</th>
                <th className="text-right py-2">After</th>
                <th className="text-left py-2 pl-3">Notes</th>
                <th className="text-right py-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.id} className="border-b last:border-0">
                  <td className="py-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${h.transactionType === "stock_in" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                    >
                      {h.transactionType === "stock_in" ? "IN" : "OUT"}
                    </span>
                  </td>
                  <td className="py-2 text-right font-medium">{h.quantity}</td>
                  <td className="py-2 text-right text-gray-500">
                    {h.previousStock}
                  </td>
                  <td className="py-2 text-right font-semibold">
                    {h.currentStock}
                  </td>
                  <td className="py-2 pl-3 text-gray-500 text-xs">
                    {h.notes || "-"}
                  </td>
                  <td className="py-2 text-right text-xs text-gray-400">
                    {new Date(h.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  </div>
);

const Inventory = () => {
  const { backendUrl, token, role } = useContext(UserContext);
  const headers = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token],
  );

  const [products, set_products] = useState([]);
  const [loading, set_loading] = useState(true);
  const [search, set_search] = useState("");
  const [cat_filter, set_cat_filter] = useState("all");
  const [status_filter, set_status_filter] = useState("all");
  const [categories, set_categories] = useState([]);
  const [show_modal, set_show_modal] = useState(false);
  const [edit_prod, set_edit_prod] = useState(null);
  const [stock_in_prod, set_stock_in_prod] = useState(null);
  const [hist_prod, set_hist_prod] = useState(null);
  const [history, set_history] = useState([]);
  const [is_saving, set_is_saving] = useState(false);
  const [toggling_id, set_toggling_id] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const productPerPage = 10;

  const can_manage = ["admin", "manager"].includes(role);

  const load_products = async () => {
    try {
      set_loading(true);
      const params = can_manage ? { isActive: "all" } : { isActive: "true" };
      const res = await axios.get(`${backendUrl}/api/products`, {
        params,
        headers,
      });
      set_products(res.data.products || []);
    } catch {
      toast.error("failed to load products");
    } finally {
      set_loading(false);
    }
  };

  const load_cats = async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/products/categories`, {
        headers,
      });
      set_categories(res.data.categories || []);
    } catch {}
  };

  useEffect(() => {
    load_products();
    load_cats();
  }, [backendUrl]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter((p) => {
      const match_cat = cat_filter === "all" || p.category === cat_filter;
      const match_status =
        status_filter === "all" ||
        (status_filter === "active" && p.isActive) ||
        (status_filter === "inactive" && !p.isActive);
      const match_search =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);
      return match_cat && match_status && match_search;
    });
  }, [products, search, cat_filter, status_filter]);

  const save_product = async (form) => {
    try {
      set_is_saving(true);
      if (edit_prod) {
        const res = await axios.put(
          `${backendUrl}/api/products/${edit_prod.id}`,
          form,
          { headers },
        );
        set_products((prev) =>
          prev.map((p) => (p.id === edit_prod.id ? res.data.product : p)),
        );
        toast.success("product updated");
      } else {
        const res = await axios.post(`${backendUrl}/api/products`, form, {
          headers,
        });
        set_products((prev) => [res.data.product, ...prev]);
        toast.success("product added");
      }
      set_show_modal(false);
      set_edit_prod(null);
      load_cats();
    } catch (e) {
      toast.error(e.response?.data?.message || "failed to save product");
    } finally {
      set_is_saving(false);
    }
  };

  const delete_product = async (prod) => {
    if (
      !window.confirm(
        `Delete "${prod.name}" permanently? This cannot be undone.`,
      )
    )
      return;
    try {
      await axios.delete(`${backendUrl}/api/products/${prod.id}`, { headers });
      set_products((prev) => prev.filter((p) => p.id !== prod.id));
      toast.success("product deleted");
    } catch (e) {
      toast.error(e.response?.data?.message || "failed to delete");
    }
  };

  const toggle_active = async (prod) => {
    try {
      set_toggling_id(prod.id);
      const res = await axios.patch(
        `${backendUrl}/api/products/${prod.id}/toggle-active`,
        {},
        { headers },
      );
      set_products((prev) =>
        prev.map((p) => (p.id === prod.id ? res.data.product : p)),
      );
      toast.success(res.data.message);
    } catch (e) {
      toast.error(e.response?.data?.message || "failed to update status");
    } finally {
      set_toggling_id(null);
    }
  };

  const open_history = async (prod) => {
    set_hist_prod(prod);
    try {
      const res = await axios.get(
        `${backendUrl}/api/products/${prod.id}/history`,
        { headers },
      );
      set_history(res.data.transactions || []);
    } catch {
      set_history([]);
    }
  };

  const stock_status = (p) => {
    if (!p.isActive)
      return { label: "Inactive", cls: "bg-gray-100 text-gray-500" };
    if (p.currentStock === 0)
      return { label: "Out of Stock", cls: "bg-red-100 text-red-700" };
    if (p.currentStock <= 10)
      return { label: "Low Stock", cls: "bg-yellow-100 text-yellow-700" };
    return { label: "In Stock", cls: "bg-green-100 text-green-700" };
  };

  const active_count = products.filter((p) => p.isActive).length;
  const inactive_count = products.filter((p) => !p.isActive).length;
  const low_count = products.filter(
    (p) => p.isActive && p.currentStock > 0 && p.currentStock <= 10,
  ).length;

  const indexOfLastProduct = currentPage * productPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productPerPage;

  const paginatedProduct = filtered.slice(
    indexOfFirstProduct,
    indexOfLastProduct,
  );

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage products and stock levels
          </p>
        </div>
        {can_manage && (
          <button
            onClick={() => {
              set_edit_prod(null);
              set_show_modal(true);
            }}
            className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700"
          >
            <Plus size={16} /> Add Product
          </button>
        )}
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Products", value: products.length },
          { label: "Active", value: active_count },
          { label: "Inactive", value: inactive_count },
          { label: "Low Stock", value: low_count },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-xl border border-gray-200 p-4"
          >
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={search}
            onChange={(e) => set_search(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-gray-900"
          />
        </div>
        <select
          value={cat_filter}
          onChange={(e) => set_cat_filter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-900"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        {can_manage && (
          <select
            value={status_filter}
            onChange={(e) => set_status_filter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-900"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-sm text-gray-400">
            Loading products...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {[
                    "Product",
                    "SKU",
                    "Category",
                    "Stock",
                    "Cost Price",
                    "Selling Price",
                    "Stock Status",
                    ...(can_manage ? ["Active"] : []),
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={can_manage ? 9 : 8}
                      className="text-center py-10 text-gray-400"
                    >
                      No products found
                    </td>
                  </tr>
                ) : (
                  paginatedProduct.map((p) => {
                    const { label, cls } = stock_status(p);
                    return (
                      <tr
                        key={p.id}
                        className={`border-b border-gray-100 hover:bg-gray-50 ${!p.isActive ? "opacity-60" : ""}`}
                      >
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {p.name}
                        </td>
                        <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                          {p.sku}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {p.category}
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-900">
                          {p.currentStock}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {money(p.costPrice)}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {money(p.sellingPrice)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}
                          >
                            {label}
                          </span>
                        </td>
                        {can_manage && (
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Toggle
                                checked={p.isActive}
                                onChange={() => toggle_active(p)}
                                disabled={toggling_id === p.id}
                              />
                              <span
                                className={`text-xs font-medium ${p.isActive ? "text-green-600" : "text-gray-400"}`}
                              >
                                {toggling_id === p.id
                                  ? "..."
                                  : p.isActive
                                    ? "Active"
                                    : "Inactive"}
                              </span>
                            </div>
                          </td>
                        )}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {can_manage && (
                              <>
                                <button
                                  onClick={() => {
                                    set_edit_prod(p);
                                    set_show_modal(true);
                                  }}
                                  className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-900"
                                  title="Edit"
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  onClick={() => set_stock_in_prod(p)}
                                  disabled={!p.isActive}
                                  className="p-1.5 hover:bg-green-50 rounded-lg text-green-600 disabled:opacity-40 disabled:cursor-not-allowed"
                                  title="Stock In"
                                >
                                  <PackagePlus size={14} />
                                </button>
                                <button
                                  onClick={() => delete_product(p)}
                                  className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"
                                  title="Delete"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => open_history(p)}
                              className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-500"
                              title="Stock History"
                            >
                              <History size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {show_modal && (
        <ProductModal
          product={edit_prod}
          onClose={() => {
            set_show_modal(false);
            set_edit_prod(null);
          }}
          onSave={save_product}
          is_saving={is_saving}
        />
      )}
      {stock_in_prod && (
        <StockInModal
          product={stock_in_prod}
          onClose={() => set_stock_in_prod(null)}
          onSave={async (data) => {
            try {
              set_is_saving(true);
              const res = await axios.post(
                `${backendUrl}/api/products/${stock_in_prod.id}/stock-in`,
                data,
                { headers },
              );
              set_products((prev) =>
                prev.map((p) =>
                  p.id === stock_in_prod.id ? res.data.product : p,
                ),
              );
              toast.success("stock added");
              set_stock_in_prod(null);
            } catch (e) {
              toast.error(e.response?.data?.message || "failed to add stock");
            } finally {
              set_is_saving(false);
            }
          }}
          is_saving={is_saving}
        />
      )}
      {hist_prod && (
        <HistoryModal
          product={hist_prod}
          history={history}
          onClose={() => {
            set_hist_prod(null);
            set_history([]);
          }}
        />
      )}

      {filtered.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white  rounded-2xl p-4 shadow border border-gray-200">
          <div className="text-sm text-gray-700  mb-4 sm:mb-0">
            Showing{" "}
            <span className="font-semibold text-gray-900 ">
              {indexOfFirstProduct + 1}
            </span>{" "}
            to{" "}
            <span className="font-semibold text-gray-900 ">
              {Math.min(indexOfLastProduct, filtered.length)}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-gray-900 ">
              {filtered.length}
            </span>{" "}
            devices
          </div>
          <div className="flex items-center space-x-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="inline-flex items-center px-3 py-2 border border-gray-300  rounded-lg text-sm font-medium text-gray-700  hover:bg-gray-50  disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg
                className="w-5 h-5 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Previous
            </button>
            <div className="flex items-center space-x-1">
              {Array.from(
                { length: Math.ceil(filtered.length / productPerPage) },
                (_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors min-w-10px ${
                      currentPage === i + 1
                        ? "bg-linear-to-r from-cyan-500 to-blue-600 text-white shadow-lg"
                        : "text-gray-700  hover:bg-gray-100"
                    }`}
                  >
                    {i + 1}
                  </button>
                ),
              )}
            </div>
            <button
              disabled={
                currentPage === Math.ceil(filtered.length / productPerPage)
              }
              onClick={() => setCurrentPage((p) => p + 1)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700  hover:bg-gray-50  disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <svg
                className="w-5 h-5 ml-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
