<?php
if ( ! defined( 'ABSPATH' ) ) { exit; }

wc_print_notices();

if ( is_cart() ) {
	// Load Merchi SDK initialization script first
	$staging_mode = get_option('merchi_staging_mode');
	if ($staging_mode === 'yes') {
		wp_enqueue_script(
			'merchi-sdk-cdn',
			'https://staging.merchi.co/static/js/dist/merchi-init.js',
			array(),
			null,
			true
		);
	} else {
		wp_enqueue_script(
			'merchi-sdk-cdn',
			'https://merchi.co/static/js/dist/merchi-init.js',
			array(),
			null,
			true
		);
	}

	// Then load the React cart component
	wp_enqueue_script(
		'merchi-cart-react',                                              
		plugins_url( 'dist/js/woocommerce_cart_checkout.js', dirname( __FILE__, 2 ) ),
		array( 'react', 'react-dom', 'merchi-sdk-cdn' ),
		filemtime( plugin_dir_path( dirname( __FILE__, 2 ) ) . 'dist/js/woocommerce_cart_checkout.js' ),
		true
	);
}
?>
<div id="woocommerce-cart-form"></div>
<?php do_action( 'woocommerce_after_cart' ); ?>
