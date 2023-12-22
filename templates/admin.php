<?php declare(strict_types=1); ?>
<div class="wrap">
  <h1><?php echo esc_html( get_admin_page_title() ); ?></h1>
  <?php settings_errors(); ?>
  <div style="margin-top: 1em" class="plugin-body">
	<form action="options.php" method="post">
	  <?php
			settings_fields( 'merchi_options_group' );
			do_settings_sections( 'merchi_plugin' );
			submit_button( 'Save Settings' );
		?>
	</form>
  </div>
</div>
