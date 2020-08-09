var xhttp = new XMLHttpRequest();

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
    var userID = element.id
    var params = {'url': '/add-user', 'payload': userID, 'key': 'user_id'};
    ajaxCalls(params, element, processAddUser);
}

function processAddUser(data, element) {
    
    var userID = element.id;
    var userName = element.name;
    var userUsername = element.value;

    var div = document.createElement('div');
    div.id = data['roomID']
    div.innerHTML = userName;
    div.setAttribute("onclick","getCurrentPrivateRoom(this); verify_status()");
    var button = document.createElement('button'); 
    button.id = userID;
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

    var friendID = element.id;
    var friendName = element.name;
    var friendUsername = element.value;

    var div = document.createElement('div');
    div.innerHTML = friendName;
    var button = document.createElement('button'); 
    button.id = friendID;
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
    var button = document.createElement('button'); 
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

function getCurrentPrivateRoom(element) {
    friendName = element.getElementsByTagName("button")[0].name;
    friendUsername = element.getElementsByTagName("button")[0].value;
    privateRoomID = element.id;
    
    // set this value so that verify_status can function from socketio.js
    document.getElementById("get_user_status").innerHTML = friendUsername;

    document.getElementById("currentRoomName").innerHTML = friendName;

    var params = {'url': '/private-room', 'payload': privateRoomID, 'key': 'room_id'};
    ajaxCalls(params, element, processgetCurrentPrivateRoom);
}

function processgetCurrentPrivateRoom(data, element) {
    clearInputResources(false);

    current_room = data.current_room;
    room_history = current_room.room_history;
    for (x in room_history) {
        msg = room_history[x];
        const li = document.createElement('li');
        li.innerHTML = `${msg['author']} says ${msg['messages']} @ ${moment(msg['timestamp']).format('MMM-D H:mm')}`;
        document.getElementById("messages").append(li);
    }
}

function clearInputResources(value) {
    
    document.getElementById("myMessage").hidden = value;
    document.getElementById("sendbutton").hidden = value;

    // clears the message li
    var msgContent = document.getElementById("messages");
    if (msgContent) {
        while (msgContent.firstChild) {
            msgContent.removeChild(msgContent.firstChild);
        }
    }
}