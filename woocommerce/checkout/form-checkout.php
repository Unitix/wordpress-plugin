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

?>
<div id="woocommerce-checkout-form"></div>

<?php
do_action( 'woocommerce_after_checkout_form', $checkout );
