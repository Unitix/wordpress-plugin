<?php declare(strict_types=1);
/**
 * @package  MerchiPlugin
 */

namespace MerchiPlugin\Api\Callbacks;
use \MerchiPlugin\Base\MerchiProductImportListtable as MerchiProductImportListtable;
use \MerchiPlugin\Base\MerchiProductExportList as MerchiProductExportList;
use MerchiPlugin\Base\BaseController;

class AdminCallbacks extends BaseController {


	public function adminDashboard() {
		return require_once( "$this->plugin_path/templates/admin.php" );
	}


	public function adminCpt() {
		if( get_option( 'merchi_staging_mode' ) == 'yes' ) {
			$merchi_url = 'https://api.staging.merchi.co/';
		}
		else {
			$merchi_url = 'https://api.merchi.co/';
		}
		return require_once( "$this->plugin_path/templates/cpt.php" );
	}

	//code by navneet start here.....
	public function adminMerchiProductImport() {
		?>
        <div class="wrap">
            <h2>Merchi Product List</h2>
            <form method="post" action="">
                <?php
                $my_products_list = new MerchiProductImportListtable();
                $my_products_list->prepare_items();
                $my_products_list->display();
                $my_products_list->process_bulk_action();
                ?>
            </form>
        </div>
    <?php
	}

	public function adminMerchiProductExport() {
		?>
		<div class="wrap">
			<h2>Export Products</h2>
			<form method="post" action="">
				<?php
				$my_products_list = new MerchiProductExportList();
				$my_products_list->prepare_items();
				$my_products_list->display();
				$my_products_list->process_bulk_action();
				?>
			</form>
		</div>
		<?php
	}
	//code by navneet end here.....


	public function merchiOptionsGroup( $input ) {
		return $input;
	}


	public function merchiAdminSection() {
		echo 'Update your Merchi settings';
		//$current_currency = get_option('woocommerce_currency');
		//echo $current_currency;
	}


	// phpcs:disable WordPress.Security.EscapeOutput.OutputNotEscaped
	public function merchiStoreUrl() {
		$value = esc_attr( get_option( 'merchi_url' ) );
		echo '<input type="text" class="regular-text" name="merchi_url" value="' . $value . '" placeholder="00">';
	}

	public function merchiApiSecret() {
		$value = esc_attr( get_option( 'merchi_api_secret' ) );
		echo '<input type="password" class="regular-text" name="merchi_api_secret" value="' . $value . '" placeholder="xxxxx">';
	}

	public function stagingMerchiStoreUrl() {
		$value = esc_attr( get_option( 'staging_merchi_url' ) );
		echo '<input type="text" class="regular-text" name="staging_merchi_url" value="' . $value . '" placeholder="00">';
	}

	public function stagingMerchiApiSecret() {
		$value = esc_attr( get_option( 'staging_merchi_api_secret' ) );
		echo '<input type="password" class="regular-text" name="staging_merchi_api_secret" value="' . $value . '" placeholder="xxxxx">';
	}

	public function merchiMountPointId() {
		$value = esc_attr( get_option( 'merchi_mount_point_id' ) );
		echo '<input type="text" class="regular-text" name="merchi_mount_point_id" value="' . $value . '" placeholder="example_class">';
	}

	public function merchiRedirectURL() {
		$value = esc_attr( get_option( 'merchi_redirect_url' ) );
		echo '<input type="text" class="regular-text" name="merchi_redirect_url" value="' . $value . '" placeholder="https://example.com/success">';
	}

	public function merchiRedirectURLQuote() {
		$value = esc_attr( get_option( 'merchi_redirect_url_quote' ) );
		echo '<input type="text" class="regular-text" name="merchi_redirect_url_quote" value="' . $value . '" placeholder="https://example.com/quote-success">';
	}
	
	public function merchiStripeKey() {
		$value = esc_attr( get_option( 'merchi_stripe_api_key' ) );
		echo '<input type="text" class="regular-text" name="merchi_stripe_api_key" value="' . $value . '" placeholder="">';
	}

	public function merchiStagingMode() {
		$value = esc_attr( get_option( 'merchi_staging_mode' ) );
		echo '<select name="merchi_staging_mode" id="merchi_staging_mode">
			<option value="yes" ' . selected( $value, "yes", false ) . '>Staging</option>
			<option value="no" ' . selected( $value, "no", false ) . '>Production</option>
		</select>';
	}
	public function merchiSetCurrency() {	
		$current_currency = get_option('merchi_currency');
		echo $current_currency;
		$currencies = get_woocommerce_currencies();
        $current_currency = get_woocommerce_currency();
        echo '<select name="woocommerce_currency" id="woocommerce_currency">';

        foreach ($currencies as $currency_code => $currency_name) {
            echo '<option value="' . esc_attr($currency_code) . '" ' . selected($currency_code, $current_currency, false) . '>' . esc_html($currency_name) . ' (' . esc_html($currency_code) . ')' . '</option>';
        }

        echo '</select>';
	}

	public function merchiSetSessionToken() {
		$value = esc_attr( get_option( 'merchi_api_session_token' ) );
		echo '<input type="text" class="regular-text" name="merchi_api_session_token" value="' . $value . '" placeholder="">';
	}
	// phpcs:enable
}
