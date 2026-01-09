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

    let isDataEmpty = false;
    let shouldReset = false;

    const getAllRequest = store.getAll();
    getAllRequest.onsuccess = () => {
      const existing = Array.isArray(getAllRequest.result)
        ? getAllRequest.result
        : [];

      const existingIds = existing
        .map((item) => item?.id)
        .filter((id) => typeof id === "number")
        .sort((a, b) => a - b);
      const defaultIds = defaultData
        .map((item) => item?.id)
        .filter((id) => typeof id === "number")
        .sort((a, b) => a - b);

      if (existing.length === 0) {
        isDataEmpty = true;
        shouldReset = true;
      } else if (existing.length !== defaultData.length) {
        shouldReset = true;
      } else if (existingIds.join(",") !== defaultIds.join(",")) {
        shouldReset = true;
      }

      if (shouldReset) {
        console.log(
          `IndexedDB status: Resetting data (found ${existing.length} items, expected ${defaultData.length}).`
        );
        store.clear();
        defaultData.forEach((item) => {
          store.put(item);
        });
      } else {
        console.log(
          `IndexedDB has valid data (${existing.length} items), skipping init.`
        );
      }
    };

    getAllRequest.onerror = () => {
      console.error("Error getting products for init");
      reject("Error getting products for init");
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

export const clearAllProducts = async () => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => {
      // Request successful, wait for transaction to complete
    };

    transaction.oncomplete = () => {
      console.log("All products cleared from DB.");
      resolve();
    };

    transaction.onerror = (event) => {
      console.error("Error clearing products:", event.target.error);
      reject("Error clearing products: " + event.target.error);
    };
  });
};
