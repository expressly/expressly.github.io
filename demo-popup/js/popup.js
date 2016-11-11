/**
 * Expressly popup script.
 * Handles the popup and it's content related actions.
 **/

window.onload = function() {
    var popup = document.getElementById("xly-demo-popup");
    popup.parentNode.removeChild(popup);
    popup.style.display = 'block';
    document.body.appendChild(popup);
};

function xly_close_popup() {
    var popup = document.getElementById("xly-demo-popup");
    popup.parentNode.removeChild(popup);
}