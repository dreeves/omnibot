function hasKeysExclusively(object, keys) {
    const sortedKeys = keys.sort();
    const sortedObjectKeys = Object.keys(object).sort();
    return (
        sortedKeys.length === sortedObjectKeys.length &&
        sortedObjectKeys.every((v, k) => sortedKeys[k] === v)
    );
}

module.exports = { hasKeysExclusively };
