var xly = xly || {
        callExpressly: function (url, callback, el) {
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
                    callback(JSON.parse(xhr.responseText), el);
                }
            }

            xhr.open('GET', "https://prod.expresslyapp.com/api/adserver/banner" + url,
                true);
            xhr.send('');
        },

        getXlyAttr: function (attribute) {
            var metas = parent.document.getElementsByTagName('meta');
            for (var i = 0; i < metas.length; i++) {
                if (metas[i].getAttribute("property") == "xly:" + attribute) {
                    return metas[i].getAttribute("content");
                }
            }
            return null;
        },

        getPpid: function () {
            return this.getXlyAttr('ppid');
        },

        getMerchant: function () {
            return 'undefined' === typeof xlyMerchant || xlyMerchant === null ? this.getXlyAttr('merchant') : xlyMerchant;
        },

        getEmail: function () {
            return this.getXlyAttr('cemail');
        },

        getFullName: function () {
            return this.getXlyAttr('cname');
        },

        xlyRenderCreative: function (payload, el) {
            var img = el.querySelector("img");
            if (el.href == "%%XLY_LINK%%" || el.href == document.location.href || el.href == '' || !el.href) {
                el.href = payload.migrationLink;
            } else {
                el.href = el.href + encodeURIComponent(payload.migrationLink);
            }
            img.src = payload.bannerImageUrl;
        },

        initialise: function () {
            var creatives = document.getElementsByClassName("xly-creative");
            for (var i = 0; i < creatives.length; i++) {
                var link = creatives[i];
                if (link.xlyReady) {
                    continue;
                }
                link.xlyReady = true;

                var img = link.querySelector("img");
                var ppid = this.getPpid();
                var merchant = this.getMerchant();
                if (ppid) {
                    this.callExpressly(
                        "?ppid=" + encodeURIComponent(ppid) +
                        "&width=" + img.getAttribute("width") +
                        "&height=" + img.getAttribute("height"),
                        this.xlyRenderCreative,
                        link);
                } else if (merchant) {
                    var email = this.getEmail();
                    var fullName = this.getFullName();
                    if (email && fullName) {
                        this.callExpressly(
                            "/precache?merchantUuid=" + encodeURIComponent(merchant) +
                            "&email=" + encodeURIComponent(email) +
                            "&fullName=" + encodeURIComponent(fullName) +
                            "&width=" + img.getAttribute("width") +
                            "&height=" + img.getAttribute("height"),
                            this.xlyRenderCreative,
                            link);
                    } else {
                        this.callExpressly(
                            "/anonymous?merchantUuid=" + encodeURIComponent(merchant) +
                            "&width=" + img.getAttribute("width") +
                            "&height=" + img.getAttribute("height"),
                            this.xlyRenderCreative,
                            link);
                    }
                } else {
                    console.log("meta tag with xly:ppid or xly:merchant not found");
                }
            }
        }
    };

xly.initialise();
