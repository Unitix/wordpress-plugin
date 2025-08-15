<?php declare(strict_types = 1);
/**
 * Plugin Name:       Merchi Plugin
 * Plugin URI:        https://merchi.co
 * Description:       Fetch your products from Merchi. This plugin requires Woocommerce.
 * Version:           1.4.4
 * Author:            Charlie Campton
 * License:           GPL v2 or later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 *
 * @package MerchiPlugin
 */

// If this file is called directly, exit.
if (! defined( 'ABSPATH' )) {
	exit;
}

/* Navneet's code */
$merchi_mode = get_option('merchi_staging_mode');

if($merchi_mode){
	$merchi_url = $merchi_mode == 'yes' ? 'https://api.staging.merchi.co/' : 'https://api.merchi.co/';
	$merchi_base_url = $merchi_mode == 'yes' ? 'https://staging.merchi.co' : 'https://merchi.co';
	$merchi_domain = $merchi_mode == 'yes' ? get_option('staging_merchi_url') : get_option('merchi_url');
	$merchiMode = $merchi_mode == 'yes' ? 'staging' : 'live';
	$merchiSecret = $merchi_mode == 'yes' ? get_option('staging_merchi_api_secret') : get_option('merchi_api_secret');
	$merchiStripeKey = get_option('merchi_stripe_api_key');
	define('MERCHI_URL', $merchi_url);
	define('MERCHI_BASE_URL', $merchi_base_url);
	define('MERCHI_DOMAIN', $merchi_domain);
	define('MERCHI_MODE', $merchiMode);
	define('MERCHI_API_SECRET', $merchiSecret);
	define('MERCHI_STRIPE_API_KEY', $merchiStripeKey);
}else{
	define('MERCHI_URL', '');
	define('MERCHI_BASE_URL', '');
	define('MERCHI_DOMAIN', '');
	define('MERCHI_MODE', '');
	define('MERCHI_API_SECRET', '');
	define('MERCHI_STRIPE_API_KEY', '');
}
/* Navneet's code */

// Require Composer Autoload.
if (file_exists( dirname( __FILE__ ) . '/vendor/autoload.php' )) {
	require_once dirname( __FILE__ ) . '/vendor/autoload.php';
}

/* if (file_exists(  __DIR__ . '/class-wp-example-request.php' ) ) {
	//require_once __DIR__ . '/class-wp-example-request.php';
	//$background_process = new WP_Example_Request();

	// Dispatch the request
	//$background_process->dispatch();
	
} */

/**
 * don't remove this code
 * Callback function to load background process classes on admin initialization.
 *
 * This function loads the necessary background process classes when the WordPress
 * admin area is initialized. These classes are required for handling background
 * processes efficiently.
 *
 * @return void
 */
//Load background process classes
function gc_load_background_classes_on_admin_init() {
    // Include the WP_Example_Request class file
    require_once __DIR__ . '/class-wp-example-request.php';
    
    // Instantiate the WP_Example_Request class
    $background_process = new WP_Example_Request();
	//$example_process = new WP_Example_Process();
}
// Hook the function to be executed on admin initialization
add_action('admin_init', 'gc_load_background_classes_on_admin_init');

// Code that runs on activation.
function activate_merchi_plugin() {
	$my_account = get_page_by_path( 'my-account' );
	if (isset( $my_account )) {
		wp_delete_post( $my_account->ID );
	}
	flush_rewrite_rules();
}


register_activation_hook( __FILE__, 'activate_merchi_plugin' );


function deactivate_merchi_plugin() {
	flush_rewrite_rules();

}


register_activation_hook( __FILE__, 'deactivate_merchi_plugin' );

// Initialise all core classes of the plugin.
require_once( 'MerchiPlugin/init.php' );
if (class_exists( 'MerchiPlugin\\Init' )) {
	MerchiPlugin\Init::register_services();
}





// Deactivate purchasing on woocommerce.
add_filter('woocommerce_widget_cart_is_hidden', '__return_true');
add_filter('woocommerce_is_purchasable', function($res, $obj){
	return $obj->exists() && ( 'publish' === $obj->get_status() || current_user_can( 'edit_post', $obj->get_id() ) ) ;
}, 10, 2);
add_filter('private_title_format', 'remove_protected_private_prefix');
function remove_protected_private_prefix($title) {
    return '%s';
}
// Add live or Mergi URL to the footer
add_action( 'wp_footer', 'add_merchi_url' );
add_action( 'admin_footer', 'add_merchi_url' );
function add_merchi_url() {
	echo '<input type="hidden" id="plugin_merchi_url" value ="'.MERCHI_BASE_URL.'">';
}


// Add mount point Class module shortcode
add_shortcode( 'merchi_mount_point', 'merchi_mount_point' );
function merchi_mount_point() {
	
	$merchi_mount_point_id = get_option( 'merchi_mount_point_id' );
	if( $merchi_mount_point_id != '' ) {
		
		echo '<div class="' . $merchi_mount_point_id . '">
		</div>';
	}
}

// Navneet Code starts here.

function custom_override_woocommerce_template($template, $template_name, $template_path) {
		switch ($template_name) {
			case 'checkout/form-checkout.php':
				return plugin_dir_path(__FILE__) . 'woocommerce/checkout/form-checkout.php';
			case 'checkout/thankyou.php':
				return plugin_dir_path(__FILE__) . 'woocommerce/checkout/thankyou.php';
			case 'cart/cart.php':
				return plugin_dir_path(__FILE__) . 'woocommerce/cart/form-cart.php';
			default:
				return $template;
		}
}
add_filter('woocommerce_locate_template', 'custom_override_woocommerce_template', 10, 3);

add_action( 'cst_woocommerce_checkout_order_review', 'woocommerce_order_review', 10 );

add_filter( 'woocommerce_billing_fields', 'bbloomer_move_checkout_email_field' );

// add_action( 'template_redirect', function () {

//     if ( ! is_cart() && ! is_checkout() ) {
//         return;                     
//     }

//     wp_enqueue_script(
//         'merchi-react-init',                                           
//         plugins_url( 'dist/js/woocommerce_cart_checkout.js', dirname( __FILE__, 2 ) ),
//         [ 'react', 'react-dom' ],
//         filemtime( plugin_dir_path( dirname( __FILE__, 2 ) ) . 'dist/js/woocommerce_cart_checkout.js' ),
//         true
//     );
// }, 20 );


 
function bbloomer_move_checkout_email_field( $address_fields ) {
    $address_fields['billing_email']['priority'] = 1;
    return $address_fields;
}

function cst_is_gb_postcode( $to_check ) {

		// Permitted letters depend upon their position in the postcode.
		// https://en.wikipedia.org/wiki/Postcodes_in_the_United_Kingdom#Validation.
		$alpha1 = '[abcdefghijklmnoprstuwyz]'; // Character 1.
		$alpha2 = '[abcdefghklmnopqrstuvwxy]'; // Character 2.
		$alpha3 = '[abcdefghjkpstuw]';         // Character 3 == ABCDEFGHJKPSTUW.
		$alpha4 = '[abehmnprvwxy]';            // Character 4 == ABEHMNPRVWXY.
		$alpha5 = '[abdefghjlnpqrstuwxyz]';    // Character 5 != CIKMOV.

		$pcexp = array();

		// Expression for postcodes: AN NAA, ANN NAA, AAN NAA, and AANN NAA.
		$pcexp[0] = '/^(' . $alpha1 . '{1}' . $alpha2 . '{0,1}[0-9]{1,2})([0-9]{1}' . $alpha5 . '{2})$/';

		// Expression for postcodes: ANA NAA.
		$pcexp[1] = '/^(' . $alpha1 . '{1}[0-9]{1}' . $alpha3 . '{1})([0-9]{1}' . $alpha5 . '{2})$/';

		// Expression for postcodes: AANA NAA.
		$pcexp[2] = '/^(' . $alpha1 . '{1}' . $alpha2 . '[0-9]{1}' . $alpha4 . ')([0-9]{1}' . $alpha5 . '{2})$/';

		// Exception for the special postcode GIR 0AA.
		$pcexp[3] = '/^(gir)(0aa)$/';

		// Standard BFPO numbers.
		$pcexp[4] = '/^(bfpo)([0-9]{1,4})$/';

		// c/o BFPO numbers.
		$pcexp[5] = '/^(bfpo)(c\/o[0-9]{1,3})$/';

		// Load up the string to check, converting into lowercase and removing spaces.
		$postcode = strtolower( $to_check );
		$postcode = str_replace( ' ', '', $postcode );

		// Assume we are not going to find a valid postcode.
		$valid = false;

		// Check the string against the six types of postcodes.
		foreach ( $pcexp as $regexp ) {
			if ( preg_match( $regexp, $postcode, $matches ) ) {
				// Remember that we have found that the code is valid and break from loop.
				$valid = true;
				break;
			}
		}

		return $valid;
	}

function cst_is_postcode( $postcode, $country ) {
	if ( strlen( trim( preg_replace( '/[\s\-A-Za-z0-9]/', '', $postcode ) ) ) > 0 ) {
		return false;
	}

	switch ( $country ) {
		case 'AT':
		case 'BE':
		case 'CH':
		case 'HU':
		case 'NO':
			$valid = (bool) preg_match( '/^([0-9]{4})$/', $postcode );
			break;
		case 'BA':
			$valid = (bool) preg_match( '/^([7-8]{1})([0-9]{4})$/', $postcode );
			break;
		case 'BR':
			$valid = (bool) preg_match( '/^([0-9]{5})([-])?([0-9]{3})$/', $postcode );
			break;
		case 'DE':
			$valid = (bool) preg_match( '/^([0]{1}[1-9]{1}|[1-9]{1}[0-9]{1})[0-9]{3}$/', $postcode );
			break;
		case 'DK':
			$valid = (bool) preg_match( '/^(DK-)?([1-24-9]\d{3}|3[0-8]\d{2})$/', $postcode );
			break;
		case 'ES':
		case 'FR':
		case 'IT':
			$valid = (bool) preg_match( '/^([0-9]{5})$/i', $postcode );
			break;
		case 'GB':
			$valid = cst_is_gb_postcode( $postcode );
			break;
		case 'IE':
			$valid = (bool) preg_match( '/([AC-FHKNPRTV-Y]\d{2}|D6W)[0-9AC-FHKNPRTV-Y]{4}/', wc_normalize_postcode( $postcode ) );
			break;
		case 'IN':
			$valid = (bool) preg_match( '/^[1-9]{1}[0-9]{2}\s{0,1}[0-9]{3}$/', $postcode );
			break;
		case 'JP':
			$valid = (bool) preg_match( '/^([0-9]{3})([-]?)([0-9]{4})$/', $postcode );
			break;
		case 'PT':
			$valid = (bool) preg_match( '/^([0-9]{4})([-])([0-9]{3})$/', $postcode );
			break;
		case 'PR':
		case 'US':
			$valid = (bool) preg_match( '/^([0-9]{5})(-[0-9]{4})?$/i', $postcode );
			break;
		case 'CA':
			$valid = (bool) preg_match( '/^([ABCEGHJKLMNPRSTVXY]\d[ABCEGHJKLMNPRSTVWXYZ])([\ ])?(\d[ABCEGHJKLMNPRSTVWXYZ]\d)$/i', $postcode );
			break;
		case 'PL':
			$valid = (bool) preg_match( '/^([0-9]{2})([-])([0-9]{3})$/', $postcode );
			break;
		case 'CZ':
		case 'SK':
			$valid = (bool) preg_match( '/^([0-9]{3})(\s?)([0-9]{2})$/', $postcode );
			break;
		case 'NL':
			$valid = (bool) preg_match( '/^([1-9][0-9]{3})(\s?)(?!SA|SD|SS)[A-Z]{2}$/i', $postcode );
			break;
		case 'SI':
			$valid = (bool) preg_match( '/^([1-9][0-9]{3})$/', $postcode );
			break;
		case 'LI':
			$valid = (bool) preg_match( '/^(94[8-9][0-9])$/', $postcode );
			break;
		default:
			$valid = true;
			break;
	}

	return $valid;
}

function cst_is_phone($phone, $country) {
	//$phone = preg_replace("/[^0-9+]/", "", $phone);
	$patterns = [
		'AD' => '/^\+376\d{6}$/',
		'AE' => '/^\+971\d{9}$/',
		'AF' => '/^\+93\d{9}$/',
		'AG' => '/^\+1\d{10}$/',
		'AI' => '/^\+1\d{10}$/',
		'AL' => '/^\+355\d{9}$/',
		'AM' => '/^\+374\d{8}$/',
		'AO' => '/^\+244\d{9}$/',
		'AQ' => '/^\+672\d{7}$/',
		'AR' => '/^\+54\d{10}$/',
		'AS' => '/^\+1\d{10}$/',
		'AT' => '/^\+43\d{9}$/',
		'AU' => '/^\+61\d{9,10}$/',
		'AW' => '/^\+297\d{7}$/',
		'AX' => '/^\+358\d{9,10}$/',
		'AZ' => '/^\+994\d{9}$/',
		'BA' => '/^\+387\d{8}$/',
		'BB' => '/^\+1\d{10}$/',
		'BD' => '/^\+880\d{10}$/',
		'BE' => '/^\+32\d{9}$/',
		'BF' => '/^\+226\d{7}$/',
		'BG' => '/^\+359\d{9}$/',
		'BH' => '/^\+973\d{8}$/',
		'BI' => '/^\+257\d{8}$/',
		'BJ' => '/^\+229\d{8}$/',
		'BL' => '/^\+590\d{9}$/',
		'BM' => '/^\+1\d{10}$/',
		'BN' => '/^\+673\d{7}$/',
		'BO' => '/^\+591\d{8}$/',
		'BQ' => '/^\+599\d{7}$/',
		'BR' => '/^\+55\d{10}$/',
		'BS' => '/^\+1\d{10}$/',
		'BT' => '/^\+975\d{8}$/',
		'BV' => '/^\+47\d{8}$/',
		'BW' => '/^\+267\d{8}$/',
		'BY' => '/^\+375\d{9}$/',
		'BZ' => '/^\+501\d{7}$/',
		'CA' => '/^\+1\d{10}$/',
		'CC' => '/^\+61\d{9}$/',
		'CD' => '/^\+243\d{9}$/',
		'CF' => '/^\+236\d{8}$/',
		'CG' => '/^\+242\d{9}$/',
		'CH' => '/^\+41\d{9}$/',
		'CI' => '/^\+225\d{8}$/',
		'CK' => '/^\+682\d{5}$/',
		'CL' => '/^\+56\d{9}$/',
		'CM' => '/^\+237\d{8}$/',
		'CN' => '/^\+86\d{11}$/',
		'CO' => '/^\+57\d{10}$/',
		'CR' => '/^\+506\d{8}$/',
		'CU' => '/^\+53\d{8}$/',
		'CV' => '/^\+238\d{7}$/',
		'CW' => '/^\+599\d{7}$/',
		'CX' => '/^\+61\d{9}$/',
		'CY' => '/^\+357\d{9}$/',
		'CZ' => '/^\+420\d{9}$/',
		'DE' => '/^\+49\d{10}$/',
		'DJ' => '/^\+253\d{6}$/',
		'DK' => '/^\+45\d{8}$/',
		'DM' => '/^\+1\d{10}$/',
		'DO' => '/^\+1\d{10}$/',
		'DZ' => '/^\+213\d{9}$/',
		'EC' => '/^\+593\d{9}$/',
		'EE' => '/^\+372\d{7}$/',
		'EG' => '/^\+20\d{10}$/',
		'EH' => '/^\+212\d{9}$/',
		'ER' => '/^\+291\d{7}$/',
		'ES' => '/^\+34\d{9}$/',
		'ET' => '/^\+251\d{9}$/',
		'FI' => '/^\+358\d{9,10}$/',
		'FJ' => '/^\+679\d{7}$/',
		'FK' => '/^\+500\d{5}$/',
		'FM' => '/^\+691\d{7}$/',
		'FO' => '/^\+298\d{6}$/',
		'FR' => '/^\+33\d{9}$/',
		'GA' => '/^\+241\d{8}$/',
		'GB' => '/^\+44\d{10}$/',
		'GD' => '/^\+1\d{10}$/',
		'GE' => '/^\+995\d{9}$/',
		'GF' => '/^\+594\d{9}$/',
		'GG' => '/^\+44\d{10}$/',
		'GH' => '/^\+233\d{9}$/',
		'GI' => '/^\+350\d{8}$/',
		'GL' => '/^\+299\d{6}$/',
		'GM' => '/^\+220\d{7}$/',
		'GN' => '/^\+224\d{8}$/',
		'GP' => '/^\+590\d{9}$/',
		'GQ' => '/^\+240\d{8}$/',
		'GR' => '/^\+30\d{10}$/',
		'GS' => '/^\+500\d{5}$/',
		'GT' => '/^\+502\d{8}$/',
		'GU' => '/^\+1\d{10}$/',
		'GW' => '/^\+245\d{7}$/',
		'GY' => '/^\+592\d{7}$/',
		'HK' => '/^\+852\d{8}$/',
		'HM' => '/^\+672\d{7}$/',
		'HN' => '/^\+504\d{8}$/',
		'HR' => '/^\+385\d{9}$/',
		'HT' => '/^\+509\d{8}$/',
		'HU' => '/^\+36\d{9}$/',
		'ID' => '/^\+62\d{9}$/',
		'IE' => '/^\+353\d{9}$/',
		'IL' => '/^\+972\d{9}$/',
		'IM' => '/^\+44\d{10}$/',
		'IN' => '/^\+91\d{10}$/',
		'IO' => '/^\+246\d{7}$/',
		'IQ' => '/^\+964\d{8}$/',
		'IR' => '/^\+98\d{9}$/',
		'IS' => '/^\+354\d{7}$/',
		'IT' => '/^\+39\d{10}$/',
		'JE' => '/^\+44\d{10}$/',
		'JM' => '/^\+1\d{10}$/',
		'JO' => '/^\+962\d{9}$/',
		'JP' => '/^\+81\d{9}$/',
		'KE' => '/^\+254\d{9}$/',
		'KG' => '/^\+996\d{9}$/',
		'KH' => '/^\+855\d{8}$/',
		'KI' => '/^\+686\d{5}$/',
		'KM' => '/^\+269\d{7}$/',
		'KN' => '/^\+1\d{10}$/',
		'KP' => '/^\+850\d{8}$/',
		'KR' => '/^\+82\d{9}$/',
		'KW' => '/^\+965\d{8}$/',
		'KY' => '/^\+1\d{10}$/',
		'KZ' => '/^\+7\d{10}$/',
		'LA' => '/^\+856\d{8}$/',
		'LB' => '/^\+961\d{7}$/',
		'LC' => '/^\+1\d{10}$/',
		'LI' => '/^\+423\d{7}$/',
		'LK' => '/^\+94\d{9}$/',
		'LR' => '/^\+231\d{7}$/',
		'LS' => '/^\+266\d{8}$/',
		'LT' => '/^\+370\d{8}$/',
		'LU' => '/^\+352\d{8}$/',
		'LV' => '/^\+371\d{8}$/',
		'LY' => '/^\+218\d{9}$/',
		'MA' => '/^\+212\d{9}$/',
		'MC' => '/^\+377\d{8}$/',
		'MD' => '/^\+373\d{8}$/',
		'ME' => '/^\+382\d{7}$/',
		'MF' => '/^\+590\d{9}$/',
		'MG' => '/^\+261\d{9}$/',
		'MH' => '/^\+692\d{7}$/',
		'MK' => '/^\+389\d{7}$/',
		'ML' => '/^\+223\d{7}$/',
		'MM' => '/^\+95\d{8}$/',
		'MN' => '/^\+976\d{8}$/',
		'MO' => '/^\+853\d{8}$/',
		'MP' => '/^\+1\d{10}$/',
		'MQ' => '/^\+596\d{9}$/',
		'MR' => '/^\+222\d{7}$/',
		'MS' => '/^\+1\d{10}$/',
		'MT' => '/^\+356\d{8}$/',
		'MU' => '/^\+230\d{7}$/',
		'MV' => '/^\+960\d{7}$/',
		'MW' => '/^\+265\d{7}$/',
		'MX' => '/^\+52\d{10}$/',
		'MY' => '/^\+60\d{9}$/',
		'MZ' => '/^\+258\d{9}$/',
		'NA' => '/^\+264\d{9}$/',
		'NC' => '/^\+687\d{6}$/',
		'NE' => '/^\+227\d{7}$/',
		'NF' => '/^\+672\d{7}$/',
		'NG' => '/^\+234\d{9}$/',
		'NI' => '/^\+505\d{8}$/',
		'NL' => '/^\+31\d{9}$/',
		'NO' => '/^\+47\d{8}$/',
		'NP' => '/^\+977\d{9}$/',
		'NR' => '/^\+674\d{4}$/',
		'NU' => '/^\+683\d{4}$/',
		'NZ' => '/^\+64\d{8}$/',
		'OM' => '/^\+968\d{8}$/',
		'PA' => '/^\+507\d{8}$/',
		'PE' => '/^\+51\d{9}$/',
		'PF' => '/^\+689\d{6}$/',
		'PG' => '/^\+675\d{7}$/',
		'PH' => '/^\+63\d{10}$/',
		'PK' => '/^\+92\d{10}$/',
		'PL' => '/^\+48\d{9}$/',
		'PM' => '/^\+508\d{6}$/',
		'PN' => '/^\+870\d{7}$/',
		'PR' => '/^\+1\d{10}$/',
		'PS' => '/^\+970\d{9}$/',
		'PT' => '/^\+351\d{9}$/',
		'PW' => '/^\+680\d{7}$/',
		'PY' => '/^\+595\d{9}$/',
		'QA' => '/^\+974\d{8}$/',
		'RE' => '/^\+262\d{9}$/',
		'RO' => '/^\+40\d{9}$/',
		'RS' => '/^\+381\d{9}$/',
		'RU' => '/^\+7\d{10}$/',
		'RW' => '/^\+250\d{9}$/',
		'SA' => '/^\+966\d{9}$/',
		'SB' => '/^\+677\d{5}$/',
		'SC' => '/^\+248\d{7}$/',
		'SD' => '/^\+249\d{9}$/',
		'SE' => '/^\+46\d{9}$/',
		'SG' => '/^\+65\d{8}$/',
		'SH' => '/^\+290\d{6}$/',
		'SI' => '/^\+386\d{8}$/',
		'SJ' => '/^\+47\d{8}$/',
		'SK' => '/^\+421\d{9}$/',
		'SL' => '/^\+232\d{8}$/',
		'SM' => '/^\+378\d{7}$/',
		'SN' => '/^\+221\d{9}$/',
		'SO' => '/^\+252\d{7}$/',
		'SR' => '/^\+597\d{7}$/',
		'SS' => '/^\+211\d{9}$/',
		'ST' => '/^\+239\d{7}$/',
		'SV' => '/^\+503\d{8}$/',
		'SX' => '/^\+1\d{10}$/',
		'SY' => '/^\+963\d{9}$/',
		'SZ' => '/^\+268\d{7}$/',
		'TC' => '/^\+1\d{10}$/',
		'TD' => '/^\+235\d{8}$/',
		'TF' => '/^\+262\d{9}$/',
		'TG' => '/^\+228\d{8}$/',
		'TH' => '/^\+66\d{9}$/',
		'TJ' => '/^\+992\d{9}$/',
		'TK' => '/^\+690\d{4}$/',
		'TL' => '/^\+670\d{7}$/',
		'TM' => '/^\+993\d{8}$/',
		'TN' => '/^\+216\d{8}$/',
		'TO' => '/^\+676\d{5}$/',
		'TR' => '/^\+90\d{10}$/',
		'TT' => '/^\+1\d{10}$/',
		'TV' => '/^\+688\d{4}$/',
		'TW' => '/^\+886\d{9}$/',
		'TZ' => '/^\+255\d{9}$/',
		'UA' => '/^\+380\d{9}$/',
		'UG' => '/^\+256\d{9}$/',
		'UM' => '/^\+1\d{10}$/',
		'US' => '/^\+1\d{10}$/',
		'UY' => '/^\+598\d{8}$/',
		'UZ' => '/^\+998\d{9}$/',
		'VA' => '/^\+379\d{8}$/',
		'VC' => '/^\+1\d{10}$/',
		'VE' => '/^\+58\d{10}$/',
		'VG' => '/^\+1\d{10}$/',
		'VI' => '/^\+1\d{10}$/',
		'VN' => '/^\+84\d{9}$/',
		'VU' => '/^\+678\d{5}$/',
		'WF' => '/^\+681\d{6}$/',
		'WS' => '/^\+685\d{4}$/',
		'YE' => '/^\+967\d{9}$/',
		'YT' => '/^\+262\d{9}$/',
		'ZA' => '/^\+27\d{9}$/',
		'ZM' => '/^\+260\d{9}$/',
		'ZW' => '/^\+263\d{9}$/',
	];
	
    if (isset($patterns[$country])) {
         return preg_match($patterns[$country], $phone);
		//return preg_match($patterns[$country], $phone) && strlen($phone) >= 15;
    }

	return false;
}


add_action('wp_ajax_check_user_registration', 'cst_check_user_registration');
add_action('wp_ajax_nopriv_check_user_registration', 'cst_check_user_registration');
function cst_check_user_registration(){
	$postData = wp_unslash( $_POST[ 'postData' ] );
	parse_str($postData, $params);
	$billing_email = wc_clean( wp_unslash( $_POST[ 'billing_email' ] ) );
	WC()->session->set( 'cst_billing_info' , $params );
	$country = wc_clean( wp_unslash( $_POST[ 'country' ] ) );
	$fname = wc_clean( wp_unslash( $_POST[ 'fname' ] ) );
	$postcode = wc_clean( wp_unslash( $_POST[ 'postcode' ] ) );
	$phone = wc_clean( wp_unslash( $_POST[ 'phone' ] ) );
	$value   = $postcode ? wc_format_postcode( $postcode, $country ) : false;
	$phone   = wc_format_phone_number( $phone );
	$email   = is_email( $_POST[ 'email' ] );
	$token   = sanitize_key( $_POST[ 'token' ] );
	$id   = wc_clean( wp_unslash( $_POST[ 'id' ] ) );

	WC()->session->set( 'cst_billing_phone' , $phone );

	if ( $value && '' !== $value && $country && ! cst_is_postcode( $value, $country ) ) {
		echo json_encode(array('resp'=>'error', 'msg'=>'Not a valid postal code'));
	}else if ( empty($phone) || false == $phone || ($phone && ! cst_is_phone( $phone , $country)) ) {
		echo json_encode(array('resp'=>'error', 'msg'=>'Not a valid phone number'));
	}else if ( !$email ) {
		echo json_encode(array('resp'=>'error', 'msg'=>'Not a valid email'));
	}else{
		$response = wp_remote_post( MERCHI_URL.'v6/user-check-email/?email_address='.$email );
		$resp = json_decode(wp_remote_retrieve_body($response));
		if($resp->errorCode && $resp->errorCode == 5){
			if( $country && $value && $phone && $token && $fname ){
				$url = MERCHI_URL.'v6/public_user_create/?cart_token='.$token;
				$cuResponse = wp_remote_post( $url, array(
						'method'      => 'POST',
						'headers'     => array(),
						'body'        => array(
							'registeredUnderDomains-0-id' => 5,
							'registeredUnderDomains-count' => 1,
							'name' => $fname,
							'phoneNumbers-0-number' => $phone,
							'phoneNumbers-0-code' => $country,
							'phoneNumbers-count' => 1,
							'emailAddresses-0-emailAddress' => $email,
							'emailAddresses-count' => 1,
						)
					)
				);
				$cuResp = json_decode(wp_remote_retrieve_body($cuResponse));
				if($cuResp->errorCode && $cuResp->errorCode == 6){
					echo json_encode(array('resp'=>'error', 'msg'=>$cuResp->message));
				}else{
					setcookie('cstExistingUser', 'true', time() + (86400 * 30), "/");
					$_COOKIE['cstExistingUser'] = 'true';
					echo json_encode(array('resp'=>'registered', 'user_id'=>$cuResp->user->id));
				}
			}else{
				echo json_encode(array('resp'=>'error', 'msg'=>'Could not find email address.'));
			}
		}else{
			setcookie('cstExistingUser', 'true', time() + (86400 * 30), "/");
			$_COOKIE['cstExistingUser'] = 'true';
			echo json_encode(array('resp'=>'registered', 'user_id'=>$resp->user_id ));
		}
	}
	exit;
}

add_action( 'wp_ajax_nopriv_append_country_prefix_in_billing_phone', 'country_prefix_in_billing_phone' );
add_action( 'wp_ajax_append_country_prefix_in_billing_phone', 'country_prefix_in_billing_phone' );
function country_prefix_in_billing_phone() {
    $calling_code = '';
    $country_code = isset( $_POST['country_code'] ) ? $_POST['country_code'] : '';
    if( $country_code ){
        $calling_code = WC()->countries->get_country_calling_code( $country_code );
        $calling_code = is_array( $calling_code ) ? $calling_code[0] : $calling_code;
    }
    echo $calling_code;
    die();
}

function merchi_enqueue_wc_block_styles() {

	// wp_enqueue_style( 'wc-blocks-style' );
	wp_enqueue_style( 'wc-blocks-packages-style' );

	if ( is_cart() ) {
		$src = trailingslashit( WC()->plugin_url() ) . 'assets/client/blocks/cart.css';

    wp_register_style( 'woocommerce-cart', $src, [], WC_VERSION );
    wp_enqueue_style(  'woocommerce-cart' );
	}

	if ( is_checkout() ) {
		$src = trailingslashit( WC()->plugin_url() ) . 'assets/client/blocks/checkout.css';

		wp_register_style( 'woocommerce-checkout', $src, [], WC_VERSION );
		wp_enqueue_style(  'woocommerce-checkout' );
	}

	// $handle = 'wc-blocks-checkout-style';
	// $rel_path = 'assets/client/blocks/checkout.css';

	// if ( wp_style_is( $handle, 'registered' ) ) {
	// 		wp_enqueue_style( $handle );
	// } else if ( class_exists( 'WooCommerce' ) ) {
	// 		wp_register_style(
	// 				$handle,
	// 				trailingslashit( WC()->plugin_url() ) . $rel_path,
	// 				array( 'wc-blocks-style' ),
	// 				WC_VERSION
	// 		);
	// 		wp_enqueue_style( $handle );
	// }

	//  if ( is_cart() ) {                         
  //       $handle   = 'wc-blocks-cart-style';
  //       $rel_path = 'assets/client/blocks/cart.css';

  //       if ( wp_style_is( $handle, 'registered' ) ) {
  //           wp_enqueue_style( $handle );
  //       } elseif ( class_exists( 'WooCommerce' ) ) {
  //           wp_register_style(
  //               $handle,
  //               trailingslashit( WC()->plugin_url() ) . $rel_path,
  //               array( 'wc-blocks-style' ),
  //               WC_VERSION
  //           );
  //           wp_enqueue_style( $handle );
  //       }
  //   }

	if (is_page('thankyou')) {
        wp_enqueue_style('woocommerce-general');
        wp_enqueue_style('woocommerce-layout');
        wp_enqueue_style('woocommerce-smallscreen');
    }
}
add_action( 'wp_enqueue_scripts', 'merchi_enqueue_wc_block_styles' );

function enqueue_admin_customfiles($hook)
{
		if ($hook == 'post-new.php' || $hook == 'post.php') {
				wp_enqueue_style(
						'custom-admin-style',
						plugin_dir_url(__FILE__) . 'custom.css'
				);
				wp_enqueue_style(
						'cst-jquery-ui-style', 'https://code.jquery.com/ui/1.12.1/themes/base/jquery-ui.css'
				);
				wp_enqueue_script(
						'cst-jquery-ui',
						'https://code.jquery.com/ui/1.12.1/jquery-ui.js',
						array('jquery'),
						null,
						true
				);
				if ('edit-tags.php' == $hook || 'term.php' == $hook) {
						wp_enqueue_media();
				}
				wp_enqueue_script(
						'custom-merchi-script',
						MERCHI_BASE_URL.'/static/js/dist/merchi-init.js',
						array(),
						null,
						true
				);
				wp_enqueue_script(
						'custom-admin-script',
						plugin_dir_url(__FILE__) . 'dist/js/wordpress_merchi_dashboard.js',
						array('cst-jquery-ui'),
						null,
						true
			  );
				wp_localize_script(
						'custom-admin-script',
						'frontendajax',
						array(
								'ajaxurl' => admin_url('admin-ajax.php'),
								'nonce' => wp_create_nonce('merchi_ajax_nonce')
						)
				);
				wp_localize_script(
						'custom-admin-script',
						'scriptData',
						array(
								'merchi_mode' => MERCHI_MODE,
								'merchi_domain' => MERCHI_DOMAIN,
								'merchi_url' => MERCHI_URL,
								'merchi_secret' => MERCHI_API_SECRET,
								'woo_product_id' => get_the_ID()
						)
				);
		}
}
add_action('admin_enqueue_scripts', 'enqueue_admin_customfiles');

function enqueue_my_public_script()
{
	wp_enqueue_style('custom-admin-style', plugin_dir_url(__FILE__) . 'custom.css');
	
	// First enqueue the Merchi initialization script
	$staging_mode = get_option('merchi_staging_mode');
	if ($staging_mode === 'yes') {
		wp_enqueue_script(
			'merchi-init-frontend',
			'https://staging.merchi.co/static/js/dist/merchi-init.js',
			array(),
			null,
			true
		);
	} else {
		wp_enqueue_script(
			'merchi-init-frontend',
			'https://merchi.co/static/js/dist/merchi-init.js',
			array(),
			null,
			true
		);
	}
	
	// Load public script on all pages
	wp_enqueue_script('custom-public-script', plugins_url('/dist/js/merchi_public_custom.js', __FILE__), array('jquery', 'merchi-init-frontend'), rand(0,1000), true);
	
	// Only load cart/checkout script on relevant pages
	if (is_cart() || is_checkout() || is_wc_endpoint_url('order-received')) {
		wp_enqueue_script('custom-checkout-script', plugins_url('/dist/js/woocommerce_cart_checkout.js', __FILE__), array('merchi-init-frontend'), '1.0', true);
	}
	
	// Only load order confirmation script on order confirmation pages  
	if (is_wc_endpoint_url('order-received') || is_page('thankyou')) {
		wp_enqueue_script('custom-order-confirmation-script', plugins_url('/dist/js/order_confirmation.js', __FILE__), array('merchi-init-frontend'), '1.0', true);
	}
	
	// wp_enqueue_script('custom-stripe-script', 'https://js.stripe.com/v3/', array(), '1.0', true);
	// $stripeSecret = false;
	// $telephoneInput = false;
	// if($billing_values){
	// 	$telephoneInput = $billing_values['billing_phone'];
	// }
	// if( isset($_COOKIE['cart-'.MERCHI_DOMAIN]) && !empty($_COOKIE['cart-'.MERCHI_DOMAIN]) && is_checkout() && ( isset($_GET['step']) && $_GET['step'] == 3 ) ){
	// 	$cart = explode(',', $_COOKIE['cart-'.MERCHI_DOMAIN]);
	// 	$url = MERCHI_URL.'v6/stripe/payment_intent/cart/'.$cart[0].'/?cart_token='.$cart[1];
	// 	$response = wp_remote_get( $url, array('timeout'=> 20) );

	// 	$resp = json_decode(wp_remote_retrieve_body($response));
	// 	$stripeSecret = $resp->stripeClientSecret;
	// }

	// Localize scriptData for all scripts that need it
	$script_data = array(
		'merchi_mode' => MERCHI_MODE,
		'merchi_url' => MERCHI_URL,
		'merchi_domain' => MERCHI_DOMAIN,
		'merchi_stripe_api_key' => MERCHI_STRIPE_API_KEY,
		'cartUrl' => wc_get_cart_url(),
		'checkoutUrl' => wc_get_checkout_url(),
		'shopUrl' => wc_get_page_permalink('shop'),
	);
	
	wp_localize_script('custom-public-script', 'scriptData', $script_data);
	
	// Only localize for scripts that are actually enqueued
	if (is_cart() || is_checkout() || is_wc_endpoint_url('order-received')) {
		wp_localize_script('custom-checkout-script', 'scriptData', $script_data);
	}
	
	if (is_wc_endpoint_url('order-received') || is_page('thankyou')) {
		wp_localize_script('custom-order-confirmation-script', 'scriptData', $script_data);
	}
	
	// wp_localize_script('custom-checkout-scrip', 'scriptData', array(
	// 	'merchi_domain' => MERCHI_DOMAIN,
	// 	'merchi_mode' => MERCHI_MODE,
	// 	'merchi_url' => MERCHI_URL,
	// 	'merchi_stripe_api_key' => MERCHI_STRIPE_API_KEY,
	// ));
}
add_action('wp_enqueue_scripts', 'enqueue_my_public_script');


function custom_product_meta_box()
{
	add_meta_box(
		'custom_product_meta_box_id',
		'Merchi Configuration',
		'render_custom_product_meta_box',
		'product',
		'side',
		'high'
	);
}
add_action('add_meta_boxes', 'custom_product_meta_box');

function render_custom_product_meta_box()
{
	global $post;

	// Add nonce for security
	wp_nonce_field('merchi_product_meta_box', 'merchi_product_meta_nonce');

	$product_id = get_post_meta($post->ID, 'product_id', true);
	$product_name = get_post_meta($post->ID, 'product_name', true);
	$product_regular_price = get_post_meta($post->ID, '_regular_price', true);
?>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css" />
    <input type="hidden" id="hidden_product_id" name="hidden_product_id" value="<?php echo esc_attr(
        $product_id
    ); ?>">
    <input type="hidden" id="hidden_product_name" name="hidden_product_name"
        value="<?php echo esc_attr($product_name); ?>">
    <input type="hidden" id="hidden_regular_price" name="hidden_regular_price"
        value="<?php echo esc_attr($product_regular_price); ?>">
    <div id="product_meta_box">
        <div id="search_box" style="display: <?php echo (empty($product_name)) ? 'block' : 'none'; ?>;">
            <input type="text" id="custom_value_field" name="custom_value" list="custom_value_list"
                placeholder="Enter Product Name">
            <span class="cst-loader"></span>
            <span class="search-icon"><i class="fas fa-search"></i></span>
            <div id="search_results" onclick="spinner()"></div>
            <div class="loader"></div>
        </div>
        <div id="selected_value_display"
            style="display: <?php echo (empty($product_name)) ? 'none' : 'inline-block'; ?>;">
            <h3 style="cursor: pointer;">
                <?php echo esc_html($product_name); ?>
            </h3>
        </div>
    </div>
    <?php if (!empty($post->ID) && $post->post_status !== 'auto-draft' && !empty($product_id)) : ?>
    <!-- New Sync with Merchi Button -->
    <div style="margin-top: 10px; text-align: left;">
        <button type="button" id="sync_with_merchi_btn" class="button button-primary">
					  Sync with Merchi
				</button>
        <span id="sync_merchi_status" style="margin-left: 10px;"></span>
    </div>
    <script type="text/javascript">
    jQuery(document).ready(function($) {
        $('#sync_with_merchi_btn').on('click', function() {
            var btn = $(this);
            var status = $('#sync_merchi_status');
            btn.prop('disabled', true);
            status.text('Syncing...');
            $.ajax({
                url: ajaxurl,
                type: 'POST',
                data: {
                    action: 'fetch_merchi_product',
                    wooProductId: <?php echo intval($post->ID); ?>
                },
                success: function(response) {
                    if (response.success) {
                        status.text('Synced successfully!');
                    } else {
                        status.text('Sync failed: ' + (response.data && response.data.message ? response.data.message : 'Unknown error'));
                    }
                    btn.prop('disabled', false);
                },
                error: function(xhr, statusText, errorThrown) {
                    status.text('Sync failed: ' + errorThrown);
                    btn.prop('disabled', false);
                }
            });
        });
    });
    </script>
    <?php endif; ?>
    <script type="text/javascript">
    jQuery(document).ready(function($) {
        $('#sync_with_merchi_btn').on('click', function() {
            var btn = $(this);
            var status = $('#sync_merchi_status');
            btn.prop('disabled', true);
            status.text('Syncing...');
            $.ajax({
                url: ajaxurl,
                type: 'POST',
                data: {
                    action: 'fetch_merchi_product',
                    wooProductId: <?php echo intval($post->ID); ?>
                },
                success: function(response) {
                    if (response.success) {
                        status.text('Synced successfully!');
                    } else {
                        status.text('Sync failed: ' + (response.data && response.data.message ? response.data.message : 'Unknown error'));
                    }
                    btn.prop('disabled', false);
                },
                error: function(xhr, statusText, errorThrown) {
                    status.text('Sync failed: ' + errorThrown);
                    btn.prop('disabled', false);
                }
            });
        });
    });
    </script>
<?php
}
/**
 * Callback function to create a product in the background process.
 *
 * This function initiates a background process to create a product.
 * The process is handled asynchronously to prevent delays in page loading.
 *
 * @return void
 */
function gc_create_product_background_process() {
	if (isset($_POST['checkedValues'])) {
		$checkedValues = $_POST['checkedValues'];
		if ($checkedValues) {
			update_option('gc_backgroung_process_prods', $checkedValues);
			// Option update successful
			$background_process = new WP_Example_Request();  
			$background_process->dispatch();
			// Send JSON response indicating success
			echo json_encode(array('success' => true));
		} else {
			// Option update failed
			echo json_encode(array('success' => false, 'error' => 'Option update failed'));
		}
	} else {
		// No 'checkedValues' found in POST data
		echo json_encode(array('success' => false, 'error' => 'No checkedValues found in POST data'));
	}
	// Terminate WordPress execution
	wp_die();
}
// Hook the background process function to handle AJAX requests
add_action('wp_ajax_gc_create_product_background_process', 'gc_create_product_background_process');
add_action('wp_ajax_nopriv_gc_create_product_background_process', 'gc_create_product_background_process');


// Add an action for handling the AJAX request
add_action('wp_ajax_save_flag_for_show_meta', 'save_flag_for_show_meta_ajax_function');
add_action('wp_ajax_nopriv_save_flag_for_show_meta', 'save_flag_for_show_meta_ajax_function');

function save_flag_for_show_meta_ajax_function() {
	// Verify nonce
	if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'merchi_ajax_nonce')) {
		wp_send_json_error('Invalid nonce');
		return;
	}
	
	$newproduct_id = isset($_POST['postId']) ? sanitize_text_field($_POST['postId']) : '';
	
	if (empty($newproduct_id)) {
		wp_send_json_error('Post ID is required');
		return;
	}
	
	$result = update_post_meta($newproduct_id, 'show_meta_key', 1);
	
	if ($result !== false) {
		echo "Meta updated successfully.";
	} else {
		echo "Failed to update meta.";
	}
	
	wp_die();
}


function save_meta_box_value($post_id, $post)
{
	// Verify nonce
	if (!isset($_POST['merchi_product_meta_nonce']) || !wp_verify_nonce($_POST['merchi_product_meta_nonce'], 'merchi_product_meta_box')) {
		return;
	}

	// Check if this is an autosave
	if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
		return;
	}

	// Check permissions
	if (!current_user_can('edit_post', $post_id)) {
		return;
	}

	if ($post->post_type == 'product' && (isset($_POST['hidden_product_name']))) {
		if (isset($_POST['hidden_product_id'])) {
			$product_id = sanitize_text_field($_POST['hidden_product_id']);
			$product_name = sanitize_text_field($_POST['hidden_product_name']);
			$product_regulr_price = sanitize_text_field($_POST['hidden_regular_price']);
			update_post_meta($post_id, 'product_id', $product_id);
			update_post_meta($post_id, 'product_name', $product_name);
			update_post_meta($post_id, '_regular_price',  $product_regulr_price);
			update_post_meta($post_id, '_sku',  $product_id);
		}
	}
}
add_action('save_post', 'save_meta_box_value', 10, 2);

add_action('wp_ajax_media_image_attach', 'media_image_attach');
add_action('wp_ajax_nopriv_media_image_attach', 'media_image_attach');

function media_image_attach()
{
	$image_url = sanitize_text_field($_POST['image_url']);
	$product_id = sanitize_text_field($_POST['postId']);
	$mimetype = sanitize_text_field($_POST['mimetype']);
	$filename = basename($image_url);
	if (!empty($filename)) {
		$image_data = file_get_contents($image_url);
		$upload_dir = wp_upload_dir();
		$file_path = $upload_dir['path'] . '/' . $filename;
		file_put_contents($file_path, $image_data);
		$attachment_data = array(
			'post_title'     => sanitize_file_name($filename),
			'post_content'   => '',
			'post_status'    => 'inherit',
			'post_mime_type' => $mimetype,
		);
		$attachment_id = wp_insert_attachment($attachment_data, $file_path);
		require_once ABSPATH . 'wp-admin/includes/image.php';
		$attachment_data = wp_generate_attachment_metadata($attachment_id, $file_path);
		wp_update_attachment_metadata($attachment_id, $attachment_data);

		$gallery_images = get_post_meta($product_id, '_product_image_gallery', true);
		$gallery_images_array = explode(',', $gallery_images);
		$gallery_images_array[] = $attachment_id;
		update_post_meta($product_id, '_product_image_gallery', implode(',', $gallery_images_array));
		// Return attachment ID as response
		echo json_encode(implode(',', $gallery_images_array));
	}
}

add_action('wp_ajax_media_featureimage_attach', 'media_featureimage_attach');
add_action('wp_ajax_nopriv_media_featureimage_attach', 'media_featureimage_attach');

function media_featureimage_attach()
{
	$image_url = sanitize_text_field($_POST['image_url']);
	$product_id = sanitize_text_field($_POST['postId']);
	$mimetype = sanitize_text_field($_POST['mimetype']);
	$filename = basename($image_url);

	if (!empty($filename)) {
		$image_data = file_get_contents($image_url);
		$upload_dir = wp_upload_dir();
		$file_path = $upload_dir['path'] . '/' . $filename;
		file_put_contents($file_path, $image_data);
		$attachment_data = array(
			'post_title'     => sanitize_file_name($filename),
			'post_content'   => '',
			'post_status'    => 'inherit',
			'post_mime_type' => $mimetype,
		);
		$attachment_id = wp_insert_attachment($attachment_data, $file_path);
		require_once ABSPATH . 'wp-admin/includes/image.php';
		$attachment_data = wp_generate_attachment_metadata($attachment_id, $file_path);
		wp_update_attachment_metadata($attachment_id, $attachment_data);

		$gallery_images = get_post_meta($product_id, '_product_image_gallery', true);
		$gallery_images_array = explode(',', $gallery_images);
		$gallery_images_array[] = $attachment_id;
		set_post_thumbnail($product_id, $attachment_id);
		update_post_meta($product_id, '_regular_price', $new_regular_price);
		// Return attachment ID as response
		echo json_encode($attachment_id);
	}
}

function generateRandomString($length = 10) {
    $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    $charactersLength = strlen($characters);
    $randomString = '';
    for ($i = 0; $i < $length; $i++) {
        $randomString .= $characters[random_int(0, $charactersLength - 1)];
    }
    return $randomString;
}

add_action('wp_ajax_send_id_for_add_cart', 'send_id_for_add_cart');
add_action('wp_ajax_nopriv_send_id_for_add_cart', 'send_id_for_add_cart');

function merchi_build_clean_payload( array $raw ) : array {
    $clean = [
        'id'        => $raw['id'],
        'domain'    => [ 'id' => $raw['domain']['id'] ],
        'cartItems' => [],
    ];

    foreach ( $raw['cartItems'] as $item ) {
        $cleanItem = [
            'id'        => $item['id']  ?? null,
            'product'   => [ 'id' => $item['productID'] ?? $item['product']['id'] ],
            'quantity'  => (int) $item['quantity'],
            'totalCost' => (float) $item['totalCost'],
            'variationsGroups' => array_map( function ( $g ) {
                return [
                    'quantity'   => (int) ( $g['quantity'] ?? 0 ),
                    'variations' => array_map( function ( $v ) {
                        return [
                            'variationField' => isset( $v['variationField']['id'] )
                                ? [ 'id' => $v['variationField']['id'] ]
                                : null,
                            'value'          => $v['value'] ?? null,
                        ];
                    }, $g['variations'] ?? [] ),
                ];
            }, $item['variationsGroups'] ?? [] ),
        ];
        $clean['cartItems'][] = $cleanItem;
    }

    return $clean;
}

/**
 * Send a PATCH request to the Merchi API to update a cart.
 * @param string $cart_id The Merchi cart ID.
 * @param string $cart_token The Merchi cart token.
 * @param array $payload The data to PATCH to the cart.
 * @return array|WP_Error The response from the Merchi API.
 */
function patch_merchi_cart($cart_id, $cart_token, $payload) {     
    // Validate cart token
    if (empty($cart_token)) {
        error_log('Merchi PATCH skipped: cart_token not found');
        return array(
            'success' => false,
            'error' => 'Cart token is required for PATCH request'
        );
    }
    
     $cart_embed = [
        'cartItems' => [
            'product' => (object)[
            'domain' => (object)[
                'company' => (object)[
                    'defaultTaxType' => (object)[],
                    'taxTypes'       => (object)[]
                ]
            ],
            'featureImage'              => (object)[],  
            'groupVariationFields'      => (object)[   
                'options' => (object)[ 'linkedFile' => (object)[] ]
            ],
            'images'                    => (object)[],  
            'independentVariationFields'=> (object)[  
                'options' => (object)[ 'linkedFile' => (object)[] ]
            ],
            'taxType'                   => (object)[]
        ],
            'taxType'          => (object)[],
            'variations'       => (object)[     // variationsEmbed
                'selectedOptions' => (object)[],
                'variationField'  => (object)[  // optionsEmbed
                    'options' => (object)[ 'linkedFile' => (object)[] ],
                    'variationCostDiscountGroup'  => (object)[],
                    'variationUnitCostDiscountGroup' => (object)[]
                ],
                'variationFiles' => (object)[]
            ],
            'variationsGroups' => (object)[     // variationsGroupsEmbed
                'variations' => (object)[
                    'selectedOptions' => (object)[],
                    'variationField'  => (object)[
                        'options' => (object)[ 'linkedFile' => (object)[] ],
                        'variationCostDiscountGroup'  => (object)[],
                        'variationUnitCostDiscountGroup' => (object)[]
                    ],
                    'variationFiles' => (object)[]
                ]
            ],
        ],
        'client'        => [ 'emailAddresses' => (object)[], 'profilePicture' => (object)[] ],
        'clientCompany' => (object)[],
        'domain'        => [
            'company' => [
                'defaultTaxType'         => (object)[],
                'isStripeAccountEnabled' => (object)[],
                'taxTypes'               => (object)[],
            ],
        ],
        'invoice'         => (object)[],
        'receiverAddress' => (object)[],
        'shipmentGroups'  => [
            'cartItems'    => [ 'product' => (object)[] ],
            'quotes'       => [ 'shipmentMethod' => [ 'originAddress' => (object)[], 'taxType' => (object)[] ] ],
            'selectedQuote'=> [ 'shipmentMethod' => [ 'originAddress' => (object)[], 'taxType' => (object)[] ] ],
        ],
        'discountItems'   => (object)[],
    ];
    // Convert embed to JSON and URL encode
    $embed_json = json_encode($cart_embed);
    $embed_encoded = urlencode($embed_json);
    
    // Build the URL with embed parameter
    $api_url = MERCHI_URL . 'v6/carts/' . $cart_id . '/?cart_token=' . $cart_token . '&embed=' . $embed_encoded;
    
    $response = wp_remote_request(
        $api_url,
        array(
            'method' => 'PATCH',
            'headers' => array(
                'Content-Type' => 'application/json',
                'Accept' => 'application/json'
            ),
            'body' => json_encode($payload),
            'timeout' => 30
        )
    );
    
    if (is_wp_error($response)) {
        error_log('Merchi PATCH error: ' . $response->get_error_message());
        return array(
            'success' => false,
            'error' => $response->get_error_message()
        );
    }
    
    $response_code = wp_remote_retrieve_response_code($response);
    $response_body = wp_remote_retrieve_body($response);
    $response_data = json_decode($response_body, true);
    
    // Check for both HTTP error codes and API error responses
    if ($response_code >= 200 && $response_code < 300 && (!isset($response_data['errorCode']) || $response_data['errorCode'] === 0)) {
        error_log('Merchi PATCH successful');
        return array(
            'success' => true,
            'data' => $response_data
        );
    } else {
        $error_message = isset($response_data['message']) ? $response_data['message'] : 'Unknown error';
        error_log('Merchi PATCH failed with code: ' . $response_code);
        error_log('Response body: ' . $response_body);
        return array(
            'success' => false,
            'error' => 'API request failed: ' . $error_message,
            'details' => $response_data
        );
    }
}

function send_id_for_add_cart(){
    if (class_exists('WooCommerce')) {
        try {
            $item_count = count( WC()->cart->get_cart() ) ;
            $cart = $_POST['item']; 

            // Clear and store new session data
            WC()->session->__unset('merchi_cart_data');
            WC()->session->set('merchi_cart_data', $cart['merchiCartJson']);
                        
            if (function_exists('wc_clear_notices')) {
                wc_clear_notices();
            }
            // Trigger cart updated action to refresh blocks
            do_action('woocommerce_cart_updated');
        
        // Check if we have valid merchi cart data
        $merchi_cart_json = isset($cart['merchiCartJson']) ? $cart['merchiCartJson'] : null;
        
        // Only attempt to patch Merchi cart if we have valid data
        if ($merchi_cart_json && isset($merchi_cart_json['token']) && isset($merchi_cart_json['id'])) {
            $merchi_cart_token = $merchi_cart_json['token'];
            $cart_id = $merchi_cart_json['id'];
						
								$payload = merchi_build_clean_payload( $merchi_cart_json );
                
                $patch_response = patch_merchi_cart(
                    $cart_id,
                    $merchi_cart_token,
                    $payload
                );
                // Optionally, handle/log the response or errors
                if (is_wp_error($patch_response)) {
                    error_log('Merchi PATCH error: ' . $patch_response->get_error_message());
                } else {
                    error_log('Merchi PATCH success');
                }
            } else {
                error_log('Skipping Merchi PATCH - no valid cart data');
            }

            $taxAmount = $cart['taxAmount'];
            if(!isset($cart['cartItems'])){
                echo 0;
                exit;
            }

            $cartItems = $cart['cartItems'];
        
            // Set cart ID cookie
            setcookie('cstCartId', $cart_id, time() + (86400 * 30), "/");
            $_COOKIE['cstCartId'] = $cart_id;
            
            // Get cart token from cookie or generate new one
            $cart_token = null;
            if (isset($_COOKIE['cart-'.MERCHI_DOMAIN])) {
                $cookie_parts = explode(',', $_COOKIE['cart-'.MERCHI_DOMAIN]);
                if (count($cookie_parts) > 1) {
                    $cart_token = trim($cookie_parts[1]);
                }
            }
            
            $products = array();
            $productsAdded = array();
            foreach( $cartItems as $itemKey => $cartItem ){
                if (!isset($cartItem['productID'])) {
                    error_log('Warning: productID not set in cart item: ' . print_r($cartItem, true));
                    continue;
                }
                
                $sku = $cartItem['productID'];
                if(!in_array($sku, $products)){
                    $params = array(
                        'post_type' => 'product',
                        'meta_query' => array(
                            array(
                                'key' => '_sku',
                                'value' => $sku,
                                'compare' => '='
                            )
                        ),
                        'posts_per_page' => 12, 
                    );

                    $wc_query = new WP_Query($params);
                    if ($wc_query->have_posts()) {
                        $product = wc_get_product($wc_query->posts[0]);
                        $product_id = $product->get_id();
                        $products[$product_id] = $sku;
                    }
                }else{
                    $product_id = array_search($sku, $products, true);
                }

                $cart_item_data = array('selection'=>array());
                // Build the selection array as in the reference
                if (isset($cartItem['variations'])) {
                    foreach ($cartItem['variations'] as $i => $variationGroup) {
                        $group = array();
                        // Map all key-value pairs from variationGroup
                        if (is_array($variationGroup)) {
                            foreach ($variationGroup as $field_id => $value) {
                                $group[$field_id] = $value;
                            }
                        }
                        // Map objExtras by field ID if present
                        if (isset($cartItem['objExtras'][$i]) && is_array($cartItem['objExtras'][$i])) {
                            foreach ($cartItem['objExtras'][$i] as $extraKey => $extraValue) {
                                if ($extraKey === 'quantity') {
                                    $group['quantity'] = $extraValue;
                                } else {
                                    // Try to find the field ID by matching the key to the field name
                                    $field_id = null;
                                    foreach ($ordered_fields as $fid => $field) {
                                        if (isset($field['name']) && $field['name'] === $extraKey) {
                                            $field_id = $fid;
                                            break;
                                        }
                                    }
                                    if ($field_id !== null) {
                                        $group[$field_id] = $extraValue;
                                    } else {
                                        $group[$extraKey] = $extraValue; // fallback
                                    }
                                }
                            }
                        }
                        $cart_item_data['selection'][] = $group;
                    }
                }							
                $quantity = $cartItem['quantity'];

                $cart_item_key = WC()->cart->find_product_in_cart( WC()->cart->generate_cart_id( $product_id, 0, array(), $cart_item_data ) );
                $currentCartItem = array();
                if( $cart_item_key && array_key_exists($cart_item_key, $productsAdded) ) {
                    $current_quantity = $productsAdded[$cart_item_key]['quantity'];
                    $current_subTotal = $productsAdded[$cart_item_key]['subtotal'];
                    $newQuantity = intval($current_quantity) + intval($quantity);
                    WC()->cart->remove_cart_item( $cart_item_key );
                    $cart_item_key = WC()->cart->add_to_cart($product_id, $newQuantity, 0, array(), $cart_item_data);
                    $currentCartItem['quantity'] = $newQuantity;
                    $currentCartItem['subtotalCost'] = floatval($current_subTotal) + floatval($cartItem['subTotal']);
                    $productsAdded[$cart_item_key] = array( 'subtotal' => $currentCartItem['subtotalCost'], 'quantity' => $newQuantity );
                }else if( !$cart_item_key ){
                    $cart_item_key = WC()->cart->add_to_cart($product_id, $quantity, 0, array(), $cart_item_data);
                    $currentCartItem['quantity'] = $quantity;
                    $currentCartItem['subtotalCost'] = $cartItem['subTotal'];
                }else{
                    $productsAdded[$cart_item_key] = array( 'subtotal' => $cartItem['subTotal'], 'quantity' => $quantity );
                    continue;
                }
                $currentCartItem['product_id'] = $product_id;
                $currentCartItem['totalCost'] = $cartItem['totalCost'];
                $currentCartItem['taxAmount'] = $taxAmount;
                update_option("get_cart_myItems_".$cart_id."_".$cart_item_key, $currentCartItem);
                $productsAdded[] = $cart_item_key;
            }				
						$merchi_cart = null;

						if ( is_array( $patch_response )
     						&& ! empty( $patch_response['success'] )
     						&& isset( $patch_response['data']['cart'] ) ) {

    						$merchi_cart = $patch_response['data']['cart'];   						
    						// Update WC session with the latest cart data from PATCH response
    						if (WC()->session && $merchi_cart) {
    						    WC()->session->set('merchi_cart_data', $merchi_cart);
    						}
						}
						echo json_encode([
    						'success'    => true,
    						'merchiCart' => $merchi_cart
						]);
						wp_die();
        } catch(Exception $e) {
            error_log('Error in send_id_for_add_cart: ' . $e->getMessage());
            echo json_encode(array('success' => false, 'error' => $e->getMessage()));
        }
    }
    wp_die();
}

add_action( 'wp_ajax_cst_cart_item_after_remove', 'cst_cart_item_after_remove', 10, 2);
add_action( 'wp_ajax_nopriv_cst_cart_item_after_remove', 'cst_cart_item_after_remove', 10, 2);

function cst_cart_item_after_remove() {
    error_log('=== Merchi Cart Item Removal Process Started ===');
    
    if (isset($_COOKIE['cstCartId'])) {
        $item_id = $_POST['item_id'];
        $cart_id = $_COOKIE['cstCartId'];
        $cart_length = $_POST['cart_length'];
        
        error_log('Removal parameters:');
        error_log('- Item ID: ' . $item_id);
        error_log('- Cart ID: ' . $cart_id);
        error_log('- Cart length: ' . $cart_length);
        
        // Get cart token from cookie
        $cart_token = null;
        if (isset($_COOKIE['cart-'.MERCHI_DOMAIN])) {
            $cookie_parts = explode(',', $_COOKIE['cart-'.MERCHI_DOMAIN]);
            if (count($cookie_parts) > 1) {
                $cart_token = trim($cookie_parts[1]);
                error_log('Found cart token: ' . $cart_token);
            } else {
                error_log('Warning: Invalid cart cookie format');
            }
        } else {
            error_log('Warning: No cart cookie found');
        }

        // Make delete request to Merchi API if we have the token
        if ($cart_token) {
            $url = MERCHI_URL . 'v6/cart_items/' . $item_id . '/?cart_token=' . urlencode($cart_token);
            error_log('Attempting DELETE request to Merchi API: ' . $url);
            
            $args = array(
                'method' => 'DELETE',
                'timeout' => 30,
            );

            $response = wp_remote_request($url, $args);
            
            if (is_wp_error($response)) {
                error_log('Merchi API DELETE error: ' . $response->get_error_message());
            } else {
                $response_code = wp_remote_retrieve_response_code($response);
                $response_body = wp_remote_retrieve_body($response);
                error_log('Merchi API DELETE response:');
                error_log('- Status code: ' . $response_code);
                error_log('- Response body: ' . $response_body);
            }
        } else {
            error_log('Skipping Merchi API call - no cart token available');
        }

        if (1 == $cart_length || 0 == $cart_length) {
            error_log('Cart is empty or has only one item, clearing cookies');
            setcookie('cart-'.MERCHI_DOMAIN, "", time() - 3600, "/");
            setcookie("cstCartId", "", time() - 3600, "/");
            error_log('Cart cookies cleared');
        }

        $options = get_option_extended("get_cart_myItems_".$cart_id);
        $itemData = $options['get_cart_myItems_'.$cart_id.'_'.$item_id];
        error_log('Item data retrieved from options: ' . print_r($itemData, true));
        
        // Send success response with event data
        wp_send_json_success(array(
            'event' => 'merchi_cart_item_removed',
            'data' => array(
                'item_id' => $item_id,
                'cart_id' => $cart_id,
                'cart_length' => $cart_length,
                'item_data' => $itemData
            )
        ));
    } else {
        error_log('Error: No cstCartId cookie found during Merchi cart item removal');
    }
    error_log('=== Merchi Cart Item Removal Process Completed ===');
    exit;
}

// function my_custom_remove_cart_item_action( $removed_cart_item_key, $cart_item ) {
//     // Prevent recursive calls
//     static $is_processing = false;
//     if ($is_processing) {
//         return;
//     }
//     $is_processing = true;

//     try {
//         // Get the cart item data from the cart
//         $cart = WC()->cart;
//         if (!$cart) {
//             return;
//         }

//         // Remove the item from WooCommerce cart (if not already removed)
//         if ($cart->get_cart_item($removed_cart_item_key)) {
//             $cart->remove_cart_item($removed_cart_item_key);
//         }
        
//         // Get the cart ID from cookie
//         if (isset($_COOKIE['cstCartId'])) {
//             $cart_id = $_COOKIE['cstCartId'];
            
//             // Remove the item data from WordPress options
//             $option_key = 'get_cart_myItems_'.$cart_id.'_'.$removed_cart_item_key;
//             delete_option($option_key);
            
//             // Refresh cart session and totals
//             $cart->set_session();
//             $cart->calculate_totals();
            
//             // Get remaining cart items count
//             $remaining_items = $cart->get_cart_contents_count();
            
//             // If this was the last item, clear the cart cookies
//             if ($remaining_items <= 0) {
//                 //setcookie('cart-'.MERCHI_DOMAIN, "", time() - 3600, "/");
//                 setcookie("cstCartId", "", time() - 3600, "/");
//             }
//         }
//     } catch (Exception $e) {
//         error_log('Error in cart item removal: ' . $e->getMessage());
//     } finally {
//         $is_processing = false;
//     }
// }

function merchi_norm( $str ) {
    return strtolower( trim( (string) $str ) );
}

// extract the variation name → variation value mapping from woo cart
function merchi_variation_from_woo( $woo_item ) {
    $map = [];
    // Prefer selection array (contains stable field IDs)
    if ( is_array( $woo_item ) && ! empty( $woo_item['selection'] ) && is_array( $woo_item['selection'] ) ) {
        foreach ( $woo_item['selection'] as $group ) {
            if ( ! is_array( $group ) ) { continue; }
            foreach ( $group as $field_key => $field_value ) {
                if ( $field_key === 'quantity' ) { continue; }
                $key = (string) $field_key;
                $val = null;
                if ( is_array( $field_value ) ) {
                    if ( isset( $field_value['value'] ) && $field_value['value'] !== '' ) {
                        $val = (string) $field_value['value'];
                    } elseif ( isset( $field_value['selectedOptions'] ) && is_array( $field_value['selectedOptions'] ) ) {
                        $vals = [];
                        foreach ( $field_value['selectedOptions'] as $so ) {
                            if ( isset( $so['optionId'] ) ) { $vals[] = (string) $so['optionId']; }
                            elseif ( isset( $so['value'] ) ) { $vals[] = (string) $so['value']; }
                        }
                        if ( $vals ) { $val = implode( ',', $vals ); }
                    } elseif ( isset( $field_value['valueId'] ) ) {
                        $val = (string) $field_value['valueId'];
                    }
                } else {
                    $val = (string) $field_value;
                }
                if ( $val !== null && $val !== '' ) {
                    $map[ $key ] = merchi_norm( $val );
                }
            }
        }
    }
    // Fallback: use item_data (label/value) when selection is not available
    if ( ! $map && ! empty( $woo_item['item_data'] ) && is_array( $woo_item['item_data'] ) ) {
        foreach ( $woo_item['item_data'] as $data ) {
            if ( isset( $data['name'], $data['value'] ) ) {
                $map[ merchi_norm( $data['name'] ) ] = merchi_norm( $data['value'] );
            }
        }
    }
    return $map;
}
// extract the variation name → variation value mapping from merchi cart
function merchi_variation_from_merchi( $m_item ) {
    $map = [];
    if ( ! empty( $m_item['variationsGroups'] ) ) {
        foreach ( $m_item['variationsGroups'] as $g ) {
            foreach ( ($g['variations'] ?? []) as $v ) {
                $field = $v['variationField'] ?? [];
                $fname = isset( $field['id'] ) ? (string)$field['id'] : (string)($field['name'] ?? '');
                $val   = null;
                if ( isset( $v['selectedOptions'] ) && is_array( $v['selectedOptions'] ) ) {
                    $vals = [];
                    foreach ( $v['selectedOptions'] as $so ) {
                        if ( isset( $so['optionId'] ) ) { $vals[] = (string)$so['optionId']; }
                        elseif ( isset( $so['value'] ) ) { $vals[] = (string)$so['value']; }
                    }
                    if ( $vals ) { $val = implode( ',', $vals ); }
                }
                if ( $val === null && isset( $v['value'] ) ) {
                    $val = (string)$v['value'];
                }
                if ( $fname !== '' && $val !== null ) {
                    $map[ merchi_norm( $fname ) ] = merchi_norm( $val );
                }
            }
        }
    }
    return $map;
}

function merchi_fingerprint( $sku, $qty, $var_map ) {
    ksort( $var_map );
    return $sku . ':' . intval( $qty ) . ':' . md5( wp_json_encode( $var_map ) );
}

function merchi_sync_session_after_remove( $removed_key, $cart_obj ) {
    if ( ! WC()->session || empty( $_COOKIE['cstCartId'] ) ) {
        return;
    }
    $cart_id = $_COOKIE['cstCartId'];

    $merchi_cart = WC()->session->get( 'merchi_cart_data' );
    if ( empty( $merchi_cart['cartItems'] ) || ! is_array( $merchi_cart['cartItems'] ) ) {
        return;
    }

    // Attempt to identify the removed Woo item using WC's removed_cart_contents
    $removed_item = null;
    if ( isset( $cart_obj->removed_cart_contents ) && isset( $cart_obj->removed_cart_contents[ $removed_key ] ) ) {
        $removed_item = $cart_obj->removed_cart_contents[ $removed_key ];
    }

    $deleted_merchi_item_id = null;

    if ( $removed_item ) {
        $sku = isset( $removed_item['data'] ) && is_object( $removed_item['data'] ) && method_exists( $removed_item['data'], 'get_sku' )
            ? $removed_item['data']->get_sku()
            : '';
        $qty = intval( $removed_item['quantity'] ?? 0 );
        $var = merchi_variation_from_woo( $removed_item );
        $fp_removed = merchi_fingerprint( $sku, $qty, $var );

        $match_index = null;
        foreach ( $merchi_cart['cartItems'] as $idx => $m_item ) {
            $m_fp = merchi_fingerprint(
                $m_item['product']['id'] ?? $m_item['productID'],
                intval( $m_item['quantity'] ?? 0 ),
                merchi_variation_from_merchi( $m_item )
            );
            if ( $fp_removed === $m_fp ) {
                $match_index = $idx;
                $deleted_merchi_item_id = $m_item['id'] ?? null;
                break;
            }
        }

        if ( $match_index !== null ) {
            // Remove from session snapshot
            array_splice( $merchi_cart['cartItems'], $match_index, 1 );
            WC()->session->set( 'merchi_cart_data', $merchi_cart );

            // Also propagate deletion to Merchi API when possible
            if ( $deleted_merchi_item_id ) {
                $cart_token = null;
                if ( isset( $_COOKIE['cart-' . MERCHI_DOMAIN] ) ) {
                    $cookie_parts = explode( ',', $_COOKIE['cart-' . MERCHI_DOMAIN] );
                    if ( count( $cookie_parts ) > 1 ) {
                        $cart_token = trim( $cookie_parts[1] );
                    }
                }
                if ( $cart_token ) {
                    $url  = MERCHI_URL . 'v6/cart_items/' . urlencode( (string)$deleted_merchi_item_id ) . '/?cart_token=' . urlencode( $cart_token );
                    $args = array( 'method' => 'DELETE', 'timeout' => 30 );
                    wp_remote_request( $url, $args );
                }
            }
        }
    }

    // Rebuild per-item mapping for remaining items (handle duplicates safely)
    $used = [];
    $m_items_copy = $merchi_cart['cartItems'];
    foreach ( WC()->cart->get_cart() as $cart_item_key => $woo_item ) {
        $sku  = $woo_item['data']->get_sku();
        $qty  = intval( $woo_item['quantity'] );
        $var  = merchi_variation_from_woo( $woo_item );
        $fp   = merchi_fingerprint( $sku, $qty, $var );

        // find the matching item in merchi_cart_data
        $matched = null;
        foreach ( $m_items_copy as $m_item ) {
            $mid = (string) ( $m_item['id'] ?? md5( wp_json_encode( $m_item ) ) );
            if ( isset( $used[ $mid ] ) ) { continue; }
            $m_fp = merchi_fingerprint(
                $m_item['product']['id'] ?? $m_item['productID'],
                intval( $m_item['quantity'] ?? 0 ),
                merchi_variation_from_merchi( $m_item )
            );
            if ( $fp === $m_fp ) {
                $matched = $m_item;
                $used[ $mid ] = true;
                break;
            }
        }
        if ( ! $matched ) {
            continue;
        }

        $lineTotal = floatval( $matched['totalCost'] ?? 0 );
        if ( $lineTotal <= 0 ) {
            $lineTotal = floatval( $matched['subtotalCost'] ?? 0 );
        }
        $quantity  = intval( $matched['quantity'] ?? 0 );
        $currentCartItem = [
            'product_id'   => $matched['product']['id']    ?? $matched['productID'],
            'quantity'     => $quantity,
            'subtotalCost' => floatval( $matched['subtotalCost'] ?? 0 ),
            'totalCost'    => $lineTotal,
            'taxAmount'    => floatval( $matched['taxAmount'] ?? 0 ),
        ];
        update_option( "get_cart_myItems_{$cart_id}_{$cart_item_key}", $currentCartItem );
    }
}

// add_action( 'woocommerce_remove_cart_item', 'my_custom_remove_cart_item_action', 10, 2 );
add_action( 'woocommerce_remove_cart_item', 'merchi_sync_session_after_remove', 10, 2 );

add_filter( 'woocommerce_cart_item_quantity', 'wc_cart_item_quantity', 10, 3 );
function wc_cart_item_quantity( $product_quantity, $cart_item_key, $cart_item ){
    if( is_cart() ){
        $product_quantity = sprintf( '%2$s <input type="hidden" name="cart[%1$s][qty]" value="%2$s" />', $cart_item_key, $cart_item['quantity'] );
    }
    return $product_quantity;

}

function merchi_get_selected_value($field_key, $wanted_option_id = null, $group_hint = null) {
	$field_key = (string) $field_key;
	$wanted    = $wanted_option_id !== null ? (string) $wanted_option_id : null;

	if (!is_array($group_hint) || empty($group_hint['variations']) || !is_array($group_hint['variations'])) {
		return null;
	}

	// find specific field in target group
	foreach (($group_hint ? [$group_hint] : []) as $group) {
		foreach (($group['variations'] ?? []) as $var) {
			$vf  = $var['variationField'] ?? [];
			$vid = isset($vf['id'])   ? (string)$vf['id']   : null;
			$vnm = isset($vf['name']) ? (string)$vf['name'] : null;
			if ($vid !== $field_key && $vnm !== $field_key) {
				continue;
			}

			// get value from selectedOptions
			if (!empty($var['selectedOptions']) && is_array($var['selectedOptions'])) {
				$vals = [];
				foreach ($var['selectedOptions'] as $so) {
					if ($wanted !== null && isset($so['optionId']) && (string)$so['optionId'] !== $wanted) {
						continue;
					}
					if (isset($so['value']) && $so['value'] !== '') {
						$vals[] = (string) $so['value'];
					}
				}
				if ($vals) {
					return implode(', ', array_values(array_unique($vals)));
				}
			}

			// get value from selectableOptions by matching optionId
			$raw = isset($var['value']) ? (string)$var['value'] : '';
			if ($raw !== '') {
				foreach (($var['selectableOptions'] ?? []) as $opt) {
					if ((string)($opt['optionId'] ?? '') === $raw && isset($opt['value'])) {
						return (string)$opt['value'];
					}
				}
				foreach (($vf['options'] ?? []) as $opt) {
					if ((string)($opt['id'] ?? '') === $raw && isset($opt['value'])) {
						return (string)$opt['value'];
					}
				}
			}
			return null;
		}
	}
	return null;
}

add_filter( 'woocommerce_get_item_data', 'filter_woocommerce_get_item_data', 99, 2 );
function filter_woocommerce_get_item_data( $cart_data, $cart_item = null ) {
    if ( !$cart_item ) {
        return $cart_data;
    }

    $cart_data = array();

    // Try to get the WooCommerce product ID from the cart item
    $product_id = null;
    if (isset($cart_item['product_id'])) {
        $product_id = $cart_item['product_id'];
    } elseif (isset($cart_item['data']) && is_object($cart_item['data']) && method_exists($cart_item['data'], 'get_id')) {
        $product_id = $cart_item['data']->get_id();
    }

    // Get field labels and product meta
    $field_labels = $product_id ? get_post_meta($product_id, '_merchi_field_labels', true) : array();
    $merchi_product_data = $product_id ? get_post_meta($product_id, '_merchi_product_data', true) : array();

    // Build option value maps for select/radio fields
    $option_value_map = array();
    $field_option_label_map = array(); // field_id => [option_id => label]
    if (!empty($merchi_product_data['product'])) {
        $product = $merchi_product_data['product'];
        $fields = array();
        if (!empty($product['groupVariationFields'])) {
            $fields = array_merge($fields, $product['groupVariationFields']);
        }
        if (!empty($product['independentVariationFields'])) {
            $fields = array_merge($fields, $product['independentVariationFields']);
        }
        foreach ($fields as $field) {
            if (!empty($field['options'])) {
                $field_id = $field['id'];
                foreach ($field['options'] as $option) {
                    if (isset($option['id']) && isset($option['value'])) {
                        $option_value_map[$option['id']] = $option['value'];
                        $field_option_label_map[$field_id][$option['id']] = $option['value'];
                    }
                }
            }
        }
    }

    // Build a per-item Merchi group hint (variations list) by matching this cart row
    $merchi_group_hint = null;
    if (WC()->session) {
        $__m = WC()->session->get('merchi_cart_data');
        if (is_array($__m) && !empty($__m['cartItems']) && is_array($__m['cartItems'])) {
            $__sku = (isset($cart_item['data']) && is_object($cart_item['data']) && method_exists($cart_item['data'], 'get_sku')) ? $cart_item['data']->get_sku() : '';
            $__qty = intval($cart_item['quantity'] ?? 0);
            $__var = merchi_variation_from_woo($cart_item);
            $__fp  = merchi_fingerprint($__sku, $__qty, $__var);

            $__matched = null;
            foreach ($__m['cartItems'] as $__mi) {
                $__mfp = merchi_fingerprint(
                    $__mi['product']['id'] ?? $__mi['productID'],
                    intval($__mi['quantity'] ?? 0),
                    merchi_variation_from_merchi($__mi)
                );
                if ($__mfp === $__fp) { $__matched = $__mi; break; }
            }
            if ($__matched && !empty($__matched['variationsGroups'])) {
                $__vars = array();
                foreach ($__matched['variationsGroups'] as $__g) {
                    if (!empty($__g['variations']) && is_array($__g['variations'])) {
                        foreach ($__g['variations'] as $__v) { $__vars[] = $__v; }
                    }
                }
                if ($__vars) { $merchi_group_hint = array('variations' => $__vars); }
            }
        }
    }

    if (isset($cart_item['selection']) && is_array($cart_item['selection'])) {
        $group_count = 1;
        foreach ($cart_item['selection'] as $group) {
            if (is_array($group)) {
                $group_label = count($cart_item['selection']) > 1 ? 'Group ' . $group_count : null;
                if ($group_label) {
                    $cart_data[] = array(
                        'name' => $group_label,
                        'value' => '',
                        'display' => '',
                    );
                }
                foreach ($group as $field_label => $field_value) {
                    // Skip empty values except for '0'
                    if ((is_array($field_value) && empty($field_value)) || (!is_array($field_value) && trim((string)$field_value) === '' && $field_value !== '0')) {
                        continue;
                    }
                    $field_label_str = is_string($field_label) ? $field_label : (string)$field_label;
                    // Use field label from mapping if available
                    $label = isset($field_labels[$field_label_str]) ? $field_labels[$field_label_str] : ucfirst(str_replace('_', ' ', $field_label_str));

                    // Field-specific option label mapping
                    $field_id = $field_label_str;
                    $field_options = isset($field_option_label_map[$field_id]) ? $field_option_label_map[$field_id] : array();

                    // peritem selectedOptions text from matched merchi item
                    $selected_text = $merchi_group_hint ? merchi_get_selected_value((string)$field_label_str, null, $merchi_group_hint) : null;
                    if ($selected_text !== null && $selected_text !== '') {
                        $cart_data[] = array('name' => $label, 'value' => esc_html($selected_text), 'display' => '');
                        continue;
                    }

                    // --- Look for sibling variationFiles for this field ---
                    $variationFiles = null;
                    if (is_array($group)) {
                        foreach ($group as $k => $v) {
                            if (is_array($v) && isset($v['variationField']['id']) && isset($v['variationFiles']) && $v['variationField']['id'] == $field_label_str) {
                                $variationFiles = $v['variationFiles'];
                                break;
                            }
                        }
                    }
                    if ($variationFiles && is_array($variationFiles)) {
                        $file_links = array();
                        foreach ($variationFiles as $file) {
                            if (isset($file['downloadUrl']) && isset($file['name'])) {
                                $file_links[] = '<a href="' . esc_url($file['downloadUrl']) . '" target="_blank">' . esc_html($file['name']) . '</a>';
                            }
                        }
                        $value = implode(', ', $file_links);
                    }
                    // Handle file upload data (array of file objects)
                    elseif (is_array($field_value) && isset($field_value[0]['name']) && isset($field_value[0]['downloadUrl'])) {
                        $file_links = array();
                        foreach ($field_value as $file) {
                            if (isset($file['downloadUrl']) && isset($file['name'])) {
                                $file_links[] = '<a href="' . esc_url($file['downloadUrl']) . '" target="_blank">' . esc_html($file['name']) . '</a>';
                            }
                        }
                        $value = implode(', ', $file_links);
                    }
                    // Handle file upload data (variationFiles property)
                    elseif (isset($field_value['variationFiles']) && is_array($field_value['variationFiles'])) {
                        $file_links = array();
                        foreach ($field_value['variationFiles'] as $file) {
                            if (isset($file['downloadUrl']) && isset($file['name'])) {
                                $file_links[] = '<a href="' . esc_url($file['downloadUrl']) . '" target="_blank">' . esc_html($file['name']) . '</a>';
                            }
                        }
                        $value = implode(', ', $file_links);
                    }
                    // Handle regular file URLs
                    elseif (filter_var($field_value, FILTER_VALIDATE_URL)) {
                        $value = '<a href="' . esc_url($field_value) . '" target="_blank">' . basename($field_value) . '</a>';
                    }
                    // Handle option values and fallback for file IDs, using field-specific mapping
                    elseif (is_array($field_value)) {
                        // Only show labels that exist in this field's options
                        $labels = array();
                        foreach ($field_value as $v) {
                            if (isset($field_options[$v])) {
                                $labels[] = esc_html($field_options[$v]);
                            }
                        }
                        if (empty($labels)) {
                            continue; // skip if no valid labels
                        }
                        $value = implode(', ', $labels);
                        $cart_data[] = array(
                            'name' => $label,
                            'value' => $value,
                            'display' => '',
                        );
                        continue;
                    }
                    // Handle single option value for fields with options
                    if (!empty($field_options)) {
                        if (isset($field_options[$field_value])) {
                            $value = esc_html($field_options[$field_value]);
                            $cart_data[] = array(
                                'name' => $label,
                                'value' => $value,
                                'display' => '',
                            );
                        }
                        // If not found, skip
                        continue;
                    }
                    // Handle color values
                    if (is_string($field_value) && preg_match('/^#([A-Fa-f0-9]{6})$/', $field_value)) {
                        $value = '<span style="display:inline-block;width:16px;height:16px;background:' . esc_attr($field_value) . ';border:1px solid #ccc;vertical-align:middle;margin-right:4px;"></span> ' . esc_html($field_value);
                        $cart_data[] = array(
                            'name' => $label,
                            'value' => $value,
                            'display' => '',
                        );
                        continue;
                    }
                    // Handle URLs
                    if (is_string($field_value) && filter_var($field_value, FILTER_VALIDATE_URL)) {
                        $value = '<a href="' . esc_url($field_value) . '" target="_blank">' . basename($field_value) . '</a>';
                        $cart_data[] = array(
                            'name' => $label,
                            'value' => $value,
                            'display' => '',
                        );
                        continue;
                    }
                    // Default case (show value)
                    $value = esc_html($field_value);
                    $cart_data[] = array(
                        'name' => $label,
                        'value' => $value,
                        'display' => '',
                    );
                }
                $group_count++;
            } else {
                if (trim((string)$group) === '' && $group !== '0') {
                    continue;
                }
                $cart_data[] = array(
                    'name' => 'Field',
                    'value' => esc_html($group),
                );
            }}
    }
    return $cart_data;
}
add_filter( 'woocommerce_get_item_data', 'filter_woocommerce_get_item_data', 99, 2 );

add_filter( 'woocommerce_add_to_cart_fragments', 'cart_count_fragments_wp', 10, 1 );

add_action( 'wp_footer', function () {
	?>
	<style>
		.wc-block-cart-item__quantity .wc-block-components-quantity-selector {
			display: none !important;
		}
	</style>
	<?php
}, 9999 );  

function cart_count_fragments_wp( $fragments ) {
	if(WC()->cart->get_cart_contents_count()){
		$fragments['#mini-cart .cart-items'] = '<span class="cart-items">' . WC()->cart->get_cart_contents_count() . '</span>';
	}else{
		$fragments['#mini-cart .cart-items'] = '<span class="cart-items-none">' . WC()->cart->get_cart_contents_count() . '</span>';
	}
    return $fragments;
}

// add_action( 'woocommerce_before_calculate_totals', 'merchi_apply_prices_by_index', 20 );

function merchi_apply_prices_by_index( $cart ) {
    $merchi_cart = WC()->session ? WC()->session->get( 'merchi_cart_data' ) : null;
    if ( ! $merchi_cart || empty( $merchi_cart['cartItems'] ) ) return;

    $m_items = array_values( $merchi_cart['cartItems'] );
    $woo_items = array_values( $cart->get_cart() );
    $max = min( count( $woo_items ), count( $m_items ) );

    for ( $i = 0; $i < $max; $i++ ) {
        $m = $m_items[ $i ];
        if ( ! isset( $m['totalCost'], $m['quantity'] ) || $m['quantity'] <= 0 ) {
            continue;
        }

        $unit = floatval( $m['totalCost'] ) / intval( $m['quantity'] );
        $woo_items[ $i ]['data']->set_price( $unit );
        $woo_items[ $i ]['data']->set_regular_price( $unit );
        $woo_items[ $i ]['data']->set_sale_price( '' );
    }
}

// add_action( 'woocommerce_before_calculate_totals', 'bbloomer_alter_price_cart', 0 );

function bbloomer_alter_price_cart( $cart ) {
    if ( is_admin() && ! defined( 'DOING_AJAX' ) ) return;
    
    if (!isset($_COOKIE['cstCartId'])) {
        return;
    }
    
    $cart_id = $_COOKIE['cstCartId'];
    $options = get_option_extended('get_cart_myItems_'.$cart_id."_");
 
    //LOOP THROUGH CART ITEMS & APPLY PRICE
    foreach ( $cart->get_cart() as $cart_item_key => $cart_item ) {
        $option_key = 'get_cart_myItems_'.$cart_id.'_'.$cart_item_key;
        if (!isset($options[$option_key])) {
            continue;
        }
        
        $itemData = $options[$option_key];
        if (!isset($itemData['quantity']) || !isset($itemData['subtotalCost'])) {
            continue;
        }
        
        $product = $cart_item['data'];
				$quantity = max( 1, intval( $itemData['quantity'] ) );
				$cost = isset( $itemData['totalCost'] ) ? $itemData['totalCost'] : $itemData['subtotalCost'];
				$unit = floatval( $cost );
				if ( $unit <= 0 ) continue;
				$cart_item['data']->set_price( $unit );
        $cart_item['data']->set_regular_price( $unit );
        $cart_item['data']->set_sale_price( '' );
    }
}

function woo_add_cart_fee( $cart ) {
    if ( is_admin() && ! defined( 'DOING_AJAX' ) ) {
        return;
    }

    if (!isset($_COOKIE['cstCartId'])) {
        return;
    }

    $item_fee = 0;
    $cart_id = $_COOKIE['cstCartId'];
	
	  $options = get_option_extended('get_cart_myItems_'.$cart_id."_");

    foreach ( $cart->get_cart() as $cart_item_key => $cart_item ) {
        $option_key = 'get_cart_myItems_'.$cart_id.'_'.$cart_item_key;
        if (!isset($options[$option_key])) {
            continue;
        }
        
        $itemData = $options[$option_key];
        if (isset($itemData['taxAmount'])) {
            $item_fee = floatval($itemData['taxAmount']);
            break; // We only need the first valid tax amount
        }
    }

    if ($item_fee > 0) {
        // add_fee method (TAX will NOT be applied here)
        $cart->add_fee( 'Tax: ', $item_fee, false );
    }
}
add_action( 'woocommerce_cart_calculate_fees','woo_add_cart_fee' );

function get_option_extended($partial_key) {
    global $wpdb;

    $partial_key = $wpdb->esc_like($partial_key);

    $option_name_pattern = '%' . $partial_key . '%';

    $query = $wpdb->prepare("SELECT * FROM $wpdb->options WHERE option_name LIKE %s", $option_name_pattern);

    $results = $wpdb->get_results($query);

    $options = array();

    if ($results) {
        foreach ($results as $result) {
            $options[$result->option_name] = maybe_unserialize($result->option_value);
        }
    }

    return $options;
}
function cst_woocommerce_cart_item_class( $string, $cart_item, $cart_item_key ) {
	static $count = 0;
    $string = $string.' cst_cart_item cst_item_'.$count;
	$count++;
    return $string;
}
add_filter( 'woocommerce_cart_item_class', 'cst_woocommerce_cart_item_class', 10, 3 );

add_action('wp_footer', function(){
	?>
	<div class="cst-loader-container loader-hidden" id="cstLoader">
		<div class="cstLoader"></div>
	</div>
	<?php
});



add_filter( 'woocommerce_payment_gateways', 'cst_add_gateway_class' );
function cst_add_gateway_class( $gateways ) {
	$gateways[] = 'WC_Merchi_Gateway'; // your class name is here
	return $gateways;
}

add_action( 'plugins_loaded', 'cst_init_gateway_class' );
function cst_init_gateway_class() {
    // Check if WooCommerce is active
    if (!class_exists('WooCommerce')) {
        return;
    }

	class WC_Merchi_Gateway extends WC_Payment_Gateway {

 		/**
 		 * Class constructor, more about it in Step 3
 		 */

		public $testmode;
		public $private_key;
		public $publishable_key;
 		public function __construct() {
			
			$this->id = 'merchi'; // payment gateway plugin ID
			$this->icon = ''; // URL of the icon that will be displayed on checkout page near your gateway name
			$this->has_fields = true; // in case you need a custom credit card form
			$this->method_title = 'Merchi Gateway';
			$this->method_description = 'Description of Merchi payment gateway'; // will be displayed on the options page

			// gateways can support subscriptions, refunds, saved payment methods,
			// but in this tutorial we begin with simple payments
			$this->supports = array(
				'products'
			);

			// Method with all the options fields
			$this->init_form_fields();

			// Load the settings.
			$this->init_settings();
			$this->title = $this->get_option( 'title' );
			$this->description = $this->get_option( 'description' );
			$this->enabled = $this->get_option( 'enabled' );
			$this->testmode = 'yes' === $this->get_option( 'testmode' );
			$this->private_key = $this->testmode ? $this->get_option( 'test_private_key' ) : $this->get_option( 'private_key' );
			$this->publishable_key = $this->testmode ? $this->get_option( 'test_publishable_key' ) : $this->get_option( 'publishable_key' );

			// This action hook saves the settings
			add_action( 'woocommerce_update_options_payment_gateways_' . $this->id, array( $this, 'process_admin_options' ) );

			// We need custom JavaScript to obtain a token
			add_action( 'wp_enqueue_scripts', array( $this, 'payment_scripts' ) );
		
 		}

		/**
 		 * Plugin options, we deal with it in Step 3 too
 		 */
 		public function init_form_fields(){

			$this->form_fields = array(
				'enabled' => array(
					'title'       => 'Enable/Disable',
					'label'       => 'Enable Merchi Gateway',
					'type'        => 'checkbox',
					'description' => '',
					'default'     => 'no'
				),
				'title' => array(
					'title'       => 'Title',
					'type'        => 'text',
					'description' => 'This controls the title which the user sees during checkout.',
					'default'     => 'Credit Card',
					'desc_tip'    => true,
				),
				'description' => array(
					'title'       => 'Description',
					'type'        => 'textarea',
					'description' => 'This controls the description which the user sees during checkout.',
					'default'     => 'Pay with your credit card via our super-cool payment gateway.',
				),
				'testmode' => array(
					'title'       => 'Test mode',
					'label'       => 'Enable Test Mode',
					'type'        => 'checkbox',
					'description' => 'Place the payment gateway in test mode using test API keys.',
					'default'     => 'yes',
					'desc_tip'    => true,
				),
				'test_publishable_key' => array(
					'title'       => 'Test Publishable Key',
					'type'        => 'text'
				),
				'test_private_key' => array(
					'title'       => 'Test Private Key',
					'type'        => 'password',
				),
				'publishable_key' => array(
					'title'       => 'Live Publishable Key',
					'type'        => 'text'
				),
				'private_key' => array(
					'title'       => 'Live Private Key',
					'type'        => 'password'
				)
			);
	
	 	}

		/**
		 * You will need it if you want your custom credit card form, Step 4 is about it
		 */
		public function payment_fields() {

			
			// ok, let's display some description before the payment form
			if( $this->description ) {
				// you can instructions for test mode, I mean test card numbers etc.
				if( $this->testmode ) {
					$this->description  = trim( $this->description );
				}
				// display the description with <p> tags etc.
				echo wpautop( wp_kses_post( $this->description ) );
			}
		 
			echo '<form id="payment-form">
      <div id="link-authentication-element">
        <!--Stripe.js injects the Link Authentication Element-->
      </div>
      <div id="payment-element">
        <!--Stripe.js injects the Payment Element-->
      </div>
      <button id="submit" class="cst-stripe-payment-button">
        <div class="spinner hidden" id="spinner"></div>
        <span id="button-text">Pay now</span>
      </button>
      <div id="payment-message" class="hidden"></div>
      </form>';
				 
		}

		/*
		 * Custom CSS and JS, in most cases required only when you decided to go with a custom credit card form
		 */
	 	public function payment_scripts() {

			// we need JavaScript to process a token only on cart/checkout pages, right?
			if( ! is_cart() && ! is_checkout() && ! isset( $_GET[ 'pay_for_order' ] ) ) {
				return;
			}

			// if our payment gateway is disabled, we do not have to enqueue JS too
			if( 'no' === $this->enabled ) {
				return;
			}

			// no reason to enqueue JavaScript if API keys are not set
			if( empty( $this->private_key ) || empty( $this->publishable_key ) ) {
				return;
			}

			// do not work with card detailes without SSL unless your website is in a test mode
			if( ! $this->testmode && ! is_ssl() ) {
				return;
			}
			
			// in most payment processors you have to use PUBLIC KEY to obtain a token
			wp_localize_script( 'custom-public-script', 'merchi_params', array(
				'publishableKey' => $this->publishable_key
			) );
	
	 	}

		/*
 		 * Fields validation, more in Step 5
		 */
		public function validate_fields() {

			if( empty( $_POST[ 'billing_first_name' ] ) ) {
				wc_add_notice( 'First name is required!', 'error' );
				return false;
			}
			return true;

		}

		/*
		 * We're processing the payments here, everything about it is in Step 5
		 */
		public function process_payment( $order_id ) {

			// we need it to get any order detailes
			$order = wc_get_order( $order_id );

			// we received the payment
			$order->payment_complete();
			$order->reduce_order_stock();

			// some notes to customer (replace true with false to make it private)
			$order->add_order_note( 'Hey, your order is paid! Thank you!', true );

			// Empty cart
			WC()->cart->empty_cart();

			// Redirect to the thank you page
			return array(
				'result' => 'success',
				'redirect' => $this->get_return_url( $order ),
			);	
	 	}
 	}
}


add_action('wp_ajax_cst_add_shipping', 'cst_add_shipping');
add_action('wp_ajax_nopriv_cst_add_shipping', 'cst_add_shipping');
function cst_add_shipping() {
    if (isset($_POST['shippingCost'])) {
        WC()->session->set('cst_shipping_cost', floatval($_POST['shippingCost']));
        echo json_encode(array('success' => true));
    } else {
        echo json_encode(array('success' => false, 'error' => 'No shipping cost provided'));
    }
    wp_die();
}

add_action('woocommerce_cart_calculate_fees', 'cst_add_cart_custom_fee');

function cst_add_cart_custom_fee() {
    $extracost = WC()->session->get( 'cst_shipping_cost' );
    WC()->cart->add_fee('Shipping & Handling:', $extracost);
}

add_filter('woocommerce_order_button_html', 'cst_order_button_html' );
function cst_order_button_html( $button ) {
	$class = 'class="button cst-order-place-button alt btn-v-dark w-100 mt-3 py-3"';
	$button_text = apply_filters( 'woocommerce_order_button_text', __( 'Place order', 'woocommerce' ) );
	$button = '<a '.$class.'>' . $button_text . '</a>';
    return $button;
}

add_filter( 'woocommerce_default_address_fields', 'cst_optional_last_name' );
function cst_optional_last_name( $fields ) {
    $fields['last_name']['required']    = false;
    return $fields;
}

add_action('wp_ajax_prodct_title_attach', 'prodct_title_attach');
add_action('wp_ajax_nopriv_prodct_title_attach', 'prodct_title_attach');

function prodct_title_attach() {
    $product_title = sanitize_text_field($_POST['product_title']);
    $product_id = sanitize_text_field($_POST['postId']);
	  $product_sku = sanitize_text_field($_POST['product_id']); 
    error_log('Product Title: ' . $product_title);
    error_log('Product ID: ' . $product_id);

    $update_args = array(
        'ID'         => $product_id,
        'post_title' => $product_title,
		    'post_status'   => 'publish',
    );

	update_post_meta($product_id, '_sku', $product_sku);
    $result = wp_update_post($update_args);

    if (is_wp_error($result)) {
        error_log('Error updating product title: ' . $result->get_error_message());
        echo 'Error updating product title: ' . $result->get_error_message();
    } else {
        error_log('Product Title Updated!');
        echo 'Product Title Updated!';
    }
    wp_die();
}

add_action('woocommerce_after_cart_table', 'add_clear_cart_button');
function add_clear_cart_button() {
    ?>
    <form class="woocommerce-cart-form" action="<?php echo esc_url(wc_get_cart_url()); ?>" method="post">
        <p class="woocommerce-Button woocommerce-Button--secondary">
            <input type="hidden" name="clear-cart" value="1" />
            <button type="submit" class="button" name="clear_cart" value="<?php esc_attr_e('Clear Cart', 'woocommerce'); ?>">
                <?php esc_html_e('Clear Cart', 'woocommerce'); ?>
            </button>
        </p>
    </form>
    <?php
}

// Function to handle clearing the cart
add_action('init', 'clear_cart_action');
function clear_cart_action() {
    if (isset($_POST['clear_cart']) && $_POST['clear_cart'] == 'Clear Cart') {
        WC()->cart->empty_cart();
		setcookie('cart-'.MERCHI_DOMAIN, "", time() - 3600, "/");
		setcookie("cstCartId", "", time() - 3600, "/");
		?>
		<script>
			localStorage.removeItem("MerchiCart");
		</script>
		<?php
    }
}

add_action('wp_ajax_cst_remove_cookie', 'cst_remove_cookie');
add_action('wp_ajax_nopriv_cst_remove_cookie', 'cst_remove_cookie');

function cst_remove_cookie(){
	$cookieName = $_POST['cookieName'];
	setcookie($cookieName, "", time() - 3600, "/");
}



//jeet
// Add a top-level menu item
function my_plugin_menu() {
    add_menu_page(
        'My Plugin Page', // Page title
        'My Plugin',      // Menu title
        'manage_options', // Capability required to access the menu
        'my-plugin-page', // Menu slug (unique identifier)
        'my_plugin_page_callback', // Callback function to display the menu page
        'dashicons-admin-generic', // Icon URL or Dashicons class
        20 // Position in the menu
    );
}
add_action('admin_menu', 'my_plugin_menu');

// Callback function to display the menu page
function my_plugin_page_callback() {
    // Display your menu page content here
    echo '<div class="wrap">';
    echo '<h1>My Plugin Page</h1>';
    echo '<p>This is where you can add your plugin settings and content.</p>';
    echo '</div>';
}
// Add a sub-menu item under the top-level menu created above
function my_plugin_submenu() {
    add_submenu_page(
        'my-plugin-page', // Parent menu slug
        'Submenu Page',    // Page title
        'Submenu',         // Menu title
        'manage_options',  // Capability required to access the submenu
        'my-submenu-page', // Menu slug (unique identifier)
        'my_submenu_page_callback' // Callback function to display the submenu page
    );
}
add_action('admin_menu', 'my_plugin_submenu');

// Callback function to display the submenu page
function my_submenu_page_callback() {
    
    echo '<h1>Submenu Page</h1>';
    
	  echo '<button class="clickme" type="button">Click Me!</button>';
	
}

// Add an action to save billing phone in the order details
add_action('woocommerce_checkout_create_order', 'cst_save_billing_phone');
function cst_save_billing_phone($order) {
	$biling_phone  = WC()->session->get( 'cst_billing_phone');
    $order->set_billing_phone($biling_phone);
	WC()->session->__unset( 'cst_billing_phone' );
}
/**
 * Adds a loader HTML element before the add to cart button on single product pages.
 */
add_action('wp_head', 'add_product_loader_to_header');

function add_product_loader_to_header() {
    echo '<div id="overlay" style="display:none;"></div>
          <div id="product-loader" style="display:none; position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); z-index:9999;">
            <img src="' . plugin_dir_url(__FILE__) . 'images/loading-loading-gif.gif" alt="Loading...">
          </div>';
		  ?>
		  <style>
#overlay {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7); /* Dark semi-transparent background */
    z-index: 9998; /* Just below the loader */
}
</style>
		  <?php
}

add_action('wp_ajax_fetch_products', 'fetch_products_from_merchi');
add_action('wp_ajax_nopriv_fetch_products', 'fetch_products_from_merchi');

function fetch_products_from_merchi() {
    // Get necessary data from the AJAX request or set defaults
    $api_key = sanitize_text_field($_POST['apiKey']);
    $api_url = sanitize_url($_POST['apiUrl']);
    $domain_id = sanitize_text_field($_POST['domainId']);
		$q = sanitize_text_field($_POST['q']);
    $offset = isset($_POST['offset']) ? intval($_POST['offset']) : 0;
    $limit = 25;

    // Build the API URL with embed for featureImage
    $embed = urlencode(json_encode(['featureImage' => new stdClass()]));
    $api_url = esc_url_raw($api_url."v6/products/?apiKey=$api_key&inDomain=$domain_id&limit=$limit&offset=$offset&q=$q&embed=$embed");


    // Make the external API request
    $response = wp_remote_get($api_url);

    // Check if the request was successful
    if (is_wp_error($response)) {
        wp_send_json_error(['message' => 'Error fetching products']);
        wp_die();
    }

    // Get and decode the API response
    $body = wp_remote_retrieve_body($response);
    $products = json_decode($body, true);

    // Add thumbnailUrl to each product if possible
    if (isset($products['products']) && !empty($products['products'])) {
        foreach ($products['products'] as &$item) {
            if (isset($item['product']['featureImage']['id']) && isset($item['product']['featureImage']['mimetype'])) {
                $featureImage = $item['product']['featureImage'];
                $fileType = explode('/', $featureImage['mimetype'])[1];
                $item['product']['thumbnailUrl'] = MERCHI_URL . "v6/product-public-file/download/" . $featureImage['id'] . "." . $fileType;
            } else {
                $item['product']['thumbnailUrl'] = '';
            }
        }
        unset($item);
        wp_send_json_success($products);
    } else {
        wp_send_json_error(['message' => 'No products found']);
    }

    wp_die(); // Terminate to ensure no further output
}

add_action('wp_ajax_save_product_meta', 'save_product_meta_callback');

function save_product_meta_callback() {
    $product_id = intval($_POST['wooProductId']);
    $selected_id = sanitize_text_field($_POST['selectedId']);
    $selected_name = sanitize_text_field($_POST['selectedName']);
    $selected_price = sanitize_text_field($_POST['selectedPrice']);

    if (!$product_id) {
        wp_send_json_error(['message' => 'Invalid product ID']);
        wp_die();
    }

    // Update WooCommerce product meta
    update_post_meta($product_id, 'product_id', $selected_id);
	  update_post_meta($product_id, 'product_name', $selected_name);
	  update_post_meta($product_id, '_regular_price',  $selected_price);

    wp_send_json_success(['message' => 'Product meta saved successfully']);
    wp_die();
}

add_action('wp_ajax_fetch_merchi_product', 'fetch_merchi_product_callback');


function fetch_merchi_product_callback() {
    $woo_product_id = isset($_POST['wooProductId']) ? intval($_POST['wooProductId']) : 0;
    if (!$woo_product_id) {
        error_log('fetch_merchi_product_callback: Missing WooCommerce Product ID');
        wp_send_json_error(['message' => 'WooCommerce Product ID is required.']);
        wp_die();
    }
    
    error_log('fetch_merchi_product_callback: Fetching product for Woo ID ' . $woo_product_id);
    $result = import_merchi_product_data($woo_product_id);

    if ($result['success']) {
        error_log('fetch_merchi_product_callback: Success - ' . $result['message']);
        wp_send_json_success(['message' => $result['message']]);
    } else {
        error_log('fetch_merchi_product_callback: Error - ' . $result['message']);
        wp_send_json_error(['message' => $result['message']]);
    }
    wp_die();
}

function import_merchi_product_data($woo_product_id) {
    $merchi_product_id = get_post_meta($woo_product_id, 'product_id', true);
    if (empty($merchi_product_id)) {
        error_log('import_merchi_product_data: Merchi Product ID not found in product meta for Woo ID ' . $woo_product_id);
        return ['success' => false, 'message' => 'Merchi Product ID not found in product meta.'];
    }

    $merchi_domain_id = defined('MERCHI_DOMAIN') ? MERCHI_DOMAIN : '';
    $merchi_api_secret = defined('MERCHI_API_SECRET') ? MERCHI_API_SECRET : '';
    $merchi_api_url = defined('MERCHI_URL') ? MERCHI_URL : '';
    if (empty($merchi_api_url)) {
        $merchi_api_url = 'https://api.merchi.co/';
        error_log('import_merchi_product_data: Using default Merchi API URL: ' . $merchi_api_url);
    }
    if (empty($merchi_domain_id) || empty($merchi_api_secret) || empty($merchi_api_url)) {
        error_log('import_merchi_product_data: Missing Merchi API credentials or URL.');
        return ['success' => false, 'message' => 'Missing Merchi API credentials or URL.'];
    }
    $api_url_base = rtrim($merchi_api_url, '/') . '/v6/products/' . $merchi_product_id . '/?apiKey=' . $merchi_api_secret . '&inDomain=' . $merchi_domain_id . '&skip_rights=y';
    error_log('import_merchi_product_data: API URL - ' . $api_url_base);

    $productEmbed = [
        'component' => new stdClass(),
        'defaultJob' => new stdClass(),
        'domain' => [
            'activeTheme' => ['mainCss' => new stdClass()],
            'logo' => new stdClass()
        ],
        'draftTemplates' => ['file' => new stdClass()],
        'groupBuyStatus' => new stdClass(),
        'groupVariationFields' => ['options' => ['linkedFile' => new stdClass()]],
        'images' => new stdClass(),
        'independentVariationFields' => ['options' => ['linkedFile' => new stdClass()]],
        'publicFiles' => new stdClass(),
    ];
    $embed_json = json_encode($productEmbed);
    $embed_encoded = urlencode($embed_json);
    $api_url = $api_url_base . "&embed=" . $embed_encoded;
    error_log('import_merchi_product_data: Full API URL - ' . $api_url);

    // Debug: Log the actual API request
    error_log('import_merchi_product_data: Making API request to: ' . $api_url);
    $response = wp_remote_get($api_url);

    // Debug: Log the raw response
    if (is_wp_error($response)) {
        error_log('import_merchi_product_data: Failed to fetch Merchi product data. ' . $response->get_error_message());
        return ['success' => false, 'message' => 'Failed to fetch Merchi product data.'];
    }
    error_log('import_merchi_product_data: Raw API response: ' . print_r($response, true));

    $body = wp_remote_retrieve_body($response);
    error_log('import_merchi_product_data: API response body: ' . $body);
    $data = json_decode($body, true);
    error_log('import_merchi_product_data: Decoded API response: ' . print_r($data, true));

    // Improved error handling for missing or invalid product
    if (!is_array($data) || !isset($data['product']) || empty($data['product'])) {
        error_log('import_merchi_product_data: No valid product found in API response!');
        return ['success' => false, 'message' => 'No valid product found in API response. Raw response: ' . $body];
    }

    if (isset($data['product']['allowQuotation'])) {
        $allow_quotation = $data['product']['allowQuotation'];
        update_post_meta($woo_product_id, 'allowQuotation', $allow_quotation);
    }

    update_post_meta($woo_product_id, '_merchi_product_data', $data);

    $field_labels = [];
    if (!empty($data['product']['groupVariationFields'])) {
        foreach ($data['product']['groupVariationFields'] as $field) {
            $field_labels[$field['id']] = $field['name'];
        }
    }
    if (!empty($data['product']['independentVariationFields'])) {
        foreach ($data['product']['independentVariationFields'] as $field) {
            $field_labels[$field['id']] = $field['name'];
        }
    }
    update_post_meta($woo_product_id, '_merchi_field_labels', $field_labels);

    create_variations_for_product($woo_product_id, $data);
    
    return ['success' => true, 'message' => 'Variations created for WooCommerce Product ID: ' . $woo_product_id];
}

add_action('wp_ajax_create_product_from_merchi', 'create_product_from_merchi_callback');
function create_product_from_merchi_callback() {
    $merchi_product_id = isset($_POST['merchiProductId']) ? sanitize_text_field($_POST['merchiProductId']) : '';
    $merchi_product_name = isset($_POST['merchiProductName']) ? sanitize_text_field($_POST['merchiProductName']) : '';
    $merchi_product_price = isset($_POST['merchiProductPrice']) ? sanitize_text_field($_POST['merchiProductPrice']) : '';

    if (empty($merchi_product_id) || empty($merchi_product_name)) {
        wp_send_json_error(['message' => 'Missing Merchi product data.']);
    }

    $new_product = new WC_Product_Simple();
    $new_product->set_name($merchi_product_name);
    $new_product->set_status('draft');
    $new_product->set_regular_price($merchi_product_price);
    $new_product->set_price($merchi_product_price);
    $new_product_id = $new_product->save();

    if ($new_product_id) {
        update_post_meta($new_product_id, 'product_id', $merchi_product_id);
        update_post_meta($new_product_id, 'product_name', $merchi_product_name);

        $import_result = import_merchi_product_data($new_product_id);
        
        $edit_url = get_edit_post_link($new_product_id, 'raw');

        wp_send_json_success([
            'edit_url' => $edit_url,
            'message' => 'Product created. ' . $import_result['message']
        ]);

    } else {
        wp_send_json_error(['message' => 'Failed to create WooCommerce product.']);
    }
}

function download_and_attach_image($image_url) {
    require_once ABSPATH . 'wp-admin/includes/file.php';
    require_once ABSPATH . 'wp-admin/includes/media.php';
    require_once ABSPATH . 'wp-admin/includes/image.php';

    // Debug log
    error_log('Attempting to download and attach image from URL: ' . $image_url);

    $upload_dir = wp_upload_dir();
    if (is_wp_error($upload_dir)) {
        error_log('Error getting upload directory: ' . $upload_dir->get_error_message());
        return false;
    }

    $response = wp_remote_head($image_url);
    if (is_wp_error($response)) {
        error_log('Error checking image URL: ' . $response->get_error_message());
        return false;
    }

    $content_type = wp_remote_retrieve_header($response, 'content-type');
    error_log('Image content type: ' . $content_type);

    $extension = '';
    if (strpos($content_type, 'image/jpeg') !== false) {
        $extension = '.jpg';
    } elseif (strpos($content_type, 'image/png') !== false) {
        $extension = '.png';
    } elseif (strpos($content_type, 'image/gif') !== false) {
        $extension = '.gif';
    } elseif (strpos($content_type, 'image/webp') !== false) {
        $extension = '.webp';
    }

    if (empty($extension)) {
        error_log('Unsupported image type: ' . $content_type);
        return false;
    }

    $filename = sanitize_file_name(uniqid('merchi_image_') . $extension);
    $file_path = $upload_dir['path'] . '/' . $filename;

    $existing_attachment_id = attachment_url_to_postid($upload_dir['url'] . '/' . $filename);
    if ($existing_attachment_id) {
        error_log('Found existing attachment ID: ' . $existing_attachment_id);
        return $existing_attachment_id;
    }

    $tmp = download_url($image_url);
    if (is_wp_error($tmp)) {
        error_log('Error downloading image: ' . $tmp->get_error_message());
        return false;
    }

    $file_array = [
        'name'     => $filename,
        'tmp_name' => $tmp,
    ];

    $attachment_id = media_handle_sideload($file_array, 0);
    if (is_wp_error($attachment_id)) {
        @unlink($tmp);
        error_log('Error creating attachment: ' . $attachment_id->get_error_message());
        return false;
    }

    error_log('Successfully created attachment with ID: ' . $attachment_id);
    return $attachment_id;
}

/**
* Create a global WooCommerce attribute if it doesn't exist
*/
function create_global_attribute($attribute_name, $attribute_label) {
	global $wpdb;

	$attribute_name = generate_short_slug($attribute_name);
	$attribute_label = sanitize_text_field($attribute_label);

	$exists = $wpdb->get_var($wpdb->prepare(
			"SELECT attribute_id FROM {$wpdb->prefix}woocommerce_attribute_taxonomies WHERE attribute_name = %s",
			$attribute_name
	));

	if (!$exists) {
			$wpdb->insert(
					"{$wpdb->prefix}woocommerce_attribute_taxonomies",
					[
							'attribute_name' => $attribute_name,
							'attribute_label' => $attribute_label,
							'attribute_type' => 'select',
							'attribute_orderby' => 'menu_order',
							'attribute_public' => 0
					],
					['%s', '%s', '%s', '%s', '%d']
			);

			delete_transient('wc_attribute_taxonomies');

			register_taxonomy(
					'pa_' . $attribute_name,
					'product',
					[
							'hierarchical' => false,
							'show_ui' => false,
							'query_var' => true,
							'rewrite' => false,
					]
			);
	}
}

/**
* Generate a valid, unique, and shortened slug for WooCommerce attributes
*/
function generate_short_slug($attribute_name) {
	// Convert to lowercase and replace spaces with underscores
	$slug = sanitize_title($attribute_name);
	$slug = str_replace('-', '_', $slug);

	// WooCommerce attribute slugs have a max length of 28 characters
	if (strlen($slug) > 28) {
			// Shorten it while keeping readability
			$words = explode('_', $slug);
			$short_slug = '';

			foreach ($words as $word) {
					if (strlen($short_slug . '_' . $word) <= 28) {
							$short_slug .= (empty($short_slug) ? '' : '_') . $word;
					} else {
							break;
					}
			}

			$slug = $short_slug;
	}
	
	return $slug;
}

// Add image upload field when adding a new term
function add_taxonomy_image_field($taxonomy) {
	?>
	<div class="form-field term-group">
			<label for="taxonomy_image"><?php esc_html_e('Term Image', 'woocommerce'); ?></label>
			<div class="taxonomy-image-wrapper">
					<img id="taxonomy-image-preview" src="" style="max-width:100px;height:auto;display:none;" />
			</div>
			<input type="hidden" id="taxonomy_image" name="taxonomy_image" value="" />
			<button class="upload_image_button button"><?php esc_html_e('Upload Image', 'woocommerce'); ?></button>
			<button class="remove_image_button button" style="display:none;"><?php esc_html_e('Remove Image', 'woocommerce'); ?></button>
			<p class="description"><?php esc_html_e('Upload an image for this taxonomy term.', 'woocommerce'); ?></p>
	</div>
	<?php
}
add_action('admin_init', function () {
	$taxonomies = get_taxonomies([], 'names');
	foreach ($taxonomies as $taxonomy) {
			add_action("{$taxonomy}_add_form_fields", 'add_taxonomy_image_field');
	}
});

// Add image upload field when editing an existing term
function edit_taxonomy_image_field($term) {
	$image_id = get_term_meta($term->term_id, 'taxonomy_image', true);
	$image_url = $image_id ? wp_get_attachment_url($image_id) : '';
	?>
	<tr class="form-field term-group-wrap">
			<th scope="row"><label for="taxonomy_image"><?php esc_html_e('Term Image', 'woocommerce'); ?></label></th>
			<td>
					<div class="taxonomy-image-wrapper">
							<?php if ($image_url): ?>
									<img id="taxonomy-image-preview" src="<?php echo esc_url($image_url); ?>" style="max-width:100px;height:auto;" />
							<?php else: ?>
									<img id="taxonomy-image-preview" src="" style="max-width:100px;height:auto;display:none;" />
							<?php endif; ?>
					</div>
					<input type="hidden" id="taxonomy_image" name="taxonomy_image" value="<?php echo esc_attr($image_id); ?>" />
					<button class="upload_image_button button"><?php esc_html_e('Upload Image', 'woocommerce'); ?></button>
					<button class="remove_image_button button" <?php echo $image_id ? '' : 'style="display:none;"'; ?>><?php esc_html_e('Remove Image', 'woocommerce'); ?></button>
			</td>
	</tr>
	<?php
}

add_action('admin_init', function () {
	$taxonomies = get_taxonomies([], 'names');
	foreach ($taxonomies as $taxonomy) {
			add_action("{$taxonomy}_edit_form_fields", 'edit_taxonomy_image_field');
	}
});

// Save term image meta field
function save_taxonomy_image($term_id) {
	if (isset($_POST['taxonomy_image'])) {
			update_term_meta($term_id, 'taxonomy_image', intval($_POST['taxonomy_image']));
	}
}
add_action('admin_init', function () {
	$taxonomies = get_taxonomies([], 'names');
	foreach ($taxonomies as $taxonomy) {
			add_action("created_{$taxonomy}", 'save_taxonomy_image');
			add_action("edited_{$taxonomy}", 'save_taxonomy_image');
	}
});

// Add a new column to the term table
function add_taxonomy_image_column($columns) {
	$columns['taxonomy_image'] = __('Image', 'woocommerce');
	return $columns;
}

// Display the term image in the new column
function display_taxonomy_image_column($content, $column_name, $term_id) {
	if ($column_name === 'taxonomy_image') {
			$image_id = get_term_meta($term_id, 'taxonomy_image', true);
			$image_url = $image_id ? wp_get_attachment_url($image_id) : '';

			if ($image_url) {
					$content = '<img src="' . esc_url($image_url) . '" style="width:50px; height:auto;"/>';
			} else {
					$content = __('No Image', 'woocommerce');
			}
	}
	return $content;
}

// Apply the column modifications to all taxonomies
add_action('admin_init', function () {
	$taxonomies = get_taxonomies([], 'names');
	foreach ($taxonomies as $taxonomy) {
			add_filter("manage_edit-{$taxonomy}_columns", 'add_taxonomy_image_column');
			add_filter("manage_{$taxonomy}_custom_column", 'display_taxonomy_image_column', 10, 3);
	}
});




function create_variation_combinations($woo_product_id, $attributes) {
	$product = wc_get_product($woo_product_id);

	$variations = [];
	foreach ($attributes as $attribute_name => $attribute_data) {
			$values = explode('|', $attribute_data['value']);
			$variations[] = $values;
	}

	$variation_combinations = generate_combinations($variations);

	foreach ($variation_combinations as $variation_values) {
			$variation_id = wc_get_product_variation_id($woo_product_id, $variation_values);

			if (!$variation_id) {
					$variation = new WC_Product_Variation();
					$variation->set_parent_id($woo_product_id);
					$variation->set_attributes(array_combine(array_keys($attributes), $variation_values));
					$variation->set_regular_price(0);
					$variation->set_stock_status('instock');
					$variation_id = $variation->save();
			}
	}
}

function generate_combinations($arrays, $i = 0) {
	if (!isset($arrays[$i])) {
			return [[]];
	}

	$combinations = [];
	foreach ($arrays[$i] as $value) {
			foreach (generate_combinations($arrays, $i + 1) as $combination) {
					array_unshift($combination, $value);
					$combinations[] = $combination;
			}
	}
	return $combinations;
}

function wc_get_product_variation_id($product_id, $attributes) {
	$args = [
			'post_type'   => 'product_variation',
			'post_parent' => $product_id,
			'numberposts' => -1,
			'fields'      => 'ids'
	];

	$variations = get_posts($args);

	foreach ($variations as $variation_id) {
			$match = true;
			foreach ($attributes as $key => $value) {
					if (get_post_meta($variation_id, 'attribute_' . sanitize_title($key), true) !== $value) {
							$match = false;
							break;
					}
			}
			if ($match) {
					return $variation_id;
			}
	}
	return false;
}

// AJAX handler for updating shipment method
add_action('wp_ajax_update_shipment_method', 'ajax_update_shipment_method');
add_action('wp_ajax_nopriv_update_shipment_method', 'ajax_update_shipment_method');
function ajax_update_shipment_method() {
	wp_send_json_success();
}

function create_variations_for_product($woo_product_id, $merchi_product_data) {
	error_log('create_variations_for_product: Starting for WooCommerce Product ID: ' . $woo_product_id);
	
	$product = wc_get_product($woo_product_id);
	if (!$product) {
		error_log('create_variations_for_product: Product not found for ID: ' . $woo_product_id);
		return;
	}

	$attributes_to_add = [];
	$product_meta_inputs = [];
	$merchi_product = $merchi_product_data['product'];

	$merchi_ordered_fields = [];
	$grouped_field_template = [];

	error_log('create_variations_for_product: Processing grouped variation fields');
	if (!empty($merchi_product['groupVariationFields'])) {
		error_log('create_variations_for_product: Found ' . count($merchi_product['groupVariationFields']) . ' grouped variation fields');
		foreach ($merchi_product['groupVariationFields'] as $group_field) {
			$field_type = intval($group_field['fieldType']);
			$field_id = intval($group_field['id']);
			$field_name = sanitize_text_field($group_field['name']);
			$slug = generate_short_slug($field_name);
			$options = $group_field['options'] ?? [];

			error_log('create_variations_for_product: Processing grouped field: ' . $field_name . ' with ' . count($options) . ' options');

			if (!empty($options) && is_array($options)) {
				$taxonomy = 'pa_' . $slug;
				if (!taxonomy_exists($taxonomy)) {
					error_log('create_variations_for_product: Creating taxonomy: ' . $taxonomy);
					create_global_attribute($slug, $field_name);
				}

				$variation_options = [];
				foreach ($options as $option) {
					if (!empty($option['include']) && !empty($option['value'])) {
						$option_value = sanitize_text_field($option['value']);
						$image_url = !empty($option['linkedFile']['viewUrl']) ? esc_url($option['linkedFile']['viewUrl']) : '';

						$term = term_exists($option_value, $taxonomy);
						if (!$term) {
							$term_info = wp_insert_term($option_value, $taxonomy);
							if (!is_wp_error($term_info) && isset($term_info['term_id'])) {
								$term_id = $term_info['term_id'];
								error_log('create_variations_for_product: Created term: ' . $option_value . ' with ID: ' . $term_id);
							}
						} else {
							$term_id = $term['term_id'];
							error_log('create_variations_for_product: Found existing term: ' . $option_value . ' with ID: ' . $term_id);
						}

						if (!empty($image_url) && !empty($term_id)) {
							update_term_meta($term_id, 'linkedFile.viewUrl', $image_url);
						}

						if (!empty($option['id'])) {
							update_term_meta($term_id, 'variation_option_id', sanitize_text_field($option['id']));
						}

						// Store variation costs in term meta
						$variation_cost = floatval($option['variationCost'] ?? 0);
						$variation_unit_cost = floatval($option['variationUnitCost'] ?? 0);
						$colour = sanitize_text_field($option['colour']) ?? '';
						update_term_meta($term_id, 'variationCost', $variation_cost);
						update_term_meta($term_id, 'variationUnitCost', $variation_unit_cost);
						update_term_meta($term_id, 'colour', $colour);

						$variation_options[] = $option_value;
					}
				}

				if (!empty($variation_options)) {
					wp_set_object_terms($woo_product_id, $variation_options, $taxonomy);
					error_log('create_variations_for_product: Set terms for taxonomy ' . $taxonomy . ': ' . implode(', ', $variation_options));
				}

				$grouped_field_template[] = [
					'type'      => 'attribute',
					'taxonomy'  => $taxonomy,
					'slug'      => $slug,
					'label'     => $field_name,
					'fieldType' => $field_type,
					'fieldID'   => $field_id,
					'required'  => !empty($group_field['required']),
					'multipleSelect' => !empty($group_field['multipleSelect']),
					'position' => $group_field['position'] ?? 0,
					'variationCost' => floatval($group_field['variationCost'] ?? 0),
					'variationUnitCost' => floatval($group_field['variationUnitCost'] ?? 0),
				];
			} else {
				$grouped_field_template[] = [
					'type'         => 'meta',
					'slug'         => $slug,
					'label'        => $field_name,
					'fieldType'    => $field_type,
					'fieldID'      => $field_id,
					'placeholder'  => esc_attr($group_field['placeholder'] ?? ''),
					'instructions' => esc_html($group_field['instructions'] ?? ''),
					'required'     => !empty($group_field['required']),
					'multipleSelect' => !empty($group_field['multipleSelect']),
					'position' => $group_field['position'] ?? 0,
					'variationCost' => floatval($group_field['variationCost'] ?? 0),
					'variationUnitCost' => floatval($group_field['variationUnitCost'] ?? 0),
				];
			}
		}
	}

	error_log('create_variations_for_product: Processing independent variation fields');
	if (!empty($merchi_product['independentVariationFields'])) {
		error_log('create_variations_for_product: Found ' . count($merchi_product['independentVariationFields']) . ' independent variation fields');
		foreach ($merchi_product['independentVariationFields'] as $variation_field) {
			$field_type = $variation_field['fieldType'];
			$field_id = $variation_field['id'];
			$field_name = sanitize_text_field($variation_field['name']);
			$slug = generate_short_slug($field_name);
			$taxonomy = 'pa_' . $slug;
			$options = $variation_field['options'] ?? [];

			error_log('create_variations_for_product: Processing independent field: ' . $field_name . ' with ' . count($options) . ' options');

			$is_option_field = in_array($field_type, [2, 6, 7, 9, 11]);

			if ($is_option_field && !empty($options)) {
				if (!taxonomy_exists($taxonomy)) {
					error_log('create_variations_for_product: Creating taxonomy: ' . $taxonomy);
					create_global_attribute($slug, $field_name);
				}

				$variation_options = [];

				foreach ($options as $option) {
					if (!empty($option['include']) && !empty($option['value'])) {
						$option_value = sanitize_text_field($option['value']);
						$image_url = !empty($option['linkedFile']['viewUrl']) ? esc_url($option['linkedFile']['viewUrl']) : '';
						$variation_option_cost = floatval($option['variationCost'] ?? 0);
						$variation_option_unit_cost = floatval($option['variationUnitCost'] ?? 0);
						$colour = sanitize_text_field($option['colour']) ?? '';

						$term = term_exists($option_value, $taxonomy);
						if (!$term) {
							$term_info = wp_insert_term($option_value, $taxonomy);
							if (!is_wp_error($term_info) && isset($term_info['term_id'])) {
								$term_id = $term_info['term_id'];
								error_log('create_variations_for_product: Created term: ' . $option_value . ' with ID: ' . $term_id);
							}
						} else {
							$term_id = $term['term_id'];
							error_log('create_variations_for_product: Found existing term: ' . $option_value . ' with ID: ' . $term_id);
						}

						if (!empty($image_url) && !empty($term_id)) {
							$attachment_id = download_and_attach_image($image_url);
							if ($attachment_id) {
								update_term_meta($term_id, 'taxonomy_image', $attachment_id);
							}
						}

						if (!empty($option['id'])) {
							update_term_meta($term_id, 'variation_option_id', sanitize_text_field($option['id']));
						}

						// Add variation costs to term meta
						update_term_meta($term_id, 'colour', $colour);
						update_term_meta($term_id, 'variationCost', $variation_option_cost);
						update_term_meta($term_id, 'variationUnitCost', $variation_option_unit_cost);

						$variation_options[] = $option_value;
					}
				}

				if (!empty($variation_options)) {
					wp_set_object_terms($woo_product_id, $variation_options, $taxonomy);
					error_log('create_variations_for_product: Set terms for taxonomy ' . $taxonomy . ': ' . implode(', ', $variation_options));

					$attributes_to_add[$taxonomy] = [
						'name'         => wc_attribute_taxonomy_name($slug),
						'is_visible'   => 1,
						'is_variation' => 0,
						'is_taxonomy'  => 1
					];
				}

				$merchi_ordered_fields[] = [
					'type'       => 'attribute',
					'taxonomy'   => $taxonomy,
					'slug'       => $slug,
					'label'      => $field_name,
					'fieldType'  => $field_type,
					'fieldID'    => $field_id,
					'required'   => !empty($variation_field['required']),
					'multipleSelect' => !empty($variation_field['multipleSelect']),
					'position' => $variation_field['position'] ?? 0,
					'variationCost' => $variation_field['variationCost'] ?? 0,
					'variationUnitCost' => $variation_field['variationUnitCost'] ?? 0,
				];
			} else {
				$meta_field = [
					'type'          => 'meta',
					'slug'          => $slug,
					'label'         => $field_name,
					'fieldType'     => $field_type,
					'fieldID'       => $field_id,
					'placeholder'   => $variation_field['placeholder'] ?? '',
					'instructions'  => $variation_field['instructions'] ?? '',
					'required'      => !empty($variation_field['required']),
					'multipleSelect' => !empty($variation_field['multipleSelect']),
				];

				$product_meta_inputs[] = $meta_field;
				$merchi_ordered_fields[] = $meta_field;
			}
		}
	}

	error_log('create_variations_for_product: Saving product meta data');
	update_post_meta($woo_product_id, '_product_attributes', $attributes_to_add);
	update_post_meta($woo_product_id, '_custom_product_fields', $product_meta_inputs);
	update_post_meta($woo_product_id, '_merchi_ordered_fields', $merchi_ordered_fields);
	update_post_meta($woo_product_id, '_group_variation_field_template', $grouped_field_template);

	$default_price = floatval($merchi_product['defaultJob']['totalCost']);
	error_log('create_variations_for_product: Setting default price: ' . $default_price);

	$product = wc_get_product($woo_product_id);
	$product->set_regular_price($default_price);
	$product->save();

	update_post_meta($woo_product_id, '_merchi_default_price', $default_price);
	
	error_log('create_variations_for_product: Completed successfully for WooCommerce Product ID: ' . $woo_product_id);
}

add_action('wp_footer', function() {
    ?>
    <script>
    jQuery(document).ready(function($) {
        var currentUrl = window.location.href.toLowerCase();
        
        if (currentUrl.includes('thankyou') || currentUrl.includes('order-received')) {
            $('.wc-block-mini-cart, .widget_shopping_cart, #mini-cart, .wp-block-woocommerce-mini-cart').hide();
          
            setTimeout(function() {
                $('.wc-block-mini-cart, .widget_shopping_cart, #mini-cart, .wp-block-woocommerce-mini-cart').hide();
            }, 500);
        }
    });
    </script>
    <?php
}, 9999);

add_action('init', function () {
    add_filter('woocommerce_get_cart_contents', 'merchi_modify_cart_contents_for_blocks', 10, 1);
});

function merchi_modify_cart_contents_for_blocks( $cart_contents ) {   
    if ( ! isset( $_COOKIE['cstCartId'] ) ) {
        $logged_once = true;
        return $cart_contents;
    }
    $cart_id = $_COOKIE['cstCartId'];
    
    $merchi_cart_data = null;
    if ( WC()->session ) {
        $merchi_cart_data = WC()->session->get( 'merchi_cart_data' );
    }

    // Preload option mapping per Woo cart_item_key
    $options_map = get_option_extended( 'get_cart_myItems_' . $cart_id . '_' );

    $has_merchi_items = ( ! empty( $merchi_cart_data['cartItems'] ) && is_array( $merchi_cart_data['cartItems'] ) );
    $has_options_map  = ( is_array( $options_map ) && ! empty( $options_map ) );
    if ( ! $has_merchi_items && ! $has_options_map ) {
        return $cart_contents;
    }

    // Build Merchi lookup maps and ordered list for final fallback
    $m_by_fp = array();
    $m_by_skuqty = array();
    $m_items_indexed = array();
    if ( $has_merchi_items ) {
        $m_items_indexed = array_values( $merchi_cart_data['cartItems'] );
        // keep stable order by id like old behavior for last fallback only
        usort( $m_items_indexed, fn( $a, $b ) => ( $a['id'] ?? 0 ) <=> ( $b['id'] ?? 0 ) );

        foreach ( $merchi_cart_data['cartItems'] as $m_item ) {
            $sku_m = (string) ( $m_item['product']['id'] ?? $m_item['productID'] ?? '' );
            $qty_m = intval( $m_item['quantity'] ?? 0 );
            $fp_m  = merchi_fingerprint( $sku_m, $qty_m, merchi_variation_from_merchi( $m_item ) );

            $m_by_fp[ $fp_m ] = $m_item;

            $key = $sku_m . '|' . $qty_m;
            if ( ! isset( $m_by_skuqty[ $key ] ) ) {
                $m_by_skuqty[ $key ] = array();
            }
            // queue to handle duplicates
            $m_by_skuqty[ $key ][] = $m_item;
        }
    }

    $idx_fallback = 0;

    foreach ( $cart_contents as $cart_item_key => &$cart_item ) {
        $applied = false;
        if ( $has_options_map && ! $applied ) {
            $opt_key = 'get_cart_myItems_' . $cart_id . '_' . $cart_item_key;

            if ( isset( $options_map[ $opt_key ] ) && is_array( $options_map[ $opt_key ] ) ) {
                $itemData = $options_map[ $opt_key ];
                $qty_m = max( 1, intval( $itemData['quantity'] ?? ( $cart_item['quantity'] ?? 1 ) ) );
                $cost_m = floatval( $itemData['totalCost'] ?? ( $itemData['subtotalCost'] ?? 0 ) );

                if ( $cost_m > 0 && $qty_m > 0 ) {
                    $unit = $cost_m / $qty_m;
                    $cart_item['data']->set_price( $unit );
                    $cart_item['data']->set_regular_price( $unit );
                    $cart_item['data']->set_sale_price( '' );
                    $applied = true;
                }
            }
        }

        if ( $applied ) {
            continue;
        }

        // fingerprint match from merchi session
        if ( $has_merchi_items && ! $applied ) {
            $sku  = (string) $cart_item['data']->get_sku();
            $qty  = intval( $cart_item['quantity'] );
            $var  = merchi_variation_from_woo( $cart_item );
            $fp   = merchi_fingerprint( $sku, $qty, $var );

            if ( isset( $m_by_fp[ $fp ] ) ) {
                $m = $m_by_fp[ $fp ];

                if ( isset( $m['totalCost'], $m['quantity'] ) && intval( $m['quantity'] ) > 0 ) {
                    $unit = floatval( $m['totalCost'] ) / intval( $m['quantity'] );
                    $cart_item['data']->set_price( $unit );
                    $cart_item['data']->set_regular_price( $unit );
                    $cart_item['data']->set_sale_price( '' );
                    $applied = true;
                }
            }
        }

        if ( $applied ) {
            continue;
        }

        if ( $has_merchi_items && ! $applied ) {
            $sku  = (string) $cart_item['data']->get_sku();
            $qty  = intval( $cart_item['quantity'] );
            $key  = $sku . '|' . $qty;

            if ( isset( $m_by_skuqty[ $key ] ) && ! empty( $m_by_skuqty[ $key ] ) ) {
                $m = array_shift( $m_by_skuqty[ $key ] );

                if ( isset( $m['totalCost'], $m['quantity'] ) && intval( $m['quantity'] ) > 0 ) {
                    $unit = floatval( $m['totalCost'] ) / intval( $m['quantity'] );
                    $cart_item['data']->set_price( $unit );
                    $cart_item['data']->set_regular_price( $unit );
                    $cart_item['data']->set_sale_price( '' );
                    $applied = true;
                }
            }
        }

        if ( $applied ) {
            continue;
        }

        // // position fallback to preserve initial display
        // if ( $has_merchi_items && isset( $m_items_indexed[ $idx_fallback ] ) ) {
        //     $m = $m_items_indexed[ $idx_fallback ];
        //     $idx_fallback++;
        //     if ( isset( $m['totalCost'], $m['quantity'] ) && intval( $m['quantity'] ) > 0 ) {
        //         $unit = floatval( $m['totalCost'] ) / intval( $m['quantity'] );
        //         $cart_item['data']->set_price( $unit );
        //         $cart_item['data']->set_regular_price( $unit );
        //         $cart_item['data']->set_sale_price( '' );
        //     }
        // }
    }
    return $cart_contents;
}

