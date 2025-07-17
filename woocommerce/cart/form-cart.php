<?php
if ( ! defined( 'ABSPATH' ) ) { exit; }

wc_print_notices();

if ( is_cart() ) {
	// Load Merchi SDK initialization script first
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
}
?>
<div id="woocommerce-cart-form"></div>
<?php do_action( 'woocommerce_after_cart' ); ?>
