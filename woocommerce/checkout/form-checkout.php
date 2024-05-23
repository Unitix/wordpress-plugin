<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

wc_print_notices();

// If checkout registration is disabled and not logged in, the user cannot checkout
if ( ! $checkout->enable_signup && ! $checkout->enable_guest_checkout && ! is_user_logged_in() ) {
	echo esc_html( apply_filters( 'woocommerce_checkout_must_be_logged_in_message', __( 'You must be logged in to checkout.', 'woocommerce' ) ) );
	return;
}
// filter hook for include new pages inside the payment method
$get_checkout_url = wc_get_checkout_url();

$steps = array(
    1 => __('Billing Information', 'yourtextdomain'),
    2 => __('Shipping Information', 'yourtextdomain'),
    3 => __('Payment', 'yourtextdomain'),
);
$is_registered = false;
$current_step = isset($_GET['step']) ? absint($_GET['step']) : 1;
$switch_case = false;
if( 1 == $current_step ){
	$switch_case = 'one';
}else if( 2 == $current_step && isset($_COOKIE['cstExistingUser']) ){
	$switch_case = 'two';
}else if( 3 == $current_step ){
	$switch_case = 'three';
}else{
	$current_step = 1;
	$switch_case = 'one';
	?>
		<script>window.history.pushState('', '', '<?php echo wc_get_checkout_url(); ?>?step=1');</script>
	<?php
}

?>

<form name="checkout" method="post" class="checkout woocommerce-checkout" id="cst-woocommerce-checkout" action="<?php echo esc_url( $get_checkout_url ); ?>" enctype="multipart/form-data">

		<ul class="checkout-steps cst-breadcrumb">
			<?php foreach ($steps as $step_num => $step_name) : ?>
				<li class="cst-breadcrumb-li <?php echo ($current_step == $step_num) ? 'active' : ''; ?>">
					<?php if (1 != $step_num) : ?>
						<i class="cst-delimiter"></i>
					<?php endif; ?>
					<?php if ($current_step != $step_num) : ?>
						<a href="<?php echo wc_get_checkout_url() . '?step=' . $step_num; ?>"><?php echo $step_name; ?></a>
					<?php else : ?>
						<?php echo $step_name; ?>
					<?php endif; ?>
				</li>
			<?php endforeach; ?>
		</ul>

	<?php if ( sizeof( $checkout->checkout_fields ) > 0 ) : ?>

		<?php do_action( 'woocommerce_checkout_before_customer_details' ); ?>
		<div class="row" id="customer_details">
			<div class="col-lg-7">
				<div class="align-left">
					<div class="box-content">
					  <?php
							switch ($switch_case) {
								case 'one':
								case 'three':
									// Display default WooCommerce billing fields
									?>
									<div class="woocommerce-billing-fields clearfix" <?php echo 'three' === $switch_case ? 'style="display:none;"' : ''; ?> >
										<?php
										$fields = WC()->checkout->checkout_fields['billing'];
										$email = '';
										if( isset($_COOKIE['cstReturningUser']) && $_COOKIE['cstReturningUser'] === 'true' && 'three' === $switch_case ){ 
												woocommerce_form_field( 'billing_email', array( 
												'type' => 'hidden', 
												'required' => false,
												'default' => 'testing@email.com',
												));
												woocommerce_form_field( 'billing_first_name', array( 
												'type' => 'hidden', 
												'required' => false,
												'default' => 'testing',
												));
												woocommerce_form_field( 'billing_last_name', array( 
												'type' => 'hidden', 
												'required' => false,
												'default' => 'testing',
												));
												woocommerce_form_field( 'billing_country', array( 
												'type' => 'hidden', 
												'required' => false,
												'default' => 'AU',
												));
												woocommerce_form_field( 'billing_city', array( 
												'type' => 'hidden', 
												'required' => false,
												'default' => 'LABRADOR',
												));
												woocommerce_form_field( 'billing_address_1', array( 
												'type' => 'hidden', 
												'required' => false,
												'default' => 'qwerty',
												));
												woocommerce_form_field( 'billing_state', array( 
												'type' => 'hidden', 
												'required' => false,
												'default' => 'QLD',
												));
												woocommerce_form_field( 'billing_postcode', array( 
												'type' => 'hidden', 
												'required' => false,
												'default' => '4215',
												));
												woocommerce_form_field( 'billing_phone', array( 
												'type' => 'hidden', 
												'required' => false,
												'default' => '0987654321',
												));
											}else{
												$billing_values = WC()->session->get( 'cst_billing_info' ) ? WC()->session->get( 'cst_billing_info' ) : false;
												foreach ( $fields as $key => $field ) {
													$field['custom_attributes']['data-cstName'] = ucfirst(str_replace('_', ' ', $key));
													if( isset($_COOKIE['cstReturningUser']) && $_COOKIE['cstReturningUser'] === 'true' && $key !== 'billing_email' ){ 
														continue;
													}
													if ( $key === 'billing_email' ) {
														$field['custom_attributes']['onblur'] = 'captureEmail(this)';
														$field['class'][] = 'capture-email';
														$field['autocomplete']= false;
														$email = WC()->checkout->get_value($key);
													}else if ( $key === 'billing_first_name' ) {
														$field['class'] = array('form-row', 'form-row-wide', 'validate-required');
														$field['label'] = 'Full Name';
														$field['custom_attributes']['data-cstName'] = 'Full Name';
													}else if ( $key === 'billing_last_name' || $key === 'billing_company' ) {
														continue;
													}
													if($billing_values){
														woocommerce_form_field($key, $field, $billing_values[$key]);
													}else{
														woocommerce_form_field($key, $field, WC()->checkout->get_value($key));
													}
												}
											}
										?>
										<input type="hidden" class="captured-email" id="captured_email" name="captured_email" value="<?php echo $email; ?>">
									</div>
									<?php 
										if( 'three' === $switch_case ) woocommerce_checkout_payment();
									break;

								case 'two':
									if(isset($_COOKIE['cstExistingUser'])){
										?>
										<div class="woocommerce-shipping-fields mb-4">
										<?php if($_COOKIE['cstExistingUser'] === 'true'){ 
											setcookie("cstExistingUser", "", time() - 3600, "/");
											unset($_COOKIE['cstExistingUser']);
											$is_registered = true;
											?>
											<div id="divshipingroup" class="cst-conditional-step">
												<div class="container">
													<div class="inner-container">
														<div class="icon">
															<br>
															<div class="mt-3">
																<strong>Select a shipment method</strong>
															</div>
														</div>
													</div>
												</div>
												<div class="shipment-container">
													<ul class="list-group" id="shipmentList">
														<!-- Existing list items will go here -->
													</ul>
												</div>
											</div>
										<?php } else{ ?>
											<div class="woocommerce-additional-fields cst-conditional-step" id="cst_register_user">
												<?php
												woocommerce_form_field('name', array('type' => 'text', 'label' => 'Name'));
												woocommerce_form_field('email', array('type' => 'email', 'label' => 'Email'));
												$countries = WC()->countries->get_countries();
												woocommerce_form_field('country', array(
													'type'    => 'select',
													'label'   => 'Country',
													'options' => $countries,
												));
												woocommerce_form_field('phone', array('type' => 'text', 'label' => 'Phone'));
												?>
											</div>
										<?php } ?>
										</div>
									<?php
									}else{
										?>
										<script>window.history.pushState('', '', '<?php echo wc_get_checkout_url(); ?>?step=1');</script>
										<?php
									}
									break;
							}
							?>
					</div>
				</div>
			</div>
			<div class="col-lg-5">
				<div class="align-left">
					<div class="checkout-order-review align-left">
						<div class="box-content featured-boxes">
							<h3 id="order_review_heading" class="text-md text-uppercase"><?php esc_html_e( 'Your order', 'woocommerce' ); ?></h3>

							<?php do_action( 'woocommerce_checkout_before_order_review' ); ?>

							<div id="order_review" class="woocommerce-checkout-review-order">
								<?php do_action( 'cst_woocommerce_checkout_order_review' ); ?>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
		<!-- Navigation Buttons -->
		<div class="checkout-navigation">
			<?php if ($current_step > 1) : ?>
				<a href="#" class="button" onclick="navigateStep(<?php echo $current_step - 1; ?>); return false;">Previous</a>
			<?php endif; ?>

			<?php if ($current_step < count($steps)) : ?>
				<a href="#" class="button" onclick="navigateStep(<?php echo $current_step + 1; ?>); return false;">Next</a>
			<?php endif; ?>
		</div>
		<?php do_action( 'woocommerce_checkout_after_customer_details' ); ?>				
	<?php endif; ?>
</form>
<script>
function getShippingGroup() {
            // Find the "MerchiCart" cookie    
            const name = '<?php echo 'cart-'.MERCHI_DOMAIN; ?>';
            const cookies = document.cookie.split(';');
            let cartValue = null;
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.startsWith(name + '=')) {
                    cartValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
            //get shipping details 
            if (cartValue) {
                const values = cartValue.split(',');
                const cartid = values[0];
                const carttoken = values[1];
                var requestOptions = {
                    method: 'GET',
                    redirect: 'follow'
                };
				const MERCHI = MERCHI_INIT.MERCHI_SDK;
				const ccart = new MERCHI.Cart();
				ccart.id(cartid);
				ccart.token(carttoken);
				var embedd = '{"cartItems":{"product":{"domain":{"company":{"defaultTaxType":{},"taxTypes":{}}},"featureImage":{},"groupVariationFields":{"options":{"linkedFile":{}}},"images":{},"independentVariationFields":{"options":{"linkedFile":{}}},"taxType":{}},"taxType":{},"variations":{"selectedOptions":{},"variationField":{"options":{"linkedFile":{},"variationCostDiscountGroup":{},"variationUnitCostDiscountGroup":{}},"variationCostDiscountGroup":{},"variationUnitCostDiscountGroup":{}},"variationFiles":{}},"variationsGroups":{"variations":{"selectedOptions":{},"variationField":{"options":{"linkedFile":{},"variationCostDiscountGroup":{},"variationUnitCostDiscountGroup":{}},"variationCostDiscountGroup":{},"variationUnitCostDiscountGroup":{}},"variationFiles":{}}}},"client":{"emailAddresses":{},"profilePicture":{}},"clientCompany":{},"domain":{"company":{"defaultTaxType":{},"isStripeAccountEnabled":{},"taxTypes":{}}},"invoice":{},"receiverAddress":{},"shipmentGroups":{"cartItems":{"product":{}},"quotes":{"shipmentMethod":{"originAddress":{},"taxType":{}}},"selectedQuote":{"shipmentMethod":{"originAddress":{},"taxType":{}}}}}';
				embedd = JSON.parse(embedd);
				var merchi_api_url = '<?php echo MERCHI_URL; ?>';
                fetch(`${merchi_api_url}v6/generate-cart-shipment-quotes/${cartid}/?cart_token=${carttoken}`,
                        requestOptions)
                    .then(response => response.text())
                    .then(result => {
                       // console.log("from get =>", result);
                       
                        const parsedResult = JSON.parse(result); // Parse the JSON string
                        var subTotal = parsedResult.cartItemsTotalCost;
                        var shipping = parsedResult.shipmentTotalCost;
                        var totalCost = parsedResult.totalCost;
                        const shipmentList = document.getElementById('shipmentList'); // Get the <ul> element
                        parsedResult.shipmentGroups.map((shipmentGroup, index) => {
                            var shipmentGroupid = shipmentGroup.id;
                           // console.log('shipmentGroup id =>', shipmentGroupid);
                            shipmentGroup.quotes.map((quote, quoteIndex) => {
                                const shipmentMethodName = quote.shipmentMethod.name;
                                const transportCompanyName = quote.shipmentMethod
                                    .transportCompanyName;
                                const totalCost = quote.totalCost;
                                const quoteid = quote.id;
                               // console.log('quoteid id =>', quoteid);
                                const listItem = document.createElement('li');
								ccart.get((data) => {
									var cartEnt = data;
									
									const qEnt = cartEnt.shipmentGroups()[index].quotes()[quoteIndex];
									var qEntStr = encodeURIComponent(JSON.stringify(qEnt));
									var quoteStr = encodeURIComponent(JSON.stringify(quote));
									var chckd = '';
									if( 0 == quoteIndex ){
										chckd = 'checked=true';
									}
									listItem.className = 'cursor-pointer list-group-item';
									listItem.innerHTML = `<div class="shipment-option"><div class="shipment-info"><p>${shipmentMethodName}</p><small>${transportCompanyName}</small><div><small class="shipment-price">AUD $${totalCost.toFixed(2)}</small></div></div><div><input type="radio" name="shipmentGroup" id="shipmentGroup_${quote.id}" data-quote-id="${quote.id}" data-shipment-group-id="${shipmentGroupid}" class="radio-class" data-index="${index}" data-quoteIndex="${quoteIndex}" ${chckd} onclick="updateShipmentMethod(${index}, ${quoteIndex})"></div></div>`;
									if( 0 == quoteIndex ){
										updateShipmentMethod(index, quoteIndex);
									}
									shipmentList.appendChild(listItem);
								},(error) => console.log(JSON.stringify(error)), embedd);
                            });
                        });
                    })
                    .catch(error => console.log('error', error));
					
            }
        }
		<?php if($is_registered){ ?>
			getShippingGroup();
		<?php } ?>
</script>
<?php

do_action( 'woocommerce_after_checkout_form', $checkout );