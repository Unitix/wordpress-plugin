<?php declare(strict_types=1);
/**
 * @package MerchiPlugin
 */

namespace MerchiPlugin;

// Base classes (load BaseController first!)
require_once __DIR__ . '/Base/BaseController.php';
require_once __DIR__ . '/Base/Enqueue.php';
require_once __DIR__ . '/Base/SettingsLinks.php';

// Callbacks (relies on BaseController)
require_once __DIR__ . '/Api/Callbacks/AdminCallbacks.php';

// API services
require_once __DIR__ . '/Api/CreateMerchiProducts.php';
require_once __DIR__ . '/Api/ExportProducts.php';
require_once __DIR__ . '/Api/SettingsApi.php';

// Pages
require_once __DIR__ . '/Pages/Admin.php';
require_once __DIR__ . '/PublicPages/ProductPage.php';

// Cart injection
// require_once __DIR__ . '/ShoppingCart/ShoppingCartInject.php';
// require_once __DIR__ . '/CartPages/CartCheckoutPage.php'; 


final class Init {


	/**
	 * Store all classes inside an array
	 *
	 * @return array Full list of classes
	 */
	public static function get_services() {
		return [
			Pages\Admin::class,
			PublicPages\ProductPage::class,
			Base\Enqueue::class,
			Base\SettingsLinks::class,
			Api\CreateMerchiProducts::class,
			Api\ExportProducts::class,
			CartPages\CartCheckoutPage::class,
		];
	}


	/**
	 * Loop through all classes, initialise them,
	 * and call register() method if it exists
	 *
	 * @return
	 */
	public static function register_services() {
		foreach (self::get_services() as $class) {
			$service = self::instantiate( $class );
			if (method_exists( $service, 'register' )) {
				$service->register();
			}
		}
	}


	/**
	 * Initialise the class
	 *
	 * @param  class $class    class from the services array
	 * @return class instance  new instance of the class
	 */
	private static function instantiate( $class ) {
		 $service = new $class();

		return $service;
	}
}
