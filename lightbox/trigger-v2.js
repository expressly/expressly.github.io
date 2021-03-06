var xlytLoaded = xlytLoaded ? xlytLoaded :
(function () {
    function fetch(uuid, callback) {
        var xhr;
        var protocol = 'https:';

        if (typeof XDomainRequest !== 'undefined') {
            xhr = new XDomainRequest();
            xhr.onload = function () {
                callback(xhr.responseText);
            };
            protocol = window.location.protocol;
        } else {
            if (typeof XMLHttpRequest !== 'undefined') {
                xhr = new XMLHttpRequest();
            }
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

            xhr.onreadystatechange = function () {
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
        }

        xhr.open('GET', protocol + "//prod.expresslyapp.com/api/v2/migration/" + uuid + "/ajax", true);
        xhr.withCredentials = true;
        xhr.send('');
    }

    function getUuid() {
        var url = window.location.href;
        var regex = /[?&]xlyt(=([^&#]*)|&|#|$)/,
            results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, " "));
    }

    // IE 8 support
    function parseLinks(payload) {
        var regex = /<link [^>]* href="([^"]+)"[^>]*>/mig;
        var links = [];
        var m;
        do {
            m = regex.exec(payload);
            if (m) {
                links.push({href: m[1]});
            }
        } while (m);
        return links;
    }

    function render(payload) {
        if (!document.body) {
            console.log("body not found - trying again");
            setTimeout(function(){ render(payload) }, 50);
            return;
        }
        var content = document.createElement("div");
        content.innerHTML = payload;
        document.body.appendChild(content);

        var head = document.getElementsByTagName('head')[0];
        var cssLinks = content.getElementsByTagName("link");
        if (cssLinks.length === 0) {
            cssLinks = parseLinks(payload);
        }

        for (var i = 0, length = cssLinks.length; i < length; i++) {
            var cssLink = cssLinks[i];
            var link = document.createElement('link');
            link.rel = 'stylesheet';
            link.type = 'text/css';
            link.href = cssLink.href;
            link.media = 'all';
            head.appendChild(link);
        }

        var scripts = content.getElementsByTagName("script");
        for (i = 0, length = scripts.length; i < length; i++) {
            var scriptLink = scripts[i];
            if (scriptLink.src) {
                var script = document.createElement('script');
                script.src = scriptLink.src;
                head.appendChild(script);
            } else {
                geval(scriptLink.innerHTML);
            }
        }
    }

    function geval(data) {
        if (data) {
            ( window.execScript || function (data) {
                window["eval"].call(window, data);
            } )(data);
        }
    }

    function compatible() {
        return !!document.querySelectorAll;
    }

    function initialise() {
        console.log('xly trigger loaded');
        var uuid = getUuid();
        if (uuid && compatible()) {
            fetch(uuid, render);
        }
    }

    initialise();
    return true;
}());
