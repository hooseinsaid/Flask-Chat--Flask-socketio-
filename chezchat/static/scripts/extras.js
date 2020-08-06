var xhttp = new XMLHttpRequest();

function addUser(element) {
    var userID = element.value;
    var userName = element.name;
    xhttp.open("POST", "/add-user", true);
    xhttp.setRequestHeader("Content-Type", "application/json"); 

    xhttp.onreadystatechange = function() {
        if (this.readyState === 4 && this.status === 200) {
            var data = JSON.parse(this.responseText);
            const div = document.createElement('div');
            div.id = data['roomID']
            div.innerHTML = userName;
            var button = document.createElement('button'); 
            button.name = userName;
            button.value = userID;
            button.setAttribute("onclick","removeUser(this);");
            const buttonText = document.createTextNode("Remove user");
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
    var friendID = element.value;
    var friendName = element.name;
    var roomID = element.parentNode.id;
    xhttp.open("POST", "/remove-user", true);
    xhttp.setRequestHeader("Content-Type", "application/json"); 
    
    xhttp.onreadystatechange = function() {
        if (this.readyState === 4 && this.status === 200) {
            const div = document.createElement('div');
            div.innerHTML = friendName;
            var button = document.createElement('button'); 
            button.name = friendName;
            button.value = friendID;
            button.setAttribute("onclick","addUser(this);");
            const buttonText = document.createTextNode("Add user"); 
            button.appendChild(buttonText);
            div.appendChild(button);

            document.getElementById("availableUsers").append(div);

            element.parentNode.remove();
        }
    };
    var data = JSON.stringify({'room_id': roomID});
    xhttp.send(data);
}

function joinRoom(element) {
    var roomID = element.value;
    var roomName = element.name;
    xhttp.open("POST", "/remove-user", true);
    xhttp.setRequestHeader("Content-Type", "application/json"); 
    
    xhttp.onreadystatechange = function() {
        if (this.readyState === 4 && this.status === 200) {
            const div = document.createElement('div');
            div.innerHTML = friendName;
            var button = document.createElement('button'); 
            button.name = friendName;
            button.value = friendID;
            button.setAttribute("onclick","addUser(this);");
            const buttonText = document.createTextNode("Add user"); 
            button.appendChild(buttonText);
            div.appendChild(button);

            document.getElementById("availableUsers").append(div);

            element.parentNode.remove();
        }
    };
    var data = JSON.stringify({'room_id': roomID});
    xhttp.send(data);
}