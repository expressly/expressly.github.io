<script type="text/javascript">
    var cp_obj = CraftyPostcodeCreate();
    cp_obj.set("access_token", "3436f-5ccf3-93f86-02095"); // your token here
    cp_obj.set("result_elem_id", "crafty_postcode_result_display");
    cp_obj.set("form", "address");
    cp_obj.set("elem_company", "companyname");
    cp_obj.set("elem_street1", "address1");
    cp_obj.set("elem_street2", "address2");
    cp_obj.set("elem_street3", "address3");
    cp_obj.set("elem_town", "town");
    cp_obj.set("elem_postcode", "postcode");

    (function() {
        // make sure our popup is on top or hierarchy
        var content = document.getElementById("xly");
        if (content) {
            document.body.insertBefore(content, document.body.firstChild);
        }
    })();

    $(function() {

    var form = $("#xly-submit-form");

    form.submit(function(event) {

        event.preventDefault();

        var submitButton = form.find('#submitButton');

        submitButton.val('Submitting...');

        $.ajaxSetup({
            xhrFields: {
                withCredentials: true
            }});

        $.post( "http://sunflowerbaby.uk/my-account/", form.serialize())
            .done(function(data) {
                form.find('.form-item').removeClass('error');
                form.find('.xly-error').removeClass('field-error');
                form.find('.xly-error').hide();

                if (!data.success) {
                    $.each( data.errors.fieldErrors, function( key, value ) {
                        var fieldDiv = form.find('#xly-' + key);
                        var fieldError = fieldDiv.find('.xly-error');
                        fieldDiv.addClass('error');
                        fieldError.text(value);
                        fieldError.show();
                        fieldError.addClass('field-error');
                    });

                    if (data.errors.globalError) {
                        var globalError = form.find('#xly-globalError');
                        globalError.text(data.errors.globalError);
                        if (data.errors.globalErrorHelp) {
                            globalError.text(globalError.text() + '. ' + data.errors.globalErrorHelp);
                        }
                        globalError.show();
                        globalError.addClass('field-error');
                        submitButton.val('OK');
                    }
                } else {
                    window.location.replace("https://prod.expresslyapp.com/api/redirect/migration/{uuid}/failed");
                }
            });
          });
      });
</script>
