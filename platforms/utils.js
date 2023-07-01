function hasKeysExclusively(object, keys) {
    const sortedKeys = keys.sort();
    return Object.keys(object)
        .sort()
        .every((v, k) => sortedKeys[k] === v);
}

module.exports = { hasKeysExclusively };
