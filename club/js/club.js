/** v1.07 **/
var club = function () {
    $.support.cors = true;
    var muid = $('body').data('muid');
    var disableEmailEntries = !!$('body').data('disable-entry-emails');
    var domainMigrationsEnabled = !!$('body').data('domain-migrations-enabled');
    var protocol = 'https:';
    var reenterTimerId = null;

    var storage = {
        get: function(key, defValue) {
            var value;
            if (typeof(Storage) !== "undefined") {
                value = localStorage.getItem(key + "." + muid);
            }
            return !!value ?  value : defValue;
        },
        set: function(key, data) {
            if (typeof(Storage) !== "undefined") {
                localStorage.setItem(key + "." + muid, data);
            }
        },
        remove: function(key) {
            if (typeof(Storage) !== "undefined") {
                localStorage.removeItem(key + "." + muid);
            }
        }
    };

    var modal = {
        alert: $('#modal--alert'),
        login: $('#modal--login'),
        register: $('#modal--register'),
        passwordReset: $('#modal--password-reset'),
        passwordResetRequest: $('#modal--password-reset-request'),

        notify: function (title, message) {
            modal.alert.find("#modal--alert-label").html(title);
            modal.alert.find("#modal--alert-message").html(message);
            modal.alert.modal('show');
        },

        flashNotification: function(title, message) {
            storage.set("notification", JSON.stringify({title: title, message: message}));
        },

        unflashNotification: function() {
            var notification = storage.get("notification", null);
            if (notification) {
                storage.remove("notification");
                var n = JSON.parse(notification);
                modal.notify(n.title, n.message);
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

    var form = {
        login: $('#form--login'),
        competition: $('#form--competition'),
        contactUs: $('#form--contact-us'),
        profile: $('#form--profile'),
        register: $('#form--register'),
        passwordReset: $('#form--password-reset'),
        passwordResetRequest: $('#form--password-reset-request'),

        toggleFeedback: function (prefix, field, toggle, customError) {
            var control = $('#' + prefix + '--' + field);

            var tooltip = $(control.next('.invalid-feedback').find('[data-toggle="tooltip"]')[0]);
            if (!!customError) {
                tooltip.data("default-title", tooltip.data("original-title"));
                tooltip.prop('title', customError);
                tooltip.tooltip("_fixTitle");
            } else {
                var original = tooltip.data("default-title");
                if (!!original) {
                    tooltip.prop('title', original);
                    tooltip.tooltip("_fixTitle");
                }
            }

            control.toggleClass('is-invalid', toggle);
        },

        isInOptOutMode: function(form) {
            var f = form.find('[name=optout]');
            return f.length > 0;
        },

        serialize: function (f) {
            var data = f.serializeArray();
            var result = {};
            $.map(data, function (o) {
                if (o['name'].indexOf('meta-') === 0) {
                    result['issuerData'] = result['issuerData'] || {};
                    result['issuerData'][o['name'].substr('meta-'.length)] = o['value'];
                } else if (o['name'] === 'answer') {
                    result[o['name']] = o['value'];
                    result['issuerData'] = result['issuerData'] || {};
                    result['issuerData'][o['name']] = o['value'];
                } else {
                    result[o['name']] = o['value'];
                }
            });

            if (form.isInOptOutMode(f)) {
                result.optin = !result.optout;
                delete result.optout
            }

            return result;
        },

        populate: function (f, data, trigger) {
            if (f.length) {
                if (form.isInOptOutMode(f)) {
                    data.optout = !data.optin;
                }

                $.each(data, function (key, value) {
                    var ctrl = $('[name=' + key + ']', f);
                    switch (ctrl.prop("type")) {
                        case "radio":
                        case "checkbox":
                            ctrl.each(function () {
                                if ($(this).attr('value') === value + "") {
                                    $(this).attr("checked", value);
                                }
                            });
                            break;
                        default:
                            var current = ctrl.val();
                            ctrl.val(value);
                            if (trigger && current !== value) {
                                ctrl.trigger('change');
                            }
                    }
                });
            }
        },

        busy: function (working) {
            var elements = $('.disable-if-busy');
            if (working) {
                elements.prop('disabled', true);
                $('body').addClass('busy');
            } else {
                elements.prop('disabled', false);
                $('body').removeClass('busy');
            }
        }
    };

    var state = {
        profile: null
    };

    var url = {
        parameter: function (name) {
            var query = decodeURIComponent(window.location.search.substring(1));
            var tokens = query.split('&');

            for (var i = 0; i < tokens.length; i++) {
                var tokenParts = tokens[i].split('=');
                if (tokenParts[0] === name) {
                    return tokenParts[1] === undefined ? true : tokenParts[1];
                }
            }
        },

        removeParameter: function (name) {
            var parts = window.location.href.split('?');
            if (parts.length >= 2) {
                var query = decodeURIComponent(parts[1]);
                var prefix = encodeURIComponent(name) + '=';
                var tokens = query.split('&');

                for (var i = tokens.length; i-- > 0;) {
                    if (tokens[i].lastIndexOf(prefix, 0) !== -1) {
                        tokens.splice(i, 1);
                    }
                }

                window.history.replaceState({}, document.title, parts[0] + (tokens.length > 0 ? '?' + tokens.join('&') : ''));
                // window.location.replace(parts[0] + (tokens.length > 0 ? '?' + tokens.join('&') : ''));
            }
        },

        addSourceParameter: function(url) {
            var referrer = Cookies.get('referrer.' + muid);
            if (referrer) {
                var delim = url.indexOf("?") > -1 ? '&' : '?';
                return url + delim + "source=" + encodeURIComponent(referrer);
            }
            return url;
        },

        storeReferrer: function() {
            if (document.referrer && document.referrer.indexOf(window.location.hostname) < 0) {
                Cookies.set('referrer.' + muid, document.referrer, {expires: 7, path: '/'});
            }
        }
    };

    var gah = {
        event: function(category, action, label) {
            if (ga) {
                ga('send', 'event', {
                    eventCategory: category,
                    eventAction: action,
                    eventLabel: label
                });
            }
        }
    };

    var strings = {
        nullToEmpty: function (s) {
            return !s || s === undefined ? '' : s;
        }
    };

    var arrays = {
        filter: function (a, filter) {
            for (var i = 0; i < a.length; i++) {
                if (!filter(a[i])) {
                    a.splice(i, 1);
                    i--;
                }
            }
            return a;
        }
    };

    var controller = {
        login: function () {
            if (form.login.get(0).checkValidity() === true) {
                var formData = form.serialize(form.login);
                server.login(formData);
            }
            form.login.toggleClass('was-validated', true);
        },

        loginRequired: function () {
            modal.login.modal('show')
        },

        logout: function () {
            server.logout();
        },

        passwordResetRequestLoggedIn: function() {
            server.passwordResetRequest({email: state.profile.email }, false);
        },

        passwordResetRequest: function () {
            if (form.passwordResetRequest.get(0).checkValidity() === true) {
                var formData = form.serialize(form.passwordResetRequest);
                server.passwordResetRequest(formData, true);
            }
            form.passwordResetRequest.toggleClass('was-validated', true);
        },

        passwordReset: function () {
            if (form.passwordReset.get(0).checkValidity() === true) {
                var formData = form.serialize(form.passwordReset);
                server.passwordReset(url.parameter("token"), formData.newPassword);
            }
            form.passwordReset.toggleClass('was-validated', true);
        },

        register: function () {
            var formData = form.serialize(form.register);
            form.toggleFeedback('form--register', 'email', false);
            if (form.register.get(0).checkValidity() === true) {
                formData.dob = dates.formatDateString(formData.dob);
                var over18 = dates.getYearsSince(dates.parseIso8601(formData.dob)) >= 18;
                form.toggleFeedback('form--register', 'dob', !over18);
                if (over18) {
                    server.register(formData);
                }
            } else if (form.register.find('.address-fields input:invalid').length > 0) {
                $('#form--register--address-fields').collapse('show');
            }
            form.register.toggleClass('was-validated', true);
        },

        updateProfile: function () {
            var formData = form.serialize(form.profile);
            form.toggleFeedback('form--register', 'email', false);
            if (form.profile.get(0).checkValidity() === true) {
                formData.dob = dates.formatDateString(formData.dob);
                var over18 = dates.getYearsSince(dates.parseIso8601(formData.dob)) >= 18;
                form.toggleFeedback('form--profile', 'dob', !over18);
                if (over18) {
                    server.update(formData);
                }
            } else if (form.profile.find('.address-fields input:invalid').length > 0) {
                $('#form--profile--address-fields').collapse('show');
            }
            form.profile.toggleClass('was-validated', true);
        },

        submitEntry: function () {
            var formData = form.serialize(form.competition);
            form.toggleFeedback('form--competition', 'email', false);
            if (form.competition.get(0).checkValidity() === true) {
                formData.dob = dates.formatDateString(formData.dob);
                var over18 = dates.getYearsSince(dates.parseIso8601(formData.dob)) >= 18;
                form.toggleFeedback('form--competition', 'dob', !over18);
                if (over18) {
                    server.submitEntry(formData, true);
                }
            } else if (form.competition.find('.address-fields input:invalid').length > 0) {
                $('#form--competition--address-fields').collapse('show');
            }
            form.competition.toggleClass('was-validated', true);
        },

        submitEntryAgain: function (cuid, title) {
            var payload = {
                emailEntrant: !disableEmailEntries,
                competitionTitle: title
            };
            server.submitEntryAgain(cuid, payload);
        },

        autoPowerLink: function (cuid, title) {
            if (state.profile) {
                var payload = Object.assign({}, state.profile);
                delete payload['registrationCompleted'];
                delete payload['resetPassword'];
                delete payload['accountId'];
                delete payload['termsTs'];
                delete payload['termsIpAddress'];
                delete payload['optinTs'];
                delete payload['optinIpAddress'];
                delete payload['optin2pTs'];
                delete payload['optin2pIpAddress'];
                delete payload['optin3pTs'];
                delete payload['optin3pIpAddress'];
                delete payload['termsAccepted'];
                payload.campaign = cuid;
                payload.competitionTitle = title;
                payload.terms = true;
                payload.optin = true;
                payload.optin2p = false;
                payload.optin3p = false;
                server.submitEntry(payload, true);
            } else {
                modal.login.modal('show');
            }
        },

        storeProfile: function (profile) {
            if (profile !== null) {
                storage.set("profile", JSON.stringify(profile));
            } else {
                storage.remove("profile");
            }
            storage.set("signedIn", profile !== null);
        },
        setProfile: function (profile, nostore, noUpdateEntries) {
            state.profile = profile;
            if (!nostore) {
                controller.storeProfile(profile);
            }

            var $body = $(document.body);
            $body.toggleClass("logged-in", profile !== null);
            var classList = $body.attr('class').split(/\s+/);
            for (i = 0; i < classList.length; i++) {
                if(classList[i].length > 0 && classList[i].startsWith('country-')){
                    $body.removeClass(classList[i]);
                }
            }
            if (profile !== null) {
                $body.addClass("country-" + profile.country);
            }

            $('.data-forename').text(profile !== null ? profile.forename : '');
            $('.disable-if-logged-in').prop("disabled", profile !== null);
            if (profile !== null) {
                if (!server.getToken()) {
                    server.setMigrationStatus("no-token");
                }
                form.populate(form.competition, profile, true);
                form.populate(form.profile, profile, true);
                form.populate(form.contactUs, {email: profile.email, name: profile.forename + ' ' + profile.surname}, false);
                if (!nostore && !noUpdateEntries) {
                    server.entries();
                }
            } else {
                if (!nostore) {
                    server.setMigrationStatus("none");
                }
                controller.setEntries([]);
            }
        },

        setEntries: function (entries, nostore) {
            $('body').toggleClass('entered-at-least-one', entries.length > 0);
            $('.competition-entered')
                .removeClass('competition-entered')
                .removeClass('reenter-never')
                .removeClass('reenter-now')
                .removeClass('reenter-later');

            var now = moment();
            var min = moment().add(1, 'day').diff(now, "seconds");

            for (var i = 0; i < entries.length; ++i) {
                var campaign = entries[i]['campaignUuid'];
                var powerlink = url.addSourceParameter(entries[i]['powerLink']);
                var link = $('[data-powerlink="' + campaign + '"]');
                var nextEntryTime = entries[i].nextEntryTime ? moment(entries[i].nextEntryTime) : null;
                var reenterClass = 'reenter-never';
                if (nextEntryTime != null) {
                    var diff = nextEntryTime.diff(now, "seconds");
                    if (diff > 0) {
                        min = Math.min(min, diff);
                    }
                    reenterClass = now.isAfter(nextEntryTime) ? 'reenter-now' : 'reenter-later';
                }
                $('[data-competition-toggle="' + campaign + '"]').addClass('competition-entered ' + reenterClass);
                link.prop('href', powerlink);
                if (!link.data("ga-event-attached")) {
                    link.click(function () {
                        gah.event("Powerlink", "click", $(this).data('powerlink'));
                    });
                    link.data("ga-event-attached", true);
                }
            }

            if (reenterTimerId) {
                clearTimeout(reenterTimerId);
            }
            reenterTimerId = setTimeout(controller.redraw, (min * 1000) + 2001);

            if (!nostore) {
                storage.set("entries", JSON.stringify(entries));
            }
        },

        redraw: function () {
            var profileVal = storage.get("profile", null);
            var entriesVal = storage.get("entries", null);
            var profile = profileVal ? JSON.parse(profileVal) : null;
            var entries = entriesVal ? JSON.parse(entriesVal) : [];
            controller.setEntries(entries, true);
            controller.setProfile(profile, true);
        },

        contactUs: function () {
            var formData = form.serialize(form.contactUs);
            formData['_subject'] = formData['_subject'] + ' ' + formData['name'];
            formData['UserAgent'] = window.navigator.userAgent;
            if (form.contactUs.get(0).checkValidity() === true) {
                form.busy(true);
                $.ajax({
                    url: "https://formspree.io/info@buyexpressly.com",
                    method: "POST",
                    data: formData,
                    dataType: "json",
                    success: function (data) {
                        window.location.href = form.contactUs.attr("action");
                        form.busy(false);
                    },
                    error: function (xhr, status, errorC) {
                        form.busy(false);
                        modal.notify(
                            "Error Sending Message",
                            "Oops! Looks like something went wrong trying to send your message");
                        printError(xhr, status, errorC);
                    }
                });
            }
            form.contactUs.toggleClass('was-validated', true);
        }
    };

    function printSuccess(result) {
        console.log('result');
        console.log(result);
    }

    function printError(xhr) {
        console.log('error');
        console.log(xhr.responseText);
        if (url.parameter('debug')) {
            alert(xhr.responseText);
        }
    }

    var server = {
        login: function (payload) {
            server.setToken(null);
            controller.setProfile(null);
            server.submit("account/login", "POST", payload,
                function (data) {
                    modal.login.modal('hide');
                    form.toggleFeedback('form--login', 'password', false);
                    server.setToken(data.token);
                    controller.setProfile(data.account);
                    gah.event('Account', 'login-success');
                },
                function (xhr) {
                    if (xhr.status === 401) {
                        form.toggleFeedback('form--login', 'password', true);
                    }
                }, true);
        },

        loginWithToken: function (token) {
            server.submit("account/login-with-token", "POST", {token: token, rememberMe: true},
                function (data) {
                    server.setToken(data.token);
                    controller.setProfile(data.account);
                    url.removeParameter('alt');
                },
                function(xhr) {
                    url.removeParameter('alt');
                });
        },

        logout: function () {
            server.submit("account/logout", "POST", null,
                function () {
                    server.setToken(null);
                    controller.setProfile(null);
                    gah.event('Account', 'logout-success');
                },
                printError);
        },

        passwordResetRequest: function (payload, closeDialog) {
            server.submit("account/password-reset-request", "POST", payload, function () {
                    if (closeDialog) {
                        modal.passwordResetRequest.one('hidden.bs.modal', function () {
                            modal.notify(
                                "Password Reset Email Sent",
                                "Please check your email for your password reset link")
                        });
                        modal.passwordResetRequest.modal('hide');
                    } else {
                        modal.notify(
                            "Password Reset Email Sent",
                            "Please check your email for your password reset link")
                    }
                    gah.event('Account', 'password-reset-success');
                },
                function (xhr, status, error) {
                    modal.passwordResetRequest.modal('hide');
                    gah.event('Account', 'password-reset-failure');
                    printError(xhr, status, error);
                });
        },

        passwordReset: function (token, newPassword) {
            server.submit("account/password-reset", "POST", {token: token, newPassword: newPassword},
                function (data) {
                    modal.passwordReset.one('hidden.bs.modal', function() {
                        modal.notify(
                            "Password Reset",
                            "Your password has been changed");
                    });
                    modal.passwordReset.modal('hide');
                    server.setToken(data.token);
                    controller.setProfile(data.account);
                    url.removeParameter('token');
                    gah.event('Account', 'password-change-success');
                },
                function (xhr, status, error) {
                    printError(xhr, status, error);
                    if (xhr.status === 403) {
                        modal.passwordReset.one('hidden.bs.modal', function() {
                            modal.notify(
                                "Password Reset Link Expired",
                                "Your password reset link has either expired or been used. Please try signing in or resetting your password again.");
                        });

                        modal.passwordReset.modal('hide');
                    } else {
                        form.toggleFeedback('form--password-reset', 'newPassword', true);
                    }
                });
        },

        exists: function (email) {
            server.submit("account/exists", "POST", {email: email}, printSuccess, printError);
        },

        profile: function (postSuccess) {
            server.submit("account/profile", "GET", null,
                function (data) {
                    controller.setProfile(data);
                    if (postSuccess) {
                        postSuccess(data);
                    }
                },
                function (xhr, status, error) {
                    printError(xhr, status, error);
                    controller.setProfile(null);
                    if (postSuccess) {
                        postSuccess(null);
                    }
                });
        },

        update: function (payload) {
            server.submit("account/update", "POST", payload,
                function (data) {
                    controller.setProfile(data);
                    form.profile.toggleClass('was-validated', false);
                    form.toggleFeedback('form--profile', 'currentPassword', false);
                    form.toggleFeedback('form--profile', 'email', false);
                    gah.event('Account', 'profile-update-success');
                    modal.notify(
                        "Profile updated",
                        "Your profile has been updated")
                },
                function (xhr, status, error) {
                    if (xhr.status === 403) {
                        form.toggleFeedback('form--profile', 'currentPassword', true, "Wrong password");
                        return;
                    } else if (xhr.status === 400) {
                        var code = JSON.parse(xhr.responseText).code;
                        if (code === 'DUPLICATE_EMAIL') {
                            form.toggleFeedback('form--profile', 'email', true, "Email address already in use");
                            return
                        }
                    }
                    gah.event('Account', 'profile-update-failure');
                    printError(xhr, status, error);
                });
        },

        unsubscribe: function (redirectTo) {
            server.submit("account/unsubscribe", "POST", {},
                function (data) {
                    controller.setProfile(data);
                    gah.event('Account', 'unsubscribe');
                    modal.flashNotification(
                        "Unsubscribed",
                        "You have been unsubscribed from the newsletter. To opt back in please go to My Account.");
                    window.location.replace(redirectTo);
                },
                function (xhr, status, error) {
                    modal.notify(
                        "Something went wrong!",
                        "We were unable to unsubscribe you. Please use the contact us form to unsubscribe.");
                    printError(xhr, status, error);
                });
        },

        register: function (payload) {
            server.submit("account/register", "POST", payload,
                function (data) {
                    modal.register.modal('hide');
                    server.setToken(data.token);
                    controller.setProfile(data.account);
                    gah.event('Account', 'register-success');
                },
                function (xhr, status, error) {
                    if (xhr.status === 400) {
                        var json = JSON.parse(xhr.responseText);
                        var code = json.code;
                        var description = json.description;
                        if (code === 'DUPLICATE_EMAIL') {
                            form.toggleFeedback('form--register', 'email', true, "Email address already registered. Please sign up or use a different email address");
                            return
                        }
                        if (code === 'VALIDATION_FAILED' && description === 'Invalid email address') {
                            form.toggleFeedback('form--register', 'email', true, "Please enter a valid email address");
                            return
                        }
                    }
                    gah.event('Account', 'register-failure');
                    printError(xhr, status, error);
                });
        },

        submitEntry: function (payload, noUpdateEntries) {
            var campaign = payload.campaign;
            delete payload['campaign'];
            server.submit("competition/" + campaign + "/enter", "POST", payload,
                function (data) {
                    form.busy(true);
                    server.setToken(data.token);
                    controller.setProfile(data.account, false, noUpdateEntries);
                    gah.event('Powerlink', 'entry-success', campaign);
                    window.location.href = url.addSourceParameter(data.powerLink);
                },
                function (xhr, status, error) {
                    if (xhr.status === 400 || xhr.status === 401) {
                        var json = JSON.parse(xhr.responseText);
                        var code = json.code;
                        var description = json.description;
                        if (code === 'DUPLICATE_EMAIL') {
                            //modal.notify("Email Registered", "<p>Please log in to enter the compeition</p>");
                            form.toggleFeedback('form--competition', 'email', true, "Please login to enter competition");
                            return
                        }
                        else if (code === 'CLUB_ACCOUNT_ALREADY_ENTERED') {
                            modal.notify("Duplicate Entry", "<p>We're sorry but you've already entered this competition</p>");
                            form.toggleFeedback('form--competition', 'email', true, "You've already entered into competition");
                            return
                        }
                        else if (code === 'CLUB_EMAIL_ALREADY_ENTERED') {
                            modal.notify("Duplicate Entry", "<p>Email address has already been entered into competition</p>");
                            form.toggleFeedback('form--competition', 'email', true, "Email address already entered into competition");
                            return
                        }
                        else if (code === 'VALIDATION_FAILED' && description === 'Invalid email address') {
                            form.toggleFeedback('form--competition', 'email', true, "Please enter a valid email address");
                            return
                        } else {
                            if(sessionStorage.getItem('failed.' + campaign) !== 'true') {
                                gah.event('Powerlink', 'entry-failure', campaign);
                                sessionStorage.setItem('failed.' + campaign, 'true');
                            }
                        }
                    } else {
                        if(sessionStorage.getItem('failed.' + campaign) !== 'true') {
                            gah.event('Powerlink', 'entry-failure', campaign);
                            sessionStorage.setItem('failed.' + campaign, 'true');
                        }
                    }
                    printError(xhr, status, error);
                });
        },

        submitEntryAgain: function (campaign, payload) {
            server.submit("competition/" + campaign + "/enter-again", "POST", payload,
                function (data) {
                    form.busy(true);
                    server.setToken(data.token);
                    controller.setProfile(data.account, false, false);
                    gah.event('Powerlink', 'entry-success', campaign);
                    window.location.href = url.addSourceParameter(data.powerLink);
                    form.busy(false);
                },
                function (xhr, status, error) {
                    if(sessionStorage.getItem('failed.' + campaign) !== 'true') {
                        gah.event('Powerlink', 'entry-failure', campaign);
                        sessionStorage.setItem('failed.' + campaign, 'true');
                    }
                    printError(xhr, status, error);
                });
        },

        entries: function () {
            server.submit("competition/entries", "GET", null,
                function (data) {
                    controller.setEntries(data);
                }, printError);
        },

        submit: function (uri, method, payload, success, error, noCredentials) {
            form.busy(true);
            $.ajax({
                url: protocol + "//prod.expresslyapp.com/api/club/" + muid + "/" + uri + "?cb=" + new Date().getTime() + "",
                type: method,
                data: payload ? JSON.stringify(payload) : null,
                contentType: "application/json",
                xhrFields: {withCredentials: !noCredentials},
                headers: server.getAuthHeader(),
                statusCode: {
                    401: function () {
                        form.busy(false);
                        server.setToken(null);
                        controller.setProfile(null);
                        controller.loginRequired();
                    }
                },
                success: function (data) {
                    form.busy(false);
                    if (success) {
                        success(data);
                    }
                    else {
                        printSuccess(data);
                    }
                },
                error: function (xhr, status, errorC) {
                    form.busy(false);
                    if (error) {
                        error(xhr, status, errorC);
                    }
                    else {
                        printError(xhr, status, errorC);
                    }
                }
            });
        },

        getToken: function() {
            return storage.get("token", null);
        },

        setToken: function(token) {
            if (!!token) {
                storage.set("token", token);
            } else {
                storage.remove("token");
            }
            server.setMigrationStatus("none");
        },

        hasToken: function() {
            var token = server.getToken();
            return !!token && token.length > 0;
        },

        getAuthHeader: function() {
            return server.hasToken() ? {'Authorization' : server.getToken() } : {};
        },

        setMigrationStatus: function(status) {
            if (server.getMigrationStatus() !== 'none') {
                storage.set("migrated", status);
            }
        },

        shouldCheckProfileForMigrated: function() {
            var status = server.getMigrationStatus();
            return domainMigrationsEnabled && (!status || status === 'no-token');
        },

        getMigrationStatus: function() {
            return storage.get('migrated', 'none');
        }
    };

    var addressAutoComplete = {
        componentForm: {
            street_number: 'short_name',
            route: 'long_name',
            postal_town: 'long_name',
            locality: 'long_name',
            postal_code: 'short_name',
            country: 'short_name'
        },

        init: function() {
            $('.address-autocomplete').each(function () {
                var $this = $(this);
                $this.focus(addressAutoComplete.initOnFocus);

                var reconstitute = function () {
                    var address = [fields.addressLine1.val(), fields.addressLine2.val(), fields.city.val(), fields.postalCode.val()];
                    $this.val(arrays.filter(address, function (v) {
                        return !!v && v.trim() !== ""
                    }).join(", "))
                };

                var fields = addressAutoComplete.getFields($this);
                fields.addressLine1.change(reconstitute);
                fields.addressLine2.change(reconstitute);
                fields.city.change(reconstitute);
                fields.postalCode.change(reconstitute);
                reconstitute();
            });
        },

        getFields: function($this) {
            var prefix = $this.data('prefix');
            return {
                addressLine1: $('#' + prefix + 'addressLine1'),
                addressLine2: $('#' + prefix + 'addressLine2'),
                locality: $('#' + prefix + 'city'),
                city: $('#' + prefix + 'city'),
                postalCode: $('#' + prefix + 'postalCode'),
                country: $('#' + prefix + 'country')
            };
        },

        initOnFocus: function () {
            var $this = $(this);
            $this.unbind( "focus", addressAutoComplete.initOnFocus);

            var countries = $('#form--competition').data('countries');
            if (!countries) {
                countries = $(document.body).data('countries');
            }
            if (!countries) {
                countries = ['GB'];
            }

            var autocomplete = new google.maps.places.Autocomplete(
                this,
                {   types: ['address'],
                    fields: ['address_components', 'formatted_address'],
                    componentRestrictions: {country: countries}});

            var fields = addressAutoComplete.getFields($this);
            autocomplete.addListener('place_changed', function () {
                addressAutoComplete.fillInAddress(
                    fields,
                    autocomplete);
            });

            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(function (position) {
                    var geolocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    var circle = new google.maps.Circle({center: geolocation, radius: position.coords.accuracy});
                    autocomplete.setBounds(circle.getBounds());
                });
            }
        },

        collectPlaceData: function (place) {
            var data = {};
            for (var i = 0; i < place.address_components.length; i++) {
                var addressType = place.address_components[i].types[0];
                if (addressAutoComplete.componentForm[addressType]) {
                    data[addressType] = place.address_components[i][addressAutoComplete.componentForm[addressType]];
                }
            }
            return data;
        },

        fillInAddress: function (fields, autocomplete) {
            var data = addressAutoComplete.collectPlaceData(autocomplete.getPlace());
            fields.addressLine1.val((strings.nullToEmpty(data['street_number']) + ' ' + strings.nullToEmpty(data['route'])).trim());
            fields.addressLine2.val('');
            var city = strings.nullToEmpty(data['postal_town']);
            if (city === '') {
                city = strings.nullToEmpty(data['locality']);
            }
            fields.city.val(city);
            fields.postalCode.val(strings.nullToEmpty(data['postal_code']));
            var country = strings.nullToEmpty(data['country']);
            if (country === '') {
                country = 'GB';
            }
            fields.country.val(country);
        },

        // Bias the autocomplete object to the user's geographical location,
        // as supplied by the browser's 'navigator.geolocation' object.
        geolocate: function () {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(function (position) {
                    var geolocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    var circle = new google.maps.Circle({center: geolocation, radius: position.coords.accuracy});
                    autocomplete.setBounds(circle.getBounds());
                });
            }
        }
    };

    var dobControl = {
        init: function () {
            $('.dob-control').each(function () {
                var $this = $(this);
                var target = $($this.data('target'));
                var inputs = $this.find('.dob-control-input');

                var syncFromValue = function () {
                    if (/\d{4}-\d{2}-\d{2}/.test(target.val())) {
                        $(inputs[0]).val(target.val().substring(8));
                        $(inputs[1]).val(target.val().substring(5, 7));
                        $(inputs[2]).val(target.val().substring(0, 4));
                    }
                };

                target.change(syncFromValue);
                syncFromValue();

                var pad = function (value) {
                    return value.length === 1
                        ? '0' + value
                        : value;
                };

                inputs.change(function () {
                    target.val(
                        $(inputs[2]).val() + '-' +
                        pad($(inputs[1]).val()) + '-' +
                        pad($(inputs[0]).val()));
                });

                inputs.keypress(function (event) {
                    var target = $(event.target);
                    var length = parseInt(target.attr('maxlength'));
                    var inp = String.fromCharCode(event.keyCode);

                    target.data("prev-val", target.val());
                    if (/[0-9]/.test(inp) && target.val().length >= length) {
                        event.preventDefault();
                    }
                    if (inp === '/' && length === 2) {
                        var next = target.nextAll('input')[0];
                        next.focus();
                    }
                });


                inputs.keyup(function (event) {
                    var target = $(event.target);
                    var length = parseInt(target.attr('maxlength'));
                    var inp = String.fromCharCode(event.keyCode);

                    if (!/[0-9]*/.test(target.val()) || target.val().length > length) {
                        target.val(target.data("prev-val"));
                        return;
                    }

                    if (/[0-9]/.test(inp) && length === 2 && target.val().length === length) {
                        var next = target.nextAll('input')[0];
                        next.focus();
                    }
                });
            });
        }
    };

    var expirables = {
        controls: $('[data-expiration]'),
        parse: function (el) {
            return moment($(el).data('expiration'));
        },
        nextExpiration: function () {
            var min = moment().add(1, 'day').diff(moment(), "seconds");
            expirables.controls.each(function () {
                $this = $(this);
                var diff = expirables.parse($this).diff(moment(), "seconds");
                if (!$this.hasClass("is-expired")) {
                    min = Math.max(Math.min(min, diff), 0);
                }
            });
            return min * 1000;
        },
        update: function () {
            var nextUpdate = expirables.nextExpiration();
            var now = moment();
            expirables.controls.each(function () {
                var expires = expirables.parse(this);
                if (now.isAfter(expires)) {
                    $(this).addClass("is-expired");
                }
            });
            setTimeout(expirables.update, nextUpdate + 1000);
        }
    };

    function registerEvents() {
        $('form').on('keyup keypress', function(e) {
            var keyCode = e.keyCode || e.which;
            if (keyCode === 13) {
                e.preventDefault();
                return false;
            }
        });
        $(window).bind('storage', function () {
            controller.redraw();
        });
        $('#action--register').click(function (event) {
            event.preventDefault();
            controller.register();
        });
        $('.action--logout').click(function (event) {
            event.preventDefault();
            controller.logout();
        });
        $('#action--login').click(function (event) {
            event.preventDefault();
            controller.login();
        });
        $('#action--password-reset-request').click(function (event) {
            event.preventDefault();
            controller.passwordResetRequest();
        });
        $('#action--login-to-signup').click(function (event) {
            event.preventDefault();
            modal.login.one('hidden.bs.modal', function() {
                modal.register.modal('show');
            });
            modal.login.modal('hide');
        });
        $('#action--login-to-reset').click(function (event) {
            event.preventDefault();
            modal.login.one('hidden.bs.modal', function() {
                modal.passwordResetRequest.modal('show');
            });
            modal.login.modal('hide');
            $('#form--password-reset-request--email').val($('#form--login--email').val());
        });
        $('#action--password-reset').click(function (event) {
            event.preventDefault();
            controller.passwordReset();
        });
        $('#action--profile').click(function (event) {
            event.preventDefault();
            controller.updateProfile();
        });
        $('#action--profile--password-reset-request').click(function (event) {
            event.preventDefault();
            controller.passwordResetRequestLoggedIn();
        });
        $('#action--enter').click(function (event) {
            event.preventDefault();
            controller.submitEntry();
        });
        $('#action--contact-us').click(function (event) {
            event.preventDefault();
            controller.contactUs();
        });
        $('#action--unsubscribe').click(function (event) {
            event.preventDefault();
            var el = $(event.target);
            server.unsubscribe(el.data('redirect'));
        });
        $('[data-powerlink-auto="true"]').click(function (event) {
            event.preventDefault();
            if (!$('body').hasClass('busy')) {
                var el = $(event.target);
                controller.autoPowerLink(el.data('powerlink'), el.data('campaign-title'));
            }
        });
        $('[data-reenter]').click(function (event) {
            event.preventDefault();
            if (!$('body').hasClass('busy')) {
                var el = $(event.target);
                controller.submitEntryAgain(el.data('reenter'), el.data('campaign-title'));
            }
        });
        $('.card-sorter').change(function () {
            var selected = $($(this).find(":selected"));
            var source = selected.data("source");
            var direction = selected.data("direction");
            $('#competition-cards').find('.competition-card').sort(function (a, b) {
                var l = $(direction === 'asc' ? a : b);
                var r = $(direction === 'asc' ? b : a);
                var lp = $(a).hasClass('promoted') ? -1 : 1;
                var rp = $(b).hasClass('promoted') ? -1 : 1;
                var result = lp - rp;
                if (result === 0) {
                    result = l.data(source) - r.data(source);
                }
                if (result === 0) {
                    result = l.data('competition-toggle').localeCompare(r.data('competition-toggle'));
                }
                return result;
            }).appendTo('#competition-cards');
        });
        $('.card-filter').change(function () {
            var selected = $($(this).find(":selected"));
            var filter = selected.data("filter");
            var container = $('#competition-cards');
            if (filter) {
                container.find('[data-category]').hide();
                container.find('[data-category="' + filter + '"]').show();
            } else {
                container.find('[data-category]').show();
            }
        });
        expirables.update();

        $('.terms-dynamic').each(function() {
            var el = $(this);
            var a = $(el.find('a').one()).clone();
            a.text("Terms and Conditions.");
            el.html('');
            el.append(a);
        });
        $('[data-pdf-source]').click(function() {
            var $this = $(this);
            var page_width = $this.data('page-width');
            var page_height = $this.data('page-height');

            if(isNaN(page_width)) {
                page_width = 293;
            }

            if(isNaN(page_height)) {
                page_height = 350;
            }

            var page_content_width = page_width - 30;

            var doc = new jsPDF('p', 'mm', [page_width, page_height]);
            doc.fromHTML($('#' + $this.data('pdf-source')).html().replace(/[^\x00-\x7F]/g, ""), 15, 15, {width: page_content_width});
            var fileName = $this.data("pdf-title");
            if(fileName === undefined) {
                fileName = 'compeition-rules.pdf';
            }
            doc.save(fileName);
        });
    }

    // init
    $(function () {
        url.storeReferrer();
        registerEvents();
        $('[data-toggle="tooltip"]').tooltip();
        dobControl.init();
        controller.redraw();

        if (url.parameter("alt")) {
            server.loginWithToken(url.parameter("alt"));
        } else if (server.hasToken() || server.shouldCheckProfileForMigrated()) {
            server.profile(function () {
                if (url.parameter("token")) {
                    modal.passwordReset.modal('show');
                }
            });
        } else {
            if (url.parameter("token")) {
                modal.passwordReset.modal('show');
            }
        }

        modal.unflashNotification();
    }());

    return {
        initAutocomplete: function () {
            addressAutoComplete.init();
        },

        matchProtocol: function (value) {
            /* add this code if you want compatibility with IE9
            <!--[if IE 9]>
            <script>
                microsite.matchProtocol(true);
            </script>
            <![endif]-->
            */
            protocol = value === true ? window.location.protocol : 'https:';
        }
    };
}();

// Fix for conflict with FastClick and Places
$(function () {
    if (navigator.userAgent.match(/(iPad|iPhone|iPod)/g)) {
        setTimeout(function () {
            var container = document.getElementsByClassName('pac-container')[0];
            container.addEventListener('touchend', function (e) {
                e.stopImmediatePropagation();
            });
        }, 500);
    }
    var doc = document.documentElement;
    doc.setAttribute('data-useragent', navigator.userAgent);
});
