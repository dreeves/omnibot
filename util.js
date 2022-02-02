function splur(n, s, p=null) { return   n===1    ? `${n} ${s}`  // Singular or
                                      : p===null ? `${n} ${s}s` // plural or
                                      :            `${n} ${p}`  // irregular
}                                                               // plural.

module.exports = { splur }
