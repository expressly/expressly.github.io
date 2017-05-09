var xlyreg = xlyreg || {
        register: function (cdata, optout) {
            xlyreg.getTokenAndRegister(cdata, optout);
        },

        getTokenAndRegister: function (cdata, optout) {
            jQuery.ajax({
                type: "GET",
                url: '/jsp/registration/common/account_new.jsp',
                success: function (response) {
                    var token = xlyreg.getToken(response);
                    xlyreg.prepareRegistration(token, cdata, optout)
                }
            });
        },

        getToken: function (html) {
            var regex = /<input[^>]+name="_dynSessConf"(?:[^>]+value="([^"]*)")[^>]*>/;
            var match = regex.exec(html);
            return match.length > 1 ? match[1] : null;
        },

        prepareRegistration: function (token, cdata, optout) {
            var hasBillingAddress = 'undefined' !== typeof cdata.migration.data.customerData.billingAddress;
            var hasShippingAddress = 'undefined' !== typeof cdata.migration.data.customerData.shippingAddress;
            var hasAddress = cdata.migration.data.customerData.addresses.length > 0 && (hasBillingAddress || hasShippingAddress);
            var address = hasAddress
                ? cdata.migration.data.customerData.addresses[hasBillingAddress ? cdata.migration.data.customerData.billingAddress : cdata.migration.data.customerData.shippingAddress]
                : null;
            if (hasAddress) {
                xlyreg.parseAddress(token, cdata, optout, address);
            } else {
                xlyreg.doRegistration(token, cdata, optout, {});
            }
        },

        doRegistration: function (token, cdata, optout, parsedAddress) {
            var password = xlyreg.generatePassword();
            var hasDob = cdata.migration.data.customerData.dob;
            var dob = hasDob ? new Date(cdata.migration.data.customerData.dob) : null;

            jQuery.ajax({
                type: "POST",
                url: '/jsp/registration/common/account_new.jsp?_DARGS=/jsp/registration/uk/common/registrationDetails.jsp',
                data: {
                    _dyncharset: 'UTF - 8',
                    _dynSessConf: token,
                    wineplanFlag: '',
                    axCustomerNumber: '',
                    password: password,
                    isBrandAcctValidated: false,
                    optInValue: !optout,
                    billingRadio_address_guest: true,
                    isNotVerificationRequired: true,
                    countryList: '#',
                    'gift-radio': 0.0,
                    '/dwint/userprofiling/DWINTRegistrationFormHandler.value.email': cdata.migration.data.email,
                    '/dwint/userprofiling/DWINTRegistrationFormHandler.value.billingAddress.salutation:Mr': cdata.migration.data.customerData.gender === 'F' ? 'Ms' : 'Mr',
                    '/dwint/userprofiling/DWINTRegistrationFormHandler.value.firstName': cdata.migration.data.customerData.firstName,
                    '/dwint/userprofiling/DWINTRegistrationFormHandler.value.lastName': cdata.migration.data.customerData.lastName,
                    '/dwint/userprofiling/DWINTRegistrationFormHandler.confirmPassword': true,
                    '/dwint/userprofiling/DWINTRegistrationFormHandler.value.confirmPassword': password,
                    '/dwint/userprofiling/DWINTRegistrationFormHandler.day': hasDob ? dob.getDate() : null,
                    '/dwint/userprofiling/DWINTRegistrationFormHandler.month': hasDob ? dob.getMonth() + 1 : null,
                    '/dwint/userprofiling/DWINTRegistrationFormHandler.year': hasDob ? dob.getFullYear() : null,
                    '/dwint/userprofiling/DWINTRegistrationFormHandler.ukAddress': true,
                    '/dwint/userprofiling/DWINTRegistrationFormHandler.value.billingAddress.companyName': parsedAddress.original ? parsedAddress.original.companyName : null,
                    '/dwint/userprofiling/DWINTRegistrationFormHandler.value.billingAddress.houseNumber': parsedAddress.houseNumber,
                    '/dwint/userprofiling/DWINTRegistrationFormHandler.value.billingAddress.flatNumber': parsedAddress.flatNumber,
                    '/dwint/userprofiling/DWINTRegistrationFormHandler.value.billingAddress.houseName': parsedAddress.houseName,
                    '/dwint/userprofiling/DWINTRegistrationFormHandler.value.billingAddress.address1': parsedAddress.address1,
                    '/dwint/userprofiling/DWINTRegistrationFormHandler.value.billingAddress.address2': parsedAddress.address2,
                    '/dwint/userprofiling/DWINTRegistrationFormHandler.value.billingAddress.address3': '',
                    '/dwint/userprofiling/DWINTRegistrationFormHandler.value.billingAddress.city': parsedAddress.city,
                    '/dwint/userprofiling/DWINTRegistrationFormHandler.value.billingAddress.county': parsedAddress.county,
                    '/dwint/userprofiling/DWINTRegistrationFormHandler.value.billingAddress.postalCode': parsedAddress.postcode,
                    '/dwint/userprofiling/DWINTRegistrationFormHandler.value.billingAddress.state': null,
                    '/dwint/userprofiling/DWINTRegistrationFormHandler.value.billingAddress.dayPhoneNumber': parsedAddress.phone,
                    '/dwint/userprofiling/DWINTRegistrationFormHandler.createSuccessURL': '/jsp/account/common/account_details.jsp',
                    '/dwint/userprofiling/DWINTRegistrationFormHandler.createErrorURL': '/jsp/registration/common/account_new.jsp',
                    '/dwint/userprofiling/DWINTRegistrationFormHandler.create': 'Create Account',
                    '_D:/dwint/userprofiling/DWINTRegistrationFormHandler.value.billingAddress.companyName': null,
                    '_D:/dwint/userprofiling/DWINTRegistrationFormHandler.value.billingAddress.houseNumber': null,
                    '_D:/dwint/userprofiling/DWINTRegistrationFormHandler.value.billingAddress.flatNumber': null,
                    '_D:/dwint/userprofiling/DWINTRegistrationFormHandler.value.billingAddress.houseName': null,
                    '_D:/dwint/userprofiling/DWINTRegistrationFormHandler.value.billingAddress.address1': null,
                    '_D:/dwint/userprofiling/DWINTRegistrationFormHandler.value.billingAddress.address2': null,
                    '_D:/dwint/userprofiling/DWINTRegistrationFormHandler.value.billingAddress.address3': null,
                    '_D:/dwint/userprofiling/DWINTRegistrationFormHandler.value.billingAddress.city': null,
                    '_D:/dwint/userprofiling/DWINTRegistrationFormHandler.value.billingAddress.county': null,
                    '_D:/dwint/userprofiling/DWINTRegistrationFormHandler.value.billingAddress.postalCode': null,
                    '_D:/dwint/userprofiling/DWINTRegistrationFormHandler.value.billingAddress.state': null,
                    '_D:countryList': null,
                    '_D:/dwint/userprofiling/DWINTRegistrationFormHandler.create': null,
                    '_D:gift-radio': null,
                    '_D:/dwint/userprofiling/DWINTRegistrationFormHandler.year': null,
                    '_D:password': null,
                    '_D:wineplanFlag': '',
                    '_D:axCustomerNumber': '',
                    '_D:/dwint/userprofiling/DWINTRegistrationFormHandler.value.email': null,
                    '_D:/dwint/userprofiling/DWINTRegistrationFormHandler.value.billingAddress.salutation': null,
                    '_D:/dwint/userprofiling/DWINTRegistrationFormHandler.value.firstName': null,
                    '_D:/dwint/userprofiling/DWINTRegistrationFormHandler.value.lastName': null,
                    '_D:/dwint/userprofiling/DWINTRegistrationFormHandler.confirmPassword': null,
                    '_D:/dwint/userprofiling/DWINTRegistrationFormHandler.value.confirmPassword': null,
                    '_D:/dwint/userprofiling/DWINTRegistrationFormHandler.day': null,
                    '_D:/dwint/userprofiling/DWINTRegistrationFormHandler.month': null,
                    '_D:isBrandAcctValidated': null,
                    '_D:/dwint/userprofiling/DWINTRegistrationFormHandler.value.billingAddress.dayPhoneNumber': null,
                    '_D:/dwint/userprofiling/DWINTRegistrationFormHandler.createSuccessURL': null,
                    '_D:/dwint/userprofiling/DWINTRegistrationFormHandler.createErrorURL': null,
                    '_D:optInValue': null,
                    '_D:/dwint/userprofiling/DWINTRegistrationFormHandler.ukAddress': null,
                    '_DARGS': '/jsp/registration/uk/common/registrationDetails.jsp'
                },
                success: xlyreg.redirect
            });
        },

        cleanArray: function (array) {
            for (var i = 0; i < array.length; i++) {
                if (!array[i]) {
                    array.splice(i, 1);
                    i--;
                }
            }
            return array;
        },

        parseAddress: function (token, cdata, optout, address) {
            var hasPhone = address && 'undefined' !== typeof address.phone && cdata.migration.data.customerData.phones.length > 0;
            var parsedAddress = {
                address1: address.address1,
                address2: address.address2,
                city: address.city,
                county: address.county,
                postcode: address.zip,
                phone: hasPhone ? cdata.migration.data.customerData.phones[address.phone].number.replace(/\s/g, '') : null,
                original: address
            };

            var addressString = xlyreg.cleanArray([address.address1, address.address2, address.city, address.zip]).join(' ,');
            jQuery.ajax({
                type: "GET",
                url: 'https://maps.googleapis.com/maps/api/geocode/json?key=AIzaSyBDALF2fhX2DBT9ZddfjyaapsvjNuq4dc4&address=' + encodeURIComponent(addressString),
                success: function (response) {
                    var results = xlyreg.selectViableAddresses(response.results);
                    if (results.length === 1) {
                        for (var i = 0; i < results[0].address_components.length; ++i) {
                            var component = results[0].address_components[i];
                            if (component.types.indexOf('subpremise') > -1) {
                                parsedAddress.flatNumber = component.short_name;
                            } else if (component.types.indexOf('premise') > -1) {
                                parsedAddress.houseName = component.short_name;
                            } else if (component.types.indexOf('street_number') > -1) {
                                parsedAddress.houseNumber = component.short_name;
                            } else if (component.types.indexOf('route') > -1) {
                                parsedAddress.address1 = component.short_name;
                            }
                        }
                    }
                    xlyreg.parseAddressContinue(token, cdata, optout, parsedAddress);
                },
                error: function (response) {
                    xlyreg.parseAddressContinue(token, cdata, optout, parsedAddress);
                }
            });
        },

        parseAddressContinue: function (token, cdata, optout, parsedAddress) {
            if (!parsedAddress.houseName && !parsedAddress.houseNumber) {
                parsedAddress.houseName = parsedAddress.original.address1;
                if (parsedAddress.address2) {
                    parsedAddress.address1 = parsedAddress.address2;
                    parsedAddress.address2 = null;
                }
            }

            xlyreg.doRegistration(token, cdata, optout, parsedAddress);
        },

        selectViableAddresses: function (array) {
            for (var i = 0; i < array.length; i++) {
                var result = array[i];
                if (result.types.indexOf('subpremise') < 0 && result.types.indexOf('premise') < 0 && result.types.indexOf('street_address') < 0) {
                    array.splice(i, 1);
                    i--;
                }
            }
            return array;
        },

        redirect: function (output) {
            if (output.indexOf('Sign Out') > -1) {
                window.location.replace('https://prod.expresslyapp.com/api/redirect/migration/' + xlyrData.uuid + '/success');
            } else if (output.indexOf('A user already exists with the login') > -1) {
                alert('You already have an account with this email address, redirecting you to login page');
                window.location.replace('/jsp/registration/common/account_login.jsp');
            } else {
                window.location.replace('https://prod.expresslyapp.com/api/redirect/migration/' + xlyrData.uuid + '/failed');
            }
        },

        generatePassword: function (len) {
            var length = (len)
                ? (len)
                : (10);
            var string = "abcdefghijklmnopqrstuvwxyz"; //to upper
            var numeric = '0123456789';
            var punctuation = '!@#$%^&*()_+~`|}{[]\:;?><,./-=';
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
        }
    };
