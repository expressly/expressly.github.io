var xlyrlwcr = xlyrlwcr || {
        milliseconds: new Date().getTime(),

        register: function(data) {
            xlyrlwcr.baseFolder = '';
            xlyrlwcr.xlyGetNonceAndRegister(data);
        },

        xlyGetNonceAndRegister: function(cdata) {
            //Call to get state of newsletter checkbox

            //First AJAX gets the current wpNonce for registration and sorted
            jQuery.ajax({
                type: "GET",
                url:  xlyrlwcr.baseFolder +"/my-account/",
                success: function(data) {
                    var wpnonce = jQuery(data).find('#woocommerce-register-nonce').val();
                    //Second AJAX posts form data into registration fields
                    jQuery.ajax({
                        type: "POST",
                        url:  xlyrlwcr.baseFolder + "/my-account/",
                        data: {
                            email: cdata.email,
                            password: xlyrlwcr.generatePassword(),
                            '_mc4wp_subscribe_wp-registration-form': cdata.optout ? 0 : 1,
                            'woocommerce-register-nonce': wpnonce,
                            register: "Register"
                        },
                        success: function(output) {
                            if (xlyrlwcr.xlyRegistrationSuccessful(output)) {
                                xlyrlwcr.xlyAddBillingDetails(cdata);
                            }
                        }
                    });
                }
            });
        },

        //First GET function pulls the required nonce code to allow for editing of account details
        //If GET is sucessful it inputs form data into relavent fields
        //Then proceeds to close the form and redirect user to URL
        xlyAddBillingDetails: function(cdata) {
            jQuery.ajax({
                type: "GET",
                url:  xlyrlwcr.baseFolder + "/my-account/edit-address/billing/",
                success: function(data) {
                    var htmlFiltered = jQuery(data).find('#_wpnonce').val();
                    jQuery.ajax({
                        type: "POST",
                        url:  xlyrlwcr.baseFolder + "/my-account/edit-address/billing/",
                        data: {
                            billing_first_name: cdata.firstName,
                            billing_last_name: cdata.lastName,
                            billing_company: '',
                            billing_email: cdata.email,
                            billing_phone: cdata.phone,
                            billing_country: 'GB',
                            billing_address_1: cdata.address1,
                            billing_address_2: '',
                            billing_city: cdata.city,
                            billing_state: '',
                            billing_postcode: cdata.zip,
                            save_address: 'Save Address',
                            '_wpnonce': htmlFiltered,
                            '_wp_http_referer': '/my-account/edit-address/billing/',
                            action: 'edit_address'
                        },
                        success: function() {
                            xlyrlwcr.xlyAddShippingDetails(cdata);
                        },
                        error: function() {
                            console.log('error with billing address');
                            xlyrlwcr.xlySendMigrationSuccess(cdata.campaignCustomerUuid); // send the success because registration has been successful
                        }
                    });
                }
            });
        },

        xlyAddShippingDetails: function(cdata) {
            jQuery.ajax({
                type: "GET",
                url:  xlyrlwcr.baseFolder + "/my-account/edit-address/shipping/",
                success: function(data) {
                    var htmlFiltered = jQuery(data).find('#_wpnonce').val();
                    jQuery.ajax({
                        type: "POST",
                        url:  xlyrlwcr.baseFolder + "/my-account/edit-address/shipping/",
                        data: {
                            shipping_first_name: cdata.firstName,
                            shipping_last_name:cdata.lastName,
                            shipping_company: '',
                            shipping_email: cdata.email,
                            shipping_phone: cdata.phone,
                            shipping_country: 'GB',
                            shipping_address_1: cdata.address1,
                            shipping_address_2: '',
                            shipping_city: cdata.city,
                            shipping_state: '',
                            shipping_postcode: cdata.zip,
                            save_address: 'Save Address',
                            '_wpnonce': htmlFiltered,
                            '_wp_http_referer': '/my-account/edit-address/shipping/',
                            action: 'edit_address'
                        },
                        success: function() {
                            xlyrlwcr.xlyAddAccountDetails(cdata);
                        },
                        error: function() {
                            console.log('error with shipping address');
                            xlyrlwcr.xlySendMigrationSuccess(cdata.campaignCustomerUuid); // send the success because registration has been successful
                        }
                    });
                }
            });
        },

        xlyAddAccountDetails: function(cdata) {
            jQuery.ajax({
                type: "GET",
                url:  xlyrlwcr.baseFolder + "/my-account/edit-account/",
                success: function(data) {
                    var htmlFiltered = jQuery(data).find('#_wpnonce').val();
                    jQuery.ajax({
                        type: "POST",
                        url:  xlyrlwcr.baseFolder + "/my-account/edit-account/",
                        data: {
                            account_first_name: cdata.firstName,
                            account_last_name: cdata.lastName,
                            account_email: cdata.email,
                            '_wpnonce': htmlFiltered,
                            '_wp_http_referer': '/my-account/edit-account/',
                            save_account_details: 'Save changes',
                            action: 'save_account_details'
                        },
                        success: function() {
                            xlyrlwcr.xlySendMigrationSuccess(cdata.campaignCustomerUuid);
                        },
                        error: function() {
                            console.log('error with acount details');
                            xlyrlwcr.xlySendMigrationSuccess(cdata.campaignCustomerUuid); // send the success because registration has been successful
                        }
                    });
                }
            });
        },

        //Detect if the form submission failed because the e-mail address already exists. It should display and appropriate error message telling the user that they are already registered and then redirect the user to the login page on the advertiser site
        xlyRegistrationSuccessful: function(output) {
            var emailCheck = jQuery(output).find('.woocommerce-error li').text();
            if (emailCheck !== 'Error: An account is already registered with your email address. Please login.') {
                return true;
            } else {
                alert('You already have an account with this email address, redirecting you to login page');
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

        xlySendMigrationSuccess: function(uuid) {
            window.location.replace('https://prod.expresslyapp.com/api/redirect/migration/' + uuid + '/success');
        }
};
