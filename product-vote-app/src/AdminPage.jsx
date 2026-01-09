import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { getAllProducts } from "./db";
import { Link } from "react-router-dom";

function AdminPage() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const storedProducts = await getAllProducts();
        if (storedProducts) {
          // Sort by ID
          storedProducts.sort((a, b) => a.id - b.id);
          setProducts(storedProducts);
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      }
    };
    fetchData();
  }, []);

  const handleExport = () => {
    // Prepare data for export (cleaner format if needed)
    const exportData = products.map(p => ({
      ID: p.id,
      产品名称: p.name,
      当前票数: p.votes
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "投票数据");
    
    // Generate filename with timestamp
    const date = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `投票数据_${date}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 text-black font-sans">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h1 className="text-2xl font-bold text-gray-800">后台数据管理</h1>
          <Link to="/" className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition">
            ← 返回投票页
          </Link>
        </div>

        <div className="mb-6 flex justify-between items-center bg-blue-50 p-4 rounded-lg border border-blue-100">
          <div>
            <h2 className="font-semibold text-blue-900">数据导出</h2>
            <p className="text-sm text-blue-700">将当前所有投票数据导出为 Excel 文件</p>
          </div>
          <button
            onClick={handleExport}
            className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition shadow-sm flex items-center gap-2"
          >
            <span>📥</span> 导出 Excel
          </button>
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">产品名称</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">当前票数</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">图片</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {products.length > 0 ? (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{product.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-bold">{product.votes}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.image ? (
                            <img src={`${import.meta.env.BASE_URL}${product.image}`} alt={product.name} className="h-8 w-8 object-cover rounded" />
                        ) : "-"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                    暂无数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminPage;
