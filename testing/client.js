var xlyr = xlyr || {
        milliseconds: new Date().getTime(),

        initialise: function (uuid, registerFunction) {
            console.log("working " + uuid);

            var content = document.getElementById("xly");
            if (content) {
                document.body.insertBefore(content, document.body.firstChild);
            }

            this.uuid = uuid;
            this.registerFunction = registerFunction;
            this.form = jQuery("#xly-submit-form");
            this.error = jQuery('#xly-globalError');
            this.firstNameField = jQuery('#xly-firstName').find('input');
            this.lastNameField = jQuery('#xly-lastName').find('input');
            this.emailField = jQuery('#xly-email').find('input');
            this.phoneField = jQuery('#xly-phone').find('input');
            this.postcodeField = jQuery('#xly-postcode').find('input');
            this.addressField = jQuery('#xly-address').find('input');
            this.townField = jQuery('#xly-town').find('input');
            this.dobField = jQuery('#xly-dob').find('input')

            this.initialiseAddressLookup();
            this.autofill();
            this.form.submit(this.register)
        },

        initialiseAddressLookup: function() {
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
            jQuery('#xly-addressLookup').click(function() { cp_obj.doLookup(); });
        },

        register: function (event) {
            event.preventDefault();
            xlyr.xlyValidateAndChecked();
        },


        xlyValidateAndChecked: function () {
            if (xlyr.xlyFormValidate() && xlyr.xlyCheckTerms()) {
                xlyr.registerFunction({
                    campaignCustomerUuid: xlyr.uuid,
                    firstName: xlyr.firstNameField.val(),
                    lastName: xlyr.lastNameField.val(),
                    email: xlyr.emailField.val(),
                    phone: xlyr.phoneField.val(),
                    country: 'GBR',
                    address1: xlyr.addressField.val(),
                    //address2: '',
                    city: xlyr.townField.val(),
                    zip: xlyr.postcodeField.val(),
                    dob: xlyr.dobField.val()
                });
            }
        },

        xlyFormValidate: function () {
            var isValid = true;
            jQuery(".field-element[type='text']").each(function () {
                var field = jQuery(this);
                if (field.val() === '') {
                    isValid = false;
                    field.css({'border': '1px solid red'});
                } else {
                    field.css({'border': 'none'});
                }
            });

            if (isValid) {
                this.error.css({'display': 'none'});
                isValid = this.xlyValidateEmailField();
            } else {
                this.error.text('Please ensure all fields are filled');
                this.error.css({'display': 'block', 'margin-bottom': '5px', 'border-radius': '5px'});
            }

            return isValid;
        },

        xlyValidateEmailField: function () {
            var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            if (!re.test(this.emailField.val())) {
                this.error.css({'display': 'block', 'margin-bottom': '5px', 'border-radius': '5px'});
                this.error.text('Not a valid email address');
                this.emailField.css({'border': '1px solid red'});
                return false;
            }
            return true;
        },

        xlyCheckTerms: function xlyCheckTerms() {
            var check = document.getElementById('subscribe');
            if (!check.checked) {
                alert('Please accept the terms and conditions for this competition');
            }
            return check.checked;
        },

        autofill: function () {
            var milliseconds = new Date().getTime();
            this.firstNameField.val('Jake');
            this.lastNameField.val('Smith');
            //this.emailField.val('Jake' + milliseconds + '@email.com');
            this.phoneField.val('07920599089');
            this.postcodeField.val('Cf64 1AZ');
            this.addressField.val('11 Church Avenue');
            this.townField.val('Penarth');
        }
    };
