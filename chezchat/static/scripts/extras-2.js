function getCurrentRoom(element) {
    // clear old messaged to display fresh ones
    clearInputResources(false);

    // autofocus on input-box
    messageInput.focus();

    friendName = element.getElementsByTagName("button")[0].name;
    friendUsername = element.getElementsByTagName("button")[0].value;
    roomID = element.id;

    localStorage.setItem("current_room_id", roomID);

    // hides the "please select a chat to start messages" at the beginning
    // set an overlay here with the widget spinner
    // hide just before the info is displayed in processgetCurrentRoom()
    document.getElementById("pre-user-select").hidden = false;
    document.getElementById("pre-user-msg").hidden = true;
    document.getElementById("pre-user-spinner").hidden = false;

    getUser.innerHTML = "";
    userStatusInfo.innerHTML = "";
    currentRoomName.innerHTML = friendName;

    showChatArea();
    
    // set this value so that verify_status can function from socketio.js
    if (!element.getElementsByTagName("button")[0].classList.contains("roomView")) {
        getUser.innerHTML = friendUsername;
    }
    else {
        userStatusInfo.innerHTML = "click here for group info";
    }

    var params = {"url": "/room-details", "payload": roomID, "key": "room_id"};
    ajaxCalls(params, element, processgetCurrentRoom);
}

function processgetCurrentRoom(data, element) {
    
    roomID = element.id;

    // clear localstorage notification counter
    if (JSON.parse(localStorage.getItem("notifyParams"))) {
        resetStorageNotification(roomID);
    }

    document.getElementById("pre-user-select").hidden = true;

    InfoModalBody = document.getElementById("roomInfoModal");
    messageDisplay = document.getElementById("messages")

    InfoModalBody.innerHTML = "";

    // add data to localStorage 

    current_room = data.current_room;
    room_history = current_room.room_history;
    for (x in room_history) {
        // create a function and use here and in socket append msgs
        msg = room_history[x];
        msg["from_db"] = true;
        // console.log(msg)
        append_msgs(msg);

    }

    room_members = data.room_members;
    if (current_room.private_room !== true) {
        for (x in room_members) {
            member = room_members[x];
            var divMain = createElement("div", {"style": "padding: 7px 0"});
            var span_ = createElement("span", {"class": "name-header"});
            span_.innerHTML = member.name_surname;
            appendChildren(divMain, [span_])
            if (member.id === current_room.created_by) {
                var adminSpan = createElement("span", {"class": "group-marker"});
                adminSpan.innerHTML = "admin"
                appendChildren(divMain, [adminSpan])
            }
            InfoModalBody.append(divMain);
        }
    }
}

function resetStorageNotification(roomID) {
    var resetNotificationCounter = JSON.parse(localStorage.getItem("notifyParams"));
    if (resetNotificationCounter) {
        resetNotificationCounter[roomID] = 0;
        localStorage.setItem("notifyParams", JSON.stringify(resetNotificationCounter));
    }

    addNotificationBadge(roomID, JSON.parse(localStorage.getItem("notifyParams")));
}

function addNotificationBadge(room_id, data) {

    var span_badgeCounter = document.querySelector(`[id=${CSS.escape(room_id)}] .roomDivInfo span.badgeCounter`);

    if (span_badgeCounter) {
        if (data[room_id] === 0) {
            span_badgeCounter.setAttribute("style", "visibility: hidden; min-width: 0")
        }
        else {
            span_badgeCounter.setAttribute("style", "visibility: visible; min-width: 18px")
            span_badgeCounter.innerHTML = data[room_id];
        }
    }

}

function addLastMessageBadge(data) {

    var span_lastMessage = document.querySelector(`[id=${CSS.escape(data.room_id)}] .roomDivInfo span.lastMessage`);

    if (span_lastMessage) {
        var elementGroupTest = document.querySelector(`[id=${CSS.escape(data.room_id)}] .noWrapDisplay .name-section span.group-marker`)

        // if the current room is a group, add the author to the badge
        if (elementGroupTest) {
            span_lastMessage.innerHTML = `${data.author}: ${data.messages}`;
        }
        else {
            span_lastMessage.innerHTML = data.messages;
        }

        processLastMessageTimeSpan(data.room_id, data.timestamp)
    }
}

function processLastMessageTimeSpan(room_id, timestamp) {
    var lastMessageTimeSpan =  document.querySelector(`[id=${CSS.escape(room_id)}] .noWrapDisplay .name-section span.time-info`);
    addLastMessageTime(lastMessageTimeSpan, timestamp);
}

function addLastMessageTime(element, timestamp) {
    var date_ = checkDate(timestamp);
    element.innerHTML = date_;
}

function checkDate(date, lastSeenCheck) {

    var currentDate = moment.utc();

    var refDate = moment.utc(date);

    var currentDateinDateFormat = currentDate.local().format("MMMM DD, YYYY");
    var refDateinDateFormat = refDate.local().format("MMMM DD, YYYY");

    var currentDateinYearFormat = currentDate.local().format("YYYY");
    var refDateinYearformat = refDate.local().format("YYYY");

    if (lastSeenCheck == true) {

        if ((currentDate - refDate) < 604800000) return `last seen ${refDate.local().fromNow()}`;
        return `last seen ${refDate.local().format("LL")} at ${refDate.local().format("HH:mm")}` 
    }
    else {

        if (currentDateinDateFormat == refDateinDateFormat) return refDate.local().format("HH:mm");
        if ((currentDate - refDate) < 604800000) return refDate.local().format("ddd");
        if (currentDateinYearFormat == refDateinYearformat) return refDate.local().format("MMM DD");

        return refDate.local().format("DD/MM/YYYY");
    }
}

function handleNotificationsHelper(room_id, count) {

    if (localStorage.getItem("notifyParams")) {
        // convert the localStorage string to a dictionary
        var existing = JSON.parse(localStorage.getItem("notifyParams"));
        if (existing[room_id]) {
            existing[room_id] = existing[room_id] + count;
        }
        else {
            existing[room_id] = count;
        }
        localStorage.setItem("notifyParams", JSON.stringify(existing));
    }
    else {
        // If no existing data, create an dictionary
        newParams = {};
        newParams[room_id] = count;
        localStorage.setItem("notifyParams", JSON.stringify(newParams));
    }

    addNotificationBadge(room_id, JSON.parse(localStorage.getItem("notifyParams")));
}

function persistentNotificationBadge() {
    var counterObject = JSON.parse(localStorage.getItem("notifyParams"));
    console.log(counterObject)
    
    if (counterObject) {
        for (var key in counterObject) {
            if (counterObject.hasOwnProperty(key)) {
                addNotificationBadge(key, counterObject)
            }
        }
    }
}

// so that the notifications can survive reload
persistentNotificationBadge();

function showChatArea() {

    document.getElementById("appNavArea").style.zIndex = 1;

    document.getElementById("appChatArea").style.backgroundColor = "white"
    document.getElementById("appChatArea").style.zIndex = 1000;
}

function hideChatArea() {
    clearInputResources(true);
    document.getElementById("appChatArea").style.zIndex = 1
    document.getElementById("appNavArea").style.zIndex = 1000;

    getUser.innerHTML = "";
    localStorage.removeItem("current_room_id");

    window.event.stopPropagation();
}

function clearInputResources(value) {

    document.getElementById("msgInput").hidden = value;
    document.getElementById("roomInfoModal").innerHTML = "";

    // clears the message li
    var msgContent = document.getElementById("messages");
    if (msgContent) {
        while (msgContent.firstChild) {
            msgContent.removeChild(msgContent.firstChild);
        }
    }
}

function append_msgs(data) {
    var outerDiv = createElement("div", {"class": "messageItems"});

    var containerDiv = createElement("div", {"class": "messageContainer"});

    var wrapperDiv = createElement("div", {"class": "messageWrap"});

    var innerDiv = createElement("div", {"class": "messagePadded"});

    // if the current room is a group append the name of the message author
    if (!getUser.innerHTML) {
        var authorSpan = createElement("span", {"class": "authorSpanElement"});
        authorSpan.innerHTML =  data.author;
        appendChildren(innerDiv, [authorSpan])
    }

    var span = createElement("span", {"class": "displayMsgText"});
    span.innerHTML = data.messages;
    appendChildren(innerDiv, [span])

    var local_time;
    var recentDate;
    var recentDateValue;
    if (data.timestamp) {
        recentDate = moment.utc(data["timestamp"]).local().format("MMMM DD, YYYY");
        recentDateValue = displayDate(recentDate);

        local_time = moment.utc(data["timestamp"]).local().format("HH:mm");        
    }
    else {
        recentDate = moment().format("MMMM DD, YYYY");
        recentDateValue = displayDate(recentDate);

        local_time = moment().format("HH:mm");
    }

    // if displayDate(recentDate) returns a value
    if (recentDateValue) {

        var outerDateDiv = createElement("div", {"class": "messageItems dateInfoItem"});

        var innerDateDiv = createElement("div", {"class": "messagePadded dateInfoStyle"});

        var dateInfoSpan = createElement("span", {});

        dateInfoSpan.innerHTML = recentDateValue;
        appendChildren(innerDateDiv, [dateInfoSpan])
        appendChildren(outerDateDiv, [innerDateDiv])
        document.getElementById("messages").append(outerDateDiv);
    }

    var timeInfoSpan = createElement("span", {"class": "timeSpanElement"});
    timeInfoSpan.innerHTML = local_time;

    var messageStatusTimeInfoWrapper = createElement("div", {"id": data.uuid, "class": "statusTimeWrapper"});
    appendChildren(messageStatusTimeInfoWrapper, [timeInfoSpan])

    // if the current msg is from the current_user
    if (data.author == username) {
        outerDiv.setAttribute("class","messageItems userSpecificMessageItems");
        wrapperDiv.setAttribute("class","messageWrap userSpecificmessageWrap");

        // if the message is being rendered from db add a tick
        // else add an exclamation until it is received by server
        if (data.from_db === true) {
            if (data.msg_delivered == true) {
                addTwoTicks(messageStatusTimeInfoWrapper);
            }
            else {
                addOneTick(messageStatusTimeInfoWrapper);
            }
        }
        else if (data.from_db === false) {
            addPending(messageStatusTimeInfoWrapper);
        }
    }

    appendChildren(innerDiv, [messageStatusTimeInfoWrapper])
    appendChildren(wrapperDiv, [innerDiv])
    appendChildren(containerDiv, [wrapperDiv])
    appendChildren(outerDiv, [containerDiv])

    document.getElementById("messages").append(outerDiv);
    scrollDownChatWindow();
}

function displayDate(recentDate) {
    var dateElement = document.querySelectorAll(".dateInfoItem .dateInfoStyle span");
    if (dateElement.length == 0) return recentDate;
    if (dateElement[dateElement.length - 1].innerHTML != recentDate) return recentDate;
    return
}

function createUniqueUID() {
    var dt = Date.now();
    var uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
        var r = (dt + Math.random()*16)%16 | 0;
        dt = Math.floor(dt/16);
        return (c=="x" ? r :(r&0x3|0x8)).toString(16);
    });
    return username + uuid;
}

function addOneTick(messageStatusTimeInfoWrapper) {
    var messageStatusSpan = createElement("span", {"class": "oneTickSpanElement"});

    var messageStatusIcon = createElement("i", {"class": "fas fa-check", "aria-hidden": "true"});

    appendChildren(messageStatusSpan, [messageStatusIcon])

    // check if the pending icon is present and if so replace it with the one tick
    if (messageStatusTimeInfoWrapper.childElementCount > 1) {
        messageStatusTimeInfoWrapper.replaceChild(messageStatusSpan, messageStatusTimeInfoWrapper.childNodes[1]);
    }
    else {
        appendChildren(messageStatusTimeInfoWrapper, [messageStatusSpan])
    }
}

function addTwoTicks(messageStatusTimeInfoWrapper) {
    var messageStatusSpan = createElement("span", {"class": "oneTickSpanElement"});

    var messageStatusIcon = createElement("i", {"class": "fas fa-check-double", "aria-hidden": "true"});

    appendChildren(messageStatusSpan, [messageStatusIcon])

    // check if the sent icon is present and if so replace it with the double ticks
    // else append afresh
    if (messageStatusTimeInfoWrapper.childElementCount > 1) {
        messageStatusTimeInfoWrapper.replaceChild(messageStatusSpan, messageStatusTimeInfoWrapper.childNodes[1]);
    }
    else {
        appendChildren(messageStatusTimeInfoWrapper, [messageStatusSpan])
    }
}

function addPending(messageStatusTimeInfoWrapper) {
    var messageStatusSpan = createElement("span", {"class": "oneTickSpanElement"});

    var messageStatusIcon = createElement("i", {"class": "fas fa-exclamation-circle", "aria-hidden": "true"});

    appendChildren(messageStatusSpan, [messageStatusIcon])

    appendChildren(messageStatusTimeInfoWrapper, [messageStatusSpan])
}

function scrollDownChatWindow() {
    var scrollElement = document.querySelector("#chatWindow .simplebar-content-wrapper");
    var scrollingHeight = document.getElementById("messages");
    scrollElement.scrollTop = scrollingHeight.scrollHeight;
}

function swapRoomPostionOnNewMessage(room_id) {

    if (document.getElementById(room_id)) {
        var parentElement = document.getElementById(room_id).parentNode;
        var child1 = document.getElementById(room_id).parentNode.firstChild
        var child2 = document.getElementById(room_id);
        parentElement.insertBefore(child2, child1);
    }
}

function timeRefresh() {
    var params = {"url": "/time-refresh"};
    ajaxCalls(params, null, showResult);
}

function showResult(data) {
    objValues = data.timestamps
    if (objValues) {
        for (var key in objValues) {
            if (objValues.hasOwnProperty(key)) {
                processLastMessageTimeSpan(key, objValues[key])
            }
        }
    }
}

setInterval(function() { timeRefresh(); }, 60000);