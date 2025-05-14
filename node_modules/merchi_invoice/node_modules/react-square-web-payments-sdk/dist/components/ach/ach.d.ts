import * as React from 'react';
import type { AchWithChildrenProps, AchWithoutChildrenProps } from './ach.types';
/**
 * Renders a ACH button to use in the Square Web Payment SDK, pre-styled to meet
 * Square branding guidelines.
 *
 * **_But with the option to override styles or use a custom children_**
 *
 * @example
 *
 * ```tsx
 * function App() {
 *   return (
 *     <SquareForm {...props}>
 *       <Ach />
 *     </SquareForm>
 *   );
 * }
 * ```
 */
export declare function Ach(props: AchWithChildrenProps): React.ReactElement;
export declare function Ach(props: AchWithoutChildrenProps): React.ReactElement;
export default Ach;
export * from './ach.types';
//# sourceMappingURL=ach.d.ts.map