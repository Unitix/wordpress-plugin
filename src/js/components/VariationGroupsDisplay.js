import React, { useState } from 'react';
import { shouldShow, buildOptionInfoMap } from '../utils';

const FIELD_TYPE_FILE = 3;
const FIELD_TYPE_COLOR = 10;
const FIELD_TYPE_COLOR_SELECT = 11;

function ColorSwatch({ colour }) {
  if (!colour) return null;
  return (
    <span
      className="merchi-cart-color-swatch"
      style={{ backgroundColor: colour }}
      title={colour}
      aria-hidden="true"
    />
  );
}

function VariationValue({ v, optionInfoMap }) {
  const fieldType = v.variationField?.fieldType;

  // ── FILE UPLOAD ──────────────────────────────────────────────────────────
  if (fieldType === FIELD_TYPE_FILE) {
    const files = Array.isArray(v.variationFiles) ? v.variationFiles : [];
    if (files.length === 0) {
      const ids = String(v.value || '').split(',').filter(Boolean);
      return (
        <span className="wc-block-components-product-details__value">
          {ids.length ? `${ids.length} file${ids.length > 1 ? 's' : ''} uploaded` : '—'}
        </span>
      );
    }
    return (
      <span className="merchi-cart-files">
        {files.map((file, i) => {
          const name = file.originalFilename || file.name || 'File';
          const isImage = file.mimetype && file.mimetype.startsWith('image/');
          const href = file.viewUrl || file.downloadUrl || '#';
          return (
            <span key={i} className="merchi-cart-file-item">
              {isImage ? (
                <a href={href} target="_blank" rel="noopener noreferrer" className="merchi-cart-file-thumb-link">
                  <img
                    src={file.viewUrl}
                    alt={name}
                    className="merchi-cart-file-thumb"
                  />
                </a>
              ) : (
                <span className="merchi-cart-file-icon" aria-hidden="true">📄</span>
              )}
              <a
                href={file.downloadUrl || file.viewUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="merchi-cart-file-name"
                title={name}
              >
                {name}
              </a>
            </span>
          );
        })}
      </span>
    );
  }

  // ── COLOUR PICKER ────────────────────────────────────────────────────────
  if (fieldType === FIELD_TYPE_COLOR) {
    const hex = v.value || '#000000';
    return (
      <span className="merchi-cart-color-value">
        <ColorSwatch colour={hex} />
        <span className="wc-block-components-product-details__value">{hex}</span>
      </span>
    );
  }

  // ── COLOUR SELECT ────────────────────────────────────────────────────────
  if (fieldType === FIELD_TYPE_COLOR_SELECT) {
    if (Array.isArray(v.selectedOptions) && v.selectedOptions.length) {
      return (
        <span className="merchi-cart-color-options">
          {v.selectedOptions.map((o, i) => {
            const info = optionInfoMap.get(String(o.optionId));
            const name = info?.value || o.value || String(o.optionId);
            const colour = info?.colour;
            return (
              <span key={i} className="merchi-cart-color-option">
                <ColorSwatch colour={colour} />
                <span className="wc-block-components-product-details__value">{name}</span>
                {i < v.selectedOptions.length - 1 && <span>,&nbsp;</span>}
              </span>
            );
          })}
        </span>
      );
    }
  }

  // ── DEFAULT ───
  let value = '';
  if (Array.isArray(v.selectedOptions) && v.selectedOptions.length) {
    value = v.selectedOptions
      .map((o) => optionInfoMap.get(String(o.optionId))?.value || o.value || o.optionId)
      .join(', ');
  } else if (optionInfoMap.has(String(v.value))) {
    value = optionInfoMap.get(String(v.value))?.value;
  } else {
    value = v.value;
  }

  return (
    <span className="wc-block-components-product-details__value" style={{ whiteSpace: 'nowrap' }}>
      {value}
    </span>
  );
}

function VariationRow({ v, optionInfoMap, paddingLeft = 0 }) {
  const label = v.variationField?.name || 'Field';
  const slug = label.toLowerCase().replace(/\s+/g, '-');

  return (
    <li
      className={`wc-block-components-product-details__${slug}`}
      style={{ paddingLeft }}
    >
      <span className="wc-block-components-product-details__name" style={{ fontWeight: 400, marginRight: 8 }}>
        {label}:
      </span>
      <VariationValue v={v} optionInfoMap={optionInfoMap} />
    </li>
  );
}

export default function VariationGroupsDisplay({ product, variationsGroups = [], variations = [] }) {
  const hasGroups = Array.isArray(variationsGroups) && variationsGroups.length > 0;
  const hasVariations = Array.isArray(variations) && variations.length > 0;

  if (!hasGroups && !hasVariations) return null;

  const optionInfoMap = buildOptionInfoMap(product);

  const isCheckoutPage = window.location.pathname.includes('/checkout') ||
    document.body.classList.contains('woocommerce-checkout') ||
    window.location.href.includes('checkout');

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

              {(group.variations || []).filter(shouldShow).map((v, i) => (
                <VariationRow
                  key={`g${gIdx}-${i}`}
                  v={v}
                  optionInfoMap={optionInfoMap}
                  paddingLeft={16}
                />
              ))}

              {'quantity' in group && (
                <li
                  key={`g${gIdx}-qty`}
                  className="wc-block-components-product-details__quantity"
                  style={{ paddingLeft: 16 }}
                >
                  <span className="wc-block-components-product-details__name" style={{ fontWeight: 400, marginRight: 8 }}>
                    Quantity:
                  </span>
                  <span className="wc-block-components-product-details__value">{group.quantity}</span>
                </li>
              )}
            </React.Fragment>
          ))}

          {variations.filter(shouldShow).map((v, i) => (
            <VariationRow
              key={`v-${i}`}
              v={v}
              optionInfoMap={optionInfoMap}
              paddingLeft={0}
            />
          ))}
        </ul>
      </div>
    );
  }

  // ── CHECKOUT PAGE: collapsed by default ─────────────────────────────────
  const [showDetails, setShowDetails] = useState(false);

  const allFields = [];
  variationsGroups.forEach((group, gIdx) => {
    group.variations?.filter(shouldShow).forEach((v, i) => {
      allFields.push({ key: `g${gIdx}-${i}`, v, groupIndex: gIdx });
    });
    if ('quantity' in group) {
      allFields.push({ key: `g${gIdx}-qty`, v: null, quantity: group.quantity, groupIndex: gIdx });
    }
  });
  variations.filter(shouldShow).forEach((v, i) => {
    allFields.push({ key: `v-${i}`, v, groupIndex: -1 });
  });

  const maxFieldsToShow = 1;
  const fieldsToShow = showDetails ? allFields.length : Math.min(maxFieldsToShow, allFields.length);
  const shouldShowDetailsButton = allFields.length > 1;

  return (
    <div className="wc-block-components-product-metadata">
      <ul className="wc-block-components-product-details merchi-variation-list">
        {variationsGroups.length > 1 && (
          <li className="merchi-selection-group-label" style={{ fontWeight: 700, marginBottom: 4 }}>
            Group 1:
          </li>
        )}

        {allFields.slice(0, fieldsToShow).map((field, index) => {
          const showGroupLabel = showDetails &&
            variationsGroups.length > 1 &&
            field.groupIndex > 0 &&
            (field.groupIndex !== allFields[index - 1]?.groupIndex);

          if (field.quantity != null) {
            return (
              <React.Fragment key={field.key}>
                {showGroupLabel && (
                  <li className="merchi-selection-group-label" style={{ fontWeight: 700, marginTop: 12, marginBottom: 4 }}>
                    {`Group ${field.groupIndex + 1}:`}
                  </li>
                )}
                <li
                  className="wc-block-components-product-details__quantity"
                  style={{ paddingLeft: variationsGroups.length > 1 ? 16 : 0 }}
                >
                  <span className="wc-block-components-product-details__name" style={{ fontWeight: 400, marginRight: 8 }}>
                    Quantity:
                  </span>
                  <span className="wc-block-components-product-details__value">{field.quantity}</span>
                </li>
              </React.Fragment>
            );
          }

          return (
            <React.Fragment key={field.key}>
              {showGroupLabel && (
                <li className="merchi-selection-group-label" style={{ fontWeight: 700, marginTop: 12, marginBottom: 4 }}>
                  {`Group ${field.groupIndex + 1}:`}
                </li>
              )}
              <VariationRow
                v={field.v}
                optionInfoMap={optionInfoMap}
                paddingLeft={variationsGroups.length > 1 ? 16 : 0}
              />
            </React.Fragment>
          );
        })}

        {shouldShowDetailsButton && (
          <li key="toggle-details" style={{ marginTop: 4 }}>
            <button
              onClick={() => setShowDetails(!showDetails)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#666',
                textDecoration: 'underline',
                padding: 0,
                fontSize: '14px',
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
