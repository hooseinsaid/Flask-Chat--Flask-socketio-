
function ajaxCalls(params, element, callback) {
    var xhttp = new XMLHttpRequest();
    xhttp.open("POST", params.url, true);
    xhttp.setRequestHeader("Content-Type", "application/json"); 

    xhttp.onreadystatechange = function() {
        if (this.readyState === 4 && this.status === 200) {
            var response = JSON.parse(this.responseText);
            callback(response, element);
        }
    };
    var data = JSON.stringify({[params.key]: params.payload});
    xhttp.send(data);
}

function addUser(element) {
    var userUsername = element.value
    var params = {'url': '/add-user', 'payload': userUsername, 'key': 'user_username'};
    ajaxCalls(params, element, processAddUser);
}

function processAddUser(data, element) {
    
    var userName = element.name;
    var userUsername = element.value;

    var div = document.createElement('div');
    div.id = data['roomID']
    div.setAttribute("class","user-list");

    var divWrap = document.createElement('div');
    divWrap.setAttribute("class","noWrapDisplay");

    
    var div2 = document.createElement('div');
    div2.setAttribute("class","name-section");
    
    var nameSpan = document.createElement('span');
    nameSpan.innerHTML = userName;
    nameSpan.setAttribute("class","name-header");
    div2.appendChild(nameSpan);

    var div3 = document.createElement('div');
    div3.setAttribute("class","roomDivInfo");
    var lastMessageSpan = document.createElement('span');
    var badgeCounterSpan = document.createElement('span')
    lastMessageSpan.setAttribute("class","lastMessage");
    badgeCounterSpan.setAttribute("class","badgeCounter");
    div3.appendChild(lastMessageSpan)
    div3.appendChild(badgeCounterSpan)

    divWrap.appendChild(div2)
    divWrap.appendChild(div3)


    div.setAttribute("onclick","getCurrentRoom(this); verify_status()");

    var button = document.createElement('button');
    button.setAttribute("class","btn btn-danger btn-sm");
    button.name = userName;
    button.value = userUsername;
    button.setAttribute("onclick","removeUser(this);");

    var buttonIcon = document.createElement('i');
    buttonIcon.setAttribute("class","fas fa-user-minus");
    buttonIcon.setAttribute("aria-hidden","true");
    button.appendChild(buttonIcon);

    div.appendChild(divWrap)
    div.appendChild(button);
    document.getElementById("friendsPanel").append(div);

    element.parentNode.remove();
}

function removeUser(element) {
    
    // only so if the current user is currently on the user to remove page
    if (element.value === getUser.innerHTML) {
        document.getElementById("user_status").innerHTML = "";
        document.getElementById("currentRoomName").innerHTML = "";
        document.getElementById("get_user_status").innerHTML = "";
        localStorage.removeItem("current_room_id");
        clearInputResources(true);
    }
    
    var roomID = element.parentNode.id;

    var params = {'url': '/remove-user', 'payload': roomID, 'key': 'room_id'};
    ajaxCalls(params, element, processRemoveUser);

    window.event.stopPropagation();
}

function processRemoveUser(data, element) {

    var friendName = element.name;
    var friendUsername = element.value;

    var div = document.createElement('div');
    div.setAttribute("class","user-list");

    var divWrap = document.createElement('div');
    divWrap.setAttribute("class","noWrapDisplay");

    var div2 = document.createElement('div');
    div2.setAttribute("class","name-section");

    var nameSpan = document.createElement('span');
    nameSpan.innerHTML = friendName;
    nameSpan.setAttribute("class","name-header");
    div2.appendChild(nameSpan);

    divWrap.appendChild(div2)
    
    var button = document.createElement('button');
    button.name = friendName;
    button.value = friendUsername;
    button.setAttribute("onclick","addUser(this);");
    button.setAttribute("class","btn btn-success btn-sm");

    var buttonIcon = document.createElement('i');
    buttonIcon.setAttribute("class","fas fa-user-plus");
    buttonIcon.setAttribute("aria-hidden","true");
    button.appendChild(buttonIcon);

    div.appendChild(divWrap)
    div.appendChild(button);

    document.getElementById("availableUsers").append(div);

    // here because I use this function to also append new users whose elements are not previously on DOM
    // only to be now appended
    if (element.parentNode) {
        element.parentNode.remove();
    }
}

function joinRoom(element) {
    var roomID = element.value;

    var params = {'url': '/join-room', 'payload': roomID, 'key': 'room_id'};
    ajaxCalls(params, element, processJoinRoom);
}

function processJoinRoom(data, element) {
    
    var roomID = element.value;
    var roomName = element.name;

    var div = document.createElement('div');
    div.id = roomID;
    div.setAttribute("class","user-list");
    div.setAttribute("onclick","getCurrentRoom(this)");

    var divWrap = document.createElement('div');
    divWrap.setAttribute("class","noWrapDisplay");

    var div2 = document.createElement('div');
    div2.setAttribute("class","name-section");

    var nameSpan = document.createElement('span');
    nameSpan.innerHTML = roomName;
    nameSpan.setAttribute("class","name-header");
    div2.appendChild(nameSpan);

    var groupMarkerSpan = document.createElement('span');
    groupMarkerSpan.innerHTML = "group";
    groupMarkerSpan.setAttribute("class","group-marker");
    div2.appendChild(groupMarkerSpan);

    var div3 = document.createElement('div');
    div3.setAttribute("class","roomDivInfo");
    var lastMessageSpan = document.createElement('span');
    var badgeCounterSpan = document.createElement('span')
    lastMessageSpan.setAttribute("class","lastMessage");
    badgeCounterSpan.setAttribute("class","badgeCounter");
    div3.appendChild(lastMessageSpan)
    div3.appendChild(badgeCounterSpan)

    divWrap.appendChild(div2)
    divWrap.appendChild(div3)

    var button = document.createElement('button');
    button.setAttribute("class","btn btn-danger btn-sm");
    button.id = "roomView"
    button.name = roomName;
    button.value = roomID;
    button.setAttribute("onclick","leaveRoom(this);");
    
    // var buttonIcon = document.createElement('i');
    // buttonIcon.setAttribute("class","fas fa-minus");
    // buttonIcon.setAttribute("aria-hidden","true");
    // button.appendChild(buttonIcon);

    var spanText = document.createElement('span');
    spanText.setAttribute("class","font-weight-bold");
    spanText.innerHTML = "Exit";
    button.appendChild(spanText);

    div.appendChild(divWrap)
    div.appendChild(button);


    document.getElementById("roomsPanel").append(div);

    element.parentNode.remove();
}

function leaveRoom(element) {

    clearInputResources(true);

    document.getElementById("currentRoomName").innerHTML = '';
    document.getElementById("user_status").innerHTML = '';
    document.getElementById("get_user_status").innerHTML = '';
    
    var roomID = element.value;
    var roomName = element.name;

    var params = {'url': '/leave-room', 'payload': roomID, 'key': 'room_id'};
    ajaxCalls(params, element, processLeaveRoom);

    window.event.stopPropagation();
}

function processLeaveRoom(data, element) {
    var roomID = element.value;
    var roomName = element.name;

    var div = document.createElement('div');
    div.setAttribute("class","user-list");

    var divWrap = document.createElement('div');
    divWrap.setAttribute("class","noWrapDisplay");

    var div2 = document.createElement('div');
    div2.setAttribute("class","name-section");

    var nameSpan = document.createElement('span');
    nameSpan.innerHTML = roomName;
    nameSpan.setAttribute("class","name-header");
    div2.appendChild(nameSpan);

    var groupMarkerSpan = document.createElement('span');
    groupMarkerSpan.innerHTML = "group";
    groupMarkerSpan.setAttribute("class","group-marker");
    div2.appendChild(groupMarkerSpan);

    divWrap.appendChild(div2)

    var button = document.createElement('button'); 
    button.setAttribute("class","btn btn-success btn-sm");
    button.name = roomName;
    button.value = roomID;
    button.setAttribute("onclick","joinRoom(this);");

    // var buttonIcon = document.createElement('i');
    // buttonIcon.setAttribute("class","fas fa-plus");
    // buttonIcon.setAttribute("aria-hidden","true");
    // button.appendChild(buttonIcon);

    var spanText = document.createElement('span');
    spanText.setAttribute("class","font-weight-bold");
    spanText.innerHTML = "Join";
    button.appendChild(spanText);

    div.appendChild(divWrap)
    div.appendChild(button);


    document.getElementById("availableRooms").append(div);

    if (element.parentNode) {
        element.parentNode.remove();
    }
}


function getCurrentRoom(element) {
    // clear old messaged to display fresh ones
    clearInputResources(false);

    // autofocus on input-box
    document.getElementById("myMessage").focus();

    // set the id of the message container so message appears only in the rooms intended
    // document.getElementById("messages")


    // display messages from localstorage here if it exists and update localstorage in processgetCurrentRoom()

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

    document.getElementById("get_user_status").innerHTML = "";
    document.getElementById("user_status").innerHTML = "";
    document.getElementById("currentRoomName").innerHTML = friendName;


    showChatArea();

    
    // set this value so that verify_status can function from socketio.js
    if (element.getElementsByTagName("button")[0].id !== "roomView") {
        document.getElementById("get_user_status").innerHTML = friendUsername;
    }
    else {
        document.getElementById("user_status").innerHTML = "click here for group info";
    }

    console.log(document.getElementById("get_user_status").innerHTML)

    var params = {'url': '/room-details', 'payload': roomID, 'key': 'room_id'};
    ajaxCalls(params, element, processgetCurrentRoom);
}

function processgetCurrentRoom(data, element) {
    
    roomID = element.id;

    // clear localstorage notification counter
    if (JSON.parse(localStorage.getItem('notifyParams'))) {
        resetStorageNotification(roomID);
    }

    document.getElementById("pre-user-select").hidden = true;

    InfoModalBody = document.getElementById("roomInfoModal");
    messageDisplay = document.getElementById("messages")

    InfoModalBody.innerHTML = '';

    // add data to localStorage 

    current_room = data.current_room;
    room_history = current_room.room_history;
    for (x in room_history) {
        // create a function and use here and in socket append msgs
        msg = room_history[x];
        msg['from_db'] = true;
        // console.log(msg)
        append_msgs(msg);

    }

    // put the last message on the badge
    // call only if there's a message in the group already
    if (room_history.length !== 0) {
        handleLastMessageHelper(room_history[room_history.length - 1])
    }

    room_members = data.room_members;
    console.log(room_members);
    if (current_room.private_room !== true) {
        for (x in room_members) {
            member = room_members[x];
            const divMain = document.createElement('div');
            divMain.setAttribute("style","padding: 7px 0");
            const span_ = document.createElement('span');
            span_.innerHTML = member.name_surname;
            span_.setAttribute("class","name-header");
            divMain.appendChild(span_)
            if (member.id === current_room.created_by) {
                const adminSpan = document.createElement('span');
                adminSpan.setAttribute("class","group-marker");
                adminSpan.innerHTML = 'admin'
                divMain.appendChild(adminSpan)
            }
            InfoModalBody.append(divMain);
        }
    }
    // scrollDownChatWindow();
}

function resetStorageNotification(roomID) {
    var resetNotificationCounter = JSON.parse(localStorage.getItem('notifyParams'));
    if (resetNotificationCounter) {
        resetNotificationCounter[roomID] = 0;
        localStorage.setItem('notifyParams', JSON.stringify(resetNotificationCounter));
    }

    addNotificationBadge(roomID, JSON.parse(localStorage.getItem('notifyParams')));
}

function addNotificationBadge(room_id, data) {

    const span_badgeCounter = document.querySelector(`[id=${CSS.escape(room_id)}] .roomDivInfo span.badgeCounter`);

    if (span_badgeCounter) {
        if (data[room_id] === 0) {
            span_badgeCounter.setAttribute("style", "visibility: hidden; margin-right: 0; min-width: 0")
        }
        else {
            span_badgeCounter.setAttribute("style", "visibility: visible; margin-right: 15px; min-width: 18px")
            span_badgeCounter.innerHTML = data[room_id];
        }
    }

}

function addLastMessageBadge(room_id, data) {

    const span_lastMessage = document.querySelector(`[id=${CSS.escape(room_id)}] .roomDivInfo span.lastMessage`);

    if (span_lastMessage) {
        const elementGroupTest = document.querySelector(`[id=${CSS.escape(room_id)}]`).parentElement

        // if the current room is a group, add the author to the badge
        if (elementGroupTest.id === 'roomsPanel')
        {
            span_lastMessage.innerHTML = `${data[room_id][1]}: ${data[room_id][0]}`;
        }
        else {
            span_lastMessage.innerHTML = data[room_id][0];
        }
    }
    
}

function handleLastMessageHelper(data) {
    var roomID = data.room_id;
    var message = data.messages;
    var author = data.author;

    if (localStorage.getItem('lastMessageParams')) {
        // convert the localStorage string to a dictionary
        var existing = JSON.parse(localStorage.getItem('lastMessageParams'));
        existing[roomID] = [message, author];
        localStorage.setItem('lastMessageParams', JSON.stringify(existing));
    }
    else {
        // If no existing data, create an dictionary
        newParams = {};
        newParams[roomID] = [message, author];
        localStorage.setItem('lastMessageParams', JSON.stringify(newParams));
    }
    addLastMessageBadge(roomID, JSON.parse(localStorage.getItem('lastMessageParams')));
}

function handleNotificationsHelper(room_id, count) {

    if (localStorage.getItem('notifyParams')) {
        // convert the localStorage string to a dictionary
        var existing = JSON.parse(localStorage.getItem('notifyParams'));
        if (existing[room_id]) {
            existing[room_id] = existing[room_id] + count;
        }
        else {
            existing[room_id] = count;
        }
        localStorage.setItem('notifyParams', JSON.stringify(existing));
        console.log(`${count} from if updating`);
    }
    else {
        // If no existing data, create an dictionary
        newParams = {};
        newParams[room_id] = count;
        localStorage.setItem('notifyParams', JSON.stringify(newParams));
        console.log(`${count} from else creating new`);
    }

    addNotificationBadge(room_id, JSON.parse(localStorage.getItem('notifyParams')));
}

function persistentNotificationBadge() {
    var counterObject = JSON.parse(localStorage.getItem('notifyParams'));
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
// it is reset on click if the room with the notification
persistentNotificationBadge();

function persistentlastMessageBadge() {
    var counterObject = JSON.parse(localStorage.getItem('lastMessageParams'));
    console.log(counterObject)
    
    if (counterObject) {
        for (var key in counterObject) {
            if (counterObject.hasOwnProperty(key)) {
                addLastMessageBadge(key, counterObject)
            }
        }
    }
}

// so that the notifications can survive reload
// the class is changed on click of the room in question
persistentlastMessageBadge();

function showChatArea() {

    document.getElementById("appNavArea").style.zIndex = 1;

    document.getElementById("appChatArea").style.backgroundColor = "white"
    document.getElementById("appChatArea").style.zIndex = 1000;
}

function hideChatArea() {
    clearInputResources(true);
    document.getElementById("appChatArea").style.zIndex = 1
    document.getElementById("appNavArea").style.zIndex = 1000;

    document.getElementById("get_user_status").innerHTML = "";
    localStorage.removeItem("current_room_id");

    window.event.stopPropagation();
}

function clearInputResources(value) {
    
    // document.getElementById("myMessage").hidden = value;
    // document.getElementById("sendbutton").hidden = value;

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
    const outerDiv = document.createElement('div');
    outerDiv.setAttribute("class","messageItems");

    const containerDiv = document.createElement('div');
    containerDiv.setAttribute("class","messageContainer");

    const wrapperDiv = document.createElement('div');
    wrapperDiv.setAttribute("class","messageWrap");

    const innerDiv = document.createElement('div');
    innerDiv.setAttribute("class","messagePadded");

    // if the current room is a group
    if (!document.getElementById("get_user_status").innerHTML) {
        const authorSpan = document.createElement('span');
        authorSpan.setAttribute("class","authorSpanElement");
        authorSpan.innerHTML =  data.author;
        innerDiv.appendChild(authorSpan);
    }

    const span = document.createElement('span');
    span.setAttribute("class","displayMsgText");
    span.innerHTML = data.messages;
    innerDiv.appendChild(span);

    var local_time;
    var recentDate;
    var recentDateValue;
    if (data.timestamp) {
        recentDate = moment.utc(data['timestamp']).local().format('MMMM DD, YYYY');
        recentDateValue = displayDate(recentDate);

        local_time = moment.utc(data['timestamp']).local().format('HH:mm');        
    }
    else {
        recentDate = moment().format('MMMM DD, YYYY');
        recentDateValue = displayDate(recentDate);

        local_time = moment().format('HH:mm');
    }

    // if displayDate(recentDate) returns a value
    if (recentDateValue) {

        const outerDateDiv = document.createElement('div');
        outerDateDiv.setAttribute("class","messageItems dateInfoItem");

        const innerDateDiv = document.createElement('div');
        innerDateDiv.setAttribute("class","messagePadded dateInfoStyle");

        const dateInfoSpan = document.createElement('span');

        dateInfoSpan.innerHTML = recentDateValue;
        innerDateDiv.appendChild(dateInfoSpan);
        outerDateDiv.appendChild(innerDateDiv);
        document.getElementById("messages").append(outerDateDiv);
    }

    const timeInfoSpan = document.createElement('span');
    timeInfoSpan.setAttribute("class","timeSpanElement");
    timeInfoSpan.innerHTML = local_time;

    const messageStatusTimeInfoWrapper = document.createElement('div');
    messageStatusTimeInfoWrapper.setAttribute("id", data.uuid);
    messageStatusTimeInfoWrapper.setAttribute("class","statusTimeWrapper");
    messageStatusTimeInfoWrapper.appendChild(timeInfoSpan);

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

    innerDiv.appendChild(messageStatusTimeInfoWrapper);
    wrapperDiv.appendChild(innerDiv);
    containerDiv.appendChild(wrapperDiv);
    outerDiv.appendChild(containerDiv);

    document.getElementById("messages").append(outerDiv);
    scrollDownChatWindow();
}

function displayDate(recentDate) {
    var dateElement = document.querySelectorAll('.dateInfoItem .dateInfoStyle span');
    var dateToReturn;
    if (dateElement.length == 0) {
        dateToReturn = recentDate;
    }
    else {
        if (dateElement[dateElement.length - 1].innerHTML != recentDate) {
            dateToReturn = recentDate;
        }
    }
    return dateToReturn;
}

function createUniqueUID() {
    var dt = Date.now();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (dt + Math.random()*16)%16 | 0;
        dt = Math.floor(dt/16);
        return (c=='x' ? r :(r&0x3|0x8)).toString(16);
    });
    return username + uuid;
}

function addOneTick(messageStatusTimeInfoWrapper) {
    const messageStatusSpan = document.createElement('span');
    messageStatusSpan.setAttribute("class","oneTickSpanElement");

    const messageStatusIcon = document.createElement('i');
    messageStatusIcon.setAttribute("class","fas fa-check");
    messageStatusIcon.setAttribute("aria-hidden","true");

    messageStatusSpan.appendChild(messageStatusIcon);

    // check if the pending icon is present and if so replace it with the one tick
    if (messageStatusTimeInfoWrapper.childElementCount > 1) {
        messageStatusTimeInfoWrapper.replaceChild(messageStatusSpan, messageStatusTimeInfoWrapper.childNodes[1]);
    }
    else {
        messageStatusTimeInfoWrapper.appendChild(messageStatusSpan);
    }
}

function addTwoTicks(messageStatusTimeInfoWrapper) {
    const messageStatusSpan = document.createElement('span');
    messageStatusSpan.setAttribute("class","oneTickSpanElement");

    const messageStatusIcon = document.createElement('i');
    messageStatusIcon.setAttribute("class","fas fa-check-double")
    messageStatusIcon.setAttribute("aria-hidden","true");

    messageStatusSpan.appendChild(messageStatusIcon);

    // check if the sent icon is present and if so replace it with the double ticks
    // else append afresh
    if (messageStatusTimeInfoWrapper.childElementCount > 1) {
        messageStatusTimeInfoWrapper.replaceChild(messageStatusSpan, messageStatusTimeInfoWrapper.childNodes[1]);
    }
    else {
        messageStatusTimeInfoWrapper.appendChild(messageStatusSpan);
    }
}

function addPending(messageStatusTimeInfoWrapper) {
    const messageStatusSpan = document.createElement('span');
    messageStatusSpan.setAttribute("class","oneTickSpanElement");

    const messageStatusIcon = document.createElement('i');
    messageStatusIcon.setAttribute("class","fas fa-exclamation-circle");
    messageStatusIcon.setAttribute("aria-hidden","true");

    messageStatusSpan.appendChild(messageStatusIcon);

    messageStatusTimeInfoWrapper.appendChild(messageStatusSpan);
}

function scrollDownChatWindow() {
    const scrollElement = document.querySelector('#chatWindow .simplebar-content-wrapper');
    const scrollingHeight = document.getElementById("messages");
    scrollElement.scrollTop = scrollingHeight.scrollHeight;
}
// set localstorage on click of a room, clear on offline or fresh online. transmit this value with each emit