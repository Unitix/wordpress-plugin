import { useEffect } from 'react';

export const backendUri = 'https://api.merchi.co/';
export const websocketServer = 'https://websockets.merchi.co/';

export const stagingBackendUri = 'https://api.staging.merchi.co/';
export const stagingWebsocketServer = 'https://websockets.staging.merchi.co/';

export const cartShipmentQuote = {
  shipmentMethod: { originAddress: {}, taxType: {} },
};

export const optionsEmbed = {
  options: {
    linkedFile: {},
    variationCostDiscountGroup: {},
    variationUnitCostDiscountGroup: {},
  },
  variationCostDiscountGroup: {},
  variationUnitCostDiscountGroup: {},
};

export const variationsEmbed = {
  selectedOptions: {},
  variationField: optionsEmbed,
  variationFiles: {},
};

export const variationsGroupsEmbed = {
  variations: variationsEmbed,
};

export const productWithImagesEmbed = {
  domain: { company: { defaultTaxType: {}, taxTypes: {} } },
  featureImage: {},
  groupVariationFields: { options: { linkedFile: {} } },
  images: {},
  independentVariationFields: { options: { linkedFile: {} } },
  taxType: {},
};

export const cartEmbed = {
  cartItems: {
    product: productWithImagesEmbed,
    taxType: {},
    variations: variationsEmbed,
    variationsGroups: variationsGroupsEmbed,
  },
  client: { emailAddresses: {}, profilePicture: {} },
  clientCompany: {},
  domain: {
    company: {
      defaultTaxType: {},
      isStripeAccountEnabled: {},
      taxTypes: {},
    },
  },
  invoice: {},
  receiverAddress: {},
  shipmentGroups: {
    cartItems: { product: {} },
    quotes: cartShipmentQuote,
    selectedQuote: cartShipmentQuote,
  },
};

export function getCookieByName(name) {
  const cookies = document.cookie.split(";");

  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    if (cookie.startsWith(name + "=")) {
      return cookie.substring(name.length + 1);
    }
  }

  return null; // Cookie not found
}

export default function useWooActive() {
  useEffect(() => {
    var INPUT = '.wc-block-components-text-input__input';
    var WRAP = '.wc-block-components-text-input';

    function toggle(el, force) {
      var w = el.closest(WRAP);
      if (w) w.classList.toggle('is-active', force ?? !!el.value);
    }

    function onFocus(e) { if (e.target.matches(INPUT)) toggle(e.target, true); }
    function onBlur(e) { if (e.target.matches(INPUT)) toggle(e.target); }
    function onInput(e) { if (e.target.matches(INPUT)) toggle(e.target); }

    document.addEventListener('focusin', onFocus);
    document.addEventListener('focusout', onBlur);
    document.addEventListener('input', onInput);
    document.addEventListener('change', onInput);

    return () => {
      document.removeEventListener('focusin', onFocus);
      document.removeEventListener('focusout', onBlur);
      document.removeEventListener('input', onInput);
      document.removeEventListener('change', onInput);
    };
  }, []);
}
