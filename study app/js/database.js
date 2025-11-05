// Database setup using IndexedDB
class Database {
    constructor() {
        this.dbName = 'StudyAppDB';
        this.version = 3;
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                const transaction = event.target.transaction;

                // Users table
                if (!db.objectStoreNames.contains('users')) {
                    const userStore = db.createObjectStore('users', { keyPath: 'id', autoIncrement: true });
                    userStore.createIndex('username', 'username', { unique: true });
                }

                // Study records table
                if (!db.objectStoreNames.contains('studyRecords')) {
                    const studyStore = db.createObjectStore('studyRecords', { keyPath: 'id', autoIncrement: true });
                    studyStore.createIndex('userId', 'userId', { unique: false });
                    studyStore.createIndex('subject', 'subject', { unique: false });
                    studyStore.createIndex('date', 'date', { unique: false });
                }

                // Tests table
                if (!db.objectStoreNames.contains('tests')) {
                    const testStore = db.createObjectStore('tests', { keyPath: 'id', autoIncrement: true });
                    testStore.createIndex('userId', 'userId', { unique: false });
                    testStore.createIndex('testNo', 'testNo', { unique: false });
                    testStore.createIndex('testDate', 'testDate', { unique: false });
                }

                // Test subjects table
                if (!db.objectStoreNames.contains('testSubjects')) {
                    const subjectStore = db.createObjectStore('testSubjects', { keyPath: 'id', autoIncrement: true });
                    subjectStore.createIndex('testId', 'testId', { unique: false });
                }

                // Custom subjects table
                if (!db.objectStoreNames.contains('customSubjects')) {
                    const customSubjectStore = db.createObjectStore('customSubjects', { keyPath: 'id', autoIncrement: true });
                    customSubjectStore.createIndex('userId', 'userId', { unique: false });
                }

                // Test batches table
                if (!db.objectStoreNames.contains('testBatches')) {
                    const batchStore = db.createObjectStore('testBatches', { keyPath: 'id', autoIncrement: true });
                    batchStore.createIndex('userId', 'userId', { unique: false });
                }

                // Update tests table to include batchId and testDate
                if (event.oldVersion < 2 && db.objectStoreNames.contains('tests')) {
                    const testStore = transaction.objectStore('tests');
                    try {
                        testStore.createIndex('batchId', 'batchId', { unique: false });
                    } catch (e) {
                        // Index might already exist
                    }
                }
                if (event.oldVersion < 3 && db.objectStoreNames.contains('tests')) {
                    const testStore = transaction.objectStore('tests');
                    try {
                        testStore.createIndex('testDate', 'testDate', { unique: false });
                    } catch (e) {
                        // Index might already exist
                    }
                }
            };
        });
    }

    async add(storeName, data) {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        return new Promise((resolve, reject) => {
            const request = store.add(data);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async get(storeName, id) {
        const transaction = this.db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        return new Promise((resolve, reject) => {
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAll(storeName, indexName = null, value = null) {
        const transaction = this.db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        
        return new Promise((resolve, reject) => {
            let request;
            if (indexName && value !== null) {
                const index = store.index(indexName);
                request = index.getAll(value);
            } else {
                request = store.getAll();
            }
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async update(storeName, id, data) {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        return new Promise((resolve, reject) => {
            const request = store.put({ ...data, id });
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async delete(storeName, id) {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        return new Promise((resolve, reject) => {
            const request = store.delete(id);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async getByIndex(storeName, indexName, value) {
        const transaction = this.db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const index = store.index(indexName);
        
        return new Promise((resolve, reject) => {
            const request = index.get(value);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAllByIndex(storeName, indexName, value) {
        const transaction = this.db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const index = store.index(indexName);
        
        return new Promise((resolve, reject) => {
            const request = index.getAll(value);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
}

const db = new Database();

