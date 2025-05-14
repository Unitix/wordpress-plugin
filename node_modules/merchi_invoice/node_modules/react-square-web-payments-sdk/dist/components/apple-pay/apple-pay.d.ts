/// <reference types="react" />
import type { ApplePayProps } from './apple-pay.types';
/**
 * Renders a Apple Pay button to use in the Square Web Payment SDK, pre-styled
 * to meet Apple Pay's branding guidelines.
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
 *       <ApplePay />
 *     </SquareForm>
 *   );
 * }
 * ```
 */
declare function ApplePay({ id, ...props }: ApplePayProps): JSX.Element;
export default ApplePay;
export * from './apple-pay.types';
//# sourceMappingURL=apple-pay.d.ts.map