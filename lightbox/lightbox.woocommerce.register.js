var xlyr = xlyr || {
  milliseconds: new Date().getTime(),


  initialise: function(uuid) {
    console.log("working locally" + uuid);

    var content = document.getElementById("xly");
    if (content) {
      document.body.insertBefore(content, document.body.firstChild);
    }

    this.uuid = uuid;
    this.form = jQuery('#xly-submit-form');
    this.error = jQuery('#xly-globalError');
    this.firstNameField = jQuery('#xly-firstName').find('input');
    this.lastNameField = jQuery('#xly-lastName').find('input');
    this.emailField = jQuery('#xly-email').find('input');
    this.phoneField = jQuery('#xly-phone').find('input');
    this.postcodeField = jQuery('#xly-postcode').find('input');
    this.addressField = jQuery('#xly-address').find('input');
    this.townField = jQuery('#xly-town').find('input');
    this.dateOfBirth = jQuery('#xly-dob').find('input');
    this.submitButton = jQuery('#submitButton');
    this.subField = jQuery('#xly-subscribe-container label');
    this.newsletterCheck = jQuery('#newsletter');

   this.initialiseAddressLookup();
    this.form.submit(this.register)

  },

  initialiseAddressLookup: function() {
    var cp_obj = CraftyPostcodeCreate();
    cp_obj.set("access_token", "f8aec-d8058-824ff-015f6"); // your token here
    cp_obj.set("result_elem_id", "crafty_postcode_result_display");
    cp_obj.set("form", "address");
    cp_obj.set("elem_company", "companyname");
    cp_obj.set("elem_street1", "address1");
    cp_obj.set("elem_street2", "address2");
    cp_obj.set("elem_street3", "address3");
    cp_obj.set("elem_town", "town");
    cp_obj.set("elem_postcode", "postcode");
    jQuery('#xly-addressLookup').click(function() {
      cp_obj.doLookup();
    });
  },

  register: function(event) {
    event.preventDefault();
    xlyr.xlyValidateAndChecked();
  },

  xlyValidateAndChecked: function() {
    if (xlyr.xlyFormValidate() && xlyr.xlyCheckTerms()) {
      xlyr.xlySubmitform();
    }
  },

  xlySubmitform: function() {
    this.xlyGetNonceAndRegister();
    xlyr.expresslyContinue();
  },

  xlyNewsletter: function() {
    console.log('checking newsletter');
    var newsletterCheck = document.getElementById('newsletter');
    if(newsletterCheck.checked) {
      console.log('checked');
      return 1;
    } else {
      console.log('not checked');
      return 0;
    }
    //return newsletterCheck.checked ? 1 : 0;
  },

  xlyGetNonceAndRegister: function() {
    //Call to get state of newsletter checkbox

    //First AJAX gets the current wpNonce for registration and sorted
    jQuery.ajax({
      type: "GET",
      url: "/my-account/",
      success: function(data) {
        var wpnonce = jQuery(data).find('#woocommerce-register-nonce').val();
        //Second AJAX posts form data into registration fields
        jQuery.ajax({
          type: "POST",
          url: "/my-account/",
          data: {
            email: xlyr.emailField.val(),
            password: xlyr.generatePassword(),
            '_mc4wp_subscribe_wp-registration-form': 0,
            '_mc4wp_subscribe_wp-registration-form': xlyr.xlyNewsletter(),
            'woocommerce-register-nonce': wpnonce,
            register: "Register"
          },
          success: function(output) {
            if (xlyr.xlyRegistrationSuccessful(output)) {
              xlyr.xlyAddBillingDetails();
            }
          }
        });
      }
    });
  },

  //First GET function pulls the required nonce code to allow for editing of account details
  //If GET is sucessful it inputs form data into relavent fields
  //Then proceeds to close the form and redirect user to URL
  xlyAddBillingDetails: function() {
    jQuery.ajax({
      type: "GET",
      url: "/my-account/edit-address/billing/",
      success: function(data) {
        var htmlFiltered = jQuery(data).find('#_wpnonce').val();
        jQuery.ajax({
          type: "POST",
          url: "/my-account/edit-address/billing/",
          data: {
            billing_first_name: xlyr.firstNameField.val(),
            billing_last_name: xlyr.lastNameField.val(),
            billing_company: '',
            billing_email: xlyr.emailField.val(),
            billing_phone: xlyr.phoneField.val(),
            billing_country: 'GB',
            billing_address_1: xlyr.addressField.val(),
            billing_address_2: '',
            billing_city: xlyr.townField.val(),
            billing_state: '',
            billing_postcode: xlyr.postcodeField.val(),
            save_address: 'Save Address',
            '_wpnonce': htmlFiltered,
            '_wp_http_referer': '/my-account/edit-address/billing/',
            action: 'edit_address'
          },
          success: function() {
            console.log('billing details added');
            xlyr.xlyAddShippingDetails();
          },
          error: function() {
            console.log('error with address');
            xlyr.xlySendMigrationSuccess(); // send the success because registration has been successful
          }
        });
      }
    });
  },

  xlyAddShippingDetails: function() {
    jQuery.ajax({
      type: "GET",
      url: "/my-account/edit-address/shipping/",
      success: function(data) {
        var htmlFiltered = jQuery(data).find('#_wpnonce').val();
        jQuery.ajax({
          type: "POST",
          url: "/my-account/edit-address/shipping/",
          data: {
            shipping_first_name: xlyr.firstNameField.val(),
            shipping_last_name: xlyr.lastNameField.val(),
            shipping_company: '',
            shipping_email: xlyr.emailField.val(),
            shipping_phone: xlyr.phoneField.val(),
            shipping_country: 'GB',
            shipping_address_1: xlyr.addressField.val(),
            shipping_address_2: '',
            shipping_city: xlyr.townField.val(),
            shipping_state: '',
            shipping_postcode: xlyr.postcodeField.val(),
            save_address: 'Save Address',
            '_wpnonce': htmlFiltered,
            '_wp_http_referer': '/my-account/edit-address/shipping/',
            action: 'edit_address'
          },
          success: function() {
            console.log('Shipping details added');
            xlyr.xlyAddAccountDetails();
          },
          error: function() {
            console.log('error with address');
            xlyr.xlySendMigrationSuccess(); // send the success because registration has been successful
          }
        });
      }
    });
  },

  xlyAddAccountDetails: function() {
    jQuery.ajax({
      type: "GET",
      url: "/my-account/edit-account/",
      success: function(data) {
        var htmlFiltered = jQuery(data).find('#_wpnonce').val();
        jQuery.ajax({
          type: "POST",
          url: "/my-account/edit-account/",
          data: {
            account_first_name: xlyr.firstNameField.val(),
            account_last_name: xlyr.lastNameField.val(),
            account_email: xlyr.emailField.val(),
            '_wpnonce': htmlFiltered,
            '_wp_http_referer': '/my-account/edit-account/',
            save_account_details: 'Save changes',
            action: 'save_account_details'
          },
          success: function() {
            console.log('Account details added');
            xlyr.xlySendMigrationSuccess();
          },
          error: function() {
            console.log('error with address');
            xlyr.xlySendMigrationSuccess(); // send the success because registration has been successful
          }
        });
      }
    });
  },

  //Detect if the form submission failed because the e-mail address already exists. It should display and appropriate error message telling the user that they are already registered and then redirect the user to the login page on the advertiser site
  xlyRegistrationSuccessful: function(output) {
    var emailCheck = jQuery(output).find('.woocommerce-error li').text();
    if (emailCheck !== 'Error: An account is already registered with your email address. Please login.') {
      console.log('email doesnt exist, registration went forward');
      return true;
    } else {
      alert('You already have an account with this email address, redirecting you to login page');
      console.log('Email exists and redirect to login page');
      window.location.replace('/my-account/');
      return false;
    }
  },

  //Generates password that will pass all requirements
  generatePassword: function(len) {
    var length = (len)
      ? (len)
      : (10);
    var string = "abcdefghijklmnopqrstuvwxyz"; //to upper
    var numeric = '0123456789';
    var punctuation = '!@#jQuery%^&*()_+~`|}{[]\:;?><,./-=';
    var password = "";
    var character = "";
    while (password.length < length) {
      var entity1 = Math.ceil(string.length * Math.random() * Math.random());
      var entity2 = Math.ceil(numeric.length * Math.random() * Math.random());
      var entity3 = Math.ceil(punctuation.length * Math.random() * Math.random());
      var hold = string.charAt(entity1);
      hold = (entity1 % 2 === 0)
        ? (hold.toUpperCase())
        : (hold);
      character += hold;
      character += numeric.charAt(entity2);
      character += punctuation.charAt(entity3);
      password = character;
    }
    return password;
  },

  xlyFormValidate: function() {
    var isValid = true;
    //xlyr.xlyValidateAge();
    jQuery(".required").each(function() {
      var field = jQuery(this);
      if (field.val() === '') {
        isValid = false;
        field.attr('style', 'border: 1px solid red!important');
      } else {
        field.css({'border': 'none'});
      }
    });

    if (isValid) {
      this.error.css({'display': 'none'});
      isValid = this.xlyValidateEmailField();
      isValid = this.xlyValidatePostCode();
      // isValid = this.xlyValidateAge();
    } else {
      this.error.text('Please ensure all fields are filled');
      this.error.css({'display': 'block', 'margin-bottom': '5px', 'border-radius': '5px'});
    }

    return isValid;
  },


  xlyValidatePostCode: function() {
    var rePostcode = /^([a-zA-Z]){1}([0-9][0-9]|[0-9]|[a-zA-Z][0-9][a-zA-Z]|[a-zA-Z][0-9][0-9]|[a-zA-Z][0-9]){1}([ ])([0-9][a-zA-z][a-zA-z]){1}$/;
    if (!rePostcode.test(this.postcodeField.val())) {
      this.error.css({'display': 'block', 'margin-bottom': '5px', 'border-radius': '5px'});
      this.error.text('Please enter a valid postcode');
      this.postcodeField.attr('style', 'border: 1px solid red!important');
      return false;
    }
    return true;
  },

  xlyValidateEmailField: function() {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (!re.test(this.emailField.val())) {
      this.error.css({'display': 'block', 'margin-bottom': '5px', 'border-radius': '5px'});
      this.error.text('Please enter a valid email address');
      this.emailField.attr('style', 'border: 1px solid red!important');
      return false;
    }
    return true;
  },

  xlyCheckTerms: function xlyCheckTerms() {
    var check = document.getElementById('subscribe');
    if (!check.checked) {
      this.error.css({'display': 'block', 'margin-bottom': '5px', 'border-radius': '5px'});
      this.error.text('Please accept the terms and conditions');
      this.subField.css({'color':'red'});
    } else {
      this.subField.css({'color':'#B2B2B2'});
    }
    return check.checked;
  },

  // Needed for test compeitition to subscribe users to our mailchimp

  xlySendMigrationSuccess: function() {
    console.log('Migration success');
    window.location.replace('https://prod.expresslyapp.com/api/redirect/migration/' + xlyr.uuid + '/success');
  },

  //Sends user to migration failure URL
  xlySendMigrationFailure: function() {
    alert('There has been an issue with this migration');
    window.location.replace('https://prod.expresslyapp.com/api/redirect/migration/' + xlyr.uuid + '/failed');
  },

  autofill: function() {
    var milliseconds = new Date().getTime();
    this.firstNameField.val('Jake');
    this.lastNameField.val('Smith');
    this.emailField.val('Jakesmith1922+' + milliseconds + '@googleemail.com');
    this.phoneField.val('07920599089');
    this.postcodeField.val('Cf64');
    this.addressField.val('11 Church Avenue');
    this.townField.val('Penarth');
  },

  expresslyContinue: function(event) {
    submitButton.style.display = "none";
    var closeButton = jQuery('.xly-decline')[0];
    jQuery(closeButton).css({'display': 'none'});
    var loader = jQuery('.xly-loader');
    jQuery(loader).css({'display': 'inline-block'});
    var xlyLoader = jQuery('.xly-loader')[0];
    jQuery(xlyLoader).css({'display': 'inline-block', 'float': 'right', 'margin-left': '47px', 'padding-top': '8px'});
  }
};

jQuery(document).ready(function() {
  xlyr.initialise(xlyrData.uuid);
});