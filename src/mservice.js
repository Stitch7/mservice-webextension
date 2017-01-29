var browser = chrome;
var mserviceUrl = browser.runtime.getManifest().permissions[0];
var currentUrl = window.location.href;

var colorIsRead = 'purple';
var colorIsNotRead = 'blue';

function loginPage() {
    if ($('.mservice').length) {
        return;
    }

    var message = 'M!Service aktiv';
    var $topTable = $($('table').get(1));
    var colspan = $topTable.find('tr').last().find('td').length;
    var $noLoginTr = $('<tr>').addClass('bg2').addClass('mservice');
    $noLoginTd = $('<td>')
        .attr('id', 'norm')
        .attr('colspan', colspan)
        .css('text-align', 'center');
    $noLoginTd.append(message);
    $noLoginTr.append($noLoginTd);
    $topTable.append($noLoginTr);
}

function loadThreadList() {
    var boardIdRegExStr = '.*\\?mode=threadlist&brdid=(\\d+)';
    var boardIdRegEx = new RegExp(boardIdRegExStr, 'g');
    var boardIdRegExResult = boardIdRegEx.exec(currentUrl);
    if (!boardIdRegExResult) {
        console.error('boardId not found');
        return;
    }
    var boardId = boardIdRegExResult[1];

    var $loadingImage = $('<img/>')
        .attr('src', chrome.extension.getURL('images/loading.gif'))
        .addClass('logo')
        .css({
            'width': '12px',
            'height': '12px',
            'position': 'absolute',
            'top': '20px',
            'left': '20px'
        });
    var $topTable = $('#boardlistform table');
    var $topTableFirstRow = $topTable.find('tr').first();
    var $boardSelectTd = $topTableFirstRow.find('td').first();
    $boardSelectTd.append($loadingImage);

    $.ajax({
        url: mserviceUrl + 'board/' + boardId + '/threads',
        success: function(data) {
            console.info('ThreadList loaded for board:', boardId);

            var threads = [];
            for (var i in data) {
                var thread = data[i];
                threads[thread.id] = thread;
            }

            $('img', $('#threadlist')).each(function () {
                var $image = $(this);
                var $messageA = $image.next();
                var $lastMessageContainerAs = $messageA.next().find('a');

                var $answersA = $lastMessageContainerAs.first();
                var $lastMessageA = $lastMessageContainerAs.last();

                var threadId;
                var idRegExResult = /ld\((\w.+),0\)/.exec($messageA.attr('onclick'));
                if (idRegExResult) {
                    threadId = idRegExResult[1];
                }

                var thread = threads[threadId];

                var messageAColor = colorIsNotRead;
                if (thread && thread.isRead) {
                    messageAColor = colorIsRead;
                }
                $messageA.css({'color': messageAColor});

                var lastMessageContainerAsColor = colorIsNotRead;
                if (thread && thread.isRead && thread.lastMessageIsRead) {
                    lastMessageContainerAsColor = colorIsRead;
                }
                $lastMessageContainerAs.css({'color': lastMessageContainerAsColor});

                $messageA.click(function () {
                    $messageA.css({'color': colorIsRead});
                });

                $answersA.click(function () {
                    $messageA.css({'color': colorIsRead});
                });

                $lastMessageA.click(function () {
                    $lastMessageContainerAs.css({'color': colorIsRead});
                });
            });

            $loadingImage.remove();
        }
    });
}

function loadThread() {
    var threadRegExStr = '.*\\?mode=thread&brdid=(\\d+)&thrdid=(.*)';
    var threadRegEx = new RegExp(threadRegExStr, 'g');
    var threadRegExResult = threadRegEx.exec(currentUrl);
    if (!threadRegExResult) {
        console.error('boardId not found');
        return;
    }
    var boardId = threadRegExResult[1];
    var threadId = threadRegExResult[2];

    if (isNaN(threadId)) {
        return;
    }

    var $loadingImage = $('<img/>')
        .attr('src', chrome.extension.getURL('images/loading.gif'))
        .addClass('loading')
        .css({
            'width': '12px',
            'height': '12px',
            'position': 'absolute',
            'top': '12px',
            'left': '10px'
        });

    $('body').append($loadingImage);

    $.ajax({
        url: mserviceUrl + 'board/' + boardId + '/thread/' + threadId,
        success: function(data) {
            console.info('Thread loaded:', threadId);

            var messages = [];
            for (var i in data) {
                var message = data[i];
                messages[message.messageId] = message;
            }

            $('li').each(function () {
                var $a = $(this).find('span a');
                var messageIdRegExResult = /pxmboard.php\?mode=message&brdid=\d+&msgid=(\d+)/.exec($a.attr('href'));
                if (!messageIdRegExResult) {
                    return;
                }
                var messageId = messageIdRegExResult[1];
                var message = messages[messageId];

                var color = colorIsNotRead;
                if (message && message.isRead) {
                    color = colorIsRead;
                }
                $a.css({'color': color});

                $a.click(function () {
                    $a.css({'color': colorIsRead});
                });
            });
            $loadingImage.remove();
        }
    });
}

function loadMessage() {
    var messageRegExStr = '.*\\?mode=message&brdid=(\\d+)&msgid=(\\d*)';
    var messageRegEx = new RegExp(messageRegExStr, 'g');
    var messageRegExResult = messageRegEx.exec(currentUrl);

    var flatviewUrl = $('a[target="flatview"]').attr('href');
    var threadIdRegExStr = '.*\\?mode=messagelist&brdid=(\\d+)&thrdid=(\\d*)';
    var threadIdRegEx = new RegExp(threadIdRegExStr, 'g');
    var threadIdRegExResult = threadIdRegEx.exec(flatviewUrl);

    if (!messageRegExResult || !threadIdRegExResult) {
        return;
    }

    var boardId = messageRegExResult[1];
    var threadId = threadIdRegExResult[2];
    var messageId = messageRegExResult[2];

    if (!messageId) {
        return;
    }

    $.ajax({
        url: mserviceUrl + 'board/' + boardId + '/thread/' + threadId + '/message/' + messageId + '/mark-as-read',
        success: function(data) {
            console.info('Message marked as read: ', messageId);
        }
    });
}

function isBoardMode(mode) {
    if (mode === 'login' && currentUrl.endsWith('pxmboard.php')) {
        return true;
    }

    var modeRegExStr = '.*\\?mode=(.+?)\\&.*';
    var modeRegEx = new RegExp(modeRegExStr, 'g');
    var modeRegExResult = modeRegEx.exec(currentUrl);
    var currentMode = modeRegExResult[1];

    return currentMode === mode;
}

function route() {
    switch (true) {
        case isBoardMode('login'):
            loginPage();
            break;
        case isBoardMode('threadlist'):
            loadThreadList();
            break;
        case isBoardMode('thread'):
            loadThread();
            break;
        case isBoardMode('message'):
            loadMessage();
            break;
    }
}

function showLoginMessage() {
    var message = 'Du bist nicht am M!Service angemeldet. ';
    var optionsUrl = browser.extension.getURL('options/options.html');
    var $optionsLink = $('<a>').attr('href', optionsUrl).append('M!Service Login');

    if (isBoardMode('login')) {
        var $topTable = $($('table').get(1));
        var colspan = $topTable.find('tr').last().find('td').length;
        var $noLoginTr = $('<tr>').addClass('bg2');
        $noLoginTd = $('<td>')
            .attr('id', 'norm')
            .attr('colspan', colspan)
            .css('text-align', 'center');
        $noLoginTd.append(message).append($optionsLink);
        $noLoginTr.append($noLoginTd);
        $topTable.append($noLoginTr);
    } else if (isBoardMode('threadlist')) {
        var $topTable = $('#boardlistform table');
        var colspan = $topTable.find('tr').last().find('td').length;
        var $noLoginTr = $('<tr>').addClass('bg2');
        $noLoginTd = $('<td>')
            .attr('id', 'norm')
            .attr('colspan', colspan);
        $noLoginTd.append($optionsLink);
        $noLoginTr.append($noLoginTd);
        $topTable.prepend($noLoginTr);
    }
}

browser.storage.local.get(['username', 'password'], function (items) {
    var username, password;
    if (items[0]) {
        username = items[0].username;
        password = items[0].password;
    } else {
        username = items.username;
        password = items.password;
    }

    if (!username || !password) {
        showLoginMessage();
        return;
    }

    $.ajaxSetup({
        type: 'GET',
        dataType: 'json',
        beforeSend: function (xhr) {
            xhr.setRequestHeader ('Authorization', 'Basic ' + btoa(username + ':' + password));
        }
    });

    route();
});
