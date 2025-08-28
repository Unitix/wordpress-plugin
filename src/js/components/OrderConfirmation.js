import React from 'react';

const OrderConfirmation = () => {

  const rawOrderData = localStorage.getItem('MerchiOrder');


  if (!rawOrderData) {
    return (
      <div className="woocommerce">
        <p className="woocommerce-thankyou-order-received">
          Thank you. Your order has been received.
        </p>
        <p>No order data found.</p>
      </div>
    );
  }

  let orderInfo;
  try {
    orderInfo = JSON.parse(rawOrderData);
  } catch (err) {
    console.error("Failed to parse order data from localStorage:", err);
    return (
      <div className="woocommerce">
        <p className="woocommerce-thankyou-order-received">
          Thank you. Your order has been received.
        </p>
        <p>Order data corrupted or invalid.</p>
      </div>
    );
  }


  const {
    receiverAddress,
    cart,
    client,
  } = orderInfo;

  const shippingCost = cart.shipmentTotalCost;

  return (
    <div className="woocommerce">
      <ul className="woocommerce-order-overview woocommerce-thankyou-order-details order_details">
        <li className="woocommerce-order-overview__date date">
          Date: <strong>{new Date().toLocaleString(undefined, {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          })}</strong>
        </li>
        <li className="woocommerce-order-overview__total total">
          Total: <strong>${cart.totalCost.toFixed(2)}</strong>
        </li>
        <li className="woocommerce-order-overview__payment-method method">
          Payment method: <strong>Debit Card</strong>
        </li>
      </ul>

      <section className="woocommerce-order-details">
        <h2 className="woocommerce-order-details__title">Order details</h2>
        <table className="woocommerce-table woocommerce-table--order-details shop_table order_details">
          <thead>
            <tr>
              <th className="woocommerce-table__product-name">Product</th>
              <th
                className="woocommerce-table__product-thumbnail"
                style={{ width: '100%' }}
              ></th>
              <th className="woocommerce-table__product-total">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {cart.cartItems.map((item, index) => (
              <tr className="woocommerce-table__line-item order_item" key={index}>
                <td className="woocommerce-table__product-image" style={{ width: '100px', height: '100px' }}>
                  <img src={item.product.featureImage.viewUrl} alt={item.product.name} />
                </td>
                <td className="woocommerce-table__product-name">
                  {item.product.name} × {item.quantity}
                </td>
                <td className="woocommerce-table__product-total">
                  <span className="woocommerce-Price-amount amount">${item.totalCost.toFixed(2)}</span>
                </td>
              </tr>
            ))}
          </tbody>

          <tfoot>
            <tr>
              <th
                className="woocommerce-table__product-name"
                colSpan={2}
                style={{ textAlign: 'left' }}
              >
                Shipping
              </th>
              <td className="woocommerce-table__product-total">
                <span className="woocommerce-Price-amount amount">
                  ${shippingCost.toFixed(2)}
                </span>
              </td>
            </tr>
            {cart.discountItems && cart.discountItems.length > 0 && (
              <tr>
                <th
                  className="woocommerce-table__product-name"
                  colSpan={2}
                  style={{ textAlign: 'left' }}
                >
                  Discount
                </th>
                <td className="woocommerce-table__product-total">
                  <span className="woocommerce-Price-amount amount">
                    -${Math.abs(cart.discountItems.reduce((sum, item) => sum + item.cost, 0)).toFixed(2)}
                  </span>
                </td>
              </tr>
            )}
            <tr>
              <th
                className="woocommerce-table__product-name"
                colSpan={2}
                style={{ textAlign: 'left' }}
              >
                Total
              </th>
              <td className="woocommerce-table__product-total">
                <span className="woocommerce-Price-amount amount">
                  ${cart.totalCost.toFixed(2)}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </section>

      <section className="woocommerce-customer-details">
        <h2 className="woocommerce-column__title">Shipping address</h2>
        <address>
          {client.name} <br />
          {client.emailAddresses[0].emailAddress} <br />
          {receiverAddress.lineOne} <br />
          {receiverAddress.city}, {receiverAddress.postcode} <br />
          {receiverAddress.state} <br />
          {receiverAddress.country} <br />
        </address>
      </section>

      {orderInfo.orderNote && (
        <section className="woocommerce-order-note">
          <h2 className="woocommerce-column__title">Note</h2>
          <p>{orderInfo.orderNote}</p>
        </section>
      )}

    </div>
  );
};

export default OrderConfirmation;
