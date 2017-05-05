var xlyr = xlyr || {
  milliseconds: new Date().getTime(),

  initialise: function(uuid, registerFunction) {
    console.log("working Local" + uuid);

    var content = document.getElementById("xly");
    if (content) {
      document.body.insertBefore(content, document.body.firstChild);
    }

    this.uuid = uuid;
    this.registerFunction = registerFunction;
    // Vanilla js
    this.form = document.getElementById('xly-submit-form');
    this.error = document.getElementById('xly-globalError');
    this.firstNameField = document.getElementById('xly-firstName').getElementsByTagName('input')[0];
    this.lastNameField = document.getElementById('xly-lastName').getElementsByTagName('input')[0];
    this.emailField = document.getElementById('xly-email').getElementsByTagName('input')[0];
    this.phoneField = document.getElementById('xly-phone').getElementsByTagName('input')[0];
    this.postcodeField = document.getElementById('xly-postcode').getElementsByTagName('input')[0];
    this.addressField = document.getElementById('xly-address').getElementsByTagName('input')[0];
    this.townField = document.getElementById('xly-town').getElementsByTagName('input')[0];
    // this.dobField = document.getElementById('xly-dob').getElementsByTagName('input')[0];
    this.submitButton = document.getElementById('submitButton');
    this.subField = document.getElementById('xly-subscribe-container').getElementsByTagName('label')[0];
    this.newsletterCheck = document.getElementById('newsletter');

    //Adding variable styles for error
    this.globalErrorStyle = 'display: block; margin-bottom: 5px; border-radius: 5px;';
    this.fieldErrorStyle = 'border: 1px solid red!important';
    this.hideErrorStyle = 'display: none;'

    this.initialiseAddressLookup();
    this.form.addEventListener('submit', event => {
      this.register(event);
    });
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
      xlyr.expresslyContinue();
      xlyr.registerFunction({
        campaignCustomerUuid: xlyr.uuid,
        firstName: xlyr.firstNameField.value,
        lastName: xlyr.lastNameField.value,
        email: xlyr.emailField.value,
        phone: xlyr.phoneField.value,
        country: 'GBR',
        address1: xlyr.addressField.value,
        //address2: '',
        city: xlyr.townField.value,
        zip: xlyr.postcodeField.value,
        // Commented out as DOB is in terms and conditions and not validated here
        // dob: xlyr.dobField.value,
        optout: !xlyr.newsletterCheck.checked
      });
    }
  },

  xlyFormValidate: function() {

    var isValid = true;
    var requiredDivs = document.querySelectorAll('.required');
    for (var i = 0; i < requiredDivs.length; i++) {
      if (requiredDivs[i].value === '') {
        requiredDivs[i].style.cssText = this.fieldErrorStyle;
        isValid = false;
      } else {
        requiredDivs[i].style.cssText = 'border: none;';
      }
    }

    if (isValid) {
      this.error.style.cssText = this.hideErrorStyle;
      isValid = this.xlyValidateEmailField();
      if (isValid) {
        isValid = this.xlyValidatePostCode();
      }
    } else {
      this.error.innerHTML = 'Please ensure all fields are filled';
      this.error.style.cssText = this.globalErrorStyle;
    }
    return isValid;
  },

  xlyValidatePostCode: function() {
    var rePostcode = /^([a-zA-Z]){1}([0-9][0-9]|[0-9]|[a-zA-Z][0-9][a-zA-Z]|[a-zA-Z][0-9][0-9]|[a-zA-Z][0-9]){1}([ ])([0-9][a-zA-z][a-zA-z]){1}$/;
    if (!rePostcode.test(this.postcodeField.value)) {
      this.error.style.cssText = this.globalErrorStyle;
      this.error.innerHTML = 'Please enter a valid postcode';
      this.postcodeField.style.cssText = this.fieldErrorStyle;
      return false;
    }
    return true;
  },

  xlyValidateEmailField: function() {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (!re.test(this.emailField.value)) {
      this.error.style.cssText = this.globalErrorStyle;
      this.error.innerHTML = 'Please enter a valid email address';
      this.emailField.style.cssText = this.fieldErrorStyle;
      return false;
    }
    return true;
  },

  xlyCheckTerms: function xlyCheckTerms() {
    var check = document.getElementById('subscribe');
    if (!check.checked) {
      this.error.style.cssText = this.globalErrorStyle;
      this.error.innerHTML = 'Please accept the terms and conditions';
      this.subField.style.color = 'red';
    } else {
      this.subField.style.color = '#B2B2B2';
    }
    return check.checked;
  },

  autofill: function() {
    var milliseconds = new Date().getTime();
    this.firstNameField.value = 'Jake';
    this.lastNameField.value = 'Smith';
    //     //this.emailField.val('Jake' + milliseconds + '@email.com');
    this.phoneField.value = '07920599089';
    this.postcodeField.value = 'Cf64 1AZ';
    this.addressField.value = '11 Church Avenue';
    this.townField.value = 'Penarth';
  },

  expresslyContinue: function(event) {
    submitButton.style.display = "none";
    var closeButton = jQuery('.xly-decline')[0];
    var closeButton = document.querySelectorAll('.xly-decline')[0];
    closeButton.style.cssText = this.hideErrorStyle;
    var loader = document.querySelectorAll('.xly-loader')[0];
    loader.style.cssText = 'display:inline-block; float:right; margin-left:47px; padding-top:8px;';
  },

  ready: function(callback) {
    var ready = false;

    var detach = function() {
      if (document.addEventListener) {
        document.removeEventListener("DOMContentLoaded", completed);
        window.removeEventListener("load", completed);
      } else {
        document.detachEvent("onreadystatechange", completed);
        window.detachEvent("onload", completed);
      }
    };

    var completed = function() {
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
      } catch (e) {}

      if (top && top.doScroll) {
        (function scrollCheck() {
          if (ready)
            return;

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
xlyr.ready(function() {
  xlyr.initialise(xlyrData.uuid, xlyrData.registerFunction);
});
