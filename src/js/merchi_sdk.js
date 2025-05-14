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
  const stagingMode = window.merchiConfig.stagingMode;
  return stagingMode ? StagingMerchi : Merchi;
}
