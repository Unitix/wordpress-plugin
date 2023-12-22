<?php declare(strict_types=1);
/**
 * @package MerchiPlugin
 */
namespace MerchiPlugin\Api;

use \MerchiPlugin\Base\BaseController;

class CreateMerchiProducts extends BaseController {


	public function register() {
		add_action( 'wp_ajax_create_merchi_products', [ $this, 'create_merchi_products' ] );
		add_action( 'wp_ajax_select_merchi_products', [ $this, 'select_merchi_products' ] );
	}
	
	public function select_merchi_products() {
		
		$data = $_POST['products'];
		
		if(
			isset( $data['create'] )
			&& is_array( $data['create'] )
			&& count ( $data['create'] )
		) {
			
			$table_content = '<tr class="plugin-table-header">
				<th class="plugin-table-th-select">Select</th>
				<th class="plugin-table-th-name">Product name</th>
				<th class="plugin-table-th-status">Sync status</th>
			  </tr>';
			 
			foreach ($data['create'] as $product) {			
				
				if( isset( $product['sku'] ) ) {
					
					if( $product_id = wc_get_product_id_by_sku( $product['sku'] ) ) {
						
						if( (int)$product['merchi_updated'] && (int)$product['merchi_updated'] == (int)get_post_meta( $product_id, 'merchi_updated', true ) ) {
							
							$status = 'Up-to-date';
							$status_id = 'up-to-date';
						}
						else {
							
							$status = 'New data';
							$status_id = 'new-data';
						}
					}
					else {
						
						$status = 'New product';
						$status_id = 'new-product';
					}
				
					$table_content .= '<tr class="plugin-table-tr">
						<td class="plugin-table-td plugin-table-td-select">
							<input type="checkbox" class="merchi_checkbox" data-sku="' . $product['sku'] . '" data-status="' . $status_id . '" value="false">
						</td>
						<td class="plugin-table-td plugin-table-td-name">'
							. sanitize_text_field( $product['name'] ) .
						'</td>
						<td class="plugin-table-td plugin-table-td-status">'
							. $status .
						'</td>
					</tr>';
				}
			}

			$result['table_content'] = $table_content;
		}
		else {
			
			$result['errors'] = '<p class="import-error">
				<div class="import-error-head">
					There are no Merchi products in your Merchi store.
				</div>
			</p>';
		}
		
		echo json_encode($result);

		die();
	}
	
	public function create_merchi_products() {

		$errors = array();

		$updated_products = 0;
		
		$data = $_POST['products'];
		
		if (is_null( $data )) {
			
			wp_send_json_error( [ 'error' => 'missing product data' ] );
		}
		
		foreach ($data['create'] as $merchi_product) {

			$error_counter = 0;

			if (!array_key_exists( 'sku', $merchi_product )) {

				wp_send_json_error( [ 'error' => 'missing <strong>sku</strong>' ] );
			} 

			$sku = sanitize_textarea_field( $merchi_product['sku'] );

			if (!array_key_exists( 'price', $merchi_product )) {

				$errors[$sku]['errors'][] = 'missing <strong>price</strong>';
				$error_counter++;
			}
			else {

				$price = sanitize_textarea_field( $merchi_product['price'] );

				if (!is_string( $price ) || empty( $price )) {
					$errors[$sku]['errors'][] = '<strong>price</strong> must be non empty string';
					$error_counter++;
				}
			}
			
			if (!array_key_exists( 'description', $merchi_product )) {

				$errors[$sku]['errors'][] = 'missing <strong>description</strong>';
				$error_counter++;
			}
			else {

				$description = json_decode( wp_unslash( $merchi_product['description'] ), true );
				
				if(
					is_array( $description )
					&& isset( $description['blocks'] )
					&& isset( $description['blocks'][0] )
					&& isset( $description['blocks'][0]['text'] )
				) {
					
					$description = $description['blocks'][0]['text'];
				}
				else {
					
					$description = '';
				}
			}

			if (!array_key_exists( 'name', $merchi_product )) {

				$errors[$sku]['errors'][] = 'missing <strong>name</strong>';
				$error_counter++;
				$name = '';
			}
			else {
				$name = sanitize_textarea_field( $merchi_product['name'] );

				if (!is_string( $name ) || empty( $name )) {

					$errors[$sku]['errors'][] = '<strong>name</strong> must be non empty string';
					$error_counter++;
				}
			}

			if (!array_key_exists( 'regular_price', $merchi_product )) {

				$errors[$sku]['errors'][] = 'missing <strong>regular_price</strong>';
				$error_counter++;
			}
			else {

				$regular_price = sanitize_textarea_field( $merchi_product['regular_price'] );

				if (!is_string( $regular_price ) || empty( $regular_price )) {
					$errors[$sku]['errors'][] = '<strong>regular_price</strong> must be non empty string';
					$error_counter++;
				}
			}

			if( $error_counter ){

				$errors[$sku]['name'] = $name;
			}
			else {
			
				$attachment_ids = array();
				$thumbnail = 0;
				
				if(
					isset( $merchi_product['images'] )
					&& is_array( $merchi_product['images'] )
					&& count( $merchi_product['images'] )
				) {
					
					foreach( $merchi_product['images'] as $merchi_image ) {
						
						if( $attachment_id = $this->attache_image( $wc_product_id, $merchi_image['src'] ) ) {
						
							if( !isset( $thumbnail ) || !$thumbnail ) {
								
								$thumbnail = $attachment_id;
							}
							else {
								
								$attachment_ids[] = $attachment_id;
							}
						}
					}
				}
				
				if( !$product_id = wc_get_product_id_by_sku( $sku ) ) {
					
					$wc_product = new \WC_Product_Simple();
					$wc_product->set_sku( $sku );
				}
				else {
					
					$wc_product = new \WC_Product( $product_id );
				}
				
				$wc_product->set_description( $description );
				$wc_product->set_price( $price );
				$wc_product->set_name( $name );
				$wc_product->set_regular_price( $regular_price );
				$wc_product->set_gallery_image_ids( $attachment_ids );
				
				if( isset( $thumbnail ) && $thumbnail ) {
					
					$wc_product->set_image_id( $thumbnail );
				}
				
				$wc_product_id = $wc_product->save();
				
				// set_post_thumbnail( $wc_product_id, $thumbnail );
				
				if( isset( $merchi_product['merchi_updated'] ) ) {
					
					update_post_meta( $wc_product_id, 'merchi_updated', $merchi_product['merchi_updated'] );
				}

				$updated_products++;
			}
		}

		if( count( $errors ) ) {

			$result['errors'] = '';
			
			foreach( $errors as $sku => $error ) {

				$result['errors'] .= '<p class="import-error">
					<div class="import-error-head">'
						. 'Product: ' . $sku . ' ' . $error['name'] .
					'</div>';
					foreach( $error['errors'] as $line ) {

						$result['errors'] .= '<div class="import-error-line">'
							. $line .
						'</div>';
					}
				$result['errors'] .= '</p>';
			}
		}
		else {

			$result['errors'] = false;
		}

		$result['products'] = $updated_products;

		echo json_encode($result);
		
		wp_die();
	}
	
	public function attache_image( $product_id, $image_url ) {
		
		global $wpdb;
		
		$query = "SELECT post_id FROM ".$wpdb->prefix."postmeta WHERE meta_key='_source_url' AND meta_value='". $image_url ."'";
		
		if( $attachment_id = $wpdb->get_var( $query ) ) {
			
			if( wp_get_attachment_url( $attachment_id ) ) {
				
				return (int)$attachment_id ;
			}
		}
		
		require_once ABSPATH . 'wp-admin/includes/media.php';
		require_once ABSPATH . 'wp-admin/includes/file.php';
		require_once ABSPATH . 'wp-admin/includes/image.php';
		
		$attachment_id = media_sideload_image( $image_url, $product_id, null, 'id' );
		
		return $attachment_id;
	}
}
