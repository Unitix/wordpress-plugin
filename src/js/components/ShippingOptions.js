import React from 'react';

export default function ShippingOptions({ shipmentGroups, shipmentOptionsLoading }) {
  return (
    <>
      {shipmentOptionsLoading && <div>Loading...</div>}
      {shipmentGroups.length > 0 && (
        <div>
          <h2>Shipping Options</h2>
          <ul id="shipmentList">
            {shipmentGroups.map((shipmentGroup, index) => (
              <li key={shipmentGroup.id}>
                <h3>{shipmentGroup.name}</h3>
                <ul>
                  
                </ul>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
