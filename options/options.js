var browser = chrome;
var mserviceUrl = browser.runtime.getManifest().permissions[0];

function saveOptions() {
    var username = document.getElementById('username').value;
    var password = document.getElementById('password').value;

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
                alert('Login erfolgreich!');
            });
        },
        error: function() {
            alert('Login fehlgeschlagen!');
            browser.storage.local.remove(['username', 'password']);
            document.getElementById('password').value = '';
        }
    });
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
document.getElementById('save').addEventListener('click', saveOptions);
