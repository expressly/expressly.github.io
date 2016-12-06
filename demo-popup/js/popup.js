/**
 * Expressly popup script.
 * Handles the popup and it's content related actions.
 **/

window.onload = function() {
    var popup = document.getElementById("xly-demo-popup");
    popup.parentNode.removeChild(popup);
    popup.style.display = 'block';

    var overlay = document.createElement('div');
    overlay.classList.add('xly-demo-popup-overlay');
    popup.appendChild(overlay);
    overlay.addEventListener('click', xly_close_popup);

    document.body.appendChild(popup);

    /** Following line enables hiding the popup when clicked outside **/
    //document.body.addEventListener('click', body_clicked);
};

function body_clicked(e) {
    var target = e.target;
    var popup = document.getElementById("xly-demo-popup");

    if(target == undefined || popup == undefined) {
        return;
    }

    if(target == popup || popup.contains(target)) {
        return;
    }

    xly_close_popup();
}

function xly_close_popup() {
    var popup = document.getElementById("xly-demo-popup");

    if(popup == undefined) {
        return;
    }

    popup.parentNode.removeChild(popup);
}