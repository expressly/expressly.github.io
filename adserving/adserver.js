var xly = xly || (function () {
        if (!parent.document.xlyQueue) {
            parent.document.xlyQueue = [];
        }

        var queue = parent.document.xlyQueue;
        function push(path, el, data) {
            queue.push({
                path: path,
                el: el,
                data: data
            });
        }

        function pop() {
            parent.document.xlyBusy = false;
            if (queue && queue.length > 0) {
                var request = queue.shift();
                call(request.path, request.el, request.data);
            }
        }

        function call(path, el, data) {
            if (parent.document.xlyBusy) {
                push(path, el, data);
                return;
            }

            parent.document.xlyBusy = true;

            var xhr;
            var protocol = 'https:';
            if (typeof XDomainRequest !== 'undefined') {
                xhr = new XDomainRequest();
                xhr.onload = function () {
                    pop();
                    render(JSON.parse(xhr.responseText), el);
                };
                xhr.onerror = pop;
                xhr.setRequestHeader = function () {
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

                    pop();

                    if (xhr.status !== 200) {
                        return;
                    }

                    if (xhr.readyState === 4) {
                        render(JSON.parse(xhr.responseText), el);
                    }
                };
            }


            xhr.open('POST', protocol + "//prod.expresslyapp.com/api/adserver/banner" + path, true);
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.withCredentials = true;
            xhr.send(JSON.stringify(data));
        }

        function getXlyAttr(attribute) {
            var metas = parent.document.getElementsByTagName('meta');
            for (var i = 0; i < metas.length; i++) {
                if (metas[i].getAttribute("property") === ("xly:" + attribute)) {
                    return metas[i].getAttribute("content");
                }
            }
            return null;
        }

        function getPpid() {
            return getXlyAttr('ppid');
        }

        function getMerchant() {
            return 'undefined' === typeof xlyMerchant || xlyMerchant === null ? getXlyAttr('merchant') : xlyMerchant;
        }

        function getEmail() {
            return getXlyAttr('cemail');
        }

        function getFullName() {
            return getXlyAttr('cname');
        }

        function render(payload, el) {
            var img = el.querySelector("img");
            if (el.href === "%%XLY_LINK%%" || el.href === document.location.href || el.href === '' || !el.href) {
                el.href = payload.migrationLink;
            } else {
                el.href = el.href + encodeURIComponent(payload.migrationLink);
            }
            img.src = payload.bannerImageUrl;
        }

        return {
            autoinit: function() {
              return 'false' !== getXlyAttr('autoinit');
            },

            initialise: function () {
                var creatives = document.querySelectorAll(".xly-creative");
                for (var i = 0; i < creatives.length; i++) {
                    var link = creatives[i];
                    if (link.xlyReady) {
                        continue;
                    }
                    link.xlyReady = true;

                    var img = link.querySelector("img");
                    var ppid = getPpid();
                    var merchant = getMerchant();
                    var campaigns = link.getAttribute('data-campaigns');
                    campaigns = campaigns ? campaigns.split(",") : null;
                    if (ppid) {
                        call('', link,
                            {
                                ppid: ppid,
                                width: img.getAttribute("width"),
                                height: img.getAttribute("height"),
                                campaigns: campaigns,
                                source: getXlyAttr('source')
                            }
                        );
                    } else if (merchant) {
                        var email = getEmail();
                        var fullName = getFullName();
                        if (email && fullName) {
                            call('/precache', link,
                                {
                                    merchantUuid: merchant,
                                    width: img.getAttribute("width"),
                                    height: img.getAttribute("height"),
                                    campaigns: campaigns,
                                    source: getXlyAttr('source'),
                                    email: email,
                                    fullName: fullName,
                                    forename: getXlyAttr('cforename'),
                                    surname: getXlyAttr('csurname'),
                                    address1: getXlyAttr('caddress1'),
                                    address2: getXlyAttr('caddress2'),
                                    city: getXlyAttr('ccity'),
                                    province: getXlyAttr('cprovince'),
                                    zip: getXlyAttr('czip'),
                                    country: getXlyAttr('ccountry'),
                                    phone: getXlyAttr('cphone'),
                                    gender: getXlyAttr('cgender'),
                                    dob: getXlyAttr('cdob'),
                                    expresslyPaymentToken: getXlyAttr('cpaymentToken')
                                }
                            );
                        } else {
                            call('/anonymous', link,
                                {
                                    merchantUuid: merchant,
                                    width: img.getAttribute("width"),
                                    height: img.getAttribute("height"),
                                    campaigns: campaigns,
                                    source: getXlyAttr('source')
                                }
                            );
                        }
                    } else {
                        console.log("meta tag with xly:ppid or xly:merchant not found");
                    }
                }
            }
        }
        
    })();

if (xly.autoinit()) {
    xly.initialise();
}
