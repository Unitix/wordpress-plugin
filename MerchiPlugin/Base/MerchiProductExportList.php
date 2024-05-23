<?php


namespace MerchiPlugin\Base;

if (!class_exists('WP_List_Table')) {
    require_once ABSPATH . 'wp-admin/includes/class-wp-list-table.php';
}

if (!in_array('woocommerce/woocommerce.php', apply_filters('active_plugins', get_option('active_plugins')))) {
    echo '<div class="error"><p>WooCommerce plugin is required for this functionality.</p></div>';
    return;
}

class MerchiProductExportList extends \WP_List_Table {
    // Constructor
    function __construct() {
        parent::__construct( array(
            'singular'  => 'product',
            'plural'    => 'products',
            'ajax'      => false
        ) );
    }
    public function display()
    {
        ?>
        <div class="wrap">
            <form method="post">
                <input type="hidden" name="page" value="<?php echo esc_attr($_REQUEST['page']); ?>" />
                <?php $this->search_box('Search', 'search_id'); ?>
                <input type="hidden" name="bulk_import" value="bulk_import">
                <?php parent::display();?>
            </form>
        </div>
        <?php
    }
    public function get_bulk_actions()
    {
        $actions = array(
            'bulk_export' => 'Bulk Export',
            'bulk_sync' => 'Bulk Sync'
        );
        return $actions;
    }
    public function process_bulk_action() {
        if (isset($_POST['export_product'])) {
            $product_id = isset($_POST['product_id']) ? $_POST['product_id'] : 0;
            if ($product_id) {
                $export_result = $this->export_product_to_json($product_id);
                if ($export_result !== false) {
                    echo '<pre>' . json_encode($export_result, JSON_PRETTY_PRINT) . '</pre>';
                } else {
                    echo 'Error exporting product: ' . $product_id;
                }
            }
        } elseif ('bulk_export' === $this->current_action() && isset($_POST['product'])) {
            $selected_products = $_POST['product'];
            foreach ($selected_products as $product_id) {
                $export_result = $this->export_product_to_json($product_id);
                if ($export_result !== false) {
                    echo '<pre>' . json_encode($export_result, JSON_PRETTY_PRINT) . '</pre>';
                } else {
                    echo 'Error exporting product: ' . $product_id;
                }
            }
        }
    }
    
    
    public function export_product_to_json($product_id) {
        $product = wc_get_product($product_id);
        if ($product) {
            $thumbnail_id = $product->get_image_id();
            $thumbnail_url = wp_get_attachment_image_url($thumbnail_id, 'thumbnail');
            
            $gallery_images = array();
            $attachment_ids = $product->get_gallery_image_ids();
            foreach ($attachment_ids as $attachment_id) {
                $gallery_images[] = wp_get_attachment_image_url($attachment_id, 'full');
            }
            
            $product_data = array(
                'name' => $product->get_name(),
                'description' => $product->get_description(),
                'featureImageUrl' => $thumbnail_url,
                'imageUrls' => $gallery_images,
                'metaData' => [
                    'product_id' => $product_id,'sku' => $product->get_sku(),'product_price' => $product->get_price(),'regular_price' => $product->regular_price,'slug'=> $product->slug,
                    'categories' => wp_get_post_terms($product_id, 'product_cat', array('fields' => 'names')),'status'=>$product->status,'attributes'=> $product->attributes,'image_id'=>$product->image_id,
                    'gallery_image_ids'=>$product->gallery_image_ids,'date_created' => $product->get_date_created()->date_i18n(get_option('date_format')),'stock_quantity'=>$product->stock_quantity,
                    'stock_status'=>$product->stock_status,'rating_counts' => $product->rating_counts, 'average_rating' => $product->average_rating, 'review_count'=>$product->review_count
                ]
            );
            // $product_data = array(
            //     'data' => array(
            //         "products" => array(
            //             array(
            //                 "name" => $product->get_name(),
            //                 "description" => $product->description,
            //                 "featureImageUrl" => $thumbnail_url,
            //                 "imageUrls" => $gallery_images,
            //             )
            //         )
            //     )
            // );            
            return $product_data;
        } else {
            return false; // Product not found
        }
    }
    
    
        // Define columns
        function get_columns() {
            $columns = array(
                'cb'            => '<input type="checkbox" />',
                'thumbnail'     => '<span style="margin-left: 15px;" class="dashicons dashicons-format-image"></span>',
                'product_name'  => 'Name',
                'sku'           => 'SKU',
                // 'stock'         => 'Stock',
                'product_price' => 'Price',
                'categories'    => 'Categories',
                'tags'          => 'Tags',
                'date'          => 'Date',
                'action'        => 'Action'
            );
            return $columns;
        }
        public function get_sortable_columns() {
            $sortable_columns = array(
                'product_name'  => array('product_name', false),
                'sku'           => array('sku', false),
                // 'stock'         => array('stock', false),
                'product_price' => array('product_price', false),
                'categories'    => array('categories', false),
                'tags'          => array('tags', false),
                'date'          => array('date', false),
            );
            return $sortable_columns;
        }
        function column_cb($item) {
            return sprintf(
                '<input type="checkbox" name="product[]" value="%s" />',
                $item->get_id()
            );
        }
    
            // Display data in columns
        function column_default( $item, $column_name ) {
            switch( $column_name ) {
                case 'cb':
                    return sprintf(
                        '<input type="checkbox" name="product[]" value="%s" />',
                        $item->get_id()
                    );
                case 'thumbnail':
                    $image = $item->get_image(array( 50, 50 )); // Adjust the image size as needed
                    return $image;
                case 'product_name':
                    return $item->get_name();
                case 'product_price':
                    return $item->get_price();
                case 'categories':
                    $categories = wp_get_post_terms( $item->get_id(), 'product_cat', array( 'fields' => 'names' ) );
                    return implode( ', ', $categories );
                case 'tags':
                    $tags = wp_get_post_terms( $item->get_id(), 'product_tag', array( 'fields' => 'names' ) );
                    return implode( ', ', $tags );
                // case 'stock':
                //     return $item->get_stock_quantity();
                case 'sku':
                    return $item->get_sku();
                case 'date':
                    return $item->get_date_created()->date_i18n( get_option( 'date_format' ) );
                case 'action':
                    $product_id = $item->get_id();
                    $button_text = 'Export';
                    ?>
                    <form method="post">
                        <input type="hidden" name="product_id" value="<?php echo esc_attr($product_id); ?>">
                        <button type="submit" name="export_product"><?php echo esc_html($button_text); ?></button>
                    </form>
                    <?php
                    return '';
                default:
                    return '';
            }
        }

        function prepare_items() {
            // Set arguments to filter products
            $args = array(
                'status' => 'publish',
                'limit' => -1, // Fetch all products, no limit
            );
        
            // Get data from WooCommerce
            $products = wc_get_products($args);
            $per_page = $this->get_items_per_page('products_per_page', 20);
            $current_page = $this->get_pagenum();
            $total_items = count($products);
            $offset = (($current_page - 1) * $per_page);
            $this->set_pagination_args(
                array(
                    'total_items' => $total_items,
                    'per_page' => $per_page,
                )
            );

            $products = array_slice($products, $offset, $per_page);
            $columns = $this->get_columns();
            $hidden = array();
            $sortable = $this->get_sortable_columns();
            $this->_column_headers = array($columns, $hidden, $sortable);
            $this->items = $products;
            // return $total_items;
        }
        
}


