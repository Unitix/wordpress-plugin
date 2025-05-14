import { SqError } from './types';
/**
 * Exception thrown when use of a disabled feature is attempted
 */
declare class FeatureDisabledError extends SqError {
    constructor(featureName: string);
}
export { FeatureDisabledError };
