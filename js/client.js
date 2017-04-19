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

//Autofill
jQuery(document).ready(function() {
  var milliseconds = new Date().getTime();
  jQuery('#xly-firstName input').val('Jake');
  jQuery('#xly-lastName input').val('Smith');
  jQuery('#xly-email input').val('Jake' + milliseconds + '@email.com');
  jQuery('#xly-phone input').val('07920599089');
  jQuery('#xly-postcode input').val('Cf64 1AZ');
  jQuery('#xly-address input').val('11 Church Avenue');
  jQuery('#xly-town input').val('Penarth');
});

jQuery(function() {

  console.log("working");
  var form = jQuery("#xly-submit-form");
  var htmlFiltered = "";

  form.submit(function(event) {
    event.preventDefault();
    xlyValidateAndChecked();
    //xlyValidateSpecialFields();
    function xlySubmitform() {
      xlyGetNonceAndRegister();
    }

    function xlyGetNonceAndRegister() {
      //Grabs the generated password from function
      var xlyPassword = password_generator();
      //First AJAX gets the current wpNonce for registration and soted
      jQuery.ajax({
        type: "GET",
        url: "/my-account/",
        success: function(data) {
          html = data;
          var wpnonce = jQuery(data).find('#woocommerce-register-nonce').val();
          //Second AJAX posts form data into registration fields
          jQuery.ajax({
            type: "POST",
            url: "/my-account/",
            data: {
              email: jQuery('#xly-email input').val(),
              password: xlyPassword,
              'woocommerce-register-nonce': wpnonce,
              register: "Register"
            },
            success: function(output) {
              if (xlyRegistrationSuccessful(output)) {
                xlyAddBillingDetails();
              }
            }
          });
        }
      });
    }

    //First GET function pulls the required nonce code to allow for editing of account details
    //If GET is sucessful it inputs form data into relavent fields
    //Then proceeds to close the form and redirect user to URL
    function xlyAddBillingDetails() {
      jQuery.ajax({
        type: "GET",
        url: "/my-account/edit-address/billing/",
        success: function(data) {
          html = data;
          var htmlFiltered = jQuery(data).find('#_wpnonce').val();
          jQuery.ajax({
            type: "POST",
            url: "/my-account/edit-address/billing/",
            data: {
              billing_first_name: jQuery('#xly-firstName input').val(),
              billing_last_name: jQuery('#xly-lastName input').val(),
              billing_company: '',
              billing_email: jQuery('#xly-email input').val(),
              billing_phone: jQuery('#xly-phone input').val(),
              billing_country: 'GB',
              billing_address_1: jQuery('#xly-address input').val(),
              billing_address_2: '',
              billing_city: jQuery('#xly-town input').val(),
              billing_state: '',
              billing_postcode: jQuery('#xly-postcode input').val(),
              save_address: 'Save Address',
              '_wpnonce': htmlFiltered,
              '_wp_http_referer': '/my-account/edit-address/billing/',
              action: 'edit_address'
            },
            success: function(output) {
              console.log('form would close');
              xlySendMigrationSuccess();
            },
            error: function(output) {
              console.log('Error');
              xlySendMigrationFailure();
            }
          });
        }
      });
    }

    //Detect if the form submission failed because the e-mail address already exists. It should display and appropriate error message telling the user that they are already registered and then redirect the user to the login page on the advertiser site

    function xlyRegistrationSuccessful(output) {
      var emailCheck = jQuery(output).find('.woocommerce-error li').text();

      if (emailCheck !== 'Error: An account is already registered with your email address. Please login.') {
        console.log('email doesnt exist, registration went forward');
        //This will fire through the billing details migraiton
        return true;
      } else {
        alert('You already have an account with {takerName} redirecting you to login page');
        console.log('Email exists and redirect to login page');
        //Insert Redirect
      }
    }

    // Looks for if the value of an input is null and flags global error
    function xlyFormValidate() {
      var isValid = true;
      jQuery(".field-element[type='text']").each(function() {
        if (jQuery(this).val() == '') {
          isValid = false;
          jQuery('#xly-globalError').css({'display': 'block', 'margin-bottom': '5px', 'border-radius': '5px'});
          jQuery(this).css({'border': '1px solid red'});
          jQuery('#xly-globalError').text('Please ensure all fields are filled');
        } else {
          jQuery(this).css({'border': 'none'});
          jQuery('#xly-globalError').css({'display': 'none'});
          xlyValidateEmailField();
        }
      });
      return isValid;

      // Function to check if email address is correct format
      function xlyValidateEmailField() {
        var x = jQuery('#xly-email input').val();
        var atpos = x.indexOf("@");
        var dotpos = x.lastIndexOf(".");
        if (atpos < 1 || dotpos < atpos + 2 || dotpos + 2 >= x.length) {
          jQuery('#xly-globalError').css({'display': 'block', 'margin-bottom': '5px', 'border-radius': '5px'});
          jQuery('#xly-email input').css({'border': '1px solid red'});
          jQuery('#xly-globalError').text('Not a valid email address');
          return false;
        }
      }
    }

    // Check if T&C's are checked
    function xlyCheckTerms() {
      var check = document.getElementById('subscribe');
      if (check.checked) {
        return true;
      } else {
        alert('Please accept the terms and conditions for this competition');
      }
    }

    function xlyValidateAndChecked() {
      if (xlyFormValidate() && xlyCheckTerms()) {
        xlySubmitform();
      }
    }

    //Sends user to migration success URL
    function xlySendMigrationSuccess() {
      console.log('Migration success');
      // TODO ADD BEFORE PUSH window.location.replace('https://prod.expresslyapp.com/api/redirect/migration/{uuid}/success');
    }

    //Sends user to migration failure URL
    function xlySendMigrationFailure() {
      alert('There has been an issue with this migration')
      // TODO ADD BEFORE PUSH window.location.replace('https://prod.expresslyapp.com/api/redirect/migration/{uuid}/failed');
    }

    //Generates password that will pass all reqirements
    function password_generator(len) {
      var length = (len)
        ? (len)
        : (10);
      var string = "abcdefghijklmnopqrstuvwxyz"; //to upper
      var numeric = '0123456789';
      var punctuation = '!@#jQuery%^&*()_+~`|}{[]\:;?><,./-=';
      var password = "";
      var character = "";
      var crunch = true;
      while (password.length < length) {
        entity1 = Math.ceil(string.length * Math.random() * Math.random());
        entity2 = Math.ceil(numeric.length * Math.random() * Math.random());
        entity3 = Math.ceil(punctuation.length * Math.random() * Math.random());
        hold = string.charAt(entity1);
        hold = (entity1 % 2 == 0)
          ? (hold.toUpperCase())
          : (hold);
        character += hold;
        character += numeric.charAt(entity2);
        character += punctuation.charAt(entity3);
        password = character;
      }
      return password;
    }

  });
});
