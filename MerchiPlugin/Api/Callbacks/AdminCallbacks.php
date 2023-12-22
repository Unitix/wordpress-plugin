<?php declare(strict_types=1);
/**
 * @package  MerchiPlugin
 */

namespace MerchiPlugin\Api\Callbacks;

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


	public function merchiOptionsGroup( $input ) {
		return $input;
	}


	public function merchiAdminSection() {
		echo 'Update your Merchi settings';
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

	// public function wooSecret() {
		// $value = esc_attr( get_option( 'woo_k_s' ) );
		// echo '<input type="password" class="regular-text" name="woo_k_s" value="' . $value . '" placeholder="cs_xxxxxxxxxxxxxx">';
	// }

	// public function wooPublic() {
		// $value = esc_attr( get_option( 'woo_k_p' ) );
		// echo '<input type="text" class="regular-text" name="woo_k_p" value="' . $value . '" placeholder="ck_xxxxxxxxxxxxxx">';
	// }


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

	public function merchiStagingMode() {
		$value = esc_attr( get_option( 'merchi_staging_mode' ) );
		// echo '<input type="checkbox" name="merchi_staging_mode" value="yes" ' . checked( $value, "yes", false ) . '><span style="margin-left: 10px;">Staging/Prodaction</span>';
		echo '<select name="merchi_staging_mode" id="merchi_staging_mode">
			<option value="yes" ' . selected( $value, "yes", false ) . '>Staging</option>
			<option value="no" ' . selected( $value, "no", false ) . '>Production</option>
		</select>';
	}

	// phpcs:enable
}
