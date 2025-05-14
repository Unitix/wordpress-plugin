/// <reference types="react" />
import type { GiftCardBase, GiftCardFunctionChildren, GiftCardWithChildren } from './gift-card.types';
/**
 * Renders a Gift Card Input to use in the Square Web Payment SDK, pre-styled to
 * meet Square branding guidelines.
 *
 * **_But with the option to override styles_**
 *
 * @example
 *
 * ```tsx
 * function App() {
 *   return (
 *     <SquareForm {...props}>
 *       <GiftCard />
 *     </SquareForm>
 *   );
 * }
 * ```
 */
declare function GiftCard(props: GiftCardBase): JSX.Element;
declare function GiftCard(props: GiftCardFunctionChildren): JSX.Element;
declare function GiftCard(props: GiftCardWithChildren): JSX.Element;
export default GiftCard;
export * from './gift-card.types';
//# sourceMappingURL=gift-card.d.ts.map