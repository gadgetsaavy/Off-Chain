class Cache {
    constructor(ttl = 60000) { // Default TTL (Time to Live) is 60 seconds
        this.ttl = ttl;
        this.cache = new Map();
    }

    set(key, value) {
        const now = Date.now();
        this.cache.set(key, { value, expiry: now + this.ttl });
    }

    get(key) {
        const now = Date.now();
        const cached = this.cache.get(key);

        if (cached && cached.expiry > now) {
            return cached.value;
        } else {
            this.cache.delete(key);
            return null;
        }
    }

    clear() {
        this.cache.clear();
    }
}

module.exports = Cache;