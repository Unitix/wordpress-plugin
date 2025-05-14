import * as React from 'react';
import type * as Square from '@square/web-sdk';
import type { AfterpayProviderProps } from './afterpay.types';
export declare const AfterpayContext: React.Context<Square.AfterpayClearpay | null | undefined>;
declare function AfterpayProvider({ children, onShippingAddressChange, onShippingOptionChange }: AfterpayProviderProps): JSX.Element;
export declare function useAfterpay(): Square.AfterpayClearpay | null;
export default AfterpayProvider;
//# sourceMappingURL=afterpay.d.ts.map