import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Download, FileText, Calendar, BarChart3 } from "lucide-react";
import { UserContext } from "../../context/UserContext";

const money = (v) =>
  new Intl.NumberFormat("en-ET", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(v || 0));

const months = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const Reports = () => {
  const { backendUrl, token } = useContext(UserContext);
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const today = new Date();
  const [reportType, setReportType] = useState("daily");
  const [date, setDate] = useState(today.toISOString().split("T")[0]);
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState("");

  const fetchReport = async () => {
    try {
      setLoading(true);
      let res;
      if (reportType === "daily") {
        res = await axios.get(`${backendUrl}/api/reports/daily`, { params: { date }, headers });
        setData(res.data);
      } else if (reportType === "monthly") {
        res = await axios.get(`${backendUrl}/api/reports/monthly`, { params: { year, month }, headers });
        setData(res.data);
      } else {
        res = await axios.get(`${backendUrl}/api/reports/stock`, { headers });
        setData(res.data);
      }
    } catch (e) {
      toast.error("Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType, date, month, year, backendUrl]);

  const downloadReport = async (format) => {
    try {
      setDownloading(format);
      const params = { type: reportType, format };
      if (reportType === "daily") params.date = date;
      else if (reportType === "monthly") { params.year = year; params.month = month; }

      const res = await axios.get(`${backendUrl}/api/reports/export`, {
        params,
        headers,
        responseType: "blob",
      });

      const ext = format === "pdf" ? "pdf" : "xlsx";
      const filename = `${reportType}_report_${reportType === "daily" ? date : `${year}_${month}`}.${ext}`;
      const url = URL.createObjectURL(res.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error("Failed to download report");
    } finally {
      setDownloading("");
    }
  };

  const sales = data?.sales || [];
  const products = data?.products || [];
  const totals = data?.totals || {};

  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500 mt-0.5">Generate and export business reports</p>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            {[
              { value: "daily", label: "Daily", icon: Calendar },
              { value: "monthly", label: "Monthly", icon: FileText },
              { value: "stock", label: "Stock", icon: BarChart3 },
            ].map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setReportType(value)}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${
                  reportType === value ? "bg-gray-900 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>

          {reportType === "daily" && (
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-900" />
          )}
          {reportType === "monthly" && (
            <>
              <select value={month} onChange={(e) => setMonth(Number(e.target.value))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-900">
                {months.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
              <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))}
                min="2020" max="2100"
                className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-900" />
            </>
          )}

          <button
            onClick={() => downloadReport("xlsx")}
            disabled={!!downloading || (reportType !== "stock" && sales.length === 0) || (reportType === "stock" && products.length === 0)}
            className="flex items-center gap-2 border border-gray-300 bg-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:text-gray-400"
          >
            <Download size={14} /> Excel
          </button>
          <button
            onClick={() => downloadReport("pdf")}
            disabled={!!downloading || (reportType !== "stock" && sales.length === 0) || (reportType === "stock" && products.length === 0)}
            className="flex items-center gap-2 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 disabled:bg-gray-400"
          >
            <Download size={14} /> PDF
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-5 border-b text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Qelem Meda Technologies PLC</p>
          <h2 className="text-lg font-bold text-gray-900 mt-1">
            {reportType === "daily" && `Daily Sales Report — ${date}`}
            {reportType === "monthly" && `Monthly Sales Report — ${months[month - 1]} ${year}`}
            {reportType === "stock" && "Stock Report"}
          </h2>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-gray-400">Loading report...</div>
        ) : reportType === "stock" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {["No.", "Product Name", "SKU", "Category", "Cost Price", "Selling Price", "Initial Stock", "Current Stock", "Status"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-10 text-gray-400">No products</td></tr>
                ) : (
                  products.map((p, i) => {
                    const status = p.currentStock === 0 ? { label: "Out of Stock", cls: "bg-red-100 text-red-700" }
                      : p.currentStock <= 10 ? { label: "Low Stock", cls: "bg-yellow-100 text-yellow-700" }
                      : { label: "In Stock", cls: "bg-green-100 text-green-700" };
                    return (
                      <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.sku}</td>
                        <td className="px-4 py-3 text-gray-600">{p.category}</td>
                        <td className="px-4 py-3 text-right">{money(p.costPrice)}</td>
                        <td className="px-4 py-3 text-right font-medium">{money(p.sellingPrice)}</td>
                        <td className="px-4 py-3 text-right">{p.initialStock}</td>
                        <td className="px-4 py-3 text-right font-bold">{p.currentStock}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${status.cls}`}>{status.label}</span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {["No.", "Sale #", "Date", "Customer", "Subtotal", "Discount", "Taxable Amount", "VAT (15%)", "Total", "Prepared By", "Approved By"].map((h) => (
                      <th key={h} className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sales.length === 0 ? (
                    <tr><td colSpan={11} className="text-center py-10 text-gray-400">No sales for this period</td></tr>
                  ) : (
                    <>
                      {sales.map((s, i) => (
                        <tr key={s.id} className="border-b last:border-0 hover:bg-gray-50">
                          <td className="px-3 py-2.5 text-gray-500">{i + 1}</td>
                          <td className="px-3 py-2.5 font-mono text-xs font-medium">{s.saleNumber}</td>
                          <td className="px-3 py-2.5 text-gray-500 text-xs">{new Date(s.createdAt).toLocaleDateString()}</td>
                          <td className="px-3 py-2.5">{s.customerName || "Walk-in"}</td>
                          <td className="px-3 py-2.5 text-right">{money(s.subtotal)}</td>
                          <td className="px-3 py-2.5 text-right text-red-600">-{money(s.discountAmount)}</td>
                          <td className="px-3 py-2.5 text-right">{money(s.taxableAmount)}</td>
                          <td className="px-3 py-2.5 text-right">{money(s.vatAmount)}</td>
                          <td className="px-3 py-2.5 text-right font-semibold">{money(s.totalAmount)}</td>
                          <td className="px-3 py-2.5 text-gray-600">{s.preparedBy?.name || "—"}</td>
                          <td className="px-3 py-2.5 text-gray-600">{s.approvedBy?.name || "—"}</td>
                        </tr>
                      ))}
                      <tr className="bg-gray-900 text-white font-bold">
                        <td className="px-3 py-3" colSpan={4}>TOTAL</td>
                        <td className="px-3 py-3 text-right">{money(totals.subtotal)}</td>
                        <td className="px-3 py-3 text-right">-{money(totals.discountAmount)}</td>
                        <td className="px-3 py-3 text-right">{money(totals.taxableAmount)}</td>
                        <td className="px-3 py-3 text-right">{money(totals.vatAmount)}</td>
                        <td className="px-3 py-3 text-right">{money(totals.totalAmount)}</td>
                        <td colSpan={2}></td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>

            {sales.length > 0 && (
              <div className="grid grid-cols-2 gap-8 p-6 border-t text-sm">
                <div>
                  <p className="font-bold text-gray-900">Prepared By</p>
                  <p className="mt-3">Name: {sales[0]?.preparedBy?.name || "____________________"}</p>
                  <p className="mt-2">Signature: ____________________</p>
                  <p className="mt-2">Date: ____________________</p>
                </div>
                <div>
                  <p className="font-bold text-gray-900">Approved By</p>
                  <p className="mt-3">Name: {sales.find((s) => s.approvedBy)?.approvedBy?.name || "____________________"}</p>
                  <p className="mt-2">Signature: ____________________</p>
                  <p className="mt-2">Date: ____________________</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Reports;