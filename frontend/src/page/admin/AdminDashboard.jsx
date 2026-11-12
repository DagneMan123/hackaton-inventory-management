import { useContext, useEffect, useState } from "react"
import axios from "axios"
import {
  ShoppingCart, Package, TrendingUp, AlertTriangle,
  Clock, ArrowRight, BarChart3,
} from "lucide-react"
import { Link } from "react-router-dom"
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar, Legend,
} from "recharts"
import { UserContext } from "../../context/UserContext"

const money = (v) =>
  new Intl.NumberFormat("en-ET", { style: "currency", currency: "ETB", maximumFractionDigits: 0 }).format(Number(v || 0))

const short_money = (v) => {
  const n = Number(v || 0)
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`
  return n.toString()
}

const StatCard = ({ title, value, icon: Icon, color, sub, to }) => (
  <Link to={to} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow block">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
        {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
      </div>
      <div className={`p-2.5 rounded-lg ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
    </div>
  </Link>
)

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-gray-900 mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color }} className="text-xs">
          {entry.name}: {entry.name === "Revenue" ? money(entry.value) : entry.value}
        </p>
      ))}
    </div>
  )
}

const AdminDashboard = () => {
  const { backendUrl, token } = useContext(UserContext)
  const [stats, set_stats] = useState(null)
  const [recent_sales, set_recent] = useState([])
  const [low_stock, set_low_stock] = useState([])
  const [chart_data, set_chart_data] = useState([])
  const [today_sales, set_today] = useState([])
  const [today_total, set_today_total] = useState(0)
  const [loading, set_loading] = useState(true)
  const [chart_loading, set_chart_loading] = useState(true)

  const headers = token ? { Authorization: `Bearer ${token}` } : {}

  useEffect(() => {
    const load = async () => {
      try {
        set_loading(true)
        const [stats_res, sales_res, stock_res, today_res] = await Promise.all([
          axios.get(`${backendUrl}/api/sales/stats`, { headers }),
          axios.get(`${backendUrl}/api/sales`, { params: { limit: 5 }, headers }),
          axios.get(`${backendUrl}/api/reports/stock`, { headers }),
          axios.get(`${backendUrl}/api/reports/daily`, { headers }),
        ])
        set_stats(stats_res.data.stats)
        set_recent(sales_res.data.sales || [])
        set_low_stock((stock_res.data.lowStock || []).slice(0, 5))
        const t_sales = today_res.data.sales || []
        set_today(t_sales)
        set_today_total(today_res.data.totals?.totalAmount || 0)
      } catch (e) {
        console.error(e)
      } finally {
        set_loading(false)
      }
    }
    load()
  }, [backendUrl])

  useEffect(() => {
    const load_chart = async () => {
      try {
        set_chart_loading(true)
        const now = new Date()
        const months_data = []

        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
          const yr = d.getFullYear()
          const mo = d.getMonth() + 1
          const month_name = d.toLocaleString("en-US", { month: "short" })

          try {
            const res = await axios.get(`${backendUrl}/api/reports/monthly`, {
              params: { year: yr, month: mo },
              headers,
            })
            const totals = res.data.totals || {}
            const sales_count = (res.data.sales || []).length
            months_data.push({
              month: month_name,
              Revenue: parseFloat(totals.totalAmount || 0),
              Orders: sales_count,
              VAT: parseFloat(totals.vatAmount || 0),
            })
          } catch {
            months_data.push({ month: month_name, Revenue: 0, Orders: 0, VAT: 0 })
          }
        }

        set_chart_data(months_data)
      } catch (e) {
        console.error(e)
      } finally {
        set_chart_loading(false)
      }
    }
    load_chart()
  }, [backendUrl])

  const badge = (status) => {
    const map = {
      pending: "bg-yellow-100 text-yellow-700",
      approved: "bg-green-100 text-green-700",
      rejected: "bg-red-100 text-red-700",
      completed: "bg-blue-100 text-blue-700",
    }
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${map[status] || "bg-gray-100 text-gray-600"}`}>
        {status}
      </span>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Qelem Meda Technologies — Inventory & Sales</p>
        </div>
        <Link
          to="/admin/orders"
          className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700"
        >
          <ShoppingCart size={16} />
          New Sale
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse h-24" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Monthly Revenue"
            value={money(stats?.monthRevenue)}
            icon={TrendingUp}
            color="bg-blue-500"
            sub="This month"
            to="/admin/analytics"
          />
          <StatCard
            title="Total Orders"
            value={stats?.totalSales ?? 0}
            icon={ShoppingCart}
            color="bg-green-500"
            sub="Approved sales"
            to="/admin/orders"
          />
          <StatCard
            title="Products"
            value={stats?.totalProducts ?? 0}
            icon={Package}
            color="bg-purple-500"
            sub="Active products"
            to="/admin/inventory"
          />
          <StatCard
            title="Pending Approval"
            value={stats?.pendingSales ?? 0}
            icon={Clock}
            color="bg-orange-500"
            sub="Awaiting manager"
            to="/admin/orders"
          />
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-gray-900">Revenue History</h2>
              <p className="text-xs text-gray-400 mt-0.5">Last 6 months</p>
            </div>
            <Link to="/admin/analytics" className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1">
              Full analytics <ArrowRight size={12} />
            </Link>
          </div>
          {chart_loading ? (
            <div className="h-48 flex items-center justify-center">
              <div className="animate-pulse text-sm text-gray-400">Loading...</div>
            </div>
          ) : chart_data.every(d => d.Revenue === 0) ? (
            <div className="h-48 flex flex-col items-center justify-center text-gray-400">
              <BarChart3 size={32} className="mb-2 text-gray-200" />
              <p className="text-sm">No sales data yet</p>
            </div>
          ) : (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chart_data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="rev_grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#111827" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#111827" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="vat_grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={short_money} tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={44} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 10, paddingTop: 6 }} iconType="circle" iconSize={7} />
                  <Area type="monotone" dataKey="Revenue" stroke="#111827" strokeWidth={2} fill="url(#rev_grad)" dot={{ r: 2, fill: "#111827" }} activeDot={{ r: 4 }} />
                  <Area type="monotone" dataKey="VAT" stroke="#3b82f6" strokeWidth={2} fill="url(#vat_grad)" dot={{ r: 2, fill: "#3b82f6" }} activeDot={{ r: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="mb-4">
            <h2 className="font-semibold text-gray-900">Order Count</h2>
            <p className="text-xs text-gray-400 mt-0.5">Orders per month</p>
          </div>
          {chart_loading ? (
            <div className="h-48 flex items-center justify-center">
              <div className="animate-pulse text-sm text-gray-400">Loading...</div>
            </div>
          ) : chart_data.every(d => d.Orders === 0) ? (
            <div className="h-48 flex flex-col items-center justify-center text-gray-400">
              <BarChart3 size={32} className="mb-2 text-gray-200" />
              <p className="text-sm">No orders yet</p>
            </div>
          ) : (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart_data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={28} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="Orders" fill="#111827" radius={[4, 4, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-gray-900">Today's Sales</h2>
            <p className="text-xs text-gray-400 mt-0.5">{today_sales.length} approved sales today</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Today's Revenue</p>
            <p className="text-xl font-bold text-green-600">{money(today_total)}</p>
          </div>
        </div>
        {today_sales.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-5">No approved sales today yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 border-b">
                  <th className="text-left py-2">Sale #</th>
                  <th className="text-left py-2">Customer</th>
                  <th className="text-right py-2">Items</th>
                  <th className="text-right py-2">Subtotal</th>
                  <th className="text-right py-2">VAT</th>
                  <th className="text-right py-2">Total</th>
                  <th className="text-left py-2 pl-3">Prepared By</th>
                </tr>
              </thead>
              <tbody>
                {today_sales.map(s => (
                  <tr key={s.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-2 font-mono text-xs font-medium text-gray-900">{s.saleNumber}</td>
                    <td className="py-2 text-gray-700">{s.customerName || "Walk-in"}</td>
                    <td className="py-2 text-right text-gray-600">{(s.items || []).length}</td>
                    <td className="py-2 text-right text-gray-600">{money(s.subtotal)}</td>
                    <td className="py-2 text-right text-gray-500">{money(s.vatAmount)}</td>
                    <td className="py-2 text-right font-semibold text-gray-900">{money(s.totalAmount)}</td>
                    <td className="py-2 pl-3 text-gray-500 text-xs">{s.preparedBy?.name || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Recent Orders</h2>
            <Link to="/admin/orders" className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {recent_sales.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No sales yet</p>
          ) : (
            <div className="space-y-3">
              {recent_sales.map(sale => (
                <div key={sale.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{sale.saleNumber}</p>
                    <p className="text-xs text-gray-400">{sale.customerName || "Walk-in"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{money(sale.totalAmount)}</p>
                    {badge(sale.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Low Stock Alert</h2>
            <Link to="/admin/inventory" className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {low_stock.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">All products well stocked</p>
          ) : (
            <div className="space-y-3">
              {low_stock.map(p => (
                <Link key={p.id} to="/admin/inventory"
                  className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 hover:bg-gray-50 rounded px-1">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.sku} · {p.category}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={14} className={p.currentStock === 0 ? "text-red-500" : "text-yellow-500"} />
                    <span className={`text-sm font-bold ${p.currentStock === 0 ? "text-red-600" : "text-yellow-600"}`}>
                      {p.currentStock} left
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "New Sale", path: "/admin/orders", icon: ShoppingCart, color: "bg-blue-50 text-blue-700 hover:bg-blue-100" },
            { label: "View Products", path: "/admin/inventory", icon: Package, color: "bg-green-50 text-green-700 hover:bg-green-100" },
            { label: "View Reports", path: "/admin/reports", icon: TrendingUp, color: "bg-purple-50 text-purple-700 hover:bg-purple-100" },
            { label: "Analytics", path: "/admin/analytics", icon: BarChart3, color: "bg-orange-50 text-orange-700 hover:bg-orange-100" },
          ].map(action => (
            <Link key={action.path} to={action.path}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl text-sm font-medium transition-colors ${action.color}`}>
              <action.icon size={22} />
              {action.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
