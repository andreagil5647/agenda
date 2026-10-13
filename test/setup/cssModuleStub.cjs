// Stands in for a CSS Module under Jest: `styles.panel` is the string "panel".
module.exports = new Proxy(
  {},
  {
    get: (_target, className) => (className === '__esModule' ? false : String(className)),
  },
);
