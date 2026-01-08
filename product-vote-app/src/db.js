const DB_NAME = "ProductVoteDB";
const DB_VERSION = 1;
const STORE_NAME = "products";

export const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error("IndexedDB open error:", event.target.error);
      reject("Database error: " + event.target.error);
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
  });
};

export const initData = async (defaultData) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    const countRequest = store.count();
    let isDataEmpty = false;

    countRequest.onsuccess = () => {
      const count = countRequest.result;
      // 检查数据完整性：如果为空，或者数量少于默认数据数量，则视为需要初始化
      if (count === 0 || count < defaultData.length) {
        console.log(
          `IndexedDB status: ${
            count === 0 ? "Empty" : "Incomplete (found " + count + " items)"
          }. Initializing/Fixing data...`
        );
        isDataEmpty = true;

        // 如果是数据不完整，建议先清空（虽然 put 会覆盖，但 clear 更干净）
        if (count > 0) {
          store.clear();
        }

        defaultData.forEach((item) => {
          store.put(item); // 使用 put 确保覆盖或新增
        });
      } else {
        console.log(
          `IndexedDB has valid data count (${count} items), skipping init.`
        );
      }
    };

    countRequest.onerror = () => {
      console.error("Error checking data count");
      reject("Error checking data count");
    };

    // 无论是否写入数据，都等待事务完成
    transaction.oncomplete = () => {
      console.log("initData transaction completed.");
      resolve(isDataEmpty);
    };

    transaction.onerror = (event) => {
      console.error("Transaction error in initData:", event.target.error);
      reject("Transaction error: " + event.target.error);
    };
  });
};

export const getAllProducts = async () => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      // 此时 result 已经可用
      console.log(
        `getAllProducts success, found ${
          request.result ? request.result.length : 0
        } items.`
      );
    };

    request.onerror = () => {
      reject("Error getting products");
    };

    transaction.oncomplete = () => {
      resolve(request.result);
    };
  });
};

export const updateProduct = async (product) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(product); // 发起更新请求

    request.onsuccess = () => {
      // 请求成功，等待事务提交
    };

    // 监听事务完成，确保数据已持久化
    transaction.oncomplete = () => {
      console.log(
        `Product ${product.id} updated in DB successfully (Transaction Completed).`
      );
      resolve(product);
    };

    transaction.onerror = (event) => {
      console.error("Error updating product:", event.target.error);
      reject("Error updating product: " + event.target.error);
    };
  });
};
