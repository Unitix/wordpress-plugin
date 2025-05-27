<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

wc_print_notices();


function enqueue_merchi_checkout_script() {
	// Register the script
	wp_register_script(
			'merchi-checkout-init',
			plugin_dir_url(dirname(dirname(__FILE__))) . 'dist/js/merchi_checkout_init.js',
			array('react', 'react-dom'), // Dependencies
			null, // Version
			true // Load in footer
	);

	// Enqueue the script
	wp_enqueue_script('merchi-checkout-init');
}

add_action('wp_enqueue_scripts', 'enqueue_merchi_checkout_script');

// If checkout registration is disabled and not logged in, the user cannot checkout
if ( ! $checkout->enable_signup && ! $checkout->enable_guest_checkout && ! is_user_logged_in() ) {
    echo esc_html( apply_filters( 'woocommerce_checkout_must_be_logged_in_message', __( 'You must be logged in to checkout.', 'woocommerce' ) ) );
    return;
}

// Filter hook for including new pages inside the payment method
$get_checkout_url = wc_get_checkout_url();
$steps = array(
    1 => __('Billing Information', 'yourtextdomain'),
    2 => __('Shipping Information', 'yourtextdomain'),
    3 => __('Payment', 'yourtextdomain'),
);

$is_registered = false;
$current_step = isset($_GET['step']) ? absint($_GET['step']) : 1;
$switch_case = false;

if ( 1 == $current_step ) {
    $switch_case = 'one';
} elseif ( 2 == $current_step && isset($_COOKIE['cstExistingUser']) ) {
    $switch_case = 'two';
} elseif ( 3 == $current_step ) {
    $switch_case = 'three';
} else {
    $current_step = 1;
    $switch_case = 'one';
    ?>
    <script>
        window.history.pushState('', '', '<?php echo wc_get_checkout_url(); ?>?step=1');
    </script>
    <?php
}
?>
<div id="woocommerce-checkout-form"></div>

<?php
do_action( 'woocommerce_after_checkout_form', $checkout );
