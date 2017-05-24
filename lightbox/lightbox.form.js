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
            this.genderField = jQuery('#xly-gender');
            this.dobField = jQuery('#xly-dob');
            this.submitButton = jQuery('#xly-submitButton');
            this.subField = jQuery('#xly-subscribe-container').find('label');
            this.newsletterCheck = document.getElementById('xly-newsletter');

        //     this.initialiseAddressLookup();
            //this.autofill();
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
            var dob = this.dobField.val();
            var payloadDob = xlyr.xlyFormattedDate(dob);

            if (xlyr.xlyFormValidate() && xlyr.xlyCheckTerms() && xlyr.xlyValidateAge()) {
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
                    // dob: xlyr.dobField.val(),
                    dob: payloadDob,
                    gender: xlyr.genderField.val(),
                    optout: xlyr.newsletterCheck && !xlyr.newsletterCheck.checked
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
                if (isValid) {
                    isValid = this.xlyValidateAge();
                }
            } else {
                this.error.text('Please fill all fields');
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

        xlyGetAge: function(dateString) {
          var today = new Date();
          var birthDate = new Date(dateString);
          var age = today.getFullYear() - birthDate.getFullYear();
          var m = today.getMonth() - birthDate.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
          return age;
        },

        xlyFormattedDate: function(dob) {
          var formattedDob = dob.replace(/(\d{2})(\d{2})(\d{4})/, "$1-$2-$3");
          var newDob = formattedDob.split("-").reverse().join("-");
          return newDob;
        },

        xlyValidateAge: function() {
          var dob = this.dobField.val();
          var formattedDob = xlyr.xlyFormattedDate(dob);
          var age = xlyr.xlyGetAge(formattedDob);

          if (age < 18) {
            this.error.css({'display': 'block', 'margin-bottom': '5px', 'border-radius': '5px'});
            this.error.text('You must be over 18 to enter');
            this.dobField.css({'border': '1px solid red'});
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
            this.emailField.val('Jake' + milliseconds + '@email.com');
            this.phoneField.val('07920599089');
            this.postcodeField.val('Cf64 1AZ');
            this.addressField.val('11 Church Avenue');
            this.townField.val('Penarth');
            this.genderField.val('Male');
            this.dobField.val('24052001');
        },

        expresslyContinue: function(event) {
            xlyr.submitButton[0].style.display = "none";
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

xlyr.ready(function () {
    xlyr.initialise(xlyrData.uuid, xlyrData.registerFunction);
});
