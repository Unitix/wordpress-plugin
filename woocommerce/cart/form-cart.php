<?php
if ( ! defined( 'ABSPATH' ) ) { exit; }

wc_print_notices();

if ( is_cart() ) {
	wp_enqueue_script(
		'merchi-cart-react',                                              
		plugins_url( 'dist/js/woocommerce_cart_checkout.js', dirname( __FILE__, 2 ) ),
		array( 'react', 'react-dom' ),
		filemtime( plugin_dir_path( dirname( __FILE__, 2 ) ) . 'dist/js/woocommerce_cart_checkout.js' ),
		true
	);
}
?>
<div id="woocommerce-cart-form"></div>
<?php do_action( 'woocommerce_after_cart' ); ?>
