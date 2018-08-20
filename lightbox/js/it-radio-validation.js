/**
 * Handle the validation of opt-in radio on Italian lightbox
 * @author Ashiqur Rahman
 * @author_url http://ashiqur.com
 */

(function () {
    var accept_radio_label = document.getElementById('xly-subscribe-input-accept-label');
    var deny_radio_label = document.getElementById('xly-subscribe-input-label');
    var ok_button = document.getElementById('xly-accept-wrapper');

    ok_button.classList.add('disabled');

    accept_radio_label.addEventListener('click', function() {
        ok_button.classList.remove('disabled');
    });
    deny_radio_label.addEventListener('click', function() {
        ok_button.classList.remove('disabled');
    });
})();