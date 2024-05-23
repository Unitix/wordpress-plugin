<?php

namespace MerchiPlugin\Base;

if (!class_exists('WP_List_Table')) {
    require_once ABSPATH . 'wp-admin/includes/class-wp-list-table.php';
}

class MerchiProductImportListtable extends \WP_List_Table
{
    public $apiKey;  //'UA5_mG2q-XILdYPU1nbOZSZtjDHUnZ0IweQVdTq3Cs2wwwfV2WYXmgwxbdAKEl4bgDo9BGXO1Wi3Wwg4DZOszQ';
    public $domain_id;
    public function __construct()
    {
        parent::__construct(
            array(
                'singular' => 'product',
                'plural' => 'products',
                'ajax' => false,
            )
        );
        $this->prepare_items();
        $merchi_mode = get_option('merchi_staging_mode');
        if($merchi_mode){
            $this->domain_id = $merchi_mode == 'yes' ? get_option('staging_merchi_url') : get_option('merchi_url');
            $this->apiKey = $merchi_mode == 'yes' ? get_option('staging_merchi_api_secret') : get_option('merchi_api_secret');
        }
    }

    private function fetch_api_data()
    {
        $curl = curl_init();
        curl_setopt_array(
            $curl,
            array(
                CURLOPT_URL => "https://api.staging.merchi.co/v6/products/?apiKey=$this->apiKey&limit=0&offset=0&inDomain=$this->domain_id&session_token=5VrrvZy6hAx6KsVqsOZUyz4aG9cz8MLHmwxfAp-EuWhD60AomCg-Y-0dqxM08BbH5wAGzu-hOxZ3NdpTjzmXCQ&embed={%22featureImage%22%3A{}%2C%22images%22%3A{}}&skip_rights=y",
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_ENCODING => '',
                CURLOPT_MAXREDIRS => 10,
                CURLOPT_TIMEOUT => 0,
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
                CURLOPT_CUSTOMREQUEST => 'GET',
                CURLOPT_POSTFIELDS => '{}',
                CURLOPT_HTTPHEADER => array(
                    'Content-Type: application/json'
                ),
            )
        );
        $response = curl_exec($curl);
        curl_close($curl);
        $response_data = json_decode($response);

        return $response_data;
    }

    public function prepare_items()
    {
        $response_data = $this->fetch_api_data();
        // var_dump($response_data);

        if ($response_data && isset($response_data->products) && is_array($response_data->products) && !empty($response_data->products)) {
            $data = array();
            $product_keys = array_keys($response_data->products);

            $product_ids = array();
            foreach ($product_keys as $index) {
                $product = $response_data->products[$index];
                $product_ids[] = $product->product->id;
            }
            // Sort product IDs in descending order
            rsort($product_ids);
            foreach ($product_ids as $product_id) {
                $product = null;
                foreach ($product_keys as $index) {
                    if ($response_data->products[$index]->product->id == $product_id) {
                        $product = $response_data->products[$index];
                        break;
                    }
                }
            
                if ($product) {
                    $product_featureImage = isset($product->product->featureImage) && isset($product->product->featureImage->viewUrl) ? $product->product->featureImage->viewUrl : '';
                    $product_name = $product->product->name;
                    $product_unitPrice = $product->product->unitPrice;
                    $existing_product_id = wc_get_product_id_by_sku($product_id);
                    $status = $existing_product_id ? 'Imported' : 'Not Imported';
                    $button_text = $existing_product_id ? 'Sync' : 'Import';
            
                    // Add product data to the $data array
                    $data[] = array(
                        'thumbnail' => !empty($product_featureImage) ? '<img src="' . esc_url($product_featureImage) . '" alt="Product Image" height="50" width="50">' : '<span class="dashicons dashicons-format-image"></span><br>',
                        'name' => $product_name,
                        'sku' => $product_id,
                        'price' => '$' . $product_unitPrice,
                        'Status' => $status,
                        'Action' => '<form method="post">
                                        <input type="hidden" name="product_id" value="' . esc_attr($product_id) . '">
                                        <button type="submit" class="if_import" name="import_product">' . esc_html($button_text) . '</button>
                                    </form>'
                    );
                }
            }

            // Check Import Product 
            if (isset($_POST['import_product'])) {
                $product_id_to_import = sanitize_text_field($_POST['product_id']);
                $this->import_product_to_woocommerce($product_id_to_import);
            }

            // Product Status
            $status_filter = isset($_GET['product_status']) ? $_GET['product_status'] : 'all';
            if ($status_filter === 'imported') {
                $data = array_filter($data, function ($item) {
                    return $item['Status'] === 'Imported';
                });
            } elseif ($status_filter === 'not_imported') {
                $data = array_filter($data, function ($item) {
                    return $item['Status'] === 'Not Imported';
                });
            }

            // Sorting 
            $sortable = $this->get_sortable_columns();
            $orderby = isset($_GET['orderby']) ? sanitize_text_field($_GET['orderby']) : 'name';
            $order = isset($_GET['order']) ? sanitize_text_field($_GET['order']) : 'desc'; // Set default order to 'desc' if not provided

            if (array_key_exists($orderby, $sortable)) {
                switch ($orderby) {
                    case 'name':
                        // Sort by product name
                        usort($data, function ($a, $b) use ($order) {
                            return $order === 'desc' ? strcmp($b['name'], $a['name']) : strcmp($a['name'], $b['name']);
                        });
                        break;
                    case 'sku':
                        // Sort by product SKU as numerical values
                        usort($data, function ($a, $b) use ($order) {
                            $sku_a = (int) preg_replace('/\D/', '', $a['sku']); // Extract numerical part of SKU
                            $sku_b = (int) preg_replace('/\D/', '', $b['sku']);
                            return $order === 'desc' ? ($sku_b - $sku_a) : ($sku_a - $sku_b);
                        });
                        break;
                }
            }

            // Searching
            $search = isset($_REQUEST['s']) ? sanitize_text_field($_REQUEST['s']) : '';
            if (!empty($search)) {
                $data = array_filter($data, function ($item) use ($search) {
                    return stripos($item['name'], $search) !== false ||
                        stripos($item['sku'], $search) !== false ||
                        stripos($item['price'], $search) !== false ||
                        stripos($item['Status'], $search) !== false;
                });
            }

            
            // Pagination
            $per_page = $this->get_items_per_page('products_per_page', 20);
            $current_page = $this->get_pagenum();
            $total_items = count($data);
            $offset = (($current_page - 1) * $per_page);
            $this->set_pagination_args(
                array(
                    'total_items' => $total_items,
                    'per_page' => $per_page,
                )
            );


            $data = array_slice($data, $offset, $per_page);
            $columns = $this->get_columns();
            $hidden = array();
            $sortable = $this->get_sortable_columns();
            $this->_column_headers = array($columns, $hidden, $sortable);
            $this->items = $data;
            return $total_items;
        } else {
            echo 'No products found in the response.';
        }
    }

    // Import Product In wooCommerce
    function import_product_to_woocommerce($product_id_to_import)
    {
        update_option('jeetgeetgyayahargya', $product_id_to_import);
        error_log('Importing product to WooCommerce: ' . $product_id_to_import);
        $sku = $product_id_to_import;
        $key = $this->apiKey;
        $existing_product_id = wc_get_product_id_by_sku($sku);
        if (!$existing_product_id) {
            $curl = curl_init();
            curl_setopt_array(
                $curl,
                array(
                    CURLOPT_URL => "https://api.staging.merchi.co/v6/products/$sku/?apiKey=$key&limit=1&offset=0&inDomain=5&session_token=5VrrvZy6hAx6KsVqsOZUyz4aG9cz8MLHmwxfAp-EuWhD60AomCg-Y-0dqxM08BbH5wAGzu-hOxZ3NdpTjzmXCQ&embed={%22featureImage%22%3A{}%2C%22images%22%3A{}}&skip_rights=y",
                    CURLOPT_RETURNTRANSFER => true,
                    CURLOPT_ENCODING => '',
                    CURLOPT_MAXREDIRS => 10,
                    CURLOPT_TIMEOUT => 0,
                    CURLOPT_FOLLOWLOCATION => true,
                    CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
                    CURLOPT_CUSTOMREQUEST => 'GET',
                    CURLOPT_POSTFIELDS => '{}',
                    CURLOPT_HTTPHEADER => array(
                        'Content-Type: application/json'
                    ),
                )
            );
            $response = curl_exec($curl);
            $productData = json_decode($response);
            $this->createProduct($productData);
        } else { 
            update_option('pahlesebanahai', $product_id_to_import);
            
            ?>
            <!-- <div class="notice notice-error is-dismissible">
                <p>
                    <?php //echo esc_html('Product Already Exists.'); ?>
                </p>
            </div> -->
        <?php
        }
    }
    // Create Product In WooCommerce
    private function createProduct($productData)
    {
        if (!isset($productData->product)) {
            error_log('Error: Product data format is incorrect');
            return false;
        }
        $product = $productData->product;
        $product_name = isset($product->name) ? $product->name : '';
        $product_sku = isset($product->id) ? $product->id : '';
        $product_price = isset($product->unitPrice) ? $product->unitPrice : '';
        // $images = isset($product->unitPrice) ? $product->unitPrice : '';
        // $product_name = $productData->product->name;
        // $product_sku = $productData->product->id;
        // $product_price = $productData->product->unitPrice;
        $images = $productData->product->images;
        $product_thumbnail_url = null;
        $key = 'merchi_product_id_' . $product_sku;

        if (!empty($productData->product->featureImage)) {
            $featureImage = $productData->product->featureImage;
            $product_thumbnail_id = $featureImage->id;
            $thumbnail_mimetype = $featureImage->mimetype;
            $mimetype_parts = explode('/', $thumbnail_mimetype);
            $_mimetype = end($mimetype_parts);
            $product_thumbnail_url = "https://api.staging.merchi.co/v6/product-public-file/download/$product_thumbnail_id.$_mimetype";
        }

        $new_product_id = wp_insert_post(
            array(
                'post_title' => $product_name,
                'post_content' => '',
                'post_status' => 'publish',
                'post_type' => 'product',
            )
        );

        if (!is_wp_error($new_product_id)) {
            update_post_meta($new_product_id, $key, $productData);
        }

        if (is_wp_error($new_product_id)) {
            error_log('Error creating product: ' . $new_product_id->get_error_message());
            return false;
        }

        update_post_meta($new_product_id, '_sku', $product_sku);
        update_post_meta($new_product_id, '_regular_price', $product_price);
        update_post_meta($new_product_id, '_price', $product_price);

        if (!empty($product_thumbnail_url)) {
            $image_id = $this->uploadProductImage($product_thumbnail_url, $new_product_id, $_mimetype);
            if (!is_wp_error($image_id)) {
                set_post_thumbnail($new_product_id, $image_id);
            }
        }

        $gallery_ids = array();
        foreach ($images as $image) {
            $imageDownloadUrls = $image->id;
            $gallery_mimetype = $image->mimetype;
            $mimetype_parts = explode('/', $gallery_mimetype);
            $_mimetype = end($mimetype_parts);
            $product_gallery_url = "https://api.staging.merchi.co/v6/product-public-file/download/$imageDownloadUrls.$_mimetype";

            if (!empty($imageDownloadUrls)) {
                $image_id = $this->uploadProductGalleryImage($product_gallery_url, $new_product_id, $_mimetype);
                if (!is_wp_error($image_id)) {
                    $gallery_ids[] = $image_id;
                }
            }
        }
        // Update product gallery meta directly
        update_post_meta($new_product_id, '_product_image_gallery', implode(',', $gallery_ids));
        $product = wc_get_product($new_product_id);
        $product->set_gallery_image_ids($gallery_ids);
        $product->save();

        if($new_product_id){
            ?>
            <div class="notice notice-success is-dismissible">
                <p><?php echo esc_html('Product added successfully.'); ?></p>
            </div>
            <?php
            update_option('product_imported_flag', true);
        }

        return $new_product_id;
    }
    private function uploadProductImage($product_thumbnail_url, $product_id, $_mimetype)
    {
        $image_url = $product_thumbnail_url;
        $mimetype = $_mimetype;
        $new_product_id = $product_id;

        // Use media_sideload_image to handle image upload
        $attachment_id = media_sideload_image($image_url, $new_product_id, '', 'id');
        if (is_wp_error($attachment_id)) {
            error_log('Error uploading product image: ' . $attachment_id->get_error_message());
            return false;
        }
        // Set the attachment as the product's featured image
        set_post_thumbnail($new_product_id, $attachment_id);

        return $attachment_id;
    }

    private function uploadProductGalleryImage($product_gallery_url, $product_id, $_mimetype)
    {
        $image_url = $product_gallery_url;
        $mimetype = $_mimetype;
        $new_product_id = $product_id;
        $attachment_id = media_sideload_image($image_url, $new_product_id, '', 'id');

        if (is_wp_error($attachment_id)) {
            error_log('Error uploading product gallery image: ' . $attachment_id->get_error_message());
            return false;
        }

        return $attachment_id;
    }

    public function display()
    {
        ?>
        <div class="wrap">
            <form method="post">
                <input type="hidden" name="page" value="<?php echo esc_attr($_REQUEST['page']); ?>" />
                <?php $this->search_box('Search', 'search_id'); ?>
                <input type="hidden" name="bulk_import" value="bulk_import">
                <?php parent::display(); ?>
            </form>
        </div>
        <?php
    }

    public function column_cb($item)
    {
        $product_sku = isset($item['sku']) ? $item['sku'] : '';
        return sprintf(
            '<input type="checkbox" name="product[]" value="%s" />',
            esc_attr($product_sku)
        );
    }

    public function display_tablenav($which)
    {
        if ($which === 'top') {
            $status_counts = $this->get_status_data();
            $current_status = isset($_GET['product_status']) ? $_GET['product_status'] : 'all';
        ?>
            <div class="alignleft actions">
                <a href="<?php echo esc_url(add_query_arg('product_status', 'all')); ?>" class="<?php echo $current_status === 'all' ? 'current' : ''; ?>">All (
                    <?php echo isset($status_counts['total']) ? $status_counts['total'] : 0; ?>)
                </a> |
                <a href="<?php echo esc_url(add_query_arg('product_status', 'imported')); ?>" class="<?php echo $current_status === 'imported' ? 'current' : ''; ?>">Imported (
                    <?php echo isset($status_counts['imported']) ? $status_counts['imported'] : 0; ?>)
                </a> |
                <a href="<?php echo esc_url(add_query_arg('product_status', 'not_imported')); ?>" class="<?php echo $current_status === 'not_imported' ? 'current' : ''; ?>">Not Imported (
                    <?php echo isset($status_counts['not_imported']) ? $status_counts['not_imported'] : 0; ?>)
                </a>
            </div>
    <?php
        }
        parent::display_tablenav($which);
    }

    private function get_status_data()
    {
        $response_data = $this->fetch_api_data();
        $total_count = 0;
        $imported_count = 0;
        $not_imported_count = 0;

        if ($response_data && isset($response_data->products) && is_array($response_data->products) && !empty($response_data->products)) {
            $total_count = count($response_data->products);
            foreach ($response_data->products as $product) {
                $existing_product_id = wc_get_product_id_by_sku($product->product->id);
                if ($existing_product_id) {
                    $imported_count++;
                } else {
                    $not_imported_count++;
                }
            }
        }

        $status_counts = array(
            'total' => $total_count,
            'imported' => $imported_count,
            'not_imported' => $not_imported_count,
        );

        return $status_counts;
    }

    // Get Columns
    public function get_columns()
    {
        $columns = array(
            'cb' => '<input type="checkbox" checked  />',
            'thumbnail' => '<span style="margin-left: 15px;" class="dashicons dashicons-format-image"></span>',
            'name' => 'Name',
            'sku' => 'SKU',
            'price' => 'Price',
            'Status' => 'Status',
            'Action' => 'Action',
        );

        return $columns;
    }
    // set short 
    public function get_sortable_columns()
    {
        $sortable_columns = array(
            'name' => array('name', false),
            'sku' => array('sku', false),
            'price' => array('price', false),
            'Status' => array('Status', false),
            'Action' => array('Action', false),
        );
        return $sortable_columns;
    }
    // return column items 
    public function column_default($item, $column_name)
    {
        return isset($item[$column_name]) ? $item[$column_name] : '';
    }

    public function get_bulk_actions()
    {
        $actions = array(
            'bulk_import' => 'Bulk Import',
            'bulk_sync' => 'Bulk Sync'
        );
        return $actions;
    }
    public function process_bulk_action()
    {
        if ('bulk_import' === $this->current_action()) {
            $current_page_url = esc_url(add_query_arg(array()));
            echo '<div class="notice notice-success is-dismissible jitendradhakad"><p>Product imported successfully.</p></div>';
           /*  $selected_products = isset($_POST['product']) ? $_POST['product'] : array();
            error_log('Selected products: ' . print_r($selected_products, true));
            foreach ($selected_products as $product_id) {
                $import_result = $this->import_product_to_woocommerce($product_id);
                if ($import_result === true) {
                    echo '<div class="notice notice-success is-dismissible"><p>Product imported successfully.</p></div>';
                } else {
                    echo '<div class="notice notice-error is-dismissible"><p>Error importing product.</p></div>';
                }
            } */
            //wp_redirect($current_page_url);
            exit();
        }
    }
    
}
