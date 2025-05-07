<?php
use \MerchiPlugin\Base\MerchiProductImportListtable as MerchiProductImportListtable;
class WP_Example_Request extends WP_Async_Request  {
    protected function handle() {
        try {
            $background_process_prods = get_option('gc_backgroung_process_prods');
            $merchi_importer = new MerchiProductImportListtable();
            
            // Check if the option exists and has a value
            if ($background_process_prods !== false) {
                $success_count = 0;
                $error_count = 0;
                $errors = [];
                
                foreach ($background_process_prods as $sku) {
                    try {
                        $merchi_importer->import_product_to_woocommerce($sku);
                        $success_count++;
                    } catch (Exception $e) {
                        $error_count++;
                        $errors[] = "Error importing product {$sku}: " . $e->getMessage();
                        error_log("Background process error for SKU {$sku}: " . $e->getMessage());
                    }
                }
                
                // Send detailed email to admin
                $to = get_option('admin_email');
                $subject = 'Product Creation Notification';
                $message = 'Hello Admin,<br><br>';
                $message .= "Background process completed with the following results:<br>";
                $message .= "- Successfully created: {$success_count} products<br>";
                $message .= "- Failed to create: {$error_count} products<br>";
                
                if (!empty($errors)) {
                    $message .= "<br>Error details:<br>";
                    $message .= "<ul>";
                    foreach ($errors as $error) {
                        $message .= "<li>" . esc_html($error) . "</li>";
                    }
                    $message .= "</ul>";
                }
                
                $message .= '<br>Regards';
                $headers = array('Content-Type: text/html; charset=UTF-8');
                wp_mail($to, $subject, $message, $headers);
                
                // Clear the background process option after completion
                delete_option('gc_backgroung_process_prods');
            }
        } catch (Exception $e) {
            error_log("Critical error in background process: " . $e->getMessage());
            // Send critical error notification
            wp_mail(
                get_option('admin_email'),
                'Critical Error in Product Import Background Process',
                'A critical error occurred in the product import background process: ' . $e->getMessage()
            );
        }
    }
}
?>
