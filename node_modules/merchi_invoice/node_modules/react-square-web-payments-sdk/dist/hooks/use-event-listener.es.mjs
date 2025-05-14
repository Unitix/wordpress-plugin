import * as t from "react";
const i = (e) => e && "current" in e ? e.current : e, d = !(typeof window < "u" && window.document?.createElement);
function f({ type: e, listener: s, element: c = d ? void 0 : window, options: u }) {
  const o = t.useRef();
  t.useEffect(() => {
    o.current = s;
  }, [s]);
  const r = t.useCallback((n) => {
    o.current?.(n);
  }, []);
  t.useEffect(() => {
    const n = i(c);
    return n?.addEventListener(e, r, u), () => n?.removeEventListener(e, r);
  }, [e, c, u, r]);
}
export {
  i as getRefElement,
  f as useEventListener
};
//# sourceMappingURL=use-event-listener.es.mjs.map
