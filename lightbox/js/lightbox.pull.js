var xlyr = xlyr || {
        milliseconds: new Date().getTime(),

        initialise: function (uuid, registerFunction) {
            this.uuid = uuid;
            this.registerFunction = registerFunction;
            this.content = document.getElementById("xly");
            if (this.content && this.content !== document.body.firstChild) {
                document.body.insertBefore(this.content, document.body.firstChild);
            }
            document.getElementById("xly-accept-link").addEventListener('click', xlyr.register);
        },

        get: function (callback) {
            var xhr;

            if (typeof XMLHttpRequest !== 'undefined') xhr = new XMLHttpRequest();
            else {
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

            xhr.onreadystatechange = ensureReadiness;

            function ensureReadiness() {
                if (xhr.readyState < 4) {
                    return;
                }

                if (xhr.status !== 200) {
                    return;
                }

                if (xhr.readyState === 4) {
                    callback(xhr.responseText);
                }
            }

            xhr.open('GET', "https://prod.expresslyapp.com/api/v2/migration/" + xlyr.uuid + "/user/ajax", true);
            xhr.send('');
        },

        register: function (event) {
            event.preventDefault();
            var optout = document.getElementById('xly-subscribe-input');
            if (!optout) {
                optout = document.getElementById('subscribe'); // backwards compatibility
            }
            xlyr.expresslyContinue();
            xlyr.get(function(response) {
                var json = JSON.parse(response);
                xlyr.registerFunction(json, optout !== null && optout.checked);
            });
        },

        expresslyContinue: function(event) {
            xlyr.content.classList.add('xly-busy');
        },

        ready: function (callback) {
            var ready = false;

            var detach = function () {
                if (document.addEventListener) {
                    document.removeEventListener("DOMContentLoaded", completed);
                    window.removeEventListener("load", completed);
                } else {
                    document.detachEvent("onreadystatechange", completed);
                    window.detachEvent("onload", completed);
                }
            };

            var completed = function () {
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
                } catch (e) {
                }

                if (top && top.doScroll) {
                    (function scrollCheck() {
                        if (ready) return;

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

xlyr.ready(function () {
    xlyr.initialise(xlyrData.uuid, xlyrData.registerFunction);
});
