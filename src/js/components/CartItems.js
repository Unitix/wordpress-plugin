import React from 'react';

export default function CartItems({ cartItems, onRemove }) {
  if (!cartItems?.length) return null;

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
          {cartItems.map((item) => {
            const { product = {}, quantity = 1 } = item;
            const thumb =
              product.featureImage?.viewUrl ||
              product.previewImageUrl ||
              product.image ||
              'https://woocommerce.com/wp-content/plugins/woocommerce/assets/images/placeholder.png';
            const name = product.name || 'Product';
            const total = item.totalCost ?? item.cost ?? 0;

            return (
              <tr key={item.cartUid ?? item.key ?? product.id} className="wc-block-cart-items__row" tabIndex={-1}>
                <td className="wc-block-cart-item__image" aria-hidden="true">
                  <a href={product.url || '#'} tabIndex={-1}><img src={thumb} alt="" /></a>
                </td>
                <td className="wc-block-cart-item__product">
                  <div className="wc-block-cart-item__wrap">
                    <span className="wc-block-components-product-name">{name}</span>
                    {/* <div className="wc-block-cart-item__prices">
                      <span className="wc-block-components-product-price merchi-unit-price">
                        <span className="wc-block-formatted-money-amount wc-block-components-formatted-money-amount">{`$${unitPrice.toFixed(2)}`}</span>
                      </span>
                    </div> */}
                    <div className="wc-block-cart-item__quantity">
                      <div style={{ marginTop: 4 }}>
                        Quantity:&nbsp;{quantity}
                      </div>
                      <button
                        className="wc-block-cart-item__remove-link"
                        aria-label={`Remove ${name} from cart`}
                        onClick={() => onRemove(item)}
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
