var microsite = function () {
    $.support.cors = true;
    var protocol = 'https:';

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
    var form = {
        competition: $('#form--competition'),

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
            return result;
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
        submit: function () {
            var formData = form.serialize(form.competition);
            form.toggleFeedback('form--competition', 'email', false);
            if (form.competition.get(0).checkValidity() === true) {
                formData.dob = dates.formatDateString(formData.dob);
                var over18 = dates.getYearsSince(dates.parseIso8601(formData.dob)) >= 18;
                form.toggleFeedback('form--competition', 'dob', !over18);
                if (over18) {
                    formData.campaigns = [formData['campaign']];
                    formData.address1 = formData['addressLine1'];
                    formData.address2 = formData['addressLine2'];
                    formData.zip = formData['postalCode'];
                    formData.source = document.referrer;
                    delete formData['campaign'];
                    delete formData['term-confirmation'];
                    delete formData['addressLine1'];
                    delete formData['addressLine2'];
                    delete formData['postalCode'];
                    server.submitEntry(formData);
                }
            } else if (form.competition.find('.address-fields input:invalid').length > 0) {
                $('#form--competition--address-fields').collapse('show');
            }
            form.competition.toggleClass('was-validated', true);
        }
    };

    var server = {
        submitEntry: function(payload) {
            form.busy(true);
            $.ajax({
                url: protocol + "//prod.expresslyapp.com/api/adserver/banner/precache",
                type: "POST",
                data: JSON.stringify(payload),
                contentType: "application/json",
                xhrFields: {
                    withCredentials: true
                },
                success: function (response) {
                    window.location.href = response.migrationLink;
                },
                error: function (e) {
                    console.log(e);
                    form.busy(false);
                    alert("Oops, something went wrong with your submission. Please try again.");
                }
            });
        }
    };

    function registerEvents() {
        $('#action--enter').click(function (event) {
            event.preventDefault();
            controller.submit();
        });
        $('.address_autocomplete').focus(addressAutoComplete.geolocate);
    }

    // init
    $(function () {
        registerEvents();
        dobControl.init();
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
