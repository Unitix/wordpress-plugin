jQuery(document).ready(function ($) {
  const button = $("#merchi-send-button");

  function resetButton() {
    button.html("Send");
    button.prop("disabled", false);
  }

  function onDone(data) {
    resetButton();
    console.log(data);
    toast(data);
  }

  function onError(req, status, error) {
    resetButton();
    console.error(error);
    toast(error);
  }

  function exportProducts() {
    const data = {action: "export_products",
                  _ajax_nonce: export_products.nonce};
    $.ajax({type: "post",
            url: export_products.ajax_url,
            data: data,
            success: onDone,
            error: onError});
  }

  button.click(function () {
    button.html("Exporting...");
    button.prop("disabled", true);
    exportProducts();
  });

  function toast(msg) {
    var snackbar = document.getElementById("snackbar");
    $("#snackbar").text(msg);
    snackbar.className = "show";
    setTimeout(function () {
      snackbar.className = snackbar.className.replace("show", "");
    }, 3000);
  }
});
