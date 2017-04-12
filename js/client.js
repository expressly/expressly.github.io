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

// jQuery(document).ready(function() {
//     var milliseconds = new Date().getTime();
//     jQuery('#xly-firstName input').val('Jake');
//     jQuery('#xly-lastName input').val('Smith');
//     jQuery('#xly-email input').val('Jake' + milliseconds + '@email.com');
//     jQuery('#xly-phone input').val('07920599089');
//     jQuery('#xly-postcode input').val('Cf64 1AZ');
//     //jQuery('#xly-address input').val('11 Church Avenue');
//     jQuery('#xly-town input').val('Penarth');
// });

jQuery(function() {

    console.log("working");
    var form = jQuery("#xly-submit-form");
    var htmlFiltered = "";

    form.submit(function(event) {

          event.preventDefault();

            if (document.querySelector('#xly-firstName input').value == "") {
                alert("Please provide your name!");
                return false;
            }

            if (document.querySelector('#xly-lastName input').value == "") {
                alert("Please provide your name!");
                return false;
            }

        // jQuery.ajax({
        //     type: "POST",
        //     url: "/my-account/",
        //     data: {
        //         email: jQuery('#xly-email input').val(),
        //         password: "asd234fdgd!!!",
        //         'woocommerce-register-nonce': "dc79fa4796",
        //         register: "Register"
        //     },
        //     success: function(output) {
        //         if (xlyRegistrationSuccessful(output)) {
        //             xlySendMigrationSuccess();
        //             xlyAddBillingDetails();
        //         };
        //     }
        // });



        // function xlyRegistrationSuccessful(output) {
        //     return true;
        // };

        // function xlyAddBillingDetails() {
        //     jQuery.ajax({
        //         type: "GET",
        //         url: "/my-account/edit-address/billing/",
        //         success: function(data) {
        //             html = data;
        //             var htmlFiltered = jQuery(data).find('#_wpnonce').val();
        //             jQuery.ajax({
        //                 type: "POST",
        //                 url: "/my-account/edit-address/billing/",
        //                 data: {
        //                     billing_first_name: jQuery('#xly-firstName input').val(),
        //                     billing_last_name: jQuery('#xly-lastName input').val(),
        //                     billing_company: '',
        //                     billing_email: jQuery('#xly-email input').val(),
        //                     billing_phone: jQuery('#xly-phone input').val(),
        //                     billing_country: 'GB',
        //                     billing_address_1: jQuery('#xly-address input').val(),
        //                     billing_address_2: '',
        //                     billing_city: jQuery('#xly-town input').val(),
        //                     billing_state: '',
        //                     billing_postcode: jQuery('#xly-postcode input').val(),
        //                     save_address: 'Save Address',
        //                     '_wpnonce': htmlFiltered,
        //                     '_wp_http_referer': '/my-account/edit-address/billing/',
        //                     action: 'edit_address'
        //                 },
        //                 success: function(output) {
        //                     //xlyCloseForm();
        //                 }
        //             });
        //         }
        //     });
        // }

        // function xlyCloseForm() {
        //   jQuery("#xly").css({'display':'none'})
        // }

        function xlySendMigrationSuccess() {}

        function xlySendMigrationFailure() {}

    });
});
