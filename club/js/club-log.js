$(function() {
    function send(components) {
        AWS.config.credentials = new AWS.CognitoIdentityCredentials({ IdentityPoolId: 'eu-west-2:a57995f9-ce37-4099-beb9-b9d4012860ed' });
        AWS.config.region = 'eu-west-2';
        AWS.config.credentials.get(function(err) {
            if (err) {
                console.error(err);
                return;
            }

            var kinesis = new AWS.Firehose({apiVersion: '2015-08-04'});
            kinesis.putRecord({
                Record: {
                    Data: JSON.stringify(components) + '\n'
                },
                DeliveryStreamName: 'expressly-club-pageviews'
            }, function (err, data) {
                if (err) {
                    console.error(err);
                }
            });
        });
    }

    function log() {
        Fingerprint2.get(function (components) {
            var murmur = Fingerprint2.x64hash128(components.map(function (pair) { return pair.value }).join(), 31);
            var data = {
                browserFingerprint: murmur,
                requestUrl: window.location.href,
                requestTime: new Date()
            };

            if (profile) {
                data.memberId = profile.uuid;
            }

            var length = components.length;
            for (var i = 0; i < length; i++) {
                var key = components[i].key;
                var value = components[i].value;
                if (value && String(value).length > 31 && (key === 'canvas' || key === 'webgl')) {
                    value = Fingerprint2.x64hash128(String(value), 31);
                }
                data[key] = value;
            }

            send(data);
        });
    }

    if (window.requestIdleCallback) {
        requestIdleCallback(log)
    } else {
        setTimeout(log, 500)
    }
});