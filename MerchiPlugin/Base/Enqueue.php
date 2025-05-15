<?php declare(strict_types=1);
/**
 * @package MerchiPlugin
 */

namespace MerchiPlugin\Base;

use \MerchiPlugin\Base\BaseController;

class Enqueue extends BaseController {
	public function register() {
		add_action( 'wp_enqueue_scripts', [ $this, 'do_enqueue' ] );
		add_action( 'admin_enqueue_scripts', [ $this, 'admin_enqueue' ] );
	}


	public function do_enqueue() {
		wp_enqueue_style( 'styles', $this->plugin_url . 'src/css/merchi_styles.css' );
		$mount_point = get_option( 'merchi_mount_point_id' );
		$css         = ".$mount_point {visibility: hidden;}";
		wp_add_inline_style( 'styles', $css );
		if( get_option( 'merchi_staging_mode' ) == 'yes' ) {
			$merchi_init = 'https://staging.merchi.co/static/js/dist/merchi-init.js';
		}
		else {
			$merchi_init = 'https://merchi.co/static/js/dist/merchi-init.js';
		}
		// Enqueue Merchi initialization script
		// wp_enqueue_script(
		// 	'merchi_init',
		// 	$merchi_init,
		// 	['jquery'],
		// 	null,
		// 	true
		// );
		
		// Enqueue our SDK wrapper
		wp_enqueue_script(
			'merchi_sdk',
			$this->plugin_url . 'dist/js/merchi_sdk.js',
			['merchi_init'],
			null,
			true
		);
		
		// Enqueue our product form script
		wp_enqueue_script(
			'merchi_product_form',
			$this->plugin_url . 'dist/js/merchi_product_form.js',
			['jquery', 'merchi_sdk'],
			null,
			true
		);
	}


	public function admin_enqueue() {
		if( get_option( 'merchi_staging_mode' ) == 'yes' ) {
			$merchi_url = get_option( 'staging_merchi_url' );
			$merchi_init = 'https://staging.merchi.co/static/js/dist/merchi-init.js';
		}
		else {
			$merchi_url = get_option( 'merchi_url' );
			$merchi_init = 'https://merchi.co/static/js/dist/merchi-init.js';
		}
		// wp_enqueue_script(
		// 	'merchi_init',
		// 	$merchi_init,
		// 	$ver = null
		// );
		wp_enqueue_script(
			'merchi_sdk',
			$this->plugin_url . 'dist/js/merchi_sdk.js',
			[ 'merchi_init' ]
		);
		$merchi_plugin_object = [
			'merchiStoreName' => $merchi_url,
		];

		wp_enqueue_style( 'styles',  $this->plugin_url . 'src/css/merchi_styles_admin.css' );
		wp_localize_script( 'merchi_plugin_val', 'merchiObject', $merchi_plugin_object );
		wp_enqueue_script( 'ajax_script', $this->plugin_url . 'dist/js/create_merchi_products.js', [ 'jquery' ] );
		wp_localize_script(
			'ajax_script',
			'merchi_ajax_object',
			[
				'ajax_url' => admin_url( 'admin-ajax.php' ),
				'nonce'    => wp_create_nonce( 'merchi_ajax_nonce' ),
			]
		);
		wp_enqueue_script( 'export_ajax_script', $this->plugin_url . 'dist/js/export_products.js', [ 'jquery' ] );

	}
}
