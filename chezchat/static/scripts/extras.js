
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
    div.innerHTML = userName;
    div.setAttribute("onclick","getCurrentRoom(this); verify_status()");
    var button = document.createElement('button');
    button.name = userName;
    button.value = userUsername;
    button.setAttribute("onclick","removeUser(this);");
    var buttonText = document.createTextNode("Remove user");
    button.appendChild(buttonText);
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
    div.innerHTML = friendName;
    var button = document.createElement('button');
    button.name = friendName;
    button.value = friendUsername;
    button.setAttribute("onclick","addUser(this);");
    var buttonText = document.createTextNode("Add user"); 
    button.appendChild(buttonText);
    div.appendChild(button);

    document.getElementById("availableUsers").append(div);

    element.parentNode.remove();
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
    div.innerHTML = roomName;
    div.setAttribute("onclick","getCurrentRoom(this)");
    var button = document.createElement('button');
    button.id = "roomView"
    button.name = roomName;
    button.value = roomID;
    button.setAttribute("onclick","leaveRoom(this);");
    var buttonText = document.createTextNode("Leave room"); 
    button.appendChild(buttonText);
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
    div.innerHTML = roomName;
    var button = document.createElement('button'); 
    button.name = roomName;
    button.value = roomID;
    button.setAttribute("onclick","joinRoom(this);");
    var buttonText = document.createTextNode("Join room"); 
    button.appendChild(buttonText);
    div.appendChild(button);

    document.getElementById("availableRooms").append(div);

    element.parentNode.remove();
}

function getCurrentRoom(element) {

    document.getElementById("pre-user-select").hidden = true;

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