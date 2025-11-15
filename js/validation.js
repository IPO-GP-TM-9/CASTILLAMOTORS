$(document).ready(function () {
  $("#btnConfirmar").on("click", function (e) {
    e.preventDefault();

    let valido = true;

    $("input[required], select[required]").each(function () {
      const $field = $(this);
      const value = ($field.val() || "").toString().trim();
      const $error = $field.closest(".form-group").find(".error");

      if (value === "") {
        $error.show();
        $field.css("border-color", "red");
        valido = false;
      } else {
        $error.hide();
        $field.css("border-color", "");
      }
    });

    if (valido) {
      $("#confirmModal").modal("show");
    }
  });

});
