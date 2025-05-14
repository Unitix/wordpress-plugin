/// <reference types="react" />
import { AfterpayContext, AfterpayProvider } from '../../contexts/afterpay';
import type { AfterpayButtonProps, AfterpayMessageBaseProps, AfterpayMessageCustomComponentProps, AfterpayWidgetProps } from './afterpay.types';
export declare function AfterpayButton({ Button, buttonColor, buttonType, finalCtaButtonType, id, ...props }: AfterpayButtonProps): JSX.Element;
export declare function AfterpayMessage(props: AfterpayMessageBaseProps): JSX.Element;
export declare function AfterpayMessage(props: AfterpayMessageCustomComponentProps): JSX.Element;
export declare function AfterpayWidget({ includeBranding, id, ...props }: AfterpayWidgetProps): JSX.Element;
declare function Afterpay(props: AfterpayButtonProps): JSX.Element;
export { AfterpayContext, AfterpayProvider };
export default Afterpay;
export * from './afterpay.types';
//# sourceMappingURL=afterpay.d.ts.map