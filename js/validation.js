$(document).ready(function () {

  $("#btnConfirmar").on("click", function (e) {
    e.preventDefault();

    let valido = true;

    // Selecciona inputs, selects y textareas con required
    $("input[required], select[required], textarea[required]").each(function () {

      const $field = $(this);
      const value = ($field.val() || "").toString().trim();
      let $error = $field.closest(".form-group").find(".error");
console.log('FIELD:', $field.prop('tagName'), 'id=', $field.attr('id'));

      // Para los textareas dentro de tus servicios no hay .form-group padre
      if ($error.length === 0) {
        $error = $field.siblings(".error");
      }




      if (value === "") {
        $error.show();
        $field.addClass("campo-error");

        // Si es select real oculto, también aplicamos a la versión custom
        if ($field.is('select') && $field.css('display') === 'none') {
          $('#metodoPago-custom').addClass('campo-error');
        }

        valido = false;
      } else {
        $error.hide();
        $field.removeClass("campo-error");
        if ($field.is('select') && $field.css('display') === 'none') {
          $('#metodoPago-custom').removeClass('campo-error');
        }
      }

    });

    if (valido) {
      $("#confirmModal").modal("show");
    }
  });

});
