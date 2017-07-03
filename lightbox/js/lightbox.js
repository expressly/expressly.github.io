
function XlyLightbox(config) {
    var that = this;
    this.config = config;
    this.lightbox = document.getElementById("xly");

    if (this.lightbox && this.lightbox !== document.body.firstChild) {
        document.body.insertBefore(this.lightbox, document.body.firstChild);
    }

    var migrateButton = document.getElementById("xly-accept-link");
    if (migrateButton) {
        migrateButton.addEventListener('click', function() {
            that.submit();
            return false;
        });
    }

    if (this.config.lightbox === 'form') {
        var initAddressLookup = function() {
            if('undefined' === typeof CraftyPostcodeCreate) {
                setTimeout(initAddressLookup, 60);
                return;
            }

            var cp_obj = CraftyPostcodeCreate();
            cp_obj.set("access_token", "f8aec-d8058-824ff-015f6");
            cp_obj.set("result_elem_id", "crafty_postcode_result_display");
            cp_obj.set("form", "address");
            cp_obj.set("elem_company", "companyname");
            cp_obj.set("elem_street1", "address1");
            cp_obj.set("elem_street2", "address2");
            cp_obj.set("elem_street3", "address3");
            cp_obj.set("elem_town", "town");
            cp_obj.set("elem_postcode", "postcode");
            document.getElementById('xly-addressLookup').addEventListener('click', function () {
                cp_obj.doLookup();
            });
        };

        initAddressLookup();
    }
}

XlyLightbox.prototype.submit = function() {
    this.busy(true);
    if (this.config.lightbox === 'form') {
        if (this.validate()) {
            this.pushAndMigrate();
        }
        this.busy(false);
    } else {
        this.migrate();
    }
};

XlyLightbox.prototype.migrate = function() {
    if (this.config.registration === 'js') {
        this.migrateJs();
    } else {
        this.migrateApi();
    }
};

XlyLightbox.prototype.migrateApi = function() {
    var url = this.config.migrationInitiateUrl;
    if (this.hasOptedOutOfNewsletter()) {
        url += '?optout=true';
    }
    window.location.replace(url);
};

XlyLightbox.prototype.migrateJs = function() {
    var that = this;
    this.pull(function(data) {
        var context = that.buildContext(data);
        var steps = that.config.registrationSteps;

        var executeStep = function(step, context, remainingSteps) {

            var xhr = that.xhr(function(xhr) {
                if (step.existsCheck && that.checkContent(step.existsCheck, xhr.responseText)) {
                    var loginUrlParam = typeof that.config.loginUrl !== 'undefined' && that.config.loginUrl
                        ? '?loginUrl=' + encodeURIComponent(that.config.loginUrl)
                        : '';
                    window.location.replace('https://prod.expresslyapp.com/api/redirect/migration/' + that.config.uuid + '/exists' + loginUrlParam);
                    return;
                }

                if (step.failedCheck && that.checkContent(step.failedCheck, xhr.responseText)) {
                    window.location.replace('https://prod.expresslyapp.com/api/redirect/migration/' + that.config.uuid + '/failed');
                    return;
                }

                if (step.successCheck && !that.checkContent(step.successCheck, xhr.responseText)) {
                    window.location.replace('https://prod.expresslyapp.com/api/redirect/migration/' + that.config.uuid + '/failed');
                    return;
                }

                if (step.store) {
                    that.storeToContext(step.store, xhr.responseText, context);
                }

                if (remainingSteps.length > 0) {
                    executeStep(remainingSteps.shift(), context, remainingSteps);
                } else {
                    window.location.replace('https://prod.expresslyapp.com/api/redirect/migration/' + that.config.uuid + '/success');
                }
            });

            xhr.open(step.method, step.url, true);
            xhr.withCredentials = true;
            if (step.data) {
                xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
            }
            xhr.send(that.getStepData(step.data, context));
        };

        executeStep(steps.shift(), context, steps);
    });
};

XlyLightbox.prototype.checkContent = function(check, content) {
    if (check.contains) {
        return content.indexOf(check.contains) >= 0;
    }
    return false;
};

XlyLightbox.prototype.getStepData = function(data, context) {
    if (!data) {
        return '';
    }

    var params = [];
    for (var i = 0; i < data.length; ++i) {
        var value = '';
        if (data[i].type === 'literal') {
            value = data[i].value;
        } else if (data[i].type === 'context') {
            value = context[data[i].key];
        } else if (data[i].type === 'function') {
            value = data[i].fn(context);
        }


        if (value === null || typeof value === 'undefined') {
            value = '';
        }

        params.push(encodeURIComponent(data[i].name) + '=' + encodeURIComponent(value));
    }

    return params.join("&");
};

XlyLightbox.prototype.storeToContext = function(store, content, context)  {
    var regex = /<input [^>]+>/mig;
    var inputsString = '';
    var m;
    do {
        m = regex.exec(content);
        if (m) {
            inputsString += m[0] + '\n';
        }
    } while (m);

    var div = document.createElement('div');
    div.innerHTML = inputsString;

    var inputs = {};
    for (var i = 0; i < div.children.length; ++i) {
        var name = div.children[i].name;
        if (!name) {
            continue;
        }

        if (!inputs[name]) {
            inputs[name] = [];
        }

        inputs[name].push(div.children[i]);
    }

    for (i = 0; i < store.length; ++i) {
        var inputArray = inputs[store[i].name];
        if (inputArray && inputArray.length > 0) {
            var index = store.index ? store.index : 0;
            context[store[i].key] = inputArray[index].value;
        }
    }
};

XlyLightbox.prototype.buildContext = function(data) {
    var cd = data.migration.data.customerData;
    var billingAddress = typeof cd.billingAddress !== 'undefined' ? cd.addresses[cd.billingAddress] : null;
    var shippingAddress = typeof cd.shippingAddress !== 'undefined' ? cd.addresses[cd.shippingAddress] : billingAddress;
    if (!billingAddress) {
        billingAddress = shippingAddress;
    }
    var phone = cd.phones && cd.phones.length > 0
        ? cd.phones[billingAddress && typeof billingAddress.phone !== 'undefined' ? billingAddress.phone : 0].number
        : null;

    var context = {
        uuid: this.config.uuid,
        email: data.migration.data.email,
        phone: phone,
        password: this.generatePassword(12),
        firstName: cd.firstName,
        lastName: cd.lastName,
        company: cd.company,
        dob: cd.dob,
        taxNumber: cd.taxNumber,
        gender: cd.gender,
        optout: this.hasOptedOutOfNewsletter()
    };

    if (billingAddress) {
        context.billingFirstName = billingAddress.firstName ?  billingAddress.firstName : cd.firstName;
        context.billingLastName = billingAddress.lastName ?  billingAddress.lastName : cd.lastName;
        context.billingCompany = billingAddress.companyName ?  billingAddress.companyName : cd.company;
        context.billingPhone = typeof billingAddress.phone !== 'undefined' ?  cd.phones[billingAddress.phone].number: phone;
        context.billingAddress1 = billingAddress.address1;
        context.billingAddress2 = billingAddress.address2;
        context.billingCity = billingAddress.city;
        context.billingPostcode = billingAddress.zip;
        context.billingProvince = billingAddress.stateProvince;
        context.billingCountry = billingAddress.country;
    }

    if (shippingAddress) {
        context.shippingFirstName = shippingAddress.firstName ?  shippingAddress.firstName : cd.firstName;
        context.shippingLastName = shippingAddress.lastName ?  shippingAddress.lastName : cd.lastName;
        context.shippingCompany = shippingAddress.companyName ?  shippingAddress.companyName : cd.company;
        context.shippingPhone = typeof shippingAddress.phone !== 'undefined' ?  cd.phones[shippingAddress.phone].number: phone;
        context.shippingAddress1 = shippingAddress.address1;
        context.shippingAddress2 = shippingAddress.address2;
        context.shippingCity = shippingAddress.city;
        context.shippingPostcode = shippingAddress.zip;
        context.shippingProvince = shippingAddress.stateProvince;
        context.shippingCountry = shippingAddress.country;
    }

    return context;
};

XlyLightbox.prototype.pull = function(callback) {
    var xhr = this.xhr(function(xhr) {
        callback(JSON.parse(xhr.responseText));
    });

    xhr.open('GET', "https://prod.expresslyapp.com/api/v2/migration/" + this.config.uuid + "/user/ajax", true);
    xhr.withCredentials = true;
    xhr.send('');
};


XlyLightbox.prototype.pushAndMigrate = function() {
    var that = this;
    var fields = this.getFormFields();
    var data = {
        campaignCustomerUuid: this.config.uuid,
        firstName: fields.firstName.value,
        lastName: fields.lastName.value,
        email: fields.email.value,
        phone: fields.phone.value,
        country: 'GBR',
        address1: fields.address1.value,
        address2: fields.address2 ? fields.address2.value : null,
        city: fields.town.value,
        zip: fields.postcode.value,
        province: fields.province ? fields.province.value : null,
        dob: this.formatDateString(fields.dob.value),
        gender: fields.gender.value,
        optout: this.hasOptedOutOfNewsletter()
    };

    var xhr = this.xhr(function(response) {
        var json = JSON.parse(response.responseText);
        if (json.error) {
            console.log("xly:" + json.error);
            window.location.replace(json.redirectUrl + "?e=" + encodeURIComponent(json.error));
        } else {
            that.config.migrationInitiateUrl = json.redirectUrl;
            that.migrate();
        }
    });

    xhr.open('POST', "https://prod.expresslyapp.com/api/customer/push", true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.withCredentials = true;
    xhr.send(JSON.stringify(data));
};

XlyLightbox.prototype.validate = function() {
    this.setGlobalError(null);
    var that = this;
    var isValid = true;
    var fieldMap = this.getFormFields();
    var fields = this.getObjectValues(fieldMap);

    this.apply(fields, function(field) {
        var fieldValid = !field.classList.contains('xly-required') || that.value(field) !== '';
        isValid = isValid && fieldValid;
        that.toggleClass(field, 'xly-field-error', !fieldValid);
    });

    if (!isValid) {
        this.setGlobalError('Please fill all fields');
        return false;
    }

    if (!this.validateRegex(fieldMap['email'], /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)) {
        this.setGlobalError('Not a valid email address');
        return false;
    }

    if (!this.validateRegex(fieldMap['postcode'], /^((?:(?:gir)|(?:[a-pr-uwyz])(?:(?:[0-9](?:[a-hjkpstuw]|[0-9])?)|(?:[a-hk-y][0-9](?:[0-9]|[abehmnprv-y])?)))) ?([0-9][abd-hjlnp-uw-z]{2})$/i)) {
        this.setGlobalError('Please enter a valid postcode');
        return false;
    }

    if (!this.validateRegex(fieldMap['dob'], /^(?:(?:31(\/|-|\.)(?:0?[13578]|1[02]))\1|(?:(?:29|30)(\/|-|\.)(?:0?[1,3-9]|1[0-2])\2))(?:(?:1[6-9]|[2-9]\d)?\d{2})$|^(?:29(\/|-|\.)0?2\3(?:(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00))))$|^(?:0?[1-9]|1\d|2[0-8])(\/|-|\.)(?:(?:0?[1-9])|(?:1[0-2]))\4(?:(?:1[6-9]|[2-9]\d)?\d{2})$/)) {
        this.setGlobalError('Please insert date as dd/mm/yyyy');
        return false;
    }

    var dobDate = new Date(this.formatDateString(fieldMap['dob'].value));
    if (isNaN(dobDate) || dobDate.getFullYear() < 1900) {
        this.setGlobalError('Please insert date as dd/mm/yyyy');
        return false;
    }

    var age = this.getYearsSince(dobDate);
    if (age < 18) {
        this.setGlobalError('You must be over 18 to enter');
        return false;
    }

    if (!fieldMap['terms'].checked) {
        this.setGlobalError('Please accept the terms and conditions');
        this.toggleClass(fieldMap['terms'], 'xly-field-error', true);
        return false;
    }

    return true;
};

XlyLightbox.prototype.validateRegex = function(field, regex) {
    var result = regex.test(field.value);
    this.toggleClass(field, 'xly-field-error', !result);
    return result;
};

XlyLightbox.prototype.formatDateString = function(value) {
    return value.replace(/(\d{2})\/(\d{2})\/(\d{4})/, "$3-$2-$1");
};

XlyLightbox.prototype.getYearsSince = function(date) {
    var today = new Date();
    var age = today.getFullYear() - date.getFullYear();
    var m = today.getMonth() - date.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < date.getDate())) {
        age--;
    }
    return age;
};

XlyLightbox.prototype.setGlobalError = function(message) {
    var error = document.getElementById('xly-globalError');
    error.innerText = message ? message : '';
    error.style.display = message ? 'block' : 'none';
};

XlyLightbox.prototype.getObjectValues = function(object) {
    var a = [];
    for (var property in object) {
        if (object.hasOwnProperty(property)) {
            if (object[property] !== 'undefined' && object[property] !== null) {
                a.push(object[property])
            }
        }
    }
    return a;
};

XlyLightbox.prototype.getFormFields = function() {
    return {
        'firstName': document.getElementById('xly-firstName-field'),
        'lastName': document.getElementById('xly-lastName-field'),
        'email': document.getElementById('xly-email-field'),
        'phone': document.getElementById('xly-phone-field'),
        'postcode': document.getElementById('xly-postcode-field'),
        'address1': document.getElementById('xly-address1-field'),
        'address2': document.getElementById('xly-address2-field'),
        'town': document.getElementById('xly-town-field'),
        'province': document.getElementById('xly-province-field'),
        'gender': document.getElementById('xly-gender'),
        'dob': document.getElementById('xly-dob'),
        'terms': document.getElementById('xly-terms-input'),
        'optout': document.getElementById('xly-subscribe-input')
    };
};


XlyLightbox.prototype.value = function(field) {
    return field.value;

};

XlyLightbox.prototype.busy = function(isBusy) {
    return this.toggleClass(this.lightbox, 'xly-busy', isBusy);
};

XlyLightbox.prototype.toggleClass = function(elements, className, toggle) {
    if (toggle) {
        this.apply(elements, function (el) {
            if (!el.classList.contains(className)) {
                el.classList.add(className);
            }
        });
    } else {
        this.apply(elements, function(el) {
            el.classList.remove(className);
        });
    }
    return this;
};

XlyLightbox.prototype.apply = function(array, fn) {
    if (array.constructor === Array) {
        for (var i = array.length - 1; i >= 0; --i) {
            fn(array[i]);
        }
    } else {
        fn(array);
    }
};

XlyLightbox.prototype.toArray = function toArray(htmlCollection) {
    for(var i = 0, a = []; i < htmlCollection.length; i++) {
        a.push(htmlCollection[i]);
    }
    return a;
};

XlyLightbox.prototype.xhr = function(callback) {
    var that = this;
    var xhr;
    if (typeof XMLHttpRequest !== 'undefined') {
        xhr = new XMLHttpRequest();
    } else {
        var versions = ["MSXML2.XmlHttp.5.0",
            "MSXML2.XmlHttp.4.0",
            "MSXML2.XmlHttp.3.0",
            "MSXML2.XmlHttp.2.0",
            "Microsoft.XmlHttp"];

        for (var i = 0, len = versions.length; i < len; i++) {
            try {
                xhr = new ActiveXObject(versions[i]);
                break;
            }
            catch (e) {
            }
        }
    }

    xhr.onreadystatechange = function() {
        try {
            if (xhr.readyState < 4) {
                return;
            }

            if (xhr.status !== 200) {
                return;
            }

            if (xhr.readyState === 4) {
                callback(xhr);
            }
        } catch(e) {
            that.busy(false);
            throw e;
        }
    };

    return xhr;
};

XlyLightbox.prototype.hasOptedOutOfNewsletter = function() {
    var optout = document.getElementById("xly-subscribe-input");
    return Boolean(optout && optout.checked);
};

XlyLightbox.prototype.generatePassword = function(len) {
    var length = len ? len : 10;
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
};


(function() {
    function load() {
        if('undefined' === typeof xlyrData) {
            setTimeout(load, 60);
            return;
        }
        new XlyLightbox(xlyrData);
    }
    load();
})();