(function () {
    console.log("lb=1807.001");
    var shiv = {
        addEventListenerTo: function (eventName, el, fn) {
            if (el.addEventListener) {
                el.addEventListener(eventName, fn, false);
            } else if (el.attachEvent) {
                el.attachEvent('on' + eventName, fn);
            }
        },

        contains: function (a, value) {
            if (a.indexOf) {
                return a.indexOf(value) > -1;
            } else {
                for (var i = 0, len = a.length; i < len; ++i) {
                    if (a[i] === value) {
                        return true;
                    }
                }
                return false;
            }
        },

        containsClass: function (el, className) {
            return el.classList
                ? el.classList.contains(className)
                : shiv.contains(el.className.split(/\s+/), className);
        },

        toggleClass: function (el, className, toggle) {
            if (el.classList) {
                if (toggle) {
                    if (!el.classList.contains(className)) {
                        el.classList.add(className);
                    }
                } else {
                    el.classList.remove(className);
                }
            } else {
                if (toggle) {
                    if (!shiv.containsClass(el, className)) {
                        el.className = el.className + (el.className ? ' ' : '') + className;
                    }
                } else {
                    var tokens = el.className.split(/\s+/);
                    for (var i = tokens.length - 1; i >= 0; i--) {
                        if (tokens[i] === className) {
                            tokens.splice(i, 1);
                        }
                    }
                    el.className = tokens.join(' ');
                }
            }
        }
    };

    var dates = {
        formatDateString: function (value) {
            return value.replace(/(\d{2})\/(\d{2})\/(\d{4})/, "$3-$2-$1");
        },

        parseIso8601: function (value) {
            var tokens = value.split(/-/);
            return new Date(parseInt(tokens[0], 10), parseInt(tokens[1], 10) - 1, parseInt(tokens[2], 10));
        },

        getYearsSince: function (date) {
            var today = new Date();
            var age = today.getFullYear() - date.getFullYear();
            var m = today.getMonth() - date.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < date.getDate())) {
                age--;
            }
            return age;
        }
    };

    var ajax = {
        xhr: function (callback, failedCallback) {
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

            xhr.onreadystatechange = function () {
                try {
                    if (xhr.readyState < 4) {
                        return;
                    }

                    if (xhr.status !== 200) {
                        if (failedCallback) {
                            failedCallback(xhr);
                        } else {
                            lightbox.busy(false);
                        }
                        return;
                    }

                    if (xhr.readyState === 4) {
                        callback(xhr);
                    }
                } catch (e) {
                    lightbox.busy(false);
                    throw e;
                }
            };

            return xhr;
        },

        xdr: function (method, uri, callback, failedCallback, withCredentials) {
            var xdr;
            var protocol = 'https:';
            if (typeof XDomainRequest !== 'undefined') {
                xdr = new XDomainRequest();
                xdr.onload = function () {
                    try {
                        callback(xdr);
                    } catch (e) {
                        lightbox.busy(false);
                        throw e;
                    }
                };
                xdr.onerror = function () {
                    try {
                        if (failedCallback) {
                            failedCallback(xdr);
                        }
                    } catch (e) {
                        lightbox.busy(false);
                        throw e;
                    }
                };
                xdr.setRequestHeader = function () {
                };
                protocol = window.location.protocol;
            } else {
                xdr = ajax.xhr(callback, failedCallback);
            }

            xdr.open(method, protocol + uri, true);
            xdr.withCredentials = typeof withCredentials === 'undefined' || withCredentials !== false;
            return xdr;
        }
    };

    var util = {
        apply: function (array, fn) {
            if (array.constructor === Array) {
                for (var i = array.length - 1; i >= 0; --i) {
                    fn(array[i]);
                }
            } else {
                fn(array);
            }
        },

        toArray: function toArray(htmlCollection) {
            for (var i = 0, a = []; i < htmlCollection.length; i++) {
                a.push(htmlCollection[i]);
            }
            return a;
        },

        evaluate: function (eo, context) {
            if (typeof eo === 'string') {
                return eo;
            }

            var value = '';

            if (eo.type === 'literal') {
                value = eo.value;
            } else if (eo.type === 'context') {
                value = context[eo.key];
            } else if (eo.type === 'function') {
                value = eo.fn(context);
            }

            if (value === null || typeof value === 'undefined') {
                value = '';
            }

            return value;
        },

        escapeRegex: function (s) {
            return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        }
    };

    var dom = {
        getElementAttributesForId: function (id, content) {
            var regex = new RegExp('<[^<>]*id=[\'"]' + util.escapeRegex(id) + '[\'"][^<>]*>', 'mig');
            var attrMap = {};
            var m = regex.exec(content);
            if (m) {
                var div = document.createElement('div');
                div.innerHTML = m[0];
                var attrs = div.children[0].attributes;
                for (var i = attrs.length - 1; i >= 0; i--) {
                    attrMap[attrs[i].name] = attrs[i].value;
                }
            }
            return attrMap;
        }
    };

    var lightbox = {
        root: document.getElementById("xly"),

        busy: function (isBusy) {
            shiv.toggleClass(lightbox.root, 'xly-busy', isBusy);
        },

        setGlobalError: function (message) {
            var error = document.getElementById('xly-globalError');
            error.innerText = message ? message : '';
            error.style.display = message ? 'block' : 'none';
        }
    };

    function XlyLightbox(config) {
        var that = this;
        this.config = config;

        if (lightbox.root && lightbox.root !== document.body.lastChild) {
            document.body.appendChild(lightbox.root);
        }

        var migrateButton = document.getElementById("xly-accept-link");
        if (migrateButton) {
            shiv.addEventListenerTo('click', migrateButton, function () {
                that.submit();
                return false;
            });
        }

        if (this.config.lightbox === 'form') {

            var ccEmailInput = document.getElementById('xly-campaignCustomer-email');
            if (ccEmailInput) {
                var ccEmail = ccEmailInput.value;
                if (ccEmail.indexOf('@') > 0) {
                    var emailField = document.getElementById('xly-email-field');
                    emailField.value = ccEmail;
                    emailField.readOnly = true;
                }
            }

            var initAddressLookup = function () {
                if ('undefined' === typeof CraftyPostcodeCreate) {
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
                shiv.addEventListenerTo('click', document.getElementById('xly-addressLookup'), function () {
                    cp_obj.doLookup();
                });
            };

            initAddressLookup();
        }

        if (this.config.lightbox === 'confirm' && this.config.autoConfirm === 'true') {
            this.submit();
        }
    }

    XlyLightbox.prototype.submit = function () {
        lightbox.busy(true);
        if (this.config.lightbox === 'form') {
            if (this.validate()) {
                this.pushAndMigrate();
            } else {
                lightbox.busy(false);
            }
        } else {
            this.migrate();
        }
    };

    XlyLightbox.prototype.migrate = function () {
        if (this.config.registration === 'js') {
            this.migrateJs();
        } else {
            this.migrateApi();
        }
    };

    XlyLightbox.prototype.migrateApi = function () {
        var url = this.config.migrationInitiateUrl;
        if (this.hasOptedOutOfNewsletter()) {
            url += '?optout=true';
        }
        var metadata = this.getMetadataParams();
        if (metadata) {
            url += this.hasOptedOutOfNewsletter() ? '&' : '?';
            url += metadata;
        }

        window.location.replace(url);
    };

    XlyLightbox.prototype.getMetadataParams = function () {
        var metadata = [];
        var inputs = util.toArray(lightbox.root.querySelectorAll('input'));
        inputs = inputs.concat(util.toArray(lightbox.root.querySelectorAll('select')));
        for (var i = 0; i < inputs.length; ++i) {
            var name = inputs[i].name;
            if (!name || name.indexOf('meta-') !== 0) {
                continue;
            }
            var value = this.value(inputs[i]);
            if (value !== null) {
                metadata.push(encodeURIComponent(name) + '=' + encodeURIComponent(value));
            }
        }
        return metadata.join("&");
    };

    XlyLightbox.prototype.addLocalMetadata = function (context) {
        var inputs = util.toArray(lightbox.root.querySelectorAll('input'));
        inputs = inputs.concat(util.toArray(lightbox.root.querySelectorAll('select')));
        for (var i = 0; i < inputs.length; ++i) {
            var name = inputs[i].name;
            if (!name || name.indexOf('meta-') !== 0) {
                continue;
            }
            var value = this.value(inputs[i]);
            if (value !== null) {
                context[name] = value;
            }
        }
        return context;
    };

    XlyLightbox.prototype.migrateJs = function () {
        var that = this;
        this.pull(function (data) {
            var context = that.buildContext(data);
            if (that.config.parseAddressTypes && that.config.parseAddressTypes.length > 0) {
                that.executeAddressParsing(context);
            } else {
                that.executeSteps(context);
            }
        });
    };

    XlyLightbox.prototype.executeAddressParsing = function (context) {
        var that = this;
        var parseAddressTypes = this.config.parseAddressTypes || [];
        var execute = function (type, context, remainingTypes) {
            that.parseAddress(context, type, function () {
                if (remainingTypes.length === 0) {
                    that.executeSteps(context);
                } else {
                    execute(remainingTypes.shift(), context, remainingTypes);
                }
            });
        };
        execute(parseAddressTypes.shift(), context, parseAddressTypes);
    };

    XlyLightbox.prototype.executeSteps = function (context) {
        var that = this;
        var steps = that.config.registrationSteps || [];
        var executeStep = function (step, context, remainingSteps) {
            var xhr = ajax.xhr(function (xhr) {
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
                    console.log(xhr.getResponseHeader('content-type'));
                    if(xhr.getResponseHeader('content-type') && xhr.getResponseHeader('content-type').indexOf("application/json") >= 0) {
                        that.storeJsonToContext(step.store, xhr.responseText, context);

                    } else {
                        that.storeToContext(step.store, xhr.responseText, context);
                    }
                }

                if (remainingSteps.length > 0) {
                    executeStep(remainingSteps.shift(), context, remainingSteps);
                } else {
                    window.location.replace('https://prod.expresslyapp.com/api/redirect/migration/' + that.config.uuid + '/success');
                }
            });

            var stepUrl = util.evaluate(step.url, context);
            if (step.urlParams) {
                stepUrl += '?' + that.getStepData(step.urlParams, context);
            }

            xhr.open(step.method, stepUrl, true);
            xhr.withCredentials = true;
            var data;
            if (step.headers) {
                for (var property in step.headers) {
                    if (step.headers.hasOwnProperty(property)) {
                        xhr.setRequestHeader(property, step.headers[property]);
                    }
                }
            }
            if (step.data) {
                if (step.dataType === 'json') {
                    xhr.setRequestHeader("Content-type", "application/json; charset=utf-8");
                    data = that.getStepDataAsJson(step.data, context);
                } else {
                    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
                    data = that.getStepData(step.data, context);
                }
            }
            xhr.send(data);
        };
        executeStep(steps.shift(), context, steps);
    };

    XlyLightbox.prototype.checkContent = function (check, content) {
        if (check.contains) {
            return content.indexOf(check.contains) >= 0;
        }
        return false;
    };

    XlyLightbox.prototype.getStepData = function (data, context) {
        if (!data) {
            return '';
        }

        var params = [];
        for (var i = 0; i < data.length; ++i) {
            var value = util.evaluate(data[i], context);
            params.push(encodeURIComponent(data[i].name) + '=' + encodeURIComponent(value));
        }

        return params.join("&");
    };

    XlyLightbox.prototype.getStepDataAsJson = function (data, context) {
        if (!data) {
            return '';
        }

        var params = {};
        for (var i = 0; i < data.length; ++i) {
            params[data[i].name] = util.evaluate(data[i], context);
        }

        return JSON.stringify(params);
    };

    XlyLightbox.prototype.storeJsonToContext = function (store, content, context) {
        var r = {};
        function collect(o, path) {
            for (k in o) {
                if (o.hasOwnProperty(k)) {
                    var v = o[k];
                    if (typeof v === 'object') {
                        collect(v, path + k + ".");
                    } else {
                        r[path + k] = v;
                    }
                }
            }
        }
        collect(JSON.parse(content), '');

        for (i = 0; i < store.length; ++i) {
            var key = 'undefined' !== typeof store[i]['name'] ? store[i]['name'] : store[i]['id'];
            if ('undefined' !== key && 'undefined' !== r[key]) {
                context[store[i].key] = r[key];
            }
        }
    };

    XlyLightbox.prototype.storeToContext = function (store, content, context) {
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
            if ('undefined' !== typeof store[i].name) {
                var inputArray = inputs[store[i].name];
                if (inputArray && inputArray.length > 0) {
                    var index = store.index ? store.index : 0;
                    context[store[i].key] = inputArray[index].value;
                }
            } else if ('undefined' !== typeof store[i].id) {
                var attrsForId = dom.getElementAttributesForId(store[i].id, content);
                if (attrsForId && 'undefined' !== typeof attrsForId[store[i].attr]) {
                    context[store[i].key] = attrsForId[store[i].attr];
                }
            }
        }
    };

    XlyLightbox.prototype.buildContext = function (data) {
        var cd = data.migration.data.customerData;
        var billingAddress = typeof cd.billingAddress !== 'undefined' && cd.billingAddress !== -1 ? cd.addresses[cd.billingAddress] : null;
        var shippingAddress = typeof cd.shippingAddress !== 'undefined' && cd.shippingAddress !== -1 ? cd.addresses[cd.shippingAddress] : billingAddress;
        if (!billingAddress) {
            billingAddress = shippingAddress;
        }
        var anyAddress = billingAddress ? billingAddress : (cd.addresses && cd.addresses.length > 0 ? cd.addresses[0] : null);
        var phone = cd.phones && cd.phones.length > 0
            ? cd.phones[billingAddress && typeof billingAddress.phone !== 'undefined' ? billingAddress.phone : 0].number
            : null;
        var dob = cd.dob ? dates.parseIso8601(cd.dob) : null;

        var context = {
            uuid: this.config.uuid,
            email: data.migration.data.email,
            phone: phone,
            password: this.generatePassword(12),
            firstName: cd.firstName,
            lastName: cd.lastName,
            company: cd.company,
            dob: cd.dob,
            dobDay: dob ? dob.getDate() : null,
            dobMonth: dob ? dob.getMonth() + 1 : null,
            dobYear: dob ? dob.getFullYear() : null,
            taxNumber: cd.taxNumber,
            gender: cd.gender,
            optout: this.hasOptedOutOfNewsletter()
        };

        if (billingAddress) {
            context.billingFirstName = billingAddress.firstName ? billingAddress.firstName : cd.firstName;
            context.billingLastName = billingAddress.lastName ? billingAddress.lastName : cd.lastName;
            context.billingCompany = billingAddress.companyName ? billingAddress.companyName : cd.company;
            context.billingPhone = typeof billingAddress.phone !== 'undefined' && cd.phones && cd.phones.length > 0 ? cd.phones[billingAddress.phone].number : phone;
            context.billingAddress1 = billingAddress.address1;
            context.billingAddress2 = billingAddress.address2;
            context.billingCity = billingAddress.city;
            context.billingPostcode = billingAddress.zip;
            context.billingProvince = billingAddress.stateProvince;
            context.billingCountry = billingAddress.country;
        }

        if (shippingAddress) {
            context.shippingFirstName = shippingAddress.firstName ? shippingAddress.firstName : cd.firstName;
            context.shippingLastName = shippingAddress.lastName ? shippingAddress.lastName : cd.lastName;
            context.shippingCompany = shippingAddress.companyName ? shippingAddress.companyName : cd.company;
            context.shippingPhone = typeof shippingAddress.phone !== 'undefined' && cd.phones && cd.phones.length > 0 ? cd.phones[shippingAddress.phone].number : phone;
            context.shippingAddress1 = shippingAddress.address1;
            context.shippingAddress2 = shippingAddress.address2;
            context.shippingCity = shippingAddress.city;
            context.shippingPostcode = shippingAddress.zip;
            context.shippingProvince = shippingAddress.stateProvince;
            context.shippingCountry = shippingAddress.country;
        }

        if (anyAddress) {
            context.anyFirstName = anyAddress.firstName ? anyAddress.firstName : cd.firstName;
            context.anyLastName = anyAddress.lastName ? anyAddress.lastName : cd.lastName;
            context.anyCompany = anyAddress.companyName ? anyAddress.companyName : cd.company;
            context.anyPhone = typeof anyAddress.phone !== 'undefined' && cd.phones && cd.phones.length > 0 ? cd.phones[anyAddress.phone].number : phone;
            context.anyAddress1 = anyAddress.address1;
            context.anyAddress2 = anyAddress.address2;
            context.anyCity = anyAddress.city;
            context.anyPostcode = anyAddress.zip;
            context.anyProvince = anyAddress.stateProvince;
            context.anyCountry = anyAddress.country;
        }

        var meta = data.migration.meta;
        if (meta && meta.issuerData) {
            for (var i = 0; i < meta.issuerData.length; ++i) {
                context['meta-' + meta.issuerData[i].field] = meta.issuerData[i].value;
            }
        }

        this.addLocalMetadata(context);

        return context;
    };

    XlyLightbox.prototype.pull = function (callback) {
        var xhr = ajax.xdr('GET', "//prod.expresslyapp.com/api/v2/migration/" + this.config.uuid + "/user/ajax?optout=" + this.hasOptedOutOfNewsletter(), function (xhr) {
            callback(JSON.parse(xhr.responseText));
        });
        xhr.send('');
    };


    XlyLightbox.prototype.pushAndMigrate = function () {
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
            dob: dates.formatDateString(fields.dob.value),
            gender: fields.gender.value,
            optout: this.hasOptedOutOfNewsletter()
        };

        var xhr = ajax.xdr('POST', "//prod.expresslyapp.com/api/customer/push", function (response) {
            var json = JSON.parse(response.responseText);
            if (json.error) {
                console.log("xly:" + json.error);
                window.location.replace(json.redirectUrl + "?e=" + encodeURIComponent(json.error));
            } else {
                that.config.migrationInitiateUrl = json.redirectUrl;
                if (json.redirectUrl.indexOf(that.config.uuid) < 0) {
                    that.config.uuid = json.redirectUrl.replace(/(.+\/migration\/)(.+)(\/initiate)/, "$2");
                }
                that.migrate();
            }
        });

        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.send(JSON.stringify(data));
    };

    XlyLightbox.prototype.validate = function () {
        lightbox.setGlobalError(null);
        var that = this;
        var isValid = true;
        var fieldMap = this.getFormFields();
        var fields = this.getObjectValues(fieldMap);

        util.apply(fields, function (field) {
            var fieldValid = !shiv.containsClass(field, 'xly-required') || that.value(field) !== '';
            isValid = isValid && fieldValid;
            that.toggleClass(field, 'xly-field-error', !fieldValid);
        });

        if (!isValid) {
            lightbox.setGlobalError('Please fill all fields');
            return false;
        }

        if (!this.validateRegex(fieldMap['email'], /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)) {
            that.toggleClass(fieldMap['email'], 'xly-field-error', true);
            lightbox.setGlobalError('Not a valid email address');
            return false;
        }

        if (!this.validateRegex(fieldMap['postcode'], /^((?:(?:gir)|(?:[a-pr-uwyz])(?:(?:[0-9](?:[a-hjkpstuw]|[0-9])?)|(?:[a-hk-y][0-9](?:[0-9]|[abehmnprv-y])?)))) ?([0-9][abd-hjlnp-uw-z]{2})$/i)) {
            that.toggleClass(fieldMap['postcode'], 'xly-field-error', true);
            lightbox.setGlobalError('Please enter a valid postcode');
            return false;
        }

        if (!this.validateRegex(fieldMap['dob'], /^(?:(?:31(\/|-|\.)(?:0?[13578]|1[02]))\1|(?:(?:29|30)(\/|-|\.)(?:0?[1,3-9]|1[0-2])\2))(?:(?:1[6-9]|[2-9]\d)?\d{2})$|^(?:29(\/|-|\.)0?2\3(?:(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00))))$|^(?:0?[1-9]|1\d|2[0-8])(\/|-|\.)(?:(?:0?[1-9])|(?:1[0-2]))\4(?:(?:1[6-9]|[2-9]\d)?\d{2})$/)) {
            that.toggleClass(fieldMap['dob'], 'xly-field-error', true);
            lightbox.setGlobalError('Please insert date as dd/mm/yyyy 1');
            return false;
        }

        var dobDate = dates.parseIso8601(dates.formatDateString(fieldMap['dob'].value));
        if (isNaN(dobDate) || dobDate.getFullYear() < 1900) {
            that.toggleClass(fieldMap['dob'], 'xly-field-error', true);
            lightbox.setGlobalError('Please insert date as dd/mm/yyyy 2');
            return false;
        }

        var age = dates.getYearsSince(dobDate);
        if (age < 18) {
            lightbox.setGlobalError('You must be over 18 to enter');
            return false;
        }

        if (!fieldMap['terms'].checked) {
            lightbox.setGlobalError('Please accept the terms and conditions');
            this.toggleClass(fieldMap['terms'], 'xly-field-error', true);
            return false;
        }

        return true;
    };

    XlyLightbox.prototype.validateRegex = function (field, regex) {
        var result = regex.test(field.value);
        this.toggleClass(field, 'xly-field-error', !result);
        return result;
    };

    XlyLightbox.prototype.getObjectValues = function (object) {
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

    XlyLightbox.prototype.getFormFields = function () {
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


    XlyLightbox.prototype.value = function (field) {
        if (field.type === 'checkbox') {
            return field.checked;
        }
        if (field.type === 'radio') {
            return field.checked ? field.value : null;
        }
        return field.value;

    };

    XlyLightbox.prototype.toggleClass = function (elements, className, toggle) {
        util.apply(elements, function (el) {
            shiv.toggleClass(el, className, toggle);
        });
        return this;
    };

    XlyLightbox.prototype.hasOptedOutOfNewsletter = function () {
        var optout = document.getElementById("xly-subscribe-input");
        return Boolean(optout && optout.checked);
    };

    XlyLightbox.prototype.generatePassword = function (len) {
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

    XlyLightbox.prototype.parseAddress = function (context, type, continueFn) {
        if (typeof context[type + 'Address1'] === 'undefined' || !context[type + 'Address1']) {
            continueFn();
            return;
        }

        var originalAddress1 = context[type + 'Address1'];
        var address = {
            address1: originalAddress1,
            address2: context[type + 'Address2'],
            city: context[type + 'City'],
            postcode: context[type + 'Postcode']
        };

        var cleanArray = function (array) {
            for (var i = 0; i < array.length; i++) {
                if (!array[i]) {
                    array.splice(i, 1);
                    i--;
                }
            }
            return array;
        };

        var selectViableAddresses = function (array) {
            for (var i = 0; i < array.length; i++) {
                var result = array[i];
                if (!shiv.contains(result.types, 'subpremise') && !shiv.contains(result.types, 'premise') && !shiv.contains(result.types, 'street_address')) {
                    array.splice(i, 1);
                    i--;
                }
            }
            return array;
        };

        var findHouseNumber = function (addressLine) {
            var regex = /^(\d+)\s.+$/;
            var match = regex.exec(addressLine);
            return match && match.length > 1 ? match[1] : null;
        };

        var parseAddressContinue = function (address) {
            if (!address.houseName && !address.houseNumber) {
                var houseNumber = findHouseNumber(originalAddress1);
                if (houseNumber) {
                    address.houseNumber = houseNumber;
                    address.address1 = originalAddress1.substring(houseNumber.length, originalAddress1.length).replace(/^\s+|\s+$/gm, '')
                } else {
                    address.houseName = originalAddress1;
                    if (address.address2) {
                        address.address1 = address.address2;
                        address.address2 = null;
                    }
                }
            }

            context[type + 'FlatNumber'] = address.flatNumber;
            context[type + 'HouseName'] = address.houseName;
            context[type + 'HouseNumber'] = address.houseNumber;
            context[type + 'Address1'] = address.address1;
            context[type + 'Address2'] = address.address2;
            continueFn();
        };

        var addressString = cleanArray([address.address1, address.address2, address.city, address.postcode]).join(' ,');
        var xhr = ajax.xdr(
            'GET',
            '//maps.googleapis.com/maps/api/geocode/json?key=AIzaSyBDALF2fhX2DBT9ZddfjyaapsvjNuq4dc4&address=' + encodeURIComponent(addressString),
            function (xhr) {
                var json = JSON.parse(xhr.responseText);
                var results = selectViableAddresses(json.results);
                if (results.length === 1) {
                    for (var i = 0; i < results[0].address_components.length; ++i) {
                        var component = results[0].address_components[i];
                        if (shiv.contains(component.types, 'subpremise')) {
                            address.flatNumber = component.short_name;
                        } else if (shiv.contains(component.types, 'premise')) {
                            address.houseName = component.short_name;
                        } else if (shiv.contains(component.types, 'street_number')) {
                            address.houseNumber = component.short_name;
                        } else if (shiv.contains(component.types, 'route')) {
                            address.address1 = component.short_name;
                        }
                    }
                }
                parseAddressContinue(address);
            },
            function (xhr) {
                parseAddressContinue(address);
            },
            false);

        xhr.send('');
    };

    function load() {
        if ('undefined' === typeof xlyrData) {
            setTimeout(load, 60);
            return;
        }
        new XlyLightbox(xlyrData);
    }

    load();
})();

