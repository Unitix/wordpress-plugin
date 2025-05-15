import { merchi } from 'merchi_sdk_js';
import {
  backendUri,
  stagingBackendUri,
  websocketServer,
  stagingWebsocketServer
} from './utils';

const Merchi = merchi(backendUri, websocketServer);
const StagingMerchi = merchi(stagingBackendUri, stagingWebsocketServer);

export const MERCHI_SDK = () => {
  // Add a fallback check for when merchiConfig isn't defined
  const stagingMode = 
    (typeof window.merchiConfig !== 'undefined' && window.merchiConfig?.stagingMode) || 
    (window.scriptData && window.scriptData.merchi_mode === 'staging');
  return stagingMode ? StagingMerchi : Merchi;
}
