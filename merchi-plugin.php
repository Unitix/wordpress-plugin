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
    if ($template_name === 'checkout/form-checkout.php') {
        // Path to your custom template inside the plugin
        return plugin_dir_path(__FILE__) . 'woocommerce/checkout/form-checkout.php';
    }else if ($template_name === 'checkout/thankyou.php') {
		return plugin_dir_path(__FILE__) . 'woocommerce/checkout/thankyou.php';
	}
    return $template;
}
add_filter('woocommerce_locate_template', 'custom_override_woocommerce_template', 10, 3);

add_action( 'cst_woocommerce_checkout_order_review', 'woocommerce_order_review', 10 );

add_filter( 'woocommerce_billing_fields', 'bbloomer_move_checkout_email_field' );
 
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


// function cst_is_phone( $phone ) {

// 	// $phone = preg_replace('/[^0-9]/', '', $phone);
//     // $phone= substr_replace($phone, ' ', 5, 0);
//     // return $phone;   /^\+?\d{2,3}(\s?[\(\)\-]?\d{3,5}[\(\)\-]?\s?)?\d{6,}$/
// 	 return (bool) preg_match( "/^\\+?[1-9][0-9]{7,14}$/", $phone );
	 
// }
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

function enqueue_admin_customfiles()
{
	wp_enqueue_style('custom-admin-style', plugin_dir_url(__FILE__) . 'custom.css');
	wp_enqueue_style('cst-jquery-ui-style', 'https://code.jquery.com/ui/1.12.1/themes/base/jquery-ui.css');
	wp_enqueue_script('cst-jquery-ui', 'https://code.jquery.com/ui/1.12.1/jquery-ui.js', array('jquery'), null, true);
	wp_enqueue_script('custom-admin-script', plugin_dir_url(__FILE__) . 'custom.js', array('cst-jquery-ui'), null, true);
	wp_localize_script('custom-admin-script', 'frontendajax', array('ajaxurl' => admin_url('admin-ajax.php')));
	wp_enqueue_script('custom-merchi-script', MERCHI_BASE_URL.'/static/js/dist/merchi-init.js', array(), null, true);
	wp_localize_script('custom-admin-script', 'scriptData', array(
		'merchi_mode' => MERCHI_MODE,
		'merchi_domain' => MERCHI_DOMAIN,
		'merchi_url' => MERCHI_URL,
		'merchi_secret' => MERCHI_API_SECRET,
		'woo_product_id' => get_the_ID()
	));
}
add_action('admin_enqueue_scripts', 'enqueue_admin_customfiles');

function enqueue_my_public_script()
{
	wp_enqueue_style('custom-admin-style', plugin_dir_url(__FILE__) . 'custom.css');
	wp_enqueue_script('custom-checkout-script', plugins_url('/woocommerce/checkout/checkout.js', __FILE__), array(), '1.0', true);
	wp_enqueue_script('custom-stripe-script', 'https://js.stripe.com/v3/', array(), '1.0', true);
	wp_enqueue_script('custom-public-script', plugin_dir_url(__FILE__) . 'public_custom.js', array('jquery'), rand(0,1000), true);
	wp_enqueue_script('custom-merchi-script', MERCHI_BASE_URL.'/static/js/dist/merchi-init.js', array(), null, true);
	
	$is_single_product = is_product();
	$stripeSecret = false;
	$billing_values = WC()->session->get( 'cst_billing_info' ) ? WC()->session->get( 'cst_billing_info' ) : false;
	$telephoneInput = false;
	if($billing_values){
		$telephoneInput = $billing_values['billing_phone'];
	}
	if( isset($_COOKIE['cart-'.MERCHI_DOMAIN]) && !empty($_COOKIE['cart-'.MERCHI_DOMAIN]) && is_checkout() && ( isset($_GET['step']) && $_GET['step'] == 3 ) ){
		$cart = explode(',', $_COOKIE['cart-'.MERCHI_DOMAIN]);
		$url = MERCHI_URL.'v6/stripe/payment_intent/cart/'.$cart[0].'/?cart_token='.$cart[1];
		$response = wp_remote_get( $url, array('timeout'=> 20) );

		$resp = json_decode(wp_remote_retrieve_body($response));
		$stripeSecret = $resp->stripeClientSecret;
	}
	wp_localize_script('custom-public-script', 'scriptData', array(
		'is_single_product' => $is_single_product,
		'merchi_domain' => MERCHI_DOMAIN,
		'merchi_stripe_api_key' => MERCHI_STRIPE_API_KEY,
	));
	wp_localize_script('custom-public-script', 'frontendajax', array('ajaxurl' => admin_url('admin-ajax.php'), 'checkouturl' => wc_get_checkout_url(), 'stripeSecret' => $stripeSecret, 'telephoneInput' => $telephoneInput, 'billing_values'=> $billing_values));
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

	if (is_admin() && 'product' === $post->post_type && isset($_GET['post'])) {
		$newproduct_id = $_GET['post'];
	}

	global $post;
	$product_id = get_post_meta($post->ID, 'product_id', true);
	$product_name = get_post_meta($post->ID, 'product_name', true);
	$product_regular_price = get_post_meta($post->ID, '_regular_price', true);
	$redirectAfterSuccessUrl = get_post_meta(get_the_ID(), 'redirectAfterSuccessUrl', true);
	$redirectAfterQuoteSuccessUrl = get_post_meta(get_the_ID(), 'redirectAfterQuoteSuccessUrl', true);
	$redirectWithValue = get_post_meta(get_the_ID(), 'redirectWithValue', true);
	$hideInfo = get_post_meta(get_the_ID(), 'hideInfo', true);
	$hidePreview = get_post_meta(get_the_ID(), 'hidePreview', true);
	$hidePrice = get_post_meta(get_the_ID(), 'hidePrice', true);
	$hideTitle = get_post_meta(get_the_ID(), 'hideTitle', true);
	$hideCalculatedPrice = get_post_meta(get_the_ID(), 'hideCalculatedPrice', true);
	$includeBootstrap = get_post_meta(get_the_ID(), 'includeBootstrap', true);
	$notIncludeDefaultCss = get_post_meta(get_the_ID(), 'notIncludeDefaultCss', true);
	$invoiceRedirect = get_post_meta(get_the_ID(), 'invoiceRedirect', true);
	$loadTheme = get_post_meta(get_the_ID(), 'loadTheme', true);
	$mountPointId = get_post_meta(get_the_ID(), 'mountPointId', true);
	$singleColumn = get_post_meta(get_the_ID(), 'singleColumn', true);
	$quoteRequestedRedirect = get_post_meta(get_the_ID(), 'quoteRequestedRedirect', true);
	$googleApiPublicKey = get_post_meta(get_the_ID(), 'googleApiPublicKey', true);
	$allowAddToCart = get_post_meta(get_the_ID(), 'allowAddToCart', true);
	$hideDrafting = get_post_meta(get_the_ID(), 'hideDrafting', true);
?>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css" />
<div>
    <?php if (!$newproduct_id) { ?> <h3 style="margin-left: 5px;  cursor: pointer;">To See Merchi Fields Please Enter
        Product Title Fist And Publish</h3> <?php } ?>
    <?php if ($newproduct_id) { ?>
    <input type="hidden" id="hidden_product_id" name="hidden_product_id" value="<?php echo esc_attr($product_id); ?>">
    <input type="hidden" id="hidden_product_name" name="hidden_product_name"
        value="<?php echo esc_attr($product_name); ?>">
    <input type="hidden" id="hidden_regular_price" name="hidden_regular_price"
        value="<?php echo esc_attr($product_regular_price); ?>">
    <div id="product_meta_box">
        <div id="search_box" style="display: <?php echo (empty($product_name)) ? 'block' : 'none'; ?>">
            <input type="text" id="custom_value_field" name="custom_value" list="custom_value_list"
                placeholder="Enter Product Name">
				<span class="cst-loader"></span>
            <span class="search-icon"><i class="fas fa-search"></i></span>
            <div id="search_results" onclick="spinner()"></div>
            <div class="loader">
            </div>
        </div>
        <div id="selected_value_display"
            style="display: <?php echo (empty($product_name)) ? 'none' : 'inline-block'; ?>">
            <h3 style="margin-left: 5px; cursor: pointer;"><?php echo esc_html($product_name); ?></h3>
        </div>
        <h1 id="remove_selected_value"
            style="display: <?php echo (empty($product_name)) ? 'none' : 'inline-block'; ?>; cursor: pointer;">&times;
        </h1>
    </div>
    <div class="card-header">Redirect After Success URL</div>
    <div class="card-body text-dark">
        <input type="text" id="redirectAfterSuccessUrl" name="redirectAfterSuccessUrl" placeholder="Redirect URL"
            value="<?php echo $redirectAfterSuccessUrl; ?>">
    </div>
    <div class="card-header">Redirect After Quote URL</div>
    <div class="card-body text-dark">
        <input type="text" id="redirectAfterQuoteSuccessUrl" name="redirectAfterQuoteSuccessUrl"
            placeholder="Redirect Quote URL" value="<?php echo $redirectAfterQuoteSuccessUrl; ?>">
    </div>
    <div class="card-header">Redirect With Value </div>
    <div class="card-body text-dark">
		<div class="checkbox-container">
			<label class="checkbox-label">Yes:</label>
			<input type="checkbox" id="redirectWithValue" name="redirectWithValue"
				<?php checked($redirectWithValue, 1, true); ?> value="1">
		</div>
	</div>
       
    <div class="card-header">Hide Info</div>
    <div class="card-body text-dark">
		<div class="checkbox-container">
			<label class="checkbox-label">Yes:</label>
			<input type="checkbox" id="hideInfo" name="hideInfo" <?php checked($hideInfo, 1, true); ?> value="1">
		</div>
    </div>
    <div class="card-header">Hide Preview</div>
    <div class="card-body text-dark">
		<div class="checkbox-container">
			<label class="checkbox-label">Yes:</label>
			<input type="checkbox" id="hidePreview" name="hidePreview" <?php checked($hidePreview, 1, true); ?> value="1">
		</div>
    </div>
    <div class="card-header">Hide Price</div>
    <div class="card-body text-dark">
		<div class="checkbox-container">
			<label class="checkbox-label">Yes:</label>
			<input type="checkbox" id="hidePrice" name="hidePrice" <?php checked($hidePrice, 1, true); ?> value="1">
		</div>
	</div>
    <div class="card-header">Hide Title</div>
    <div class="card-body text-dark">
		<div class="checkbox-container">
			<label class="checkbox-label">Yes:</label>
			<input type="checkbox" id="hideTitle" name="hideTitle" <?php checked($hideTitle, 1, true); ?> value="1">
		</div>
    </div>
    <div class="card-header">Hide Calculated Price</div>
    <div class="card-body text-dark">
		<div class="checkbox-container">
			<label class="checkbox-label">Yes:</label>
			<input type="checkbox" id="hideCalculatedPrice" name="hideCalculatedPrice"
            <?php checked($hideCalculatedPrice, 1, true); ?> value="1">
		</div>
    </div>
    <div class="card-header">Include Bootstrap</div>
    <div class="card-body text-dark">
		<div class="checkbox-container">
			<label class="checkbox-label">Yes:</label>
			<input type="checkbox" id="includeBootstrap" name="includeBootstrap"
            <?php checked($includeBootstrap, 1, true); ?> value="1">
		</div>
    </div>
    <div class="card-header">Not Include Default CSS</div>
    <div class="card-body text-dark">
		<div class="checkbox-container">
			<label class="checkbox-label">Yes:</label>
			<input type="checkbox" id="notIncludeDefaultCss" name="notIncludeDefaultCss"
            <?php checked($notIncludeDefaultCss, 1, true); ?> value="1">
		</div>
    </div>
    <div class="card-header">Invoice Redirect</div>
    <div class="card-body text-dark">
		<div class="checkbox-container">
			<label class="checkbox-label">Yes:</label>
			<input type="checkbox" id="invoiceRedirect" name="invoiceRedirect" <?php checked($invoiceRedirect, 1, true); ?>
            value="1">
		</div>
    </div>
    <div class="card-header">Load Theme</div>
    <div class="card-body text-dark">
		<div class="checkbox-container">
			<label class="checkbox-label">Yes:</label>
			<input type="checkbox" id="loadTheme" name="loadTheme" <?php checked($loadTheme, 1, true); ?> value="1">
		</div>
	</div>
    <div class="card-header">Mount Point Id</div>
    <div class="card-body text-dark">
        <input type="text" id="mountPointId" name="mountPointId" placeholder="Mount Point Id"
            value="<?php echo $mountPointId; ?>">
    </div>
    <div class="card-header">Single Column</div>
    <div class="card-body text-dark">
		<div class="checkbox-container">
			<label class="checkbox-label">Yes:</label>
			<input type="checkbox" id="singleColumn" name="singleColumn" <?php checked($singleColumn, 1, true); ?>
            value="1">
		</div>
	</div>
    <div class="card-header">Quote Requested Redirect</div>
    <div class="card-body text-dark">
		<div class="checkbox-container">
			<label class="checkbox-label">Yes:</label>
			<input type="checkbox" id="quoteRequestedRedirect" name="quoteRequestedRedirect"
            <?php checked($quoteRequestedRedirect, 1, true); ?> value="1">
		</div>
    </div>
    <div class="card-header">Google API Public Key</div>
    <div class="card-body text-dark">
        <input type="text" id="googleApiPublicKey" name="googleApiPublicKey" placeholder="Google API Public Key"
            value="<?php echo $googleApiPublicKey; ?>">
    </div>
    <div class="card-header">Allow Add To Cart</div>
    <div class="card-body text-dark">
		<div class="checkbox-container">
			<label class="checkbox-label">Yes:</label>
			<input type="checkbox" id="allowAddToCart" name="allowAddToCart" <?php checked($allowAddToCart, 1, true); ?>
            value="1">
		</div>
    </div>
    <div class="card-header">Hide Drafting</div>
    <div class="card-body text-dark">
		<div class="checkbox-container">
			<label class="checkbox-label">Yes:</label>
			<input type="checkbox" id="hideDrafting" name="hideDrafting" <?php checked($hideDrafting, 1, true); ?>
            value="1">
		</div>
    </div>
    <?php  } ?>
</div>
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
	$newproduct_id = isset($_POST['postId']) ? sanitize_text_field($_POST['postId']) : '';
    update_post_meta($newproduct_id,'show_meta_key', 1);
    echo "Meta updated successfully.";
    wp_die();
}


function save_meta_box_value($post_id, $post)
{
	if ($post->post_type == 'product' && (isset($_POST['hidden_product_name']))) {
		if (isset($_POST['hidden_product_id'])) {
			$product_id = sanitize_text_field($_POST['hidden_product_id']);
			$product_name = sanitize_text_field($_POST['hidden_product_name']);
			$product_regulr_price = sanitize_text_field($_POST['hidden_regular_price']);
			update_post_meta($post_id, 'product_id', $product_id);
			update_post_meta($post_id, 'product_name', $product_name);
			update_post_meta($post_id, '_regular_price',  $product_regulr_price);
			update_post_meta($post_id, 'redirectAfterSuccessUrl', $_POST['redirectAfterSuccessUrl']);
			update_post_meta($post_id, 'redirectAfterQuoteSuccessUrl', $_POST['redirectAfterQuoteSuccessUrl']);
			update_post_meta($post_id, 'redirectWithValue', $_POST['redirectWithValue']);
			update_post_meta($post_id, 'hideInfo', $_POST['hideInfo']);
			update_post_meta($post_id, 'hidePreview', $_POST['hidePreview']);
			update_post_meta($post_id, 'hidePrice', $_POST['hidePrice']);
			update_post_meta($post_id, 'hideTitle', $_POST['hideTitle']);
			update_post_meta($post_id, 'hideCalculatedPrice', $_POST['hideCalculatedPrice']);
			update_post_meta($post_id, 'includeBootstrap', $_POST['includeBootstrap']);
			update_post_meta($post_id, 'notIncludeDefaultCss', $_POST['notIncludeDefaultCss']);
			update_post_meta($post_id, 'invoiceRedirect', $_POST['invoiceRedirect']);
			update_post_meta($post_id, 'loadTheme', $_POST['loadTheme']);
			update_post_meta($post_id, 'mountPointId', $_POST['mountPointId']);
			update_post_meta($post_id, 'singleColumn', $_POST['singleColumn']);
			update_post_meta($post_id, 'quoteRequestedRedirect', $_POST['quoteRequestedRedirect']);
			update_post_meta($post_id, 'googleApiPublicKey', $_POST['googleApiPublicKey']);
			update_post_meta($post_id, 'allowAddToCart', $_POST['allowAddToCart']);
			update_post_meta($post_id, 'hideDrafting', $_POST['hideDrafting']);
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

function send_id_for_add_cart(){
	if (class_exists('WooCommerce')) {
		try {
			$item_count = count( WC()->cart->get_cart() ) ;
			$cart = $_POST['item'];
			$cartId = $cart['cartId'];
			$taxAmount = $cart['taxAmount'];
			if(!isset($cart['cartItems'])){
				echo 0;
				exit;
			}

			$cartItems = $cart['cartItems'];
		
			setcookie('cstCartId', $cartId, time() + (86400 * 30), "/");
			$_COOKIE['cstCartId'] = $cartId;
			
			$products = array();
			$productsAdded = array();
			foreach( $cartItems as $itemKey => $cartItem ){
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
				
				$variationGroups = array();
				$color_key = 'color';
				$printColor_key = 'print_color';
				$printLocation_key = 'print_location';
				$groupQuantity_key = 'group_quantity';
				$cart_item_data = array('selection'=>array());
				$quantity = 0;
				if(isset($cartItem['variations'])){
					foreach( $cartItem['variations'] as $varGroup ){
						foreach( $varGroup as $varKey=>$variationGroup ){
							foreach($variationGroup as $varG){
								$cart_item_data['selection'][] = $varG;
							}
						}
					}
				}
				// if(isset($cartItem['objExtras'])){
				// 	foreach( $cartItem['objExtras'] as $objExtras ){
				// 		foreach( $objExtras as $varKey=>$variationGroup ){
				// 			$quantity = $quantity + intval($variationGroup['quantity']);
				// 		}
				// 	}
				// }else{
				// 	$quantity = $cartItem['quantity'];
				// }
				
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
				update_option("get_cart_myItems_".$cartId."_".$cart_item_key, $currentCartItem);
				$productsAdded[] = $cart_item_key;
			}
			echo json_encode(array('success' => true));
		}catch(Exception $e) {
		  echo 'Message: ' .$e->getMessage();
		}
	}
	wp_die();
}

add_filter( 'woocommerce_cart_item_quantity', 'wc_cart_item_quantity', 10, 3 );
function wc_cart_item_quantity( $product_quantity, $cart_item_key, $cart_item ){
    if( is_cart() ){
        $product_quantity = sprintf( '%2$s <input type="hidden" name="cart[%1$s][qty]" value="%2$s" />', $cart_item_key, $cart_item['quantity'] );
    }
    return $product_quantity;

}

add_action( 'wp_ajax_cst_cart_item_after_remove', 'cst_cart_item_after_remove', 10, 2);
add_action( 'wp_ajax_nopriv_cst_cart_item_after_remove', 'cst_cart_item_after_remove', 10, 2);

function cst_cart_item_after_remove() {
	if (isset($_COOKIE['cstCartId'])) {
		$item_id = $_POST['item_id'];
		$cart_id = $_COOKIE['cstCartId'];
		$cart_length = $_POST['cart_length'];
		if( 1 == $cart_length || 0 == $cart_length ){
			setcookie('cart-'.MERCHI_DOMAIN, "", time() - 3600, "/");
			setcookie("cstCartId", "", time() - 3600, "/");
		}
		$options = get_option_extended("get_cart_myItems_".$cart_id);
		$itemData = $options['get_cart_myItems_'.$cart_id.'_'.$item_id];
		echo json_encode($itemData);
		exit;
	} 
}

function filter_woocommerce_get_item_data( $cart_data, $cart_item = null ) {
	
	foreach( $cart_item as $key => $items ){
		if($key === 'selection'){
			foreach( $items as $k=>$itm){
				$cart_data[] = array(
					'name' => 'Choice '.$k,
					'value' => $itm
				);
			}
		}
	}	
	return $cart_data;
}
add_filter( 'woocommerce_get_item_data', 'filter_woocommerce_get_item_data', 99, 2 );


add_filter( 'woocommerce_add_to_cart_fragments', 'cart_count_fragments_wp', 10, 1 );

function cart_count_fragments_wp( $fragments ) {
	if(WC()->cart->get_cart_contents_count()){
		$fragments['#mini-cart .cart-items'] = '<span class="cart-items">' . WC()->cart->get_cart_contents_count() . '</span>';
	}else{
		$fragments['#mini-cart .cart-items'] = '<span class="cart-items-none">' . WC()->cart->get_cart_contents_count() . '</span>';
	}
    return $fragments;
}

add_action( 'woocommerce_before_calculate_totals', 'bbloomer_alter_price_cart', 9999 );
 
function bbloomer_alter_price_cart( $cart ) {
 
    if ( is_admin() && ! defined( 'DOING_AJAX' ) ) return;
	
	$cart_id = $_COOKIE['cstCartId'];
	
	$options = get_option_extended('get_cart_myItems_'.$cart_id."_");
 
    //LOOP THROUGH CART ITEMS & APPLY 20% DISCOUNT
    foreach ( $cart->get_cart() as $cart_item_key => $cart_item ) {
		$itemData = $options['get_cart_myItems_'.$cart_id.'_'.$cart_item_key];
        $product = $cart_item['data'];
		$quantity = intval($itemData['quantity']);
		$subtotalCost = floatval($itemData['subtotalCost']);

		if ($quantity > 0) {
			$cart_item['data']->set_price($subtotalCost / $quantity);
		}
        //$cart_item['data']->set_price( floatval($itemData['subtotalCost'])/intval($itemData['quantity']) );
    }
 
}

function woo_add_cart_fee( $cart ) {

    if ( is_admin() && ! defined( 'DOING_AJAX' ) )
        return;

    $item_fee = 0;
	$cart_id = $_COOKIE['cstCartId'];
	
	$options = get_option_extended('get_cart_myItems_'.$cart_id."_");

    foreach ( $cart->get_cart() as $cart_item_key => $cart_item ) {
		$itemData = $options['get_cart_myItems_'.$cart_id.'_'.$cart_item_key];
        $item_fee = $itemData['taxAmount'];
    }

    // add_fee method (TAX will NOT be applied here)
    $cart->add_fee( 'Tax: ', $item_fee, false );

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

	class WC_Merchi_Gateway extends WC_Payment_Gateway {

 		/**
 		 * Class constructor, more about it in Step 3
 		 */
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


add_action('wp_ajax_cst_add_shipping', 'cst_add_shipping', 10);
add_action('wp_ajax_nopriv_cst_add_shipping', 'cst_add_shipping', 10);

function cst_add_shipping() {
    if (isset($_POST['shippingCost'])) {
		if (($num = filter_var($_POST['shippingCost'], FILTER_VALIDATE_FLOAT)) !== false) {
			WC()->session->set( 'cst_shipping_cost' , $num );
		}
    }
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

    // Build the API URL
    $api_url = esc_url_raw($api_url."v6/products/?apiKey=$api_key&inDomain=$domain_id&limit=$limit&offset=$offset&q=$q");


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

    // Return the products to the JavaScript function
    if (isset($products['products']) && !empty($products['products'])) {
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

