/** v1.01 **/
var club = function () {
    $.support.cors = true;
    var muid = $('body').data('muid');
    var protocol = 'https:';

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

        serialize: function (form) {
            var data = form.serializeArray();
            var result = {};
            $.map(data, function (o) {
                result[o['name']] = o['value'];
            });
            return result;
        },

        populate: function (form, data, trigger) {
            if (form.length) {
                $.each(data, function (key, value) {
                    var ctrl = $('[name=' + key + ']', form);
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

                window.location.replace(parts[0] + (tokens.length > 0 ? '?' + tokens.join('&') : ''));
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

        passwordResetRequest: function () {
            if (form.passwordResetRequest.get(0).checkValidity() === true) {
                var formData = form.serialize(form.passwordResetRequest);
                server.passwordResetRequest(formData);
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
                    server.submitEntry(formData);
                }
            } else if (form.competition.find('.address-fields input:invalid').length > 0) {
                $('#form--competition--address-fields').collapse('show');
            }
            form.competition.toggleClass('was-validated', true);
        },

        autoPowerLink: function (cuid) {
            if (state.profile) {
                var payload = Object.assign({}, state.profile);
                delete payload['registrationCompleted'];
                delete payload['resetPassword'];
                payload.campaign = cuid;
                payload.optin = false;
                server.submitEntry(payload);
            } else {
                modal.login.modal('show');
            }
        },

        storeProfile: function (profile) {
            if (typeof(Storage) !== "undefined") {
                if (profile !== null) {
                    localStorage.setItem("profile." + muid, JSON.stringify(profile));
                } else {
                    localStorage.removeItem("profile." + muid);
                }
                localStorage.setItem("signedIn." + muid, profile !== null);
            }
        },
        setProfile: function (profile, nostore) {
            state.profile = profile;
            if (!nostore) {
                controller.storeProfile(profile);
            }
            $('body').toggleClass("logged-in", profile !== null);
            $('.data-forename').text(profile !== null ? profile.forename : '');
            $('.disable-if-logged-in').prop("disabled", profile !== null);
            if (profile !== null) {
                form.populate(form.competition, profile, true);
                form.populate(form.profile, profile, true);
                if (!nostore) {
                    server.entries();
                }
            } else {
                controller.setEntries([]);
            }
        },
        setEntries: function (entries, nostore) {
            $('body').toggleClass('entered-at-least-one', entries.length > 0);
            $('.competition-entered').removeClass('competition-entered');

            for (var i = 0; i < entries.length; ++i) {
                $('[data-competition-toggle="' + entries[i]['campaignUuid'] + '"]').addClass('competition-entered');
                $('[data-powerlink="' + entries[i]['campaignUuid'] + '"]').prop('href', entries[i]['powerLink']);
            }

            if (typeof(Storage) !== "undefined" && !nostore) {
                localStorage.setItem("entries." + muid, JSON.stringify(entries));
            }
        },
        redraw: function () {
            if (typeof(Storage) !== "undefined") {
                var profileVal = localStorage.getItem("profile." + muid);
                var entriesVal = localStorage.getItem("entries." + muid);
                var profile = profileVal ? JSON.parse(profileVal) : null;
                var entries = entriesVal ? JSON.parse(entriesVal) : [];
                controller.setEntries(entries, true);
                controller.setProfile(profile, true);
            }
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
            server.submit("account/login", "POST", payload,
                function (data) {
                    modal.login.modal('hide');
                    form.toggleFeedback('form--login', 'password', false);
                    server.setToken(data.token);
                    controller.setProfile(data.account)
                },
                function (xhr) {
                    if (xhr.status === 401) {
                        form.toggleFeedback('form--login', 'password', true);
                    }
                });
        },

        logout: function () {
            server.submit("account/logout", "POST", null,
                function () {
                    server.setToken(null);
                    controller.setProfile(null)
                },
                printError);
        },

        passwordResetRequest: function (payload) {
            server.submit("account/password-reset-request", "POST", payload, function () {
                    modal.passwordResetRequest.modal('hide');
                    modal.notify(
                        "Password Reset Email Sent",
                        "Please check your email for your password reset link")
                },
                function (xhr, status, error) {
                    modal.passwordResetRequest.modal('hide');
                    printError(xhr, status, error);
                });
        },

        passwordReset: function (token, newPassword) {
            server.submit("account/password-reset", "POST", {token: token, newPassword: newPassword},
                function (data) {
                    modal.passwordReset.modal('hide');
                    controller.setProfile(data.account);
                    url.removeParameter('token');
                    modal.notify(
                        "Password Reset",
                        "Your password has been changed")
                },
                function (xhr, status, error) {
                    printError(xhr, status, error);
                    if (xhr.status === 403) {
                        // url.removeParameter('token');
                        modal.passwordReset.modal('hide');
                        modal.notify(
                            "Password Reset Link Expired",
                            "Your password reset link has either expired or been used. Please try signing in or resetting your password again.")
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
                    printError(xhr, status, error);
                });
        },

        register: function (payload) {
            server.submit("account/register", "POST", payload,
                function (data) {
                    modal.register.modal('hide');
                    server.setToken(data.token);
                    controller.setProfile(data.account)
                },
                function (xhr, status, error) {
                    if (xhr.status === 400) {
                        var code = JSON.parse(xhr.responseText).code;
                        if (code === 'DUPLICATE_EMAIL') {
                            form.toggleFeedback('form--register', 'email', true, "Email address already registered. Please sign up or use a different email address");
                            return
                        }
                    }
                    printError(xhr, status, error);
                });
        },

        submitEntry: function (payload) {
            var campaign = payload.campaign;
            delete payload['campaign'];
            server.submit("competition/" + campaign + "/enter", "POST", payload,
                function (data) {
                    form.busy(true);
                    server.setToken(data.token);
                    controller.setProfile(data.account);
                    window.location.href = data.powerLink;
                },
                function (xhr, status, error) {
                    if (xhr.status === 400) {
                        var code = JSON.parse(xhr.responseText).code;
                        if (code === 'DUPLICATE_EMAIL') {
                            modal.notify("Email Registered", "<p>Please log in to enter the compeition</p>");
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

        submit: function (uri, method, payload, success, error) {
            form.busy(true);
            $.ajax({
                url: protocol + "//prod.expresslyapp.com/api/club/" + muid + "/" + uri,
                type: method,
                data: payload ? JSON.stringify(payload) : null,
                contentType: "application/json",
                xhrFields: {withCredentials: true},
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
            if (typeof(Storage) !== "undefined") {
                return localStorage.getItem("token." + muid);
            }
            return null;
        },

        setToken: function(token) {
            if (typeof(Storage) !== "undefined") {
                if (!!token) {
                    localStorage.setItem("token." + muid, token);
                } else {
                    localStorage.removeItem("token." + muid);
                }
            }
        },

        hasToken: function() {
            var token = server.getToken();
            return !!token && token.length > 0;
        },

        getAuthHeader: function() {
            return server.hasToken() ? {'Authorization' : server.getToken() } : {};
        }
    };

    var addressAutoComplete = {
        componentForm: {
            street_number: 'short_name',
            route: 'long_name',
            postal_town: 'long_name',
            postal_code: 'short_name'
        },

        init: function () {
            $('.address-autocomplete').each(function () {
                var $this = $(this);
                var prefix = $this.data('prefix');

                var autocomplete = new google.maps.places.Autocomplete(
                    this,
                    {types: ['address'], componentRestrictions: {country: "uk"}});

                var fields = {
                    addressLine1: $('#' + prefix + 'addressLine1'),
                    addressLine2: $('#' + prefix + 'addressLine2'),
                    city: $('#' + prefix + 'city'),
                    postalCode: $('#' + prefix + 'postalCode')
                };

                autocomplete.addListener('place_changed', function () {
                    addressAutoComplete.fillInAddress(
                        fields,
                        autocomplete);
                });

                var reconstitute = function () {
                    var address = [fields.addressLine1.val(), fields.addressLine2.val(), fields.city.val(), fields.postalCode.val()];
                    $this.val(arrays.filter(address, function (v) {
                        return !!v && v.trim() !== ""
                    }).join(", "))
                };

                fields.addressLine1.change(reconstitute);
                fields.addressLine2.change(reconstitute);
                fields.city.change(reconstitute);
                fields.postalCode.change(reconstitute);
                reconstitute();
            });
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
            fields.city.val(strings.nullToEmpty(data['postal_town']));
            fields.postalCode.val(strings.nullToEmpty(data['postal_code']));
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
            modal.login.modal('hide');
            modal.register.modal('show');
        });
        $('#action--login-to-reset').click(function (event) {
            event.preventDefault();
            modal.login.modal('hide');
            $('#form--password-reset-request--email').val($('#form--login--email').val());
            modal.passwordResetRequest.modal('show');
        });
        $('#action--password-reset').click(function (event) {
            event.preventDefault();
            controller.passwordReset();
        });
        $('#action--profile').click(function (event) {
            event.preventDefault();
            controller.updateProfile();
        });
        $('#action--enter').click(function (event) {
            event.preventDefault();
            controller.submitEntry();
        });
        $('[data-powerlink-auto="true"]').click(function (event) {
            event.preventDefault();
            if (!$('body').hasClass('busy')) {
                controller.autoPowerLink($(event.target).data('powerlink'));
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
        $('.address_autocomplete').focus(addressAutoComplete.geolocate);
        expirables.update();
    }

    // init
    $(function () {
        registerEvents();
        $('[data-toggle="tooltip"]').tooltip();
        dobControl.init();
        controller.redraw();
        server.profile(function () {
            if (url.parameter("token")) {
                modal.passwordReset.modal('show');
            }
        });
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
