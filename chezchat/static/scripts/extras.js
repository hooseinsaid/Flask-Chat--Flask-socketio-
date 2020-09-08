
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

    var div = createDiv();
    div.id = data['roomID']
    div.setAttribute("class","user-list");

    var divWrap = createDiv();
    divWrap.setAttribute("class","noWrapDisplay");

    
    var div2 = createDiv();
    div2.setAttribute("class","name-section");
    
    var nameSpan = createSpan();
    nameSpan.innerHTML = userName;
    nameSpan.setAttribute("class","name-header");
    div2.appendChild(nameSpan);

    var timeSpan = createSpan();
    timeSpan.setAttribute("class","time-info");
    div2.appendChild(timeSpan);

    var div3 = createDiv();
    div3.setAttribute("class","roomDivInfo");
    var lastMessageSpan = createSpan();
    var badgeCounterSpan = createSpan()
    lastMessageSpan.setAttribute("class","lastMessage");
    badgeCounterSpan.setAttribute("class","badgeCounter");
    div3.appendChild(lastMessageSpan)
    div3.appendChild(badgeCounterSpan)

    divWrap.appendChild(div2)
    divWrap.appendChild(div3)


    div.setAttribute("onclick","getCurrentRoom(this); verify_status()");

    var button = createButton();
    button.setAttribute("class","btn btn-danger btn-sm");
    button.name = userName;
    button.value = userUsername;
    button.setAttribute("onclick","toModal(this);");

    var buttonIcon = createIcon();
    buttonIcon.setAttribute("class","fas fa-user-minus");
    buttonIcon.setAttribute("aria-hidden","true");
    button.appendChild(buttonIcon);

    div.appendChild(divWrap)
    div.appendChild(button);
    document.getElementById("chattables").append(div);

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

    var div = createDiv();
    div.setAttribute("class","user-list");

    var divWrap = createDiv();
    divWrap.setAttribute("class","noWrapDisplay");

    var div2 = createDiv();
    div2.setAttribute("class","name-section");

    var nameSpan = createSpan();
    nameSpan.innerHTML = friendName;
    nameSpan.setAttribute("class","name-header");
    div2.appendChild(nameSpan);

    divWrap.appendChild(div2)
    
    var button = createButton();
    button.name = friendName;
    button.value = friendUsername;
    button.setAttribute("onclick","addUser(this);");
    button.setAttribute("class","btn btn-success btn-sm");

    var buttonIcon = createIcon();
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

    var div = createDiv();
    div.id = roomID;
    div.setAttribute("class","user-list");
    div.setAttribute("onclick","getCurrentRoom(this)");

    var divWrap = createDiv();
    divWrap.setAttribute("class","noWrapDisplay");

    var div2 = createDiv();
    div2.setAttribute("class","name-section");

    var nameSpan = createSpan();
    nameSpan.innerHTML = roomName;
    nameSpan.setAttribute("class","name-header");
    div2.appendChild(nameSpan);

    var groupMarkerSpan = createSpan();
    groupMarkerSpan.innerHTML = "group";
    groupMarkerSpan.setAttribute("class","group-marker");
    div2.appendChild(groupMarkerSpan);

    var timeSpan = createSpan();
    timeSpan.setAttribute("class","time-info");
    div2.appendChild(timeSpan);


    var div3 = createDiv();
    div3.setAttribute("class","roomDivInfo");
    var lastMessageSpan = createSpan();
    var badgeCounterSpan = createSpan()
    lastMessageSpan.setAttribute("class","lastMessage");
    badgeCounterSpan.setAttribute("class","badgeCounter");
    div3.appendChild(lastMessageSpan)
    div3.appendChild(badgeCounterSpan)

    divWrap.appendChild(div2)
    divWrap.appendChild(div3)

    var button = createButton();
    button.setAttribute("class","btn btn-danger btn-sm");
    button.id = "roomView"
    button.name = roomName;
    button.value = roomID;
    button.setAttribute("onclick","leaveRoom(this);");

    var spanText = createSpan();
    spanText.setAttribute("class","font-weight-bold");
    spanText.innerHTML = "Exit";
    button.appendChild(spanText);

    div.appendChild(divWrap)
    div.appendChild(button);


    document.getElementById("chattables").append(div);

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

    var div = createDiv();
    div.setAttribute("class","user-list");

    var divWrap = createDiv();
    divWrap.setAttribute("class","noWrapDisplay");

    var div2 = createDiv();
    div2.setAttribute("class","name-section");

    var nameSpan = createSpan();
    nameSpan.innerHTML = roomName;
    nameSpan.setAttribute("class","name-header");
    div2.appendChild(nameSpan);

    var groupMarkerSpan = createSpan();
    groupMarkerSpan.innerHTML = "group";
    groupMarkerSpan.setAttribute("class","group-marker");
    div2.appendChild(groupMarkerSpan);

    divWrap.appendChild(div2)

    var button = createButton(); 
    button.setAttribute("class","btn btn-success btn-sm");
    button.name = roomName;
    button.value = roomID;
    button.setAttribute("onclick","joinRoom(this);");

    var spanText = createSpan();
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
        handleLastMessageHelper(room_history[room_history.length - 1]);
    }

    room_members = data.room_members;
    // console.log(room_members);
    if (current_room.private_room !== true) {
        for (x in room_members) {
            member = room_members[x];
            const divMain = createDiv();
            divMain.setAttribute("style","padding: 7px 0");
            const span_ = createSpan();
            span_.innerHTML = member.name_surname;
            span_.setAttribute("class","name-header");
            divMain.appendChild(span_)
            if (member.id === current_room.created_by) {
                const adminSpan = createSpan();
                adminSpan.setAttribute("class","group-marker");
                adminSpan.innerHTML = 'admin'
                divMain.appendChild(adminSpan)
            }
            InfoModalBody.append(divMain);
        }
    }
}

function createDiv() {
    var newDiv = document.createElement('div');

    return newDiv;
}

function createSpan() {
    var newSpan = document.createElement('span');

    return newSpan;
}

function createButton() {
    var newButton = document.createElement('button');

    return newButton;
}

function createIcon() {
    var newIcon = document.createElement('i');

    return newIcon;
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
            span_badgeCounter.setAttribute("style", "visibility: hidden; min-width: 0")
        }
        else {
            span_badgeCounter.setAttribute("style", "visibility: visible; min-width: 18px")
            span_badgeCounter.innerHTML = data[room_id];
        }
    }

}

function addLastMessageBadge(room_id, data) {

    const span_lastMessage = document.querySelector(`[id=${CSS.escape(room_id)}] .roomDivInfo span.lastMessage`);

    if (span_lastMessage) {
        const elementGroupTest = document.querySelector(`[id=${CSS.escape(room_id)}] .noWrapDisplay .name-section span.group-marker`)

        const lastMessageTimeSpan = document.querySelector(`[id=${CSS.escape(room_id)}] .noWrapDisplay .name-section span.time-info`)

        // if the current room is a group, add the author to the badge
        if (elementGroupTest)
        {
            span_lastMessage.innerHTML = `${data[room_id][1]}: ${data[room_id][0]}`;
        }
        else {
            span_lastMessage.innerHTML = data[room_id][0];
        }

        var date_ = checkDate(data[room_id][2]);
        lastMessageTimeSpan.innerHTML = date_;
    }
    
}

function checkDate(date) {

    var returnable;

    var currentDate = moment.utc();

    // date is already in UTC
    var refDate = moment(date);

    var currentDateinDateFormat = moment.utc(currentDate).local().format('MMMM DD, YYYY')
    var refDateinDateFormat = moment.utc(refDate).local().format('MMMM DD, YYYY')

    var currentDateinYearFormat = moment.utc(currentDate).local().format('YYYY')
    var refDateinYearformat = moment.utc(refDate).local().format('YYYY')

    if (currentDateinDateFormat == refDateinDateFormat) {
        returnable = refDate.format("HH:mm")
    }
    else if (currentDateinYearFormat == refDateinYearformat){
        returnable = refDate.format("MMM DD")
    }
    else {
        returnable = refDate.format("DD/MM/YYYY")
    }

    return returnable;
}

function handleLastMessageHelper(data) {
    var roomID = data.room_id;
    var message = data.messages;
    // last msg timestamp to UTC
    var time = moment.utc(data.timestamp);
    var author = data.author;

    if (localStorage.getItem('lastMessageParams')) {
        // convert the localStorage string to a dictionary
        var existing = JSON.parse(localStorage.getItem('lastMessageParams'));
        existing[roomID] = [message, author, time];
        localStorage.setItem('lastMessageParams', JSON.stringify(existing));
    }
    else {
        // If no existing data, create an dictionary
        newParams = {};
        newParams[roomID] = [message, author, time];
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
    const outerDiv = createDiv();
    outerDiv.setAttribute("class","messageItems");

    const containerDiv = createDiv();
    containerDiv.setAttribute("class","messageContainer");

    const wrapperDiv = createDiv();
    wrapperDiv.setAttribute("class","messageWrap");

    const innerDiv = createDiv();
    innerDiv.setAttribute("class","messagePadded");

    // if the current room is a group
    if (!document.getElementById("get_user_status").innerHTML) {
        const authorSpan = createSpan();
        authorSpan.setAttribute("class","authorSpanElement");
        authorSpan.innerHTML =  data.author;
        innerDiv.appendChild(authorSpan);
    }

    const span = createSpan();
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

        const outerDateDiv = createDiv();
        outerDateDiv.setAttribute("class","messageItems dateInfoItem");

        const innerDateDiv = createDiv();
        innerDateDiv.setAttribute("class","messagePadded dateInfoStyle");

        const dateInfoSpan = createSpan();

        dateInfoSpan.innerHTML = recentDateValue;
        innerDateDiv.appendChild(dateInfoSpan);
        outerDateDiv.appendChild(innerDateDiv);
        document.getElementById("messages").append(outerDateDiv);
    }

    const timeInfoSpan = createSpan();
    timeInfoSpan.setAttribute("class","timeSpanElement");
    timeInfoSpan.innerHTML = local_time;

    const messageStatusTimeInfoWrapper = createDiv();
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
    const messageStatusSpan = createSpan();
    messageStatusSpan.setAttribute("class","oneTickSpanElement");

    const messageStatusIcon = createIcon();
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
    const messageStatusSpan = createSpan();
    messageStatusSpan.setAttribute("class","oneTickSpanElement");

    const messageStatusIcon = createIcon();
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
    const messageStatusSpan = createSpan();
    messageStatusSpan.setAttribute("class","oneTickSpanElement");

    const messageStatusIcon = createIcon();
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

function swapRoomPostionOnNewMessage(room_id) {
    var parentElement = document.getElementById(room_id).parentNode;
    var child1 = document.getElementById(room_id).parentNode.firstChild
    var child2 = document.getElementById(room_id);
    parentElement.insertBefore(child2, child1);
}

function roomOrderArrayHandler(room_id) {
    if (localStorage.getItem('roomOrderParams')) {
        // convert the localStorage string to an array
        var existing = JSON.parse(localStorage.getItem('roomOrderParams'));
        if (existing.includes(room_id)) {
            /* if room_id is in the array already, delete it 
            so that it can be added afresh at the top of the array */
            existing.splice(existing.indexOf(room_id), 1)
        }
        // adds the new element to the beginning of the array
        existing.unshift(room_id.toString())
        localStorage.setItem('roomOrderParams', JSON.stringify(existing));
    }
    else {
        // If no existing data, create an array
        var array = [];
        // adds the new element to the beginning of the array
        array.unshift(room_id.toString());
        localStorage.setItem('roomOrderParams', JSON.stringify(array));
    }
    swapRoomPostionOnNewMessage(JSON.parse(localStorage.getItem('roomOrderParams'))[0]);
}

function roomOrder() {
    var counterObject = JSON.parse(localStorage.getItem('roomOrderParams'));
    
    if (counterObject) {
        counterObject.reverse();
        for (var count in counterObject) {
            swapRoomPostionOnNewMessage(counterObject[count]);
        }
    }
}
// so that the order can survive reload
roomOrder();