var xlyr = xlyr || {
        milliseconds: new Date().getTime(),

        initialise: function (uuid, registerFunction) {
            console.log("working 2" + uuid);

            var content = document.getElementById("xly");
            if (content) {
                document.body.insertBefore(content, document.body.firstChild);
            }

            this.uuid = uuid;
            this.registerFunction = registerFunction;
            this.accept = document.getElementById("xly-accept-link");
            this.accept.onclick = xlyr.register;
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
            var optout = document.getElementById("subscribe");
            xlyr.expresslyContinue();
            xlyr.get(function(response) {
                var json = JSON.parse(response);
                xlyr.registerFunction(json, optout.checked);
            });
        },

        expresslyContinue: function(event) {
            xlyr.accept.style.display = "none";
            var loader = xlyr.accept.nextElementSibling;
            loader.style.display = "block";
            var cancelBtn = document.getElementsByClassName('firstBtn')[0];
            cancelBtn.style.display = 'none';
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

console.log("xlyr created");
xlyr.ready(function () {
    xlyr.initialise(xlyrData.uuid, xlyrData.registerFunction);
});
