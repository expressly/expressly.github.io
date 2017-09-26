var microsite = function () {
    $.support.cors = true;
    var protocol = 'https:';
    var email = $('#email');
    var postcode = $('#postal_code');
    var phone = $('#phone');

    function submit() {
        if (validate()) {
            precacheAndRedirect(buildPayload());
        }
    }

    function buildPayload() {
        var firstName = $('#first-name').val();
        var lastName = $('#last-name').val();
        var streetNo = $('#street_number').val();
        var streetName = $('#route').val();

        return {
            merchantUuid: $('#merchant').val(),
            campaigns: [$('#campaign').val()],
            email: email.val(),
            fullName: firstName + ' ' + lastName,
            forename: firstName,
            surname: lastName,
            address1: streetNo + ' ' + streetName,
            city: $('#postal_town').val(),
            zip: postcode.val(),
            country: 'GB',
            phone: phone.val(),
            gender: $('#gender').val(),
            source: document.referrer
        };
    }

    function precacheAndRedirect(payload) {
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
                alert("Oops, something went wrong with your submission. Please try again.");
            }
        });
    }

    function globalError(message) {
        var error = $('#global-error');
        error.html(message);
        error.toggleClass("error-hidden", !message);
    }

    var validators = [
        vrValidateRequired,
        vrValidateEmailField,
        vrValidatePhoneUk,
        vrValidatePostCode,
        vrCheckAge,
        vrCheckTerms
    ];

    function validate() {
        globalError();
        $('.field-error').removeClass('field-error');

        for (var i = 0; i < validators.length; ++i) {
            var error = validators[i]();
            if (error) {
                globalError(error);
                return false;
            }
        }

        return true;
    }

    function validateRegex(field, regex) {
        var result = regex.test(field.val());
        field.toggleClass('field-error', !result);
        return result;
    }

    function validateCheckbox(field) {
        var result = field.prop('checked');
        field.toggleClass('field-error', !result);
        return result;
    }

    function vrValidateRequired() {
        var valid = true;
        $('.required').each(function () {
            if ($(this).val() === '') {
                $(this).addClass('field-error');
                valid = false;
            }
        });
        return valid ? '' : 'Please ensure all fields are filled';
    }

    function vrValidatePostCode() {
        return validateRegex(postcode, /^((?:(?:gir)|(?:[a-pr-uwyz])(?:(?:[0-9](?:[a-hjkpstuw]|[0-9])?)|(?:[a-hk-y][0-9](?:[0-9]|[abehmnprv-y])?)))) ?([0-9][abd-hjlnp-uw-z]{2})$/i)
            ? ''
            : 'Please enter a valid UK postcode';
    }

    function vrValidatePhoneUk() {
        return validateRegex(phone, /^(0|\+44|0044)\s*[1235789]\s*([0-9]\s*){9}$/)
            ? ''
            : 'Please enter a valid UK phone number';
    }

    function vrValidateEmailField() {
        return validateRegex(email, /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)
            ? ''
            : 'Please enter a valid email address';
    }

    function vrCheckAge() {
        return validateCheckbox($('#age-confirmation'))
            ? ''
            : 'Please confirm your age';
    }

    function vrCheckTerms() {
        return validateCheckbox($('#term-confirmation'))
            ? ''
            : 'Please accept the terms and conditions';
    }

    var autocomplete;

    function showAddressFields() {
        $('.hidden-field').removeClass('hidden-field');
    }

    var componentForm = {
        street_number: 'short_name',
        route: 'long_name',
        postal_town: 'long_name',
        postal_code: 'short_name'
    };

    function fillInAddress() {
        // Get the place details from the autocomplete object.
        var place = autocomplete.getPlace();

        for (var component in componentForm) {
            document.getElementById(component).value = '';
            document.getElementById(component).disabled = false;
        }

        // Get each component of the address from the place details
        // and fill the corresponding field on the form.
        for (var i = 0; i < place.address_components.length; i++) {
            var addressType = place.address_components[i].types[0];
            if (componentForm[addressType]) {
                document.getElementById(addressType).value = place.address_components[i][componentForm[addressType]];
            }
        }
    }

    // Bias the autocomplete object to the user's geographical location,
    // as supplied by the browser's 'navigator.geolocation' object.
    function geolocate() {
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

    function registerEvents() {
        $('#show-fields').click(showAddressFields);
        $('#nife-contact-form').submit(function (event) {
            event.preventDefault();
            submit();
        });
        $('#autocomplete').focus(geolocate);
    }

    registerEvents();

    return {
        initAutocomplete: function () {
            autocomplete = new google.maps.places.Autocomplete(
                document.getElementById('autocomplete'),
                {
                    types: ['address'],
                    componentRestrictions: {country: "uk"}
                });
            autocomplete.addListener('place_changed', function () {
                fillInAddress();
                showAddressFields();
            });
        },

        matchProtocol: function(value) {
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
$(function() {
    if (navigator.userAgent.match(/(iPad|iPhone|iPod)/g)) {
        setTimeout(function() {
            var container = document.getElementsByClassName('pac-container')[0];
            container.addEventListener('touchend', function(e) {
                e.stopImmediatePropagation();
            });
        }, 500);
    }
    var doc = document.documentElement;
    doc.setAttribute('data-useragent', navigator.userAgent);
});