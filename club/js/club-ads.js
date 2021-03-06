$(function() {
    function position() {
        $('.ad-placement').each(function() {
            var position = $($(this).data('position')).first();
            if (position.next().get() !== this) {
                $(this).insertAfter(position);
            }
        });
    }

    $('.card-sorter').change(function() { setTimeout(position, 10); });
    $('.card-filter').change(function() { setTimeout(position, 10); });
    position();
});

(function () {
    var muid = document.body.getAttribute('data-muid');
    var personalAdKey = 'personalAds.' + muid;
    var TABLE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    var REGEX_SPACE_CHARACTERS = /[\t\n\f\r ]/g;
    var versionNumBits = 6;
    var vendorVersionMap = {
        /**
         * Version 1
         */
        1: {
            version: 1,
            metadataFields: ['version', 'created', 'lastUpdated', 'cmpId', 'cmpVersion', 'consentScreen', 'vendorListVersion'],
            fields: [{name: 'version', type: 'int', numBits: 6}, {
                name: 'created',
                type: 'date',
                numBits: 36
            }, {name: 'lastUpdated', type: 'date', numBits: 36}, {
                name: 'cmpId',
                type: 'int',
                numBits: 12
            }, {name: 'cmpVersion', type: 'int', numBits: 12}, {
                name: 'consentScreen',
                type: 'int',
                numBits: 6
            }, {name: 'consentLanguage', type: 'language', numBits: 12}, {
                name: 'vendorListVersion',
                type: 'int',
                numBits: 12
            }, {name: 'purposeIdBitString', type: 'bits', numBits: 24}, {
                name: 'maxVendorId',
                type: 'int',
                numBits: 16
            }, {name: 'isRange', type: 'bool', numBits: 1}, {
                name: 'vendorIdBitString',
                type: 'bits',
                numBits: function numBits(decodedObject) {
                    return decodedObject.maxVendorId;
                },
                validator: function validator(decodedObject) {
                    return !decodedObject.isRange;
                }
            }, {
                name: 'defaultConsent',
                type: 'bool',
                numBits: 1,
                validator: function validator(decodedObject) {
                    return decodedObject.isRange;
                }
            }, {
                name: 'numEntries',
                numBits: 12,
                type: 'int',
                validator: function validator(decodedObject) {
                    return decodedObject.isRange;
                }
            }, {
                name: 'vendorRangeList',
                type: 'list',
                listCount: function listCount(decodedObject) {
                    return decodedObject.numEntries;
                },
                validator: function validator(decodedObject) {
                    return decodedObject.isRange;
                },
                fields: [{
                    name: 'isRange',
                    type: 'bool',
                    numBits: 1
                }, {
                    name: 'startVendorId',
                    type: 'int',
                    numBits: 16
                }, {
                    name: 'endVendorId',
                    type: 'int',
                    numBits: 16,
                    validator: function validator(decodedObject) {
                        return decodedObject.isRange;
                    }
                }]
            }]
        }
    };

    var getCookie = function (name) {
        var value = "; " + document.cookie;
        var parts = value.split("; " + name + "=");
        if (parts.length === 2) return parts.pop().split(";").shift();
    };

    var setCookie = function (name, value, days) {
        var expires = "";
        if (days) {
            var date = new Date();
            date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + (value || "") + expires + "; path=/";
    };

    function repeat(count) {
        var string = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '0';

        var padString = '';

        for (var i = 0; i < count; i += 1) {
            padString += string;
        }

        return padString;
    }

    function padLeft(string, padding) {
        return repeat(Math.max(0, padding)) + string;
    }

    function _toConsumableArray(arr) {
        if (Array.isArray(arr)) {
            for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) {
                arr2[i] = arr[i];
            }
            return arr2;
        } else {
            return _arrayFrom(arr);
        }
    }

    function decodeField(_ref3) {
        var input = _ref3.input,
            output = _ref3.output,
            startPosition = _ref3.startPosition,
            field = _ref3.field;
        var type = field.type,
            numBits = field.numBits,
            decoder = field.decoder,
            validator = field.validator,
            listCount = field.listCount;

        if (typeof validator === 'function') {
            if (!validator(output)) {
                // Not decoding this field so make sure we start parsing the next field at
                // the same point
                return {newPosition: startPosition};
            }
        }

        if (typeof decoder === 'function') {
            return decoder(input, output, startPosition);
        }

        var bitCount = typeof numBits === 'function' ? numBits(output) : numBits;

        var listEntryCount = 0;
        if (typeof listCount === 'function') {
            listEntryCount = listCount(output);
        } else if (typeof listCount === 'number') {
            listEntryCount = listCount;
        }

        switch (type) {
            case 'int':
                return {fieldValue: decodeBitsToInt(input, startPosition, bitCount)};
            case 'bool':
                return {fieldValue: decodeBitsToBool(input, startPosition)};
            case 'date':
                return {fieldValue: decodeBitsToDate(input, startPosition, bitCount)};
            case 'bits':
                return {fieldValue: input.substr(startPosition, bitCount)};
            case 'list':
                return new Array(listEntryCount).fill().reduce(function (acc) {
                    var _decodeFields = decodeFields({
                            input: input,
                            fields: field.fields,
                            startPosition: acc.newPosition
                        }),
                        decodedObject = _decodeFields.decodedObject,
                        newPosition = _decodeFields.newPosition;

                    return {
                        fieldValue: [].concat(_toConsumableArray(acc.fieldValue), [decodedObject]),
                        newPosition: newPosition
                    };
                }, {fieldValue: [], newPosition: startPosition});
            case 'language':
                return {fieldValue: decodeBitsToLanguage(input, startPosition, bitCount)};
            default:
                throw new Error('ConsentString - Unknown field type ' + type + ' for decoding');
        }
    }

    function decodeFields(_ref4) {
        var input = _ref4.input,
            fields = _ref4.fields,
            _ref4$startPosition = _ref4.startPosition,
            startPosition = _ref4$startPosition === undefined ? 0 : _ref4$startPosition;

        var position = startPosition;

        var decodedObject = fields.reduce(function (acc, field) {
            var name = field.name,
                numBits = field.numBits;

            var _decodeField = decodeField({
                    input: input,
                    output: acc,
                    startPosition: position,
                    field: field
                }),
                fieldValue = _decodeField.fieldValue,
                newPosition = _decodeField.newPosition;

            if (fieldValue !== undefined) {
                acc[name] = fieldValue;
            }

            if (newPosition !== undefined) {
                position = newPosition;
            } else if (typeof numBits === 'number') {
                position += numBits;
            }

            return acc;
        }, {});

        return {
            decodedObject: decodedObject,
            newPosition: position
        };
    }

    function decodeBitsToIds(bitString) {
        return bitString.split('').reduce(function (acc, bit, index) {
            if (bit === '1') {
                if (acc.indexOf(index + 1) === -1) {
                    acc.push(index + 1);
                }
            }
            return acc;
        }, []);
    }

    function decodeBitsToInt(bitString, start, length) {
        return parseInt(bitString.substr(start, length), 2);
    }

    function decodeBitsToBool(bitString, start) {
        return parseInt(bitString.substr(start, 1), 2) === 1;
    }

    function decodeBitsToDate(bitString, start, length) {
        return new Date(decodeBitsToInt(bitString, start, length) * 100);
    }

    function decodeBitsToLetter(bitString) {
        var letterCode = decodeBitsToInt(bitString);
        return String.fromCharCode(letterCode + 65).toLowerCase();
    }

    function decodeBitsToLanguage(bitString, start, length) {
        var languageBitString = bitString.substr(start, length);

        return decodeBitsToLetter(languageBitString.slice(0, length / 2)) + decodeBitsToLetter(languageBitString.slice(length / 2));
    }

    function decodeConsentStringBitValue(bitString) {
        var definitionMap = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : vendorVersionMap;

        var version = decodeBitsToInt(bitString, 0, versionNumBits);

        if (typeof version !== 'number') {
            throw new Error('ConsentString - Unknown version number in the string to decode');
        } else if (!vendorVersionMap[version]) {
            throw new Error('ConsentString - Unsupported version ' + version + ' in the string to decode');
        }

        var fields = definitionMap[version].fields;

        var _decodeFields2 = decodeFields({input: bitString, fields: fields}),
            decodedObject = _decodeFields2.decodedObject;

        return decodedObject;
    }

    var decode = function (input) {
        input = String(input).replace(REGEX_SPACE_CHARACTERS, '');
        var length = input.length;
        if (length % 4 === 0) {
            input = input.replace(/==?$/, '');
            length = input.length;
        }
        if (length % 4 === 1 ||
            // http://whatwg.org/C#alphanumeric-ascii-characters
            /[^+a-zA-Z0-9/]/.test(input)) {
            error('Invalid character: the string to be decoded is not correctly encoded.');
        }
        var bitCounter = 0;
        var bitStorage;
        var buffer;
        var output = '';
        var position = -1;
        while (++position < length) {
            buffer = TABLE.indexOf(input.charAt(position));
            bitStorage = bitCounter % 4 ? bitStorage * 64 + buffer : buffer;
            // Unless this is the first of a group of 4 characters…
            if (bitCounter++ % 4) {
                // …convert the first 8 bits to a single ASCII character.
                output += String.fromCharCode(0xFF & bitStorage >> (-2 * bitCounter & 6));
            }
        }
        return output;
    };

    function decodeFromBase64(consentString, definitionMap) {
        // Add padding
        var unsafe = consentString;
        while (unsafe.length % 4 !== 0) {
            unsafe += '=';
        }

        // Replace safe characters
        unsafe = unsafe.replace(/-/g, '+').replace(/_/g, '/');

        var bytes = decode(unsafe);

        var inputBits = '';
        for (var i = 0; i < bytes.length; i += 1) {
            var bitString = bytes.charCodeAt(i).toString(2);
            inputBits += padLeft(bitString, 8 - bitString.length);
        }

        return decodeConsentStringBitValue(inputBits, definitionMap);
    }

    var getVendorList = function (v, cb) {
        console.log('Fetching vendor list...');
        fetch('https://vendorlist.consensu.org/v-' + v + '/vendorlist.json', {
            method: 'get'
        }).then(function (response) {
            return response.json().then(cb);
        }).catch(function (err) {
            console.error('Unable to get vendor list for version: ' + vendorListVersion);
        });
    };

    function getVendorsAllowed(consent) {
        var allowedVendorIds = [];
        if (consent.isRange) {
            var idMap = consent.vendorRangeList.reduce(function (acc, _ref) {
                var isRange = _ref.isRange,
                    startVendorId = _ref.startVendorId,
                    endVendorId = _ref.endVendorId;

                var lastVendorId = isRange ? endVendorId : startVendorId;

                for (var i = startVendorId; i <= lastVendorId; i += 1) {
                    acc[i] = true;
                }

                return acc;
            }, {});

            for (var i = 0; i <= consent.maxVendorId; i += 1) {
                if (consent.defaultConsent && !idMap[i] || !consent.defaultConsent && idMap[i]) {
                    if (allowedVendorIds.indexOf(i) === -1) {
                        allowedVendorIds.push(i);
                    }
                }
            }
        } else {
            allowedVendorIds = decodeBitsToIds(consent.vendorIdBitString);
        }
        return allowedVendorIds;
    }

    function getPersonalisedAds() {
        var muid = document.body.getAttribute('data-muid');
        var personalAdsCookieName = 'personalisedAds.' + muid;
        var personalAds = getCookie(personalAdsCookieName);

        if (typeof personalAds === undefined) {
            setCookie(personalAdsCookieName, '-1', 31);
        } else if (parseInt(personalAds) > -1) {
            return parseInt(personalAds) > 0;
        }

        var consentCookie = getCookie("euconsent");
        if (consentCookie === undefined) {
            console.log("no consent cookie");
            setCookie(personalAdsCookieName, '-1', 31);
            return false;
        }

        var consent = decodeFromBase64(consentCookie);
        if (consent.vendorListVersion === null) {
            console.log("no vendor list version");
            setCookie(personalAdsCookieName, '-1', 31);
            return false;
        }

        var vendorListVersion = consent.vendorListVersion;
        var vendorsAllowed = getVendorsAllowed(consent);
        getVendorList(consent.vendorListVersion, function (data) {
            if (data.vendors.length === vendorsAllowed.length) {
                setCookie(personalAdsCookieName, '1', 31);
                localStorage.setItem(personalAdKey, true);
            } else {
                setCookie(personalAdsCookieName, '0', 31);
                localStorage.setItem(personalAdKey, false);
            }
        });

        return false;
    }

    var personalisedAdsValue = getPersonalisedAds();
    localStorage.setItem(personalAdKey, personalisedAdsValue);
})();
