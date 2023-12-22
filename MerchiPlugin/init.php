<?php declare(strict_types=1);
/**
 * @package MerchiPlugin
 */

namespace MerchiPlugin;

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
			ShoppingCart\ShoppingCartInject::class,
			Base\Enqueue::class,
			Base\SettingsLinks::class,
			Api\CreateMerchiProducts::class,
			Api\ExportProducts::class,
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
