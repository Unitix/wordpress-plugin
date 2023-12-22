<div class="wrap">
    <h1>Import products from merchi</h1>
    <p class="caution">
      Please do not navigate away from this page while fetching products from Merchi.
    </p>
    <div class="plugin-body">
      <div style="margin-bottom: 16px;">
        <progress id="merchi-progress" max="100" value="0"> </progress>
      </div>
      <p>Hit the "fetch" button below to retrieve your products from Merchi and add them to your Woocommerce store.</p>
      <input type="hidden" id="merchi_base_url" value="<?php echo $merchi_url; ?>" />
      <button id="merchi-fetch-button" class="button button-primary" style="margin-top: 2em">
        Fetch
      </button>
    </div>
</div>
<div class="wrap" style="display: none;">
    <div class="plugin-body">
      <p>Hit the "send" button below to send your products to Merchi from your Woocommerce store.</p>
      <div>
      </div>
      <button id="merchi-send-button" class="button button-primary" style="margin-top: 2em">
        Send
      </button>
    </div>
</div>
<div class="wrap plugin-import-errors" style="display: none;">
  <div class="plugin-error-list">
  </div>
</div>
<div class="wrap plugin-table-wrap" style="display: none;">
  <div class="plugin-products">
		<table class="plugin-table">
		</table>
    <div class="plugin-bulk" style="">
      <div class="plugin-bulk-check">
        <input type="checkbox" class="plugin-bulk-checkbox" id="merchi-all-products" value="false">
        <label for="merchi-all-products">All products</label>
      </div>
      <div class="plugin-bulk-check">
        <input type="checkbox" class="plugin-bulk-checkbox" id="merchi-new-products" value="false">
        <label for="merchi-new-products">New products</label>
      </div>
      <div class="plugin-bulk-check">
        <input type="checkbox" class="plugin-bulk-checkbox" id="merchi-new-data" value="false">
        <label for="merchi-new-data">New data</label>
      </div>
    </div>
  </div>
  <button type="button" id="merchi-sync-products" class="button button-primary" style="margin-top: 2em">
    Sync products
  </button>
</div>

<div id="snackbar"></div>
