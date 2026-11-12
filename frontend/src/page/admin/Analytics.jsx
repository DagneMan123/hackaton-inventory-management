import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { UserContext } from "../../context/UserContext";
import { TrendingUp, ShoppingCart, Package, AlertTriangle } from "lucide-react";

const money = (v) =>
  new Intl.NumberFormat("en-ET", { style: "currency", currency: "ETB", maximumFractionDigits: 0 }).format(Number(v || 0));

const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const Analytics = () => {
  const { backendUrl, token } = useContext(UserContext);
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [monthlyData, setMonthlyData] = useState(null);
  const [stockData, setStockData] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [monthRes, stockRes, statsRes] = await Promise.all([
          axios.get(`${backendUrl}/api/reports/monthly`, { params: { year, month }, headers }),
          axios.get(`${backendUrl}/api/reports/stock`, { headers }),
          axios.get(`${backendUrl}/api/sales/stats`, { headers }),
        ]);
        setMonthlyData(monthRes.data);
        setStockData(stockRes.data);
        setStats(statsRes.data.stats);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [backendUrl, year, month]);

  const topProducts = (() => {
    if (!monthlyData?.sales) return [];
    const map = new Map();
    for (const sale of monthlyData.sales) {
      for (const item of sale.items || []) {
        const existing = map.get(item.productName) || { name: item.productName, qty: 0, revenue: 0 };
        existing.qty += item.quantity;
        existing.revenue += parseFloat(item.lineTotal);
        map.set(item.productName, existing);
      }
    }
    return [...map.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  })();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">Sales performance and insights</p>
        </div>
        <div className="flex gap-2">
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-900">
            {months.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
          <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))}
            min="2020" max="2100"
            className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-900" />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="bg-white rounded-xl border h-24 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Monthly Revenue", value: money(monthlyData?.totals?.totalAmount), icon: TrendingUp, color: "text-blue-600 bg-blue-50" },
            { label: "Monthly Orders", value: monthlyData?.sales?.length ?? 0, icon: ShoppingCart, color: "text-green-600 bg-green-50" },
            { label: "Total Products", value: stats?.totalProducts ?? 0, icon: Package, color: "text-purple-600 bg-purple-50" },
            { label: "Low Stock Items", value: stockData?.lowStock?.length ?? 0, icon: AlertTriangle, color: "text-orange-600 bg-orange-50" },
          ].map((card) => (
            <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
              <div className={`p-3 rounded-xl ${card.color}`}>
                <card.icon size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-500">{card.label}</p>
                <p className="text-xl font-bold text-gray-900">{card.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Revenue Overview — {months[month - 1]} {year}</h2>
          {loading ? (
            <div className="h-40 animate-pulse bg-gray-100 rounded-lg" />
          ) : monthlyData?.sales?.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">No sales data for this period</p>
          ) : (
            <div className="space-y-2">
              {[
                { label: "Subtotal", value: monthlyData?.totals?.subtotal, color: "bg-blue-400" },
                { label: "Discount", value: monthlyData?.totals?.discountAmount, color: "bg-red-400" },
                { label: "VAT Collected", value: monthlyData?.totals?.vatAmount, color: "bg-yellow-400" },
                { label: "Net Revenue", value: monthlyData?.totals?.totalAmount, color: "bg-green-500" },
              ].map((row) => {
                const max = parseFloat(monthlyData?.totals?.subtotal) || 1;
                const pct = Math.min(100, (parseFloat(row.value) / max) * 100);
                return (
                  <div key={row.label}>
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>{row.label}</span>
                      <span className="font-semibold">{money(row.value)}</span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full ${row.color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Top Products — {months[month - 1]} {year}</h2>
          {loading ? (
            <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-8 animate-pulse bg-gray-100 rounded" />)}</div>
          ) : topProducts.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">No data</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, i) => (
                <div key={p.name} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-400 w-5">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-900 truncate">{p.name}</span>
                      <span className="text-gray-500 text-xs">{p.qty} units</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gray-800 rounded-full"
                        style={{ width: `${(p.revenue / (topProducts[0]?.revenue || 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-gray-700 w-24 text-right">{money(p.revenue)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Stock Status</h2>
        {loading ? (
          <div className="h-20 animate-pulse bg-gray-100 rounded-lg" />
        ) : (
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { label: "In Stock", value: (stockData?.products || []).filter((p) => p.currentStock > 10).length, color: "text-green-600" },
              { label: "Low Stock (≤10)", value: stockData?.lowStock?.length ?? 0, color: "text-yellow-600" },
              { label: "Out of Stock", value: stockData?.outOfStock?.length ?? 0, color: "text-red-600" },
            ].map((s) => (
              <div key={s.label} className="bg-gray-50 rounded-xl p-4">
                <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-sm text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
