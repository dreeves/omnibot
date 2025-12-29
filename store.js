const fs = require("node:fs");
const path = require("node:path");

let loaded = false;
const storePath = path.join(process.cwd(), "store.json");
let store = {};

function write() { fs.writeFileSync(storePath, JSON.stringify(store, null, 4)) }

function load() {
  if (!fs.existsSync(storePath)) { write() }
  if (!loaded) {
    const rawStore = fs.readFileSync(storePath);
    store = JSON.parse(rawStore);
    loaded = true;
  }
}

function set(key, val) { load();     store[key] = val;  write() }
function get(key)      { load();     return store[key]          }
function del(key)      { load();     delete store[key]; write() }
function clear()       { store = {};                    write() }

module.exports = { set, get, del, clear };
