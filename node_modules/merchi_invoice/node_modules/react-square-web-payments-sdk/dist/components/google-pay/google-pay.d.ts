/// <reference types="react" />
import type { GooglePayProps } from './google-pay.types';
/**
 * Renders a Google Pay button to use in the Square Web Payment SDK, pre-styled
 * to meet Google's branding guidelines.
 *
 * **Remember** that you need to set `createPaymentRequest()` in `SquareForm` if
 * you going to use this Payment Method
 *
 * @example
 *
 * ```tsx
 * function App() {
 *   return (
 *     <SquareForm {...props}>
 *       <GooglePay />
 *     </SquareForm>
 *   );
 * }
 * ```
 */
declare const GooglePay: ({ buttonColor, buttonSizeMode, buttonType, id, ...props }: GooglePayProps) => JSX.Element | null;
export default GooglePay;
export * from './google-pay.types';
//# sourceMappingURL=google-pay.d.ts.map