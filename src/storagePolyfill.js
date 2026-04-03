// Polyfill window.storage using localStorage
// Replaces Claude's persistent storage API for standalone deployment
if (!window.storage) {
  window.storage = {
    async get(key) {
      const val = localStorage.getItem(`1i_${key}`);
      return val ? { key, value: val } : null;
    },
    async set(key, value) {
      localStorage.setItem(`1i_${key}`, value);
      return { key, value };
    },
    async delete(key) {
      localStorage.removeItem(`1i_${key}`);
      return { key, deleted: true };
    },
    async list(prefix) {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k.startsWith(`1i_${prefix || ''}`)) {
          keys.push(k.replace('1i_', ''));
        }
      }
      return { keys };
    },
  };
}
