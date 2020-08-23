
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
    clearInputResources(true);
    
    document.getElementById("currentRoomName").innerHTML = '';
    document.getElementById("user_status").innerHTML = '';
    document.getElementById("get_user_status").innerHTML = '';
    
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

    document.getElementById("pre-user-select").hidden = true;

    showChatArea();

    friendName = element.getElementsByTagName("button")[0].name;
    friendUsername = element.getElementsByTagName("button")[0].value;
    roomID = element.id;

    localStorage.setItem("current_room_id", roomID);

    document.getElementById("get_user_status").innerHTML = "";
    document.getElementById("user_status").innerHTML = "";
    document.getElementById("currentRoomName").innerHTML = friendName;
    
    // set this value so that verify_status can function from socketio.js
    if (element.getElementsByTagName("button")[0].id !== "roomView") {
        document.getElementById("get_user_status").innerHTML = friendUsername;
    }

    console.log(document.getElementById("get_user_status").innerHTML)

    var params = {'url': '/room-details', 'payload': roomID, 'key': 'room_id'};
    ajaxCalls(params, element, processgetCurrentRoom);
}

function processgetCurrentRoom(data, element) {
    // clear old messaged to display fresh ones
    clearInputResources(false);

    showChatArea();

    InfoModalBody = document.getElementById("roomInfoModal");
    messageDisplay = document.getElementById("messages")

    InfoModalBody.innerHTML = '';

    current_room = data.current_room;
    console.log(current_room);
    room_history = current_room.room_history;
    for (x in room_history) {
        msg = room_history[x];
        console.log(msg)
        const li = document.createElement('li');
        li.innerHTML = `${msg['author']} says ${msg['messages']} @ ${moment.utc(msg['timestamp']).local().format('MMM-D H:mm')}`;
        messageDisplay.append(li);
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
}

function showChatArea() {

    document.getElementById("appNavArea").style.zIndex = 1;

    document.getElementById("appChatArea").style.backgroundColor = "white"
    document.getElementById("appChatArea").style.zIndex = 1000;
}

function hideChatArea() {
    document.getElementById("appChatArea").style.zIndex = 1
    document.getElementById("appNavArea").style.zIndex = 1000;
    window.event.stopPropagation();
}

// trying to detect back button
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

// set localstorage on click of a room, clear on offline or fresh online. transmit this value with each emit