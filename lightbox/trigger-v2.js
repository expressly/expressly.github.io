var xlyt = xlyt || {
            fetch: function (uuid, callback) {
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

                xhr.open('GET', "https://prod.expresslyapp.com/api/v2/migration/" + uuid + "/ajax", true);
                xhr.send('');
            },

            uuid: function () {
                var url = window.location.href;
                var regex = new RegExp("[?&]xlyt(=([^&#]*)|&|#|$)"),
                    results = regex.exec(url);
                if (!results) return null;
                if (!results[2]) return '';
                return decodeURIComponent(results[2].replace(/\+/g, " "));
            },

            render: function (payload) {
                var content = document.createElement("div");
                content.innerHTML = payload;
                var head  = document.getElementsByTagName('head')[0];
                var cssLinks = content.getElementsByTagName("link").clone();
                for (var i = 0; i < cssLinks.length; i++) {
                    var cssLink = cssLinks[i];
                    var link  = document.createElement('link');
                    link.rel  = 'stylesheet';
                    link.type = 'text/css';
                    link.href = cssLink.href;
                    link.media = 'all';
                    link.onload = function() {document.body.insertBefore(content, document.body.firstChild);};
                    head.appendChild(link);
                    //content.removeChild(cssLink);
                }
                var scripts = content.getElementsByTagName("script").clone();
                for (var i = 0; i < scripts.length; i++) {
                    var scriptLink = scripts[i];
                    if (scriptLink.src) {
                        var script = document.createElement('script');
                        script.src = scriptLink.src;
                        head.appendChild(script);
                        //content.removeChild(scriptLink);
                    } else {
                        eval(scriptLink.innerText);
                    }
                }
            },

            initialise: function () {
                var uuid = this.uuid();
                if (uuid) {
                    this.fetch(uuid, this.render);
                }
            }
        };

xlyt.initialise();
