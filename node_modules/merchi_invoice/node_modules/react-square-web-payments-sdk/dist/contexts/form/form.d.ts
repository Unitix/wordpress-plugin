import * as React from 'react';
import type { FormContextType, FormProviderProps } from './form.types';
/**
 * Internal helper that the `PaymentForm` uses to manage internal state and
 * expose access to the Web Payment SDK library.
 */
declare const FormContext: React.Context<FormContextType>;
declare function FormProvider({ applicationId, locationId, children, overrides, ...props }: FormProviderProps): JSX.Element | null;
declare const useForm: () => FormContextType;
export { FormContext, useForm };
export default FormProvider;
//# sourceMappingURL=form.d.ts.map