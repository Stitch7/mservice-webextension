var browser = chrome;
var mserviceUrl = browser.runtime.getManifest().permissions[0];

function saveOptions() {
    var username = document.getElementById('username').value;
    var password = document.getElementById('password').value;

    var $banner = $('#banner');

    $.ajax({
        url: mserviceUrl + 'test-login',
        type: 'GET',
        dataType: 'json',
        beforeSend: function (xhr) {
            xhr.setRequestHeader ('Authorization', 'Basic ' + btoa(username + ':' + password));
        },
        success: function(data) {
            browser.storage.local.set({
                username: username,
                password: password
            }, function() {
                $banner.removeClass('error').addClass('success').html('Login erfolgreich!<br/>Bitte lade ggf. den Forums Tab neu.');
            });
        },
        error: function() {
            $banner.removeClass('success').addClass('error').html('Login fehlgeschlagen!');
            browser.storage.local.remove(['username', 'password']);
            document.getElementById('password').value = '';
        }
    });

    return false;
}

function restoreOptions() {
    browser.storage.local.get(['username', 'password'], function (items) {
        var username = items.username;
        var password = items.password;
        if (username && password) {
            document.getElementById('username').value = items.username;
            document.getElementById('password').value = password;
        }
    });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
//document.getElementById('save').addEventListener('click', saveOptions);
//document.getElementById('save').addEventListener('submit', saveOptions);

$('#login-form').submit(function(event) {
    saveOptions();
    event.preventDefault();
});
