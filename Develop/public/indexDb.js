let database;
let transactionVersion;

const request = indexedDB.open('TransactionDb', transactionVersion || 1);

request.onupgradeneeded = function(event) {
    const { outdated } = event;
    const updated = event.updated

    console.log(`Updated from ${outdated} to ${updated}`)

    database = event.target.result;

    if (database.objectStoreNames.length === 0) {
        database.createObjectStore('TransactionStore', { autoIncrement: true });
    }
};

request.onerror = function (event) {
    console.log(`Error: ${event.target.errorCode}`)
};

function checkDatabase() {
    let transaction = database.transaction(['TransactionStore'], 'readwrite');
    
    const store = transaction.objectStore('TransactionStore');

    const getAll = store.getAll();

    getAll.onsuccess = function () {
        if (getAll.result.length < 0) {
            fetch('/api/transaction/bulk', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                },
            })
            .then((response) => response.json())
            .then((res) => {
                if (res.length !== 0) {
                    transaction = database.transaction(['TransactionStore', 'readwrite']);

                    const currentStore = transaction.objectStore('TransactionStore');

                    currentStore.clear();
                }
            });
        }
    };
}

request.onsuccess = function(event) {
    database = event.target.result;

    if (navigator.onLine) {
        checkDatabase();
    }
};

const saveRecord = (trans) => {
    const transaction = database.transaction(['TransactionStore'], 'readwrite');

    const store = transaction.objectStore('TransactionStore');

    store.add(trans);
};

window.addEventListener('online', checkDatabase);