<?php

namespace MerchiPlugin\CartPages;

use WC_Checkout;

class CartCheckoutPage {

    public function __construct() {
        add_action('woocommerce_after_checkout_billing_form', array($this, 'add_custom_checkout_fields'));
    }

    public function add_custom_checkout_fields(WC_Checkout $checkout) {
        echo '<div id="custom_checkout_field"><h2>' . __('Additional Information') . '</h2>';

        woocommerce_form_field('billing_phone', array(
            'type' => 'text',
            'class' => array('form-row-wide'),
            'label' => __('Phone', 'woocommerce'),
            'placeholder' => __('Enter your phone number'),
            'required' => true,
        ), $checkout->get_value('billing_phone'));

        woocommerce_form_field('billing_country_code', array(
            'type' => 'select',
            'class' => array('form-row-wide'),
            'label' => __('Country Code', 'woocommerce'),
            'options' => WC()->countries->get_countries(),
            'required' => true,
        ), $checkout->get_value('billing_country_code'));

        echo '</div>';
    }
}

new CartCheckoutPage(); 
