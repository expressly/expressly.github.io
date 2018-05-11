(function() {
    function close() {
        // classList not supported by IE8
        var root = document.getElementById('xly');
        root.className = root.className + (root.className ? ' xly-popup-hide' : 'xly-popup-hide');
        if (!window.history.replaceState) {
            return;
        }

        var url = window.location.href;
        var prefix = 'xlyt=';
        var parts = url.split('?');
        var params = parts[1].split(/[&;]/g);
        for (var i = params.length - 1; i >= 0; --i) {
            if (params[i].lastIndexOf(prefix, 0) !== -1) {
                params.splice(i, 1);
            }
        }
        window.history.replaceState(null, "", parts[0] + (params.length > 0 ? '?' + params.join('&') : ""));
    }

    var el = document.getElementById('xly-accept-link');
    if (el.addEventListener) {
        el.addEventListener('click', close, false);
    } else if (el.attachEvent)  {
        el.attachEvent('onclick', close);
    }
}());
