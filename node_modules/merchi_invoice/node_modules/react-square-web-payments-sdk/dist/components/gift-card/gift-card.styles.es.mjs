import { keyframes as r, styled as o } from "../../stitches.config.es.mjs";
const e = r({
  "0%, 100%": {
    opacity: 1
  },
  "50%": {
    opacity: 0.5
  }
}), i = o("div", {
  animation: `${e()} 2s cubic-bezier(0.4, 0, 0.6, 1) infinite`,
  background: "#F3F4F6",
  borderRadius: 6,
  height: 50,
  marginBottom: 39,
  position: "relative"
}), n = o("button", {
  backgroundColor: "#006aff",
  borderRadius: 5,
  boxShadow: 1,
  color: "#fff",
  cursor: "pointer",
  borderStyle: "none",
  fontSize: 16,
  fontWeight: 500,
  lineHeight: "24px",
  outline: "none",
  padding: 12,
  userSelect: "none",
  width: "100%",
  "&:active": {
    backgroundColor: "rgb(0, 85, 204)"
  },
  "&:disabled": {
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    color: "rgba(0, 0, 0, 0.3)",
    cursor: "not-allowed"
  }
});
export {
  i as LoadingCard,
  n as PayButton
};
//# sourceMappingURL=gift-card.styles.es.mjs.map
