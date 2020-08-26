
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

    
    var div2 = document.createElement('div');
    div2.innerHTML = userName;
    div2.setAttribute("class","name-section");


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

    div.appendChild(div2)
    div.appendChild(button);
    document.getElementById("friendsPanel").append(div);

    element.parentNode.remove();
}

function removeUser(element) {
    
    // only so these if i am currently on the user to remove page
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
    var div2 = document.createElement('div');
    div2.innerHTML = friendName;
    div2.setAttribute("class","name-section");
    var button = document.createElement('button');
    button.name = friendName;
    button.value = friendUsername;
    button.setAttribute("onclick","addUser(this);");
    button.setAttribute("class","btn btn-success btn-sm");
    var buttonIcon = document.createElement('i');
    buttonIcon.setAttribute("class","fas fa-user-plus");
    buttonIcon.setAttribute("aria-hidden","true");
    button.appendChild(buttonIcon);
    div.appendChild(div2)
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
    var div2 = document.createElement('div');
    div2.setAttribute("class","name-section");
    div2.innerHTML = roomName;
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

    div.appendChild(div2)
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
    var div2 = document.createElement('div');
    div2.innerHTML = roomName;
    div2.setAttribute("class","name-section");
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

    div.appendChild(div2)
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


    // display messages from localstorage here if it exists and update localstorage in processgetCurrentRoom()

    friendName = element.getElementsByTagName("button")[0].name;
    friendUsername = element.getElementsByTagName("button")[0].value;
    roomID = element.id;

    // hides the "please select a chat to start messages" at the beginning
    // set an overlay here with the widget spinner
    // hide just before the info is displayed in processgetCurrentRoom()
    document.getElementById("pre-user-select").hidden = false;
    document.getElementById("pre-user-msg").hidden = true;
    document.getElementById("pre-user-spinner").hidden = false;

    document.getElementById("get_user_status").innerHTML = "";
    document.getElementById("user_status").innerHTML = "";
    document.getElementById("currentRoomName").innerHTML = friendName;


    localStorage.setItem("current_room_id", roomID);


    showChatArea();

    
    // set this value so that verify_status can function from socketio.js
    if (element.getElementsByTagName("button")[0].id !== "roomView") {
        document.getElementById("get_user_status").innerHTML = friendUsername;
    }

    console.log(document.getElementById("get_user_status").innerHTML)

    var params = {'url': '/room-details', 'payload': roomID, 'key': 'room_id'};
    ajaxCalls(params, element, processgetCurrentRoom);
}

function processgetCurrentRoom(data, element) {
    

    document.getElementById("pre-user-select").hidden = true;

    InfoModalBody = document.getElementById("roomInfoModal");
    messageDisplay = document.getElementById("messages")

    InfoModalBody.innerHTML = '';

    // add data to localStorage 

    current_room = data.current_room;
    console.log(current_room);
    room_history = current_room.room_history;
    for (x in room_history) {
        // create a function and use here and in socket append msgs
        msg = room_history[x];
        msg['from_db'] = true;
        console.log(msg)
        const local_time = moment.utc(msg['timestamp']).local().format('MMM-D H:mm');
        append_msgs(msg, local_time);

        // const li = document.createElement('li');
        // li.innerHTML = `${msg['author']} says ${msg['messages']} @ ${moment.utc(msg['timestamp']).local().format('MMM-D H:mm')}`;
        // messageDisplay.append(li);
    }

    room_members = data.room_members;
    console.log(room_members);
    if (current_room.private_room !== true) {
        for (x in room_members) {
            member = room_members[x];
            const div = document.createElement('div');
            if (member.id === current_room.created_by) {
                div.innerHTML = `${member.name_surname} ADMIN`;
            }
            else {
                div.innerHTML = member.name_surname;
            }
            InfoModalBody.append(div);
        }
    }
    scrollDownChatWindow();
}

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

// trying to detect back button
//! does not work for now
document.addEventListener('backbutton', function() {
    if(document.getElementById("appChatArea").style.zIndex == 1000) {
        hideChatArea();
        console.log("back button")
    }
});


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
    
function append_msgs(data, local_time) {
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

    const timeInfoSpan = document.createElement('span');
    timeInfoSpan.setAttribute("class","timeSpanElement");
    timeInfoSpan.innerHTML = local_time;

    const messageStatusTimeInfoWrapper = document.createElement('div');
    messageStatusTimeInfoWrapper.setAttribute("id", data.uuid);
    messageStatusTimeInfoWrapper.setAttribute("class","statusTimeWrapper");
    messageStatusTimeInfoWrapper.appendChild(timeInfoSpan);


    // if the current msg is from the user
    if (data.author == username) {
        outerDiv.setAttribute("class","messageItems userSpecificMessageItems");
        wrapperDiv.setAttribute("class","messageWrap userSpecificmessageWrap");

        // if the message is being rendered from db add a tick
        // else add an exclamation until it is received by server
        if (data.from_db === true) {
            addOneTick(messageStatusTimeInfoWrapper);
        }
        else if (data.from_db === false) {
            addPending(messageStatusTimeInfoWrapper)
        }
    }


    innerDiv.appendChild(messageStatusTimeInfoWrapper);
    wrapperDiv.appendChild(innerDiv);
    containerDiv.appendChild(wrapperDiv);
    outerDiv.appendChild(containerDiv);
    document.getElementById("messages").append(outerDiv);
}

// !consider moving it to a new file
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