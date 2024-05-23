<?php
use \MerchiPlugin\Base\MerchiProductImportListtable as MerchiProductImportListtable;
class WP_Example_Request extends WP_Async_Request  {
    protected function handle() {
        $background_process_prods = get_option('gc_backgroung_process_prods');
        $merchi_importer = new MerchiProductImportListtable();
        // Check if the option exists and has a value
        if ($background_process_prods !== false) {
            $i=0;
            foreach ($background_process_prods as $sku) {
                $merchi_importer->import_product_to_woocommerce($sku);
                $i++;
            }
            
            // Send email to admin
            $to = get_option('admin_email');
            $subject = 'Product Creation Notification';
            $message = 'Hello Admin,<br><br>';
            $message .= 'A background process has created ' . $i . ' products.<br><br>';
            $message .= 'Regards';
            $headers = array('Content-Type: text/html; charset=UTF-8');
            wp_mail($to, $subject, $message, $headers);
        } 
    }
}
?>