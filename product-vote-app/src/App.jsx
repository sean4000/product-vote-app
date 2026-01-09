import { useState, useEffect } from "react";
import {
  initData,
  getAllProducts,
  updateProduct as updateProductInDb,
  clearAllProducts,
} from "./db";

const DEFAULT_PRODUCTS = [
  { id: 1, name: "产品1", votes: 0 },
  { id: 2, name: "产品2", votes: 0 },
  { id: 3, name: "产品3", votes: 0 },
];

function App() {
  const [products, setProducts] = useState(DEFAULT_PRODUCTS);
  const backgroundUrl = `${import.meta.env.BASE_URL}bg.jpg`;

  // 初始化 IndexedDB 数据
  useEffect(() => {
    const fetchData = async () => {
      try {
        await initData(DEFAULT_PRODUCTS);
        let storedProducts = await getAllProducts();

        // 按照 ID 排序，确保展示顺序一致
        if (storedProducts && storedProducts.length > 0) {
          console.log("Loaded products from DB:", storedProducts);
          storedProducts.sort((a, b) => a.id - b.id);
          setProducts(storedProducts);
        } else {
          console.warn("DB returned empty data, falling back to default.");
          // 如果读取失败或者为空，再次尝试初始化（双重保障）
          // 但正常情况下 initData 应该已经处理了
        }
      } catch (error) {
        console.error("Failed to load data from IndexedDB:", error);
      }
    };
    fetchData();
  }, []);

  // 倒计时逻辑 (模拟 57分06秒)
  const [timeLeft, setTimeLeft] = useState(57 * 60 + 6);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m} 分 ${s.toString().padStart(2, "0")} 秒`;
  };

  const handleVote = async (id) => {
    console.log("Voting for product:", id);
    const newProducts = products.map((p) =>
      p.id === id ? { ...p, votes: p.votes + 1 } : p
    );
    setProducts(newProducts);

    // 更新 IndexedDB
    const productToUpdate = newProducts.find((p) => p.id === id);
    if (productToUpdate) {
      try {
        await updateProductInDb(productToUpdate);
      } catch (error) {
        console.error("Failed to update vote in IndexedDB:", error);
      }
    }
  };

  const handleClearVotes = async () => {
    if (window.confirm("确定要清除所有投票数据吗？")) {
      try {
        // 创建所有票数为0的新产品列表
        const clearedProducts = DEFAULT_PRODUCTS.map((p) => ({
          ...p,
          votes: 0,
        }));

        // 更新 IndexedDB
        await clearAllProducts(); // 先清空
        await initData(clearedProducts); // 用票数为0的数据重新初始化

        // 更新组件状态
        setProducts(clearedProducts);

        console.log("All votes cleared and reset to zero.");
      } catch (error) {
        console.error("Failed to clear votes:", error);
      }
    }
  };

  // 计算最高票数用于柱状图高度比例
  const maxVotes = Math.max(...products.map((p) => p.votes), 10); // 默认最小刻度10，防止除以0或太高

  return (
    <div
      className="min-h-screen text-white font-sans overflow-hidden relative selection:bg-red-200 selection:text-red-900 bg-black"
      style={{
        backgroundImage: `url(${backgroundUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="absolute inset-0 bg-black/55"></div>
      <div className="relative z-10 min-h-screen">
        <header className="p-6 flex justify-between items-start">
          {/* LOGO */}
          <div className="text-5xl font-bold tracking-wider text-yellow-100 opacity-90">
            {/* LOGO */}
          </div>

          {/* 中间标题 */}
          <div className="absolute left-1/2 transform -translate-x-1/2 top-8">
            <h1 className="text-3xl font-bold tracking-widest drop-shadow-md">
              星钻三重奏
            </h1>
          </div>

          {/* 右侧统计 */}
          <div className="text-right space-y-2">
            <div className="text-lg">
              签到人数： <span className="font-bold text-2xl">2</span> 人
            </div>
            <div className="text-xl font-medium">
              倒计时： {formatTime(timeLeft)}
            </div>
          </div>
        </header>

        <main className="flex justify-center items-end h-[60vh] gap-16 px-10 pb-10">
          {products.map((product) => (
            <div
              key={product.id}
              className="flex flex-col items-center group cursor-pointer"
              onClick={() => handleVote(product.id)}
            >
              {/* 票数 */}
              <div className="mb-2 text-xl font-bold">{product.votes}票</div>

              {/* 柱状图 */}
              <div className="w-16 bg-black/20 rounded-full relative overflow-hidden h-64 border-2 border-white/10 shadow-inner">
                {/* 进度条 */}
                <div
                  className={`absolute bottom-0 left-0 right-0 rounded-full transition-all duration-500 ease-out ${
                    product.votes > 0
                      ? "bg-gradient-to-t from-purple-500 to-pink-400"
                      : "bg-transparent"
                  }`}
                  style={{ height: `${(product.votes / maxVotes) * 100}%` }}
                >
                  {/* 增加一些光泽效果 */}
                  <div className="absolute top-0 left-0 right-0 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50"></div>
                </div>
              </div>

              {/* 产品图标 (模拟图片) */}
              <div className="mt-4 w-20 h-16 bg-white rounded-lg shadow-lg flex items-center justify-center transform group-hover:scale-105 transition-transform">
                <div className="w-12 h-10 bg-red-100 rounded-md flex items-center justify-center">
                  <span className="text-red-500 text-xs">IMG</span>
                </div>
              </div>

              {/* 产品名称 */}
              <div className="mt-3 text-lg font-medium">{product.name}</div>
            </div>
          ))}
        </main>

        <div className="absolute bottom-10 left-10 opacity-60 transform -rotate-12 border-4 border-white rounded-full w-24 h-24 flex flex-col items-center justify-center">
          <div className="text-xs border-b border-white pb-1 mb-1 w-16 text-center">
            ★★★
          </div>
          <div className="font-bold text-lg">试用版</div>
          <div className="text-[10px] mt-1">仅限20人使用</div>
        </div>

        <div className="absolute bottom-8 right-10 flex gap-4">
          <button
            onClick={handleClearVotes}
            className="px-4 py-1.5 bg-red-500/50 rounded-full border border-white/30 backdrop-blur-sm text-sm hover:bg-red-600/60 transition"
          >
            🧹 清除投票
          </button>
          <button className="px-4 py-1.5 bg-black/30 rounded-full border border-white/30 backdrop-blur-sm text-sm hover:bg-black/40 transition">
            📊 排行榜模式
          </button>
          <button className="px-4 py-1.5 bg-black/30 rounded-full border border-white/30 backdrop-blur-sm text-sm hover:bg-black/40 transition">
            排行榜
          </button>
          <button className="px-4 py-1.5 bg-black/30 rounded-full border border-white/30 backdrop-blur-sm text-sm flex items-center gap-1 hover:bg-black/40 transition">
            最受欢迎的 <span className="text-xs">▼</span>
          </button>
          <button className="px-4 py-1.5 bg-black/30 rounded-full border border-white/30 backdrop-blur-sm text-sm hover:bg-black/40 transition">
            进行中
          </button>
        </div>

        <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-yellow-400 to-transparent opacity-20 transform -rotate-12 pointer-events-none"></div>
        <div className="absolute top-2/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-yellow-400 to-transparent opacity-10 transform -rotate-6 pointer-events-none"></div>
      </div>
    </div>
  );
}

export default App;
