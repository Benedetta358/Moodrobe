const DB = "moodrobe-private";
let connection;
function database() {
  if (!connection)
    connection = new Promise((resolve, reject) => {
      if (!window.indexedDB) return reject(Error("IndexedDB unavailable"));
      const request = indexedDB.open(DB, 1);
      request.onupgradeneeded = () => request.result.createObjectStore("state");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(Error("Storage blocked"));
    });
  return connection;
}
export async function loadState() {
  try {
    const db = await database();
    return await new Promise((resolve, reject) => {
      const request = db
        .transaction("state")
        .objectStore("state")
        .get("current");
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return null;
  }
}
export async function saveState(state) {
  try {
    const db = await database();
    await new Promise((resolve, reject) => {
      const tx = db.transaction("state", "readwrite");
      tx.objectStore("state").put(state, "current");
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
    try {
      const current = JSON.parse(localStorage.getItem("moodrobe-v1") || "null");
      if (
        !current ||
        !current.updatedAt ||
        current.updatedAt <= (state.updatedAt || 0)
      )
        localStorage.setItem(
          "moodrobe-v1",
          JSON.stringify({
            ...state,
            items: state.items.map(({ image, ...i }) => i),
          }),
        );
    } catch {
      /* IndexedDB remains the source of truth. */
    }
    return "indexeddb";
  } catch {
    localStorage.setItem("moodrobe-v1", JSON.stringify(state));
    return "localstorage";
  }
}
