import React from 'react';
import VariationGroupsDisplay from './VariationGroupsDisplay'
import { useCart } from '../contexts/CartContext';

export default function CartItems({ onRemove }) {
  const { cartItems } = useCart();
  if (!cartItems?.length) return null;

  const getWooKey = (item, idx) => {
    const list = (window.scriptData && (window.scriptData.wooCartDat || window.scriptData.wooCartData)) || [];
    const merchiId = item?.id || item?.merchi_cart_item_id;
    if (merchiId != null) {
      const found = list.find((row) => String(row.merchi_cart_item_id) === String(merchiId));
      if (found && found.key) return found.key;
    }
    if (typeof idx === 'number' && list[idx] && list[idx].key) return list[idx].key;
    return null;
  };

  return (
    <div className="wc-block-components-main wc-block-cart__main wp-block-woocommerce-cart-items-block">
      <table className="wc-block-cart-items wp-block-woocommerce-cart-line-items-block" tabIndex="-1">
        <caption className="screen-reader-text">
          <h2>Products in cart</h2>
        </caption>
        <thead>
          <tr className="wc-block-cart-items__header">
            <th className="wc-block-cart-items__header-image"><span>Product</span></th>
            <th className="wc-block-cart-items__header-product"><span>Details</span></th>
            <th className="wc-block-cart-items__header-total"><span>Total</span></th>
          </tr>
        </thead>
        <tbody>
          {cartItems.map((item, idx) => {
            const { product = {} } = item;
            const thumb =
              product.featureImage?.viewUrl ||
              product.images?.[0]?.viewUrl ||
              'https://woocommerce.com/wp-content/plugins/woocommerce/assets/images/placeholder.png';
            const name = product.name || 'Product';
            const total = item.totalCost ?? 0;

            const wooKey = getWooKey(item, idx);

            return (
              <tr key={item.cartUid ?? item.key ?? product.id} className="wc-block-cart-items__row" tabIndex={-1}>
                <td className="wc-block-cart-item__image" aria-hidden="true">
                  <a href={product.url || '#'} tabIndex={-1}><img src={thumb} alt="" /></a>
                </td>
                <td className="wc-block-cart-item__product">
                  <div className="wc-block-cart-item__wrap">
                    <span className="wc-block-components-product-name">{name}</span>
                    <VariationGroupsDisplay
                      product={product}
                      variationsGroups={item.variationsGroups}
                    />
                    <div className="wc-block-cart-item__quantity">
                      <button
                        className="wc-block-cart-item__remove-link"
                        aria-label={`Remove ${name} from cart`}
                        onClick={() => onRemove(item, idx, wooKey)}
                      >
                        Remove item
                      </button>
                    </div>
                  </div>
                </td>

                <td className="wc-block-cart-item__total">
                  <span className="price wc-block-components-product-price">
                    <span className="wc-block-components-product-price__value">
                      {`$${total.toFixed(2)}`}
                    </span>
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
