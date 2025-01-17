<?php

/**

 * Thankyou page

 *

 * This template can be overridden by copying it to yourtheme/woocommerce/checkout/thankyou.php.

 *

 * HOWEVER, on occasion WooCommerce will need to update template files and you

 * (the theme developer) will need to copy the new files to your theme to

 * maintain compatibility. We try to do this as little as possible, but it does

 * happen. When this occurs the version of the template file will be bumped and

 * the readme will list any important changes.

 *

 * @see https://docs.woocommerce.com/document/template-structure/

 * @package WooCommerce/Templates

 * @version 8.1.0

 */



defined( 'ABSPATH' ) || exit;

$porto_woo_version = porto_get_woo_version_number();

$resp = false;

if(isset($_COOKIE['cart-'.MERCHI_DOMAIN]) && !empty($_COOKIE['cart-'.MERCHI_DOMAIN])){

	$cart = explode(',', $_COOKIE['cart-'.MERCHI_DOMAIN]);

	$response = wp_remote_get( MERCHI_URL.'v6/stripe/payment_intent/cart/complete/'.$cart[0].'/?cart_token='.$cart[1] );

	$resp = json_decode(wp_remote_retrieve_body($response));

	setcookie('cart-'.MERCHI_DOMAIN, "", time() - 3600, "/");

	setcookie("cstCartId", "", time() - 3600, "/");

	setcookie("cstReturningUser", "", time() - 3600, "/");

	setcookie("cstExistingUser", "", time() - 3600, "/");

	WC()->session->__unset( 'cst_shipping_cost' );

	WC()->session->__unset( 'cst_billing_info' );

	$cst_merchi_invoce = get_post_meta($order->get_id(), 'cst_merchi_invoce', true);

	if(!empty($resp) && $resp->errorCode !== 1 && !$cst_merchi_invoce){

		update_post_meta($order->get_id(), 'cst_merchi_invoce', $resp);

	}

}

$resp = get_post_meta($order->get_id(), 'cst_merchi_invoce', true);

?>



<div class="woocommerce-order woocommerce-thankyou col-lg-8 mx-auto px-0">



	<?php

	if ( $order ) :



		do_action( 'woocommerce_before_thankyou', $order->get_id() );

		?>



		<?php if ( $order->has_status( 'failed' ) ) : ?>



			<p class="woocommerce-notice woocommerce-notice--error woocommerce-thankyou-order-failed"><?php esc_html_e( 'Unfortunately your order cannot be processed as the originating bank/merchant has declined your transaction. Please attempt your purchase again.', 'woocommerce' ); ?></p>



			<p class="woocommerce-notice woocommerce-notice--error woocommerce-thankyou-order-failed-actions">

				<a href="<?php echo esc_url( $order->get_checkout_payment_url() ); ?>" class="button pay"><?php esc_html_e( 'Pay', 'woocommerce' ); ?></a>

				<?php if ( is_user_logged_in() ) : ?>

					<a href="<?php echo esc_url( wc_get_page_permalink( 'myaccount' ) ); ?>" class="button pay"><?php esc_html_e( 'My account', 'woocommerce' ); ?></a>

				<?php endif; ?>

			</p>



		<?php else : ?>

			<?php if ( version_compare( $porto_woo_version, '8.1.0', '>=' ) ) : ?>

				<?php wc_get_template( 'checkout/order-received.php', array( 'order' => $order ) ); ?>

			<?php else : ?>

				<p class="woocommerce-notice woocommerce-notice--success woocommerce-thankyou-order-received line-height-md text-center text-v-dark"><i class="fas fa-check me-2"></i><?php echo apply_filters( 'woocommerce_thankyou_order_received_text', esc_html__( 'Thank you. Your order has been received.', 'woocommerce' ), $order ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></p>

			<?php endif; ?>

			<div class="d-flex flex-wrap order-info m-b-xl m-t-xs pt-3 w-100">

				<div class="woocommerce-order-overview__order order order-item">

					<?php esc_html_e( 'Order Number', 'woocommerce' ); ?>

					<mark class="font-weight-bold order-number"><?php echo $resp ? esc_html( $resp->invoice->id ) : ''; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></mark>

				</div>

				<div class="woocommerce-order-overview__status status order-item">

					<?php esc_html_e( 'Status', 'woocommerce' ); ?>

					<mark class="font-weight-bold order-status text-primary text-uppercase"><?php echo wc_get_order_status_name( $order->get_status() ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></mark>

				</div>

				<div class="woocommerce-order-overview__date date order-item">

					<?php esc_html_e( 'Date', 'woocommerce' ); ?>

					<mark class="font-weight-bold order-date"><?php echo wc_format_datetime( $order->get_date_created() ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></mark>

				</div>

				<div class="woocommerce-order-overview__total total order-item">

					<?php esc_html_e( 'Total', 'woocommerce' ); ?>

					<mark class="font-weight-bold order-total"><?php echo wp_kses_post( $order->get_formatted_order_total() );  // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></mark>

				</div>



				<?php if ( $order->get_payment_method_title() ) : ?>

					<div class="woocommerce-order-overview__payment-method method order-item">

						<?php esc_html_e( 'Payment method:', 'woocommerce' ); ?>

						<mark class="font-weight-bold order-status"><?php echo wp_kses_post( $order->get_payment_method_title() ); ?></mark>

					</div>

				<?php endif; ?>

			</div>



		<?php endif; ?>



		<?php do_action( 'woocommerce_thankyou_' . $order->get_payment_method(), $order->get_id() ); ?>

		<?php do_action( 'woocommerce_thankyou', $order->get_id() ); ?>



	<?php else : ?>



		<?php if ( version_compare( $porto_woo_version, '8.1.0', '>=' ) ) : ?>

			<?php wc_get_template( 'checkout/order-received.php', array( 'order' => false ) ); ?>

		<?php else : ?>

			<p class="woocommerce-notice woocommerce-notice--success woocommerce-thankyou-order-received"><?php echo apply_filters( 'woocommerce_thankyou_order_received_text', esc_html__( 'Thank you. Your order has been received.', 'woocommerce' ), null ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></p>

		<?php endif; ?>



		



	<?php endif; ?>



</div>

