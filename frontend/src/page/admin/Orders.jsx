import { useContext, useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  Plus,
  Search,
  X,
  Trash2,
  CheckCircle,
  XCircle,
  Eye,
  RotateCcw,
  Undo2,
} from "lucide-react";
import { UserContext } from "../../context/UserContext";

const money = (v) =>
  new Intl.NumberFormat("en-ET", {
    style: "currency",
    currency: "ETB",
    maximumFractionDigits: 4,
  }).format(Number(v || 0));

const VAT_RATE = 15;

const calcItem = (item) => {
  const qty = parseFloat(item.quantity) || 0;
  const unitPrice = parseFloat(item.unitPrice) || 0;
  const disc = parseFloat(item.discountPercent) || 0;
  const sub = qty * unitPrice;
  const discAmt = sub * (disc / 100);
  const taxable = sub - discAmt;
  const vatAmt = taxable * (VAT_RATE / 100);
  return {
    subtotal: sub,
    discountAmount: discAmt,
    taxableAmount: taxable,
    vatAmount: vatAmt,
    lineTotal: taxable + vatAmt,
  };
};

const calcTotals = (items) =>
  items.reduce(
    (acc, item) => {
      const c = calcItem(item);
      return {
        subtotal: acc.subtotal + c.subtotal,
        discountAmount: acc.discountAmount + c.discountAmount,
        taxableAmount: acc.taxableAmount + c.taxableAmount,
        vatAmount: acc.vatAmount + c.vatAmount,
        totalAmount: acc.totalAmount + c.lineTotal,
      };
    },
    {
      subtotal: 0,
      discountAmount: 0,
      taxableAmount: 0,
      vatAmount: 0,
      totalAmount: 0,
    },
  );

const RejectModal = ({ sale, onClose, onReject, is_rejecting }) => {
  const [reason, set_reason] = useState("");

  const submit = (e) => {
    e.preventDefault();
    if (!reason.trim()) return toast.error("Please enter a rejection reason");
    onReject(sale.id, reason.trim());
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h2 className="font-bold text-gray-900">Reject Sale</h2>
            <p className="text-xs text-gray-400 mt-0.5">{sale.saleNumber}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg"
          >
            <X size={18} />
          </button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          <div className="bg-red-50 rounded-xl p-3 text-sm text-red-700">
            <p className="font-semibold">You are about to reject this sale</p>
            <p className="mt-0.5 text-xs">
              Customer: {sale.customerName || "Walk-in"} · Total:{" "}
              {money(sale.totalAmount)}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Rejection Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => set_reason(e.target.value)}
              rows={3}
              placeholder="Explain why this sale is being rejected..."
              className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-red-400 resize-none"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={is_rejecting || !reason.trim()}
              className="flex-1 bg-red-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-red-700 disabled:bg-gray-400"
            >
              {is_rejecting ? "Rejecting..." : "Reject Sale"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CreateSaleModal = ({ products, onClose, onSave, isSaving }) => {
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState([
    { productId: "", quantity: 1, unitPrice: "", discountPercent: 0 },
  ]);

  const addItem = () =>
    setItems((prev) => [
      ...prev,
      { productId: "", quantity: 1, unitPrice: "", discountPercent: 0 },
    ]);

  const removeItem = (i) =>
    setItems((prev) => prev.filter((_, idx) => idx !== i));

  const updateItem = (i, key, value) => {
    setItems((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [key]: value };
      if (key === "productId") {
        const p = products.find((p) => p.id === value);
        if (p) next[i].unitPrice = parseFloat(p.sellingPrice);
        else next[i].unitPrice = "";
      }
      return next;
    });
  };

  const totals = useMemo(() => calcTotals(items), [items]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    for (const item of items) {
      if (!item.productId) return toast.error("Select a product for all items");
      if (!item.quantity || parseFloat(item.quantity) <= 0)
        return toast.error("Quantity must be positive");
      const disc = parseFloat(item.discountPercent);
      if (isNaN(disc) || disc < 0 || disc > 100)
        return toast.error("Discount must be between 0 and 100%");
    }
    onSave({
      customerName,
      customerEmail,
      customerPhone,
      notes,
      items,
      vatRate: VAT_RATE,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-bold text-gray-900">Create New Sale</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg"
          >
            <X size={18} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-5 space-y-5"
        >
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Customer (Optional)
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <input
                value={customerName}
                onChange={(e) => {
                  const value = e.target.value;
                  const cleanedValue = value.replace(/[^a-zA-Z\s]/g, "");
                  const formattedValue = cleanedValue.replace(/\b\w/g, (char) =>
                    char.toUpperCase(),
                  );

                  setCustomerName(formattedValue);
                }}
                placeholder="Customer name"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-900"
              />
              <input
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="Email"
                type="email"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-900"
              />
              <input
                value={customerPhone}
                onChange={(e) => {
                  let value = e.target.value.replace(/\D/g, "");
                  if (value.length > 10) value = value.slice(0, 10);
                  setCustomerPhone(value);
                }}
                placeholder="Phone"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-900"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Items *</h3>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                <Plus size={14} /> Add Item
              </button>
            </div>
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-gray-500 px-1">
                <div className="col-span-4">Product</div>
                <div className="col-span-2">Qty</div>
                <div className="col-span-2">Unit Price</div>
                <div className="col-span-2">Discount %</div>
                <div className="col-span-1 text-right">Total</div>
                <div className="col-span-1" />
              </div>
              {items.map((item, i) => {
                const c = calcItem(item);
                return (
                  <div key={i} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-4">
                      <select
                        value={item.productId}
                        onChange={(e) =>
                          updateItem(i, "productId", e.target.value)
                        }
                        className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm outline-none focus:border-gray-900"
                      >
                        <option value="">Select product</option>
                        {products.map((p) => (
                          <option
                            key={p.id}
                            value={p.id}
                            disabled={p.currentStock === 0}
                          >
                            {p.name} (Stock: {p.currentStock})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(i, "quantity", e.target.value)
                        }
                        className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm outline-none focus:border-gray-900"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) =>
                          updateItem(i, "unitPrice", e.target.value)
                        }
                        className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm outline-none focus:border-gray-900"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={item.discountPercent}
                        onChange={(e) =>
                          updateItem(i, "discountPercent", e.target.value)
                        }
                        className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm outline-none focus:border-gray-900"
                      />
                    </div>
                    <div className="col-span-1 text-right text-xs font-semibold text-gray-900">
                      {money(c.lineTotal)}
                    </div>
                    <div className="col-span-1 flex justify-center">
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(i)}
                          className="p-1 hover:bg-red-50 rounded text-red-400 hover:text-red-600"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>{money(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Discount</span>
              <span className="text-red-600">
                -{money(totals.discountAmount)}
              </span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Taxable Amount</span>
              <span>{money(totals.taxableAmount)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>VAT ({VAT_RATE}%)</span>
              <span>{money(totals.vatAmount)}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 border-t pt-2">
              <span>Total</span>
              <span className="text-lg">{money(totals.totalAmount.toFixed(2))}</span>
            </div>
            {totals.totalAmount > 50000 && (
              <p className="text-xs text-orange-600 font-medium">
                ⚠ Total exceeds 50,000 ETB — requires manager approval
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-900 resize-none"
            />
          </div>
        </form>

        <div className="p-5 border-t flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border border-gray-300 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex-1 bg-gray-900 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-gray-700 disabled:bg-gray-400"
          >
            {isSaving ? "Processing..." : "Create Sale"}
          </button>
        </div>
      </div>
    </div>
  );
};

const SaleDetailModal = ({ sale, onClose }) => (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl max-h-[90vh] flex flex-col">
      <div className="flex items-center justify-between p-5 border-b">
        <div>
          <h2 className="font-bold text-gray-900">{sale.saleNumber}</h2>
          <p className="text-xs text-gray-400">
            {new Date(sale.createdAt).toLocaleString()}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-gray-100 rounded-lg"
        >
          <X size={18} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {sale.customerName && (
          <div className="bg-gray-50 rounded-lg p-3 text-sm">
            <p className="font-semibold text-gray-900">{sale.customerName}</p>
            {sale.customerEmail && (
              <p className="text-gray-500">{sale.customerEmail}</p>
            )}
            {sale.customerPhone && (
              <p className="text-gray-500">{sale.customerPhone}</p>
            )}
          </div>
        )}
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-500 border-b">
              <th className="text-left py-2">Product</th>
              <th className="text-right py-2">Qty</th>
              <th className="text-right py-2">Unit Price</th>
              <th className="text-right py-2">Discount</th>
              <th className="text-right py-2">Subtotal</th>
              <th className="text-right py-2">VAT</th>
              <th className="text-right py-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {(sale.items || []).map((item) => (
              <tr key={item.id} className="border-b last:border-0">
                <td className="py-2 font-medium">{item.productName}</td>
                <td className="py-2 text-right">{item.quantity}</td>
                <td className="py-2 text-right">{money(item.unitPrice)}</td>
                <td className="py-2 text-right text-red-600">
                  {item.discountPercent}%
                </td>
                <td className="py-2 text-right">{money(item.subtotal)}</td>
                <td className="py-2 text-right">{money(item.vatAmount)}</td>
                <td className="py-2 text-right font-semibold">
                  {money(item.lineTotal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="bg-gray-50 rounded-lg p-4 space-y-1.5 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>{money(sale.subtotal)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Discount</span>
            <span className="text-red-600">-{money(sale.discountAmount)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Taxable Amount</span>
            <span>{money(sale.taxableAmount)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>VAT ({sale.vatRate}%)</span>
            <span>{money(sale.vatAmount)}</span>
          </div>
          <div className="flex justify-between font-bold text-gray-900 border-t pt-2">
            <span>Total</span>
            <span>{money(sale.totalAmount)}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase">
              Prepared By
            </p>
            <p className="mt-1 font-medium">{sale.preparedBy?.name || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase">
              {sale.status === "rejected" ? "Rejected By" : "Approved By"}
            </p>
            <p className="mt-1 font-medium">{sale.approvedBy?.name || "—"}</p>
          </div>
        </div>
        {sale.rejectionReason && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
            <p className="font-semibold mb-0.5">Rejection Reason</p>
            <p>{sale.rejectionReason}</p>
            {sale.approvedBy?.name && (
              <p className="text-xs text-red-500 mt-1">
                — {sale.approvedBy.name}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  </div>
);

const Orders = () => {
  const { backendUrl, token, role } = useContext(UserContext);

  const getHeaders = () => (token ? { Authorization: `Bearer ${token}` } : {});

  const [sales, set_sales] = useState([]);
  const [products, set_products] = useState([]);
  const [today_sales, set_today] = useState([]);
  const [loading, set_loading] = useState(true);
  const [search, set_search] = useState("");
  const [status_filter, set_status_filter] = useState("all");
  const [show_create, set_show_create] = useState(false);
  const [view_sale, set_view_sale] = useState(null);
  const [reject_sale, set_reject_sale] = useState(null);
  const [undo_id, set_undo_id] = useState(null);
  const [is_saving, set_is_saving] = useState(false);
  const [is_rejecting, set_is_rejecting] = useState(false);
  const [page, set_page] = useState(1);
  const per_page = 10;

  const can_approve = ["admin", "manager"].includes(role);

  const load_sales = async () => {
    try {
      set_loading(true);
      const res = await axios.get(`${backendUrl}/api/sales`, {
        headers: getHeaders(),
      });
      set_sales(res.data.sales || []);
    } catch {
      toast.error("Failed to load orders");
    } finally {
      set_loading(false);
    }
  };

  const load_today = async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/reports/daily`, {
        headers: getHeaders(),
      });
      const approved = (res.data.sales || []).filter(
        (s) => s.status === "approved" || s.status === "completed",
      );
      set_today(approved);
    } catch {}
  };

  const load_products = async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/products`, {
        params: { isActive: true },
        headers: getHeaders(),
      });
      set_products(res.data.products || []);
    } catch {}
  };

  useEffect(() => {
    load_sales();
    load_products();
    load_today();
  }, [backendUrl, token]);

  useEffect(() => {
    set_page(1);
  }, [search, status_filter]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return sales.filter((s) => {
      const match_status =
        status_filter === "all" || s.status === status_filter;
      const match_search =
        !q ||
        s.saleNumber.toLowerCase().includes(q) ||
        (s.customerName || "").toLowerCase().includes(q);
      return match_status && match_search;
    });
  }, [sales, search, status_filter]);

  const create_sale = async (data) => {
    try {
      set_is_saving(true);
      const res = await axios.post(`${backendUrl}/api/sales`, data, {
        headers: getHeaders(),
      });
      set_sales((prev) => [res.data.sale, ...prev]);
      set_show_create(false);
      toast.success("Sale created");
      load_today();
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to create sale");
      console.log(e.response?.data?.message);
    } finally {
      set_is_saving(false);
    }
  };

  const approve_sale = async (id) => {
    try {
      await axios.put(
        `${backendUrl}/api/sales/${id}/approve`,
        {},
        { headers: getHeaders() },
      );
      toast.success("Approved");
      load_sales();
      load_today();
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to approve");
    }
  };

  const do_reject = async (id, reason) => {
    try {
      set_is_rejecting(true);
      await axios.put(
        `${backendUrl}/api/sales/${id}/reject`,
        { reason },
        { headers: getHeaders() },
      );
      toast.success("Rejected");
      set_reject_sale(null);
      load_sales();
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to reject");
    } finally {
      set_is_rejecting(false);
    }
  };

  const retry_sale = async (id) => {
    try {
      await axios.put(
        `${backendUrl}/api/sales/${id}/resubmit`,
        {},
        { headers: getHeaders() },
      );
      toast.success("Resubmitted");
      load_sales();
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to retry");
    }
  };

  const confirm_undo = async () => {
    try {
      await axios.delete(`${backendUrl}/api/sales/${undo_id}/undo`, {
        headers: getHeaders(),
      });
      set_sales((prev) => prev.filter((s) => s.id !== undo_id));
      toast.success("Sale removed");
      load_today();
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to undo");
    } finally {
      set_undo_id(null);
    }
  };

  const badge = (status) => {
    const map = {
      pending: "bg-yellow-100 text-yellow-700",
      approved: "bg-green-100 text-green-700",
      rejected: "bg-red-100 text-red-700",
      completed: "bg-blue-100 text-blue-700",
    };
    return (
      <span
        className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${
          map[status] || "bg-gray-100 text-gray-600"
        }`}
      >
        {status}
      </span>
    );
  };

  const counts = useMemo(
    () => ({
      total: sales.length,
      pending: sales.filter((s) => s.status === "pending").length,
      approved: sales.filter((s) => s.status === "approved").length,
      rejected: sales.filter((s) => s.status === "rejected").length,
    }),
    [sales],
  );

  const today_total = today_sales.reduce(
    (s, r) => s + parseFloat(r.totalAmount || 0),
    0,
  );

  const total_pages = Math.ceil(filtered.length / per_page);
  const paginated = filtered.slice((page - 1) * per_page, page * per_page);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Sales transactions and approvals
          </p>
        </div>
        <button
          onClick={() => set_show_create(true)}
          className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700"
        >
          <Plus size={16} /> Create Order
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Orders", value: counts.total },
          { label: "Pending", value: counts.pending },
          { label: "Approved", value: counts.approved },
          { label: "Rejected", value: counts.rejected },
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

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={search}
            onChange={(e) => set_search(e.target.value)}
            placeholder="Search orders..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-gray-900"
          />
        </div>
        <select
          value={status_filter}
          onChange={(e) => set_status_filter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-900"
        >
          <option value="all">All Orders</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-sm text-gray-400">
            Loading orders...
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {[
                      "Order ID",
                      "Customer",
                      "Date",
                      "Items",
                      "Total",
                      "Status",
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
                  {paginated.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="text-center py-10 text-gray-400"
                      >
                        No orders found
                      </td>
                    </tr>
                  ) : (
                    paginated.map((sale) => (
                      <tr
                        key={sale.id}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="px-4 py-3 font-mono text-xs font-medium text-gray-900">
                          {sale.saleNumber}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {sale.customerName || "Walk-in"}
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {new Date(sale.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {(sale.items || []).length}
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-900">
                          {money(sale.totalAmount)}
                        </td>
                        <td className="px-4 py-3">{badge(sale.status)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => set_view_sale(sale)}
                              className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"
                              title="View"
                            >
                              <Eye size={14} />
                            </button>
                            {can_approve && sale.status === "pending" && (
                              <>
                                <button
                                  onClick={() => approve_sale(sale.id)}
                                  className="p-1.5 hover:bg-green-50 rounded-lg text-green-600"
                                  title="Approve"
                                >
                                  <CheckCircle size={14} />
                                </button>
                                <button
                                  onClick={() => set_reject_sale(sale)}
                                  className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"
                                  title="Reject"
                                >
                                  <XCircle size={14} />
                                </button>
                              </>
                            )}
                            {sale.status === "pending" && (
                              <button
                                onClick={() => set_undo_id(sale.id)}
                                className="p-1.5 hover:bg-orange-50 rounded-lg text-orange-500"
                                title="Undo / Remove"
                              >
                                <Undo2 size={14} />
                              </button>
                            )}
                            {sale.status === "rejected" && (
                              <button
                                onClick={() => retry_sale(sale.id)}
                                className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-500"
                                title="Retry / Resubmit"
                              >
                                <RotateCcw size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {total_pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
                <span>
                  Showing {(page - 1) * per_page + 1}–
                  {Math.min(page * per_page, filtered.length)} of{" "}
                  {filtered.length}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => set_page((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Prev
                  </button>
                  {Array.from({ length: total_pages }, (_, i) => i + 1).map(
                    (p) => (
                      <button
                        key={p}
                        onClick={() => set_page(p)}
                        className={`px-3 py-1 rounded-lg border ${
                          p === page
                            ? "bg-gray-900 text-white border-gray-900"
                            : "border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        {p}
                      </button>
                    ),
                  )}
                  <button
                    onClick={() =>
                      set_page((p) => Math.min(total_pages, p + 1))
                    }
                    disabled={page === total_pages}
                    className="px-3 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {today_sales.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-semibold text-gray-900">Today's Sales</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {today_sales.length} approved sales today
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Today's Revenue</p>
              <p className="text-lg font-bold text-green-600">
                {money(today_total)}
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 border-b">
                  <th className="text-left py-2">Sale #</th>
                  <th className="text-left py-2">Customer</th>
                  <th className="text-right py-2">Items</th>
                  <th className="text-right py-2">Total</th>
                  <th className="text-left py-2 pl-3">Prepared By</th>
                </tr>
              </thead>
              <tbody>
                {today_sales.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b last:border-0 hover:bg-gray-50"
                  >
                    <td className="py-2 font-mono text-xs font-medium text-gray-900">
                      {s.saleNumber}
                    </td>
                    <td className="py-2 text-gray-700">
                      {s.customerName || "-"}
                    </td>
                    <td className="py-2 text-right text-gray-600">
                      {(s.items || []).length}
                    </td>
                    <td className="py-2 text-right font-semibold text-gray-900">
                      {money(s.totalAmount)}
                    </td>
                    <td className="py-2 pl-3 text-gray-500 text-xs">
                      {s.preparedBy?.name || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {show_create && (
        <CreateSaleModal
          products={products}
          onClose={() => set_show_create(false)}
          onSave={create_sale}
          isSaving={is_saving}
        />
      )}
      {view_sale && (
        <SaleDetailModal sale={view_sale} onClose={() => set_view_sale(null)} />
      )}
      {reject_sale && (
        <RejectModal
          sale={reject_sale}
          onClose={() => set_reject_sale(null)}
          onReject={do_reject}
          is_rejecting={is_rejecting}
        />
      )}

      {undo_id && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-6 space-y-4">
            <h2 className="font-bold text-gray-900">Remove Pending Sale?</h2>
            <p className="text-sm text-gray-500">
              This will permanently delete the pending sale. Stock will not be
              affected since it was never deducted.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => set_undo_id(null)}
                className="flex-1 border border-gray-300 rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirm_undo}
                className="flex-1 bg-orange-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-orange-700"
              >
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
