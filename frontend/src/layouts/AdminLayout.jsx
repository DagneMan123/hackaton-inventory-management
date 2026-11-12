import { useState, useContext, useEffect, useRef } from "react"
import { Outlet, Link } from "react-router-dom"
import axios from "axios"
import { Bell, X, CheckCircle, XCircle, AlertTriangle, Clock, Package } from "lucide-react"
import Sidebar from "../component/Sidebar"
import { UserContext } from "../context/UserContext"

const money = (v) =>
  new Intl.NumberFormat("en-ET", { style: "currency", currency: "ETB", maximumFractionDigits: 0 }).format(Number(v || 0))

const QuickRejectModal = ({ sale, onClose, onReject }) => {
  const [reason, set_reason] = useState("")
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <p className="font-bold text-gray-900 text-sm">Reject Sale</p>
            <p className="text-xs text-gray-400">{sale.saleNumber}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X size={16} />
          </button>
        </div>
        <div className="p-4 space-y-3">
          <div className="bg-red-50 rounded-lg p-3 text-xs text-red-700">
            <p className="font-semibold">{sale.customerName || "Walk-in"}</p>
            <p className="mt-0.5">{money(sale.totalAmount)}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Reason *</label>
            <textarea
              value={reason}
              onChange={e => set_reason(e.target.value)}
              rows={3}
              placeholder="Why are you rejecting this sale?"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-400 resize-none"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={onClose}
              className="flex-1 border border-gray-300 rounded-lg py-2 text-sm font-medium hover:bg-gray-50">
              Cancel
            </button>
            <button
              onClick={() => { if (reason.trim()) onReject(sale.id, reason.trim()) }}
              disabled={!reason.trim()}
              className="flex-1 bg-red-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-red-700 disabled:bg-gray-300">
              Reject
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const NotifPanel = ({ open, onClose, pending_sales, low_stock_items, onApprove, onStartReject, role }) => {
  const [tab, set_tab] = useState("approvals")
  const can_approve = ["admin", "manager"].includes(role)

  if (!open) return null

  return (
    <div className="absolute right-0 top-12 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden" style={{ width: 360 }}>
      <div className="flex items-center justify-between px-4 py-3 bg-gray-900 text-white">
        <div className="flex items-center gap-2">
          <Bell size={15} />
          <span className="font-semibold text-sm">Notifications</span>
          {(pending_sales.length + low_stock_items.length) > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {pending_sales.length + low_stock_items.length}
            </span>
          )}
        </div>
        <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition">
          <X size={14} />
        </button>
      </div>

      <div className="flex border-b border-gray-100">
        {can_approve && (
          <button
            onClick={() => set_tab("approvals")}
            className={`flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
              tab === "approvals"
                ? "text-gray-900 border-b-2 border-gray-900 bg-orange-50"
                : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Clock size={12} />
            Pending Approvals
            {pending_sales.length > 0 && (
              <span className="bg-orange-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                {pending_sales.length}
              </span>
            )}
          </button>
        )}
        <button
          onClick={() => set_tab("stock")}
          className={`flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
            tab === "stock"
              ? "text-gray-900 border-b-2 border-gray-900 bg-yellow-50"
              : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
          }`}
        >
          <Package size={12} />
          Low Stock
          {low_stock_items.length > 0 && (
            <span className="bg-yellow-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
              {low_stock_items.length}
            </span>
          )}
        </button>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {tab === "approvals" && can_approve && (
          pending_sales.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle size={22} className="text-green-500" />
              </div>
              <p className="text-sm font-medium text-gray-700">there is no notifcation!</p>
              <p className="text-xs text-gray-400 mt-0.5">there ispending approvall</p>
            </div>
          ) : (
            <div>
              {pending_sales.map((sale, idx) => (
                <div key={sale.id} className={`px-4 py-3 hover:bg-gray-50 transition-colors ${idx < pending_sales.length - 1 ? "border-b border-gray-100" : ""}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-900 font-mono">{sale.saleNumber}</span>
                        <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full font-semibold">pending</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{sale.customerName || "Walk-in customer"}</p>
                      <p className="text-sm font-bold text-gray-900 mt-1">{money(sale.totalAmount)}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">by {sale.preparedBy?.name || "—"}</p>
                    </div>
                    
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {tab === "stock" && (
          low_stock_items.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle size={22} className="text-green-500" />
              </div>
              <p className="text-sm font-medium text-gray-700">Stock looks good!</p>
              <p className="text-xs text-gray-400 mt-0.5">All products well stocked</p>
            </div>
          ) : (
            <div>
              {low_stock_items.map((p, idx) => (
                <div key={p.id} className={`px-4 py-3 hover:bg-gray-50 transition-colors ${idx < low_stock_items.length - 1 ? "border-b border-gray-100" : ""}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900 truncate">{p.name}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{p.sku} · {p.category}</p>
                    </div>
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 ${
                      p.currentStock === 0
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}>
                      <AlertTriangle size={11} />
                      {p.currentStock === 0 ? "Out of stock" : `${p.currentStock} left`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50 flex justify-between">
        <Link to="/admin/orders" onClick={onClose} className="text-xs text-blue-600 hover:text-blue-800 font-medium">
          All orders →
        </Link>
        <Link to="/admin/inventory" onClick={onClose} className="text-xs text-blue-600 hover:text-blue-800 font-medium">
          Inventory →
        </Link>
      </div>
    </div>
  )
}

const AdminLayout = () => {
  const { backendUrl, token, role } = useContext(UserContext)
  const headers = token ? { Authorization: `Bearer ${token}` } : {}

  const [notif_open, set_notif_open] = useState(false)
  const [pending_sales, set_pending] = useState([])
  const [low_stock_items, set_low_stock] = useState([])
  const [reject_target, set_reject_target] = useState(null)
  const notif_ref = useRef(null)

  const can_approve = ["admin", "manager"].includes(role)

  const load_notifs = async () => {
    try {
      const calls = [axios.get(`${backendUrl}/api/reports/stock`, { headers })]
      if (can_approve) {
        calls.push(axios.get(`${backendUrl}/api/sales`, { params: { status: "pending", limit: 20 }, headers }))
      }
      const results = await Promise.all(calls)
      set_low_stock(results[0].data.lowStock || [])
      if (can_approve && results[1]) {
        set_pending(results[1].data.sales || [])
      }
    } catch {}
  }

  useEffect(() => {
    load_notifs()
    const iv = setInterval(load_notifs, 30000)
    return () => clearInterval(iv)
  }, [backendUrl, token])

  useEffect(() => {
    const handle = (e) => {
      if (notif_ref.current && !notif_ref.current.contains(e.target)) {
        set_notif_open(false)
      }
    }
    document.addEventListener("mousedown", handle)
    return () => document.removeEventListener("mousedown", handle)
  }, [])

  const approve = async (id) => {
    try {
      await axios.put(`${backendUrl}/api/sales/${id}/approve`, {}, { headers })
      load_notifs()
    } catch {}
  }

  const do_reject = async (id, reason) => {
    try {
      await axios.put(`${backendUrl}/api/sales/${id}/reject`, { reason }, { headers })
      set_reject_target(null)
      load_notifs()
    } catch {}
  }

  const total_notifs = pending_sales.length + low_stock_items.length

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-y-auto flex flex-col">
        <div className="flex items-center justify-end px-6 py-3 border-b border-gray-200 bg-white shrink-0">
          <div className="relative" ref={notif_ref}>
            <button
              onClick={() => set_notif_open(v => !v)}
              className="relative p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition"
            >
              <Bell size={18} />
              {total_notifs > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {total_notifs > 9 ? "9+" : total_notifs}
                </span>
              )}
            </button>
            <NotifPanel
              open={notif_open}
              onClose={() => set_notif_open(false)}
              pending_sales={pending_sales}
              low_stock_items={low_stock_items}
              onApprove={approve}
              onStartReject={(sale) => { set_reject_target(sale); set_notif_open(false) }}
              role={role}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </div>

      {reject_target && (
        <QuickRejectModal
          sale={reject_target}
          onClose={() => set_reject_target(null)}
          onReject={do_reject}
        />
      )}
    </div>
  )
}

export default AdminLayout
