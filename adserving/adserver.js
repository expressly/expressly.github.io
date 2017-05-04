var xly = xly || {
        callExpressly: function (path, callback, el, data) {
            if (parent.document.xlyBusy) {
                if (!parent.document.xlyQueue) {
                    parent.document.xlyQueue = [];
                }

                parent.document.xlyQueue.push({
                    path: path,
                    callback: callback,
                    el: el,
                    data: data
                });

                return;
            }
            parent.document.xlyBusy = true;

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

                parent.document.xlyBusy = false;
                if (parent.document.xlyQueue && parent.document.xlyQueue.length > 0) {
                    var request = parent.document.xlyQueue.shift();
                    xly.callExpressly(request.path, request.callback, request.el, request.data);
                }

                if (xhr.status !== 200) {
                    return;
                }

                if (xhr.readyState === 4) {
                    callback(JSON.parse(xhr.responseText), el);
                }
            }

            xhr.open('POST', "https://prod.expresslyapp.com/api/adserver/banner" + path, true);
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.send(JSON.stringify(data));
        },

        getXlyAttr: function (attribute) {
            var metas = parent.document.getElementsByTagName('meta');
            for (var i = 0; i < metas.length; i++) {
                if (metas[i].getAttribute("property") === ("xly:" + attribute)) {
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
            if (el.href === "%%XLY_LINK%%" || el.href === document.location.href || el.href === '' || !el.href) {
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
                    this.callExpressly('', this.xlyRenderCreative, link,
                        {
                            ppid: ppid,
                            width: img.getAttribute("width"),
                            height: img.getAttribute("height")
                        }
                    );
                } else if (merchant) {
                    var email = this.getEmail();
                    var fullName = this.getFullName();
                    if (email && fullName) {
                        this.callExpressly('/precache', this.xlyRenderCreative, link,
                            {
                                merchantUuid: merchant,
                                width: img.getAttribute("width"),
                                height: img.getAttribute("height"),
                                email:  email,
                                fullName: fullName,
                                address1: this.getXlyAttr('caddress1'),
                                address2: this.getXlyAttr('caddress2'),
                                city: this.getXlyAttr('ccity'),
                                province: this.getXlyAttr('cprovince'),
                                zip: this.getXlyAttr('czip'),
                                country: this.getXlyAttr('ccountry'),
                                phone: this.getXlyAttr('cphone'),
                                gender: this.getXlyAttr('cgender'),
                                dob: this.getXlyAttr('cdob')
                            }
                        );
                    } else {
                        this.callExpressly('/anonymous', this.xlyRenderCreative, link,
                            {
                                merchantUuid: merchant,
                                width: img.getAttribute("width"),
                                height: img.getAttribute("height")
                            }
                        );
                    }
                } else {
                    console.log("meta tag with xly:ppid or xly:merchant not found");
                }
            }
        }
    };

xly.initialise();
