<?php declare(strict_types=1);
/**
 * @package MerchiPlugin
 */

namespace MerchiPlugin\Pages;

use MerchiPlugin\Api\SettingsApi;
use MerchiPlugin\Base\BaseController;
use MerchiPlugin\Api\Callbacks\AdminCallbacks;

class Admin extends BaseController {

	public $settings;

	public $callbacks;

	public $pages = [];

	public $subpages = [];


	public function register() {
		$this->settings = new SettingsApi();

		$this->callbacks = new AdminCallbacks();

		$this->setPages();

		$this->setSubpages();

		$this->setSettings();
		$this->setSections();
		$this->setFields();

		$this->settings->addPages( $this->pages )->withSubPage( 'Settings' )->add_sub_pages( $this->subpages )->register();
	}


	public function setPages() {
		$icon        = $this->plugin_url . 'images/merchi-icon.svg';
		$this->pages = [
			[
				'page_title' => 'Merchi Plugin',
				'menu_title' => 'Merchi',
				'capability' => 'manage_options',
				'menu_slug'  => 'merchi_plugin',
				'callback'   => [
					$this->callbacks,
					'adminDashboard',
				],
				'icon_url'   => $icon,
				'position'   => 110,
			],
		];
	}


	public function setSubpages() {
		 $this->subpages = [
			 [
				 'parent_slug' => 'merchi_plugin',
				 'page_title'  => 'Import / Export',
				 'menu_title'  => 'Import / Export',
				 'capability'  => 'manage_options',
				 'menu_slug'   => 'merchi_fetch',
				 'callback'    => [
					 $this->callbacks,
					 'adminCpt',
				 ],
			 ],
		 ];
	}


	public function setSettings() {
		 $args = [
			 [
				 'option_group' => 'merchi_options_group',
				 'option_name'  => 'merchi_url',
				 'callback'     => [
					 $this->callbacks,
					 'merchiOptionsGroup',
				 ],
			 ],
                         [
				 'option_group' => 'merchi_options_group',
				 'option_name'  => 'merchi_api_secret',
				 'callback'     => [
					 $this->callbacks,
					 'merchiOptionsGroup',
				 ],
			 ],
			 [
				 'option_group' => 'merchi_options_group',
				 'option_name'  => 'staging_merchi_url',
				 'callback'     => [
					 $this->callbacks,
					 'stagingMerchiOptionsGroup',
				 ],
			 ],
			 [
				 'option_group' => 'merchi_options_group',
				 'option_name'  => 'staging_merchi_api_secret',
				 'callback'     => [
					 $this->callbacks,
					 'stagingMerchiOptionsGroup',
				 ],
			 ],
			 [
				 'option_group' => 'merchi_options_group',
				 'option_name'  => 'merchi_mount_point_id',
				 'callback'     => [
					 $this->callbacks,
					 'merchiOptionsGroup',
				 ],
			 ],
             [
				 'option_group' => 'merchi_options_group',
				 'option_name'  => 'merchi_redirect_url',
				 'callback'     => [
					 $this->callbacks,
					 'merchiOptionsGroup',
				 ],
			 ],
			 [
				'option_group' => 'merchi_options_group',
				'option_name'  => 'merchi_redirect_url_quote',
				'callback'     => [
					$this->callbacks,
					'merchiOptionsGroup',
				],
			],
			 // [
				 // 'option_group' => 'merchi_options_group',
				 // 'option_name'  => 'woo_k_s',
				 // 'callback'     => [
					 // $this->callbacks,
					 // 'merchiOptionsGroup',
				 // ],
			 // ],
			 // [
				 // 'option_group' => 'merchi_options_group',
				 // 'option_name'  => 'woo_k_p',
				 // 'callback'     => [
					 // $this->callbacks,
					 // 'merchiOptionsGroup',
				 // ],
			 // ],
			 [
				 'option_group' => 'merchi_options_group',
				 'option_name'  => 'merchi_staging_mode',
				 'callback'     => [
					 $this->callbacks,
					 'merchiOptionsGroup',
				 ],
			 ],
		 ];

		 $this->settings->setSettings( $args );
	}


	public function setSections() {
		 $args = [
			 [
				 'id'       => 'merchi_admin_index',
				 'title'    => 'Settings',
				 'callback' => [
					 $this->callbacks,
					 'merchiAdminSection',
				 ],
				 'page'     => 'merchi_plugin',
			 ],
		 ];

		 $this->settings->setSections( $args );
	}


	public function setFields() {
		$args = [
			[
				'id'       => 'merchi_url',
				'title'    => 'Merchi URL',
				'callback' => [
					$this->callbacks,
					'merchiStoreUrl',
				],
				'page'     => 'merchi_plugin',
				'section'  => 'merchi_admin_index',
				'args'     => [
					'label_for' => 'merchi_url',
					'class'     => 'example-class',
				],
			],
                        [
				'id'       => 'merchi_api_secret',
				'title'    => 'Merchi API secret',
				'callback' => [
					$this->callbacks,
					'merchiApiSecret',
				],
				'page'     => 'merchi_plugin',
				'section'  => 'merchi_admin_index',
				'args'     => [
					'label_for' => 'merchi_api_secret',
					'class'     => 'example-class',
				],
			],
			[
				'id'       => 'staging_merchi_url',
				'title'    => 'Staging Merchi URL',
				'callback' => [
					$this->callbacks,
					'stagingMerchiStoreUrl',
				],
				'page'     => 'merchi_plugin',
				'section'  => 'merchi_admin_index',
				'args'     => [
					'label_for' => 'staging_merchi_url',
					'class'     => 'example-class',
				],
			],
                        [
				'id'       => 'staging_merchi_api_secret',
				'title'    => 'Staging Merchi API secret',
				'callback' => [
					$this->callbacks,
					'stagingMerchiApiSecret',
				],
				'page'     => 'merchi_plugin',
				'section'  => 'merchi_admin_index',
				'args'     => [
					'label_for' => 'staging_merchi_api_secret',
					'class'     => 'example-class',
				],
			],
			[
				'id'       => 'merchi_mount_point_id',
				'title'    => 'Mount point class',
				'callback' => [
					$this->callbacks,
					'merchiMountPointId',
				],
				'page'     => 'merchi_plugin',
				'section'  => 'merchi_admin_index',
				'args'     => [
					'label_for' => 'merchi_mount_point_id',
					'class'     => 'example-class',
				],
			],
			[
				'id'       => 'merchi_redirect_url',
				'title'    => 'Redirect After Success URL',
				'callback' => [
					$this->callbacks,
					'merchiRedirectURL'
				],
				'page'     => 'merchi_plugin',
				'section'  => 'merchi_admin_index',
				'args'     => [
					'label_for' => 'merchi_redirect_url',
					'class'     => 'example-class',
				],
			],
			[
				'id'       => 'merchi_redirect_url_quote',
				'title'    => 'Redirect After Success URL for quote',
				'callback' => [
					$this->callbacks,
					'merchiRedirectURLQuote'
				],
				'page'     => 'merchi_plugin',
				'section'  => 'merchi_admin_index',
				'args'     => [
					'label_for' => 'merchi_redirect_url_quote',
					'class'     => 'example-class',
				],
			],
			// [
				// 'id'       => 'woo_k_p',
				// 'title'    => 'Woocommerce Public Key',
				// 'callback' => [
					// $this->callbacks,
					// 'wooPublic',
				// ],
				// 'page'     => 'merchi_plugin',
				// 'section'  => 'merchi_admin_index',
				// 'args'     => [
					// 'label_for' => 'woo_k_p',
					// 'class'     => 'example-class',
				// ],
			// ],
			// [
				// 'id'       => 'woo_k_s',
				// 'title'    => 'Woocommerce Secret Key',
				// 'callback' => [
					// $this->callbacks,
					// 'wooSecret',
				// ],
				// 'page'     => 'merchi_plugin',
				// 'section'  => 'merchi_admin_index',
				// 'args'     => [
					// 'label_for' => 'woo_k_s',
					// 'class'     => 'example-class',
				// ],
			// ],
			[
				'id'       => 'merchi_staging_mode',
				'title'    => 'Environment',
				'callback' => [
					$this->callbacks,
					'merchiStagingMode'
				],
				'page'     => 'merchi_plugin',
				'section'  => 'merchi_admin_index',
				'args'     => [
					'label_for' => 'merchi_staging_mode',
					'class'     => 'example-class',
				],
			],
		];

		$this->settings->setFields( $args );
	}
}
