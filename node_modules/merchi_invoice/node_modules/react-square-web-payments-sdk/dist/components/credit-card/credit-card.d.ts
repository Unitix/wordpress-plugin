/// <reference types="react" />
import type { CreditCardBase, CreditCardChildren, CreditCardFunctionChildren } from './credit-card.types';
/**
 * Renders a Credit Card Input to use in the Square Web Payment SDK, pre-styled
 * to meet Square branding guidelines.
 *
 * **_But with the option to override styles_**
 *
 * @example
 *
 * ```tsx
 * function App() {
 *   return (
 *     <SquareForm {...props}>
 *       <CreditCard />
 *     </SquareForm>
 *   );
 * }
 * ```
 */
declare function CreditCard(props: CreditCardBase): JSX.Element;
declare function CreditCard(props: CreditCardChildren): JSX.Element;
declare function CreditCard(props: CreditCardFunctionChildren): JSX.Element;
export default CreditCard;
export * from './credit-card.types';
//# sourceMappingURL=credit-card.d.ts.map