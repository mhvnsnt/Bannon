export class LRUCache<K, V> {
  private capacity: number;
  private cache: Map<K, V>;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.cache = new Map<K, V>();
  }

  get(key: K): V | undefined {
    if (!this.cache.has(key)) {
      return undefined;
    }
    const val = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, val);
    return val;
  }

  set(key: K, value: V) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  clear() {
    this.cache.clear();
  }

  toJSON(): [K, V][] {
    return Array.from(this.cache.entries());
  }

  fromJSON(entries: [K, V][]) {
    this.cache.clear();
    if (!Array.isArray(entries)) return;
    for (const item of entries) {
      if (Array.isArray(item) && item.length === 2) {
        this.cache.set(item[0], item[1]);
      }
    }
  }
}
