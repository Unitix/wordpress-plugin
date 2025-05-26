import React from 'react';

export default function ShippingOptions({ shipmentGroups, shipmentOptionsLoading }) {
  console.log(shipmentGroups);
  return (
    <>
      {shipmentOptionsLoading && <div>Loading...</div>}
      {shipmentGroups.length > 0 && (
        <div>
          <h2>Shipping Options</h2>
          <ul id="shipmentList">
            {shipmentGroups.map((shipmentGroup, index) => (
              <li key={shipmentGroup.id}>
                <h3>Shipment For {shipmentGroup?.cartItems.map(item => item.product.name).join(', ')}</h3>
                <ul>
                  {shipmentGroup?.quotes.map((quote) => (
                    <li key={quote.id}>
                      <h4>{quote.shipmentMethod.name}</h4>
                      <p>{quote.shipmentMethod.transportCompanyName}</p>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
