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
