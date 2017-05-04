var xlyr = xlyr || {
        milliseconds: new Date().getTime(),

        initialise: function (uuid, registerFunction) {
            console.log("working " + uuid);

            var content = document.getElementById("xly");
            if (content) {
                document.body.insertBefore(content, document.body.firstChild);
            }

            //Old jQuery functions commented out
            // this.form = jQuery("#xly-submit-form");
            // this.error = jQuery('#xly-globalError');
            // this.firstNameField = jQuery('#xly-firstName').find('input');
            // this.lastNameField = jQuery('#xly-lastName').find('input');
            // this.emailField = jQuery('#xly-email').find('input');
            // this.phoneField = jQuery('#xly-phone').find('input');
            // this.postcodeField = jQuery('#xly-postcode').find('input');
            // this.addressField = jQuery('#xly-address').find('input');
            // this.townField = jQuery('#xly-town').find('input');
            // this.dobField = jQuery('#xly-dob').find('input');
            // this.submitButton = jQuery('#submitButton');
            // this.subField = jQuery('#xly-subscribe-container').find('label');

            this.uuid = uuid;
            this.registerFunction = registerFunction;
            this.form = document.getElementById('xly-submit-form');
            this.error = document.getElementById('xly-globalError');
            this.firstNameField = document.getElementById('xly-firstName').getElementsByTagName('input');
            this.lastNameField = document.getElementById('xly-lastName').getElementsByTagName('input');
            this.emailField = document.getElementById('xly-email').getElementsByTagName('input');
            this.phoneField = document.getElementById('xly-phone').getElementsByTagName('input');
            this.postcodeField = document.getElementById('xly-postcode').getElementsByTagName('input');
            this.addressField = document.getElementById('xly-address').getElementsByTagName('input');
            this.townField = document.getElementById('xly-town').getElementsByTagName('input');
            this.dobField = document.getElementById('xly-dob').getElementsByTagName('input');
            this.submitButton = document.getElementById('submitButton');
            this.subField = document.getElementById('xly-subscribe-container').getElementsByTagName('label');
            this.newsletterCheck = document.getElementById('newsletter');

            this.initialiseAddressLookup();
            this.form.submit(this.register)
        },

        initialiseAddressLookup: function () {
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
            jQuery('#xly-addressLookup').click(function () {
                cp_obj.doLookup();
            });
        },

        register: function (event) {
            event.preventDefault();
            xlyr.xlyValidateAndChecked();
        },


        xlyValidateAndChecked: function () {
            if (xlyr.xlyFormValidate() && xlyr.xlyCheckTerms()) {
                xlyr.expresslyContinue();
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
                    dob: xlyr.dobField.val(),
                    optout: !xlyr.newsletterCheck.checked
                });
            }
        },

        xlyFormValidate: function () {
            var isValid = true;
            jQuery(".required").each(function () {
                var field = jQuery(this);
                if (field.val() === '') {
                    isValid = false;
                    field.attr('style', 'border: 1px solid red!important');
                    //field.css({'border': '1px solid red'});
                } else {
                    field.css({'border': 'none'});
                }
            });

            if (isValid) {
                this.error.css({'display': 'none'});
                isValid = this.xlyValidateEmailField();
                if (isValid) {
                    isValid = this.xlyValidatePostCode();
                }
            } else {
                this.error.text('Please ensure all fields are filled');
                this.error.css({'display': 'block', 'margin-bottom': '5px', 'border-radius': '5px'});
            }

            return isValid;
        },

        xlyValidatePostCode: function () {
            var rePostcode = /^([a-zA-Z]){1}([0-9][0-9]|[0-9]|[a-zA-Z][0-9][a-zA-Z]|[a-zA-Z][0-9][0-9]|[a-zA-Z][0-9]){1}([ ])([0-9][a-zA-z][a-zA-z]){1}$/;
            if (!rePostcode.test(this.postcodeField.val())) {
                this.error.css({'display': 'block', 'margin-bottom': '5px', 'border-radius': '5px'});
                this.error.text('Please enter a valid postcode');
                this.postcodeField.attr('style', 'border: 1px solid red!important');
                return false;
            }
            return true;
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
                this.error.css({'display': 'block', 'margin-bottom': '5px', 'border-radius': '5px'});
                this.error.text('Please accept the terms and conditions');
                this.subField.css({'color': 'red'});
            } else {
                this.subField.css({'color': '#B2B2B2'});
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
        },

        expresslyContinue: function(event) {
            submitButton.style.display = "none";
            var closeButton = jQuery('.xly-decline')[0];
            jQuery(closeButton).css({'display': 'none'});
            var loader = jQuery('.xly-loader');
            jQuery(loader).css({'display': 'inline-block'});
            var xlyLoader = jQuery('.xly-loader')[0];
            jQuery(xlyLoader).css({'display': 'inline-block', 'float': 'right', 'margin-left': '47px', 'padding-top': '8px'});
        },

        ready: function (callback) {
            var ready = false;

            var detach = function () {
                if (document.addEventListener) {
                    document.removeEventListener("DOMContentLoaded", completed);
                    window.removeEventListener("load", completed);
                } else {
                    document.detachEvent("onreadystatechange", completed);
                    window.detachEvent("onload", completed);
                }
            };

            var completed = function () {
                if (!ready && (document.addEventListener || event.type === "load" || document.readyState === "complete")) {
                    ready = true;
                    detach();
                    callback();
                }
            };

            if (document.readyState === "complete") {
                callback();
            } else if (document.addEventListener) {
                document.addEventListener("DOMContentLoaded", completed);
                window.addEventListener("load", completed);
            } else {
                document.attachEvent("onreadystatechange", completed);
                window.attachEvent("onload", completed);

                var top = false;

                try {
                    top = window.frameElement === null && document.documentElement;
                } catch (e) {
                }

                if (top && top.doScroll) {
                    (function scrollCheck() {
                        if (ready) return;

                        try {
                            top.doScroll("left");
                        } catch (e) {
                            return setTimeout(scrollCheck, 50);
                        }

                        ready = true;
                        detach();
                        callback();
                    })();
                }
            }
        }
    };

console.log("xlyr created");
xlyr.ready(function () {
    xlyr.initialise(xlyrData.uuid, xlyrData.registerFunction);
});