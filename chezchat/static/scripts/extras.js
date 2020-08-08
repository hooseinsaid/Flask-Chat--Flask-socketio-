var xhttp = new XMLHttpRequest();

function addUser(element) {
    var userID = element.id;
    var userName = element.name;
    var userUsername = element.value;
    xhttp.open("POST", "/add-user", true);
    xhttp.setRequestHeader("Content-Type", "application/json"); 

    xhttp.onreadystatechange = function() {
        if (this.readyState === 4 && this.status === 200) {
            var data = JSON.parse(this.responseText);
            var div = document.createElement('div');
            div.id = data['roomID']
            div.innerHTML = userName;
            div.setAttribute("onclick","getCurrentPrivateRoom(this); verify_status(); loadInputResource()");
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
    };
    var data = JSON.stringify({'user_id': userID});
    xhttp.send(data);
}

function removeUser(element) {
    clearInputResources();

    
    document.getElementById("currentRoomName").innerHTML = '';
    document.getElementById("user_status").innerHTML = '';
    document.getElementById("get_user_status").innerHTML = '';

    var friendID = element.id;
    var friendName = element.name;
    var friendUsername = element.value;
    var roomID = element.parentNode.id;
    xhttp.open("POST", "/remove-user", true);
    xhttp.setRequestHeader("Content-Type", "application/json"); 
    
    xhttp.onreadystatechange = function() {
        if (this.readyState === 4 && this.status === 200) {
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
    };
    var data = JSON.stringify({'room_id': roomID});
    xhttp.send(data);

    window.event.stopPropagation();
}

function joinRoom(element) {
    var roomID = element.value;
    var roomName = element.name;
    xhttp.open("POST", "/join-room", true);
    xhttp.setRequestHeader("Content-Type", "application/json"); 
    
    xhttp.onreadystatechange = function() {
        if (this.readyState === 4 && this.status === 200) {
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
    };
    var data = JSON.stringify({'room_id': roomID});
    xhttp.send(data);
}

function leaveRoom(element) {
    var roomID = element.value;
    var roomName = element.name;
    xhttp.open("POST", "/leave-room", true);
    xhttp.setRequestHeader("Content-Type", "application/json"); 
    
    xhttp.onreadystatechange = function() {
        if (this.readyState === 4 && this.status === 200) {
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
    };
    var data = JSON.stringify({'room_id': roomID});
    xhttp.send(data);

    window.event.stopPropagation();
}

function getCurrentPrivateRoom(element) {
    friendID = element.getElementsByTagName("button")[0].id;
    friendName = element.getElementsByTagName("button")[0].name;
    friendUsername = element.getElementsByTagName("button")[0].value;
    privateRoomID = element.id;
    
    // set this value so that verify_status can function from socketio.js
    document.getElementById("get_user_status").innerHTML = friendUsername;

    document.getElementById("currentRoomName").innerHTML = friendName;

    xhttp.open("POST", "/private-room", true);
    xhttp.setRequestHeader("Content-Type", "application/json"); 
    
    xhttp.onreadystatechange = function() {
        if (this.readyState === 4 && this.status === 200) {
            var data = JSON.parse(this.responseText);
            current_room = data.current_room;
            room_history = current_room.room_history;
            for (x in room_history) {
                msg = room_history[x];
                const li = document.createElement('li');
                li.innerHTML = `${msg['author']} says ${msg['messages']} @ ${moment(msg['timestamp']).format('MMM-D H:mm')}`;
                document.getElementById("messages").append(li);
            }
        }
    };
    var data = JSON.stringify({'room_id': privateRoomID});
    xhttp.send(data);
}

// function loadInputResource() {
//     clearInputResources();

    // for the imput fields and buttons add them to the HTML but set innerHTML empty or disable them
    // activate when a user is clicked on
    // textInput = document.createElement('input');

    // textInput.setAttribute("id", "myMessage");
    // textInput.setAttribute("type", "text");
    // textInput.setAttribute("name", "message");

    // submitButton = document.createElement('input')

    // submitButton.setAttribute("id", "sendbutton");
    // submitButton.setAttribute("type", "submit");
    // submitButton.setAttribute("name", "submit");
    // submitButton.setAttribute("value", "Send");

    // document.getElementById("msgInput").append(textInput)
    // document.getElementById("msgInput").append(submitButton)
// }

function clearInputResources() {
    // clears the message li
    var msgContent = document.getElementById("messages");
    if (msgContent) {
        while (msgContent.firstChild) {
            msgContent.removeChild(msgContent.firstChild);
        }
    }
}