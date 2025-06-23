import React from 'react';
import { shouldShow, buildOptionMap } from '../utils';

export default function VariationGroupsDisplay({ product, variationsGroups = [] }) {
  if (!Array.isArray(variationsGroups) || !variationsGroups.length) return null;

  const optionMap = buildOptionMap(product);

  return (
    <div className="wc-block-components-product-metadata">
      <ul className="wc-block-components-product-details merchi-variation-list">
        {variationsGroups.map((group, gIdx) => (
          <React.Fragment key={`grp-${gIdx}`}>
            <li
              className="merchi-selection-group-label"
              style={{ fontWeight: 700, marginTop: gIdx ? 6 : 0, marginBottom: 4 }}
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

                // if (/^#[0-9a-f]{6}$/i.test(value)) {
                //   value = (
                //     <>
                //       <span style={{
                //         display: 'inline-block', width: 14, height: 14, marginRight: 4,
                //         border: '1px solid #ccc', verticalAlign: 'middle', background: value
                //       }} />
                //       {value}
                //     </>
                //   );
                // }

                return (
                  <li key={`${gIdx}-${i}`} className={`wc-block-components-product-details__${slug}`}>
                    <span className="wc-block-components-product-details__name" style={{ fontWeight: 400 }}>
                      {label}: </span>
                    <span className="wc-block-components-product-details__value">{value}</span>
                  </li>
                );
              })}

            {'quantity' in group && (
              <li key={`${gIdx}-qty`} className="wc-block-components-product-details__quantity">
                <span className="wc-block-components-product-details__name" style={{ fontWeight: 400 }}>
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
