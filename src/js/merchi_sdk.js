import merchi from 'merchi_sdk_js';
import {
  backendUri,
  stagingBackendUri
} from './utils';

export const MERCHI_SDK = () => {
  return merchi;
}

export const MERCHI_API_URL = () => {
  const isStaging =
    window.merchiConfig?.stagingMode || 
    (window.scriptData && window.scriptData.merchi_mode === 'staging');
  return isStaging ? stagingBackendUri : backendUri;
}
