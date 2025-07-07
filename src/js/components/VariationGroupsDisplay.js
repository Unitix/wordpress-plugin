import React, { useState } from 'react';
import { shouldShow, buildOptionMap } from '../utils';

export default function VariationGroupsDisplay({ product, variationsGroups = [] }) {
  if (!Array.isArray(variationsGroups) || !variationsGroups.length) return null;

  const optionMap = buildOptionMap(product);

  // Check if current page is checkout
  const isCheckoutPage = window.location.pathname.includes('/checkout') ||
    document.body.classList.contains('woocommerce-checkout') ||
    window.location.href.includes('checkout');

  // State for showing details
  const [showDetails, setShowDetails] = useState(false);

  const toggleDetails = () => {
    setShowDetails(!showDetails);
  };

  const allFields = [];
  variationsGroups.forEach((group, gIdx) => {
    const filteredVariations = (group.variations || []).filter(shouldShow);

    filteredVariations.forEach((v, i) => {
      const label = v.variationField?.name || 'Field';
      const slug = label.toLowerCase().replace(/\s+/g, '-');

      let value = '';
      if (Array.isArray(v.selectedOptions) && v.selectedOptions.length) {
        value = v.selectedOptions
          .map((o) => optionMap.get(String(o.optionId)) || o.value || o.optionId)
          .join(', ');
      } else if (optionMap.has(String(v.value))) {
        value = optionMap.get(String(v.value));
      } else {
        value = v.value;
      }

      allFields.push({
        key: `${gIdx}-${i}`,
        label,
        value,
        slug,
        groupIndex: gIdx
      });
    });

    if ('quantity' in group) {
      allFields.push({
        key: `${gIdx}-qty`,
        label: 'Quantity',
        value: group.quantity,
        slug: 'quantity',
        groupIndex: gIdx
      });
    }
  });

  // show all fields without grouping (cart page)
  if (!isCheckoutPage) {
    return (
      <div className="wc-block-components-product-metadata">
        <ul className="wc-block-components-product-details merchi-variation-list">
          {variationsGroups.map((group, gIdx) => (
            <React.Fragment key={`grp-${gIdx}`}>
              <li
                className="merchi-selection-group-label"
                style={{ fontWeight: 700, marginTop: gIdx ? 12 : 0, marginBottom: 4 }}
              >
                {`Group ${gIdx + 1}:`}
              </li>

              {(group.variations || [])
                .filter(shouldShow)
                .map((v, i) => {
                  const label = v.variationField?.name || 'Field';
                  const slug = label.toLowerCase().replace(/\s+/g, '-');

                  let value = '';
                  if (Array.isArray(v.selectedOptions) && v.selectedOptions.length) {
                    value = v.selectedOptions
                      .map((o) => optionMap.get(String(o.optionId)) || o.value || o.optionId)
                      .join(', ');
                  } else if (optionMap.has(String(v.value))) {
                    value = optionMap.get(String(v.value));
                  } else {
                    value = v.value;
                  }

                  return (
                    <li key={`${gIdx}-${i}`} className={`wc-block-components-product-details__${slug}`} style={{ paddingLeft: 16 }}>
                      <span className="wc-block-components-product-details__name" style={{ fontWeight: 400, marginRight: 4 }}>
                        {label}: </span>
                      <span className="wc-block-components-product-details__value"
                        style={{ whiteSpace: 'nowrap' }}>{value}</span>
                    </li>
                  );
                })}

              {'quantity' in group && (
                <li key={`${gIdx}-qty`} className="wc-block-components-product-details__quantity" style={{ paddingLeft: 16 }}>
                  <span className="wc-block-components-product-details__name" style={{ fontWeight: 400, marginRight: 4 }}>
                    Quantity: </span>
                  <span className="wc-block-components-product-details__value">{group.quantity}</span>
                </li>
              )}
            </React.Fragment>
          ))}
        </ul>
      </div>
    );
  }

  const fieldsToShow = showDetails ? allFields.length : Math.min(3, allFields.length);
  const shouldShowDetailsButton = allFields.length > 3;

  return (
    <div className="wc-block-components-product-metadata">
      <ul className="wc-block-components-product-details merchi-variation-list">
        {variationsGroups.length > 1 && (
          <li
            className="merchi-selection-group-label"
            style={{ fontWeight: 700, marginBottom: 4 }}
          >
            Group 1:
          </li>
        )}

        {allFields.slice(0, fieldsToShow).map((field, index) => {
          const showGroupLabel = showDetails &&
            variationsGroups.length > 1 &&
            field.groupIndex > 0 &&
            (field.groupIndex !== allFields[index - 1]?.groupIndex);

          return (
            <React.Fragment key={field.key}>
              {showGroupLabel && (
                <li
                  className="merchi-selection-group-label"
                  style={{ fontWeight: 700, marginTop: 12, marginBottom: 4 }}
                >
                  {`Group ${field.groupIndex + 1}:`}
                </li>
              )}
              <li
                className={`wc-block-components-product-details__${field.slug}`}
                style={{ paddingLeft: variationsGroups.length > 1 ? 16 : 0 }}
              >
                <span className="wc-block-components-product-details__name" style={{ fontWeight: 400, marginRight: 4 }}>
                  {field.label}: </span>
                <span className="wc-block-components-product-details__value"
                  style={{ whiteSpace: 'nowrap' }}>{field.value}</span>
              </li>
            </React.Fragment>
          );
        })}

        {shouldShowDetailsButton && (
          <li key="toggle-details" style={{ marginTop: 4 }}>
            <button
              onClick={toggleDetails}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#666',
                textDecoration: 'underline',
                padding: 0,
                fontSize: '14px'
              }}
            >
              {showDetails ? '[-] Hide' : '[+] Show Details'}
            </button>
          </li>
        )}
      </ul>
    </div>
  );
}
