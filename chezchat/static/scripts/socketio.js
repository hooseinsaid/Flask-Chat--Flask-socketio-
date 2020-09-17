let timer, timeoutVal = 2000; // time it takes to wait for user to stop typing in ms
var messageInput = document.getElementById("myMessage");
var messageSendButton = document.getElementById("sendbutton");
var getUser = document.getElementById("get_user_status");
var userStatusInfo = document.getElementById("user_status");
var myStatus = document.getElementById("my_status");
var currentRoomName = document.getElementById("currentRoomName");

function verify_status() {
    // query the db on connect of current_user using ajax to 
    // know the current recipient"s status and update id #user_status below
    // grab current user variable on the page and query with it
    var xhttp = new XMLHttpRequest();
    xhttp.open("POST", "/get-user-status", true);
    xhttp.setRequestHeader("Content-Type", "application/json"); 

    xhttp.onreadystatechange = function() {

        if (this.readyState === 4 && this.status === 200) {

            var data = JSON.parse(this.responseText);
            var hours = (moment() - moment(data["last_seen"])) / (1000 * 3600)
            
            if (data["status"] === "offline") {
                if (data["forced_offline"] == true) {
                    userStatusInfo.innerHTML = "offline";
                }
                else {
                    if (hours <= (24 * 7)) {
                        userStatusInfo.innerHTML = `last seen ${moment(data["last_seen"]).fromNow()}`;
                    }
                    else {
                        userStatusInfo.innerHTML = `last seen ${moment(data["last_seen"]).format("LL")} at ${moment(data["last_seen"]).format("HH:mm")}`;
                    }
                }
            }
            else {
                userStatusInfo.innerHTML = `${data["status"]}`;
            }
        }
    };
    var data = JSON.stringify({"user": getUser.innerHTML});
    xhttp.send(data);
}


document.addEventListener("DOMContentLoaded", () => {
    var socket = io();

    // if the room is a private room
    // if(!getUser.innerHTML) {
    //     localStorage.removeItem("current_room_id");
    // }
    
    // on reload or first load, remove this from localstorage ad it helps direct message to the right place
    localStorage.removeItem("current_room_id");

    document.getElementById("msgInput").hidden = true;
    
    // update the present status of the recipient after 20 seconds
    setInterval(function() {
        if(getUser.innerHTML) {
            verify_status();    
        }
    }, 20000);

    // triggered when the client tries to connect to the server
    // and it emits to the on_connect event on the server side
    socket.on("connect", () => {
        myStatus.innerHTML = "You are online";
    });

    // triggered when the client pings the server and can"t connect
    socket.on("disconnect", () => {

        userStatusInfo.innerHTML = "";

        myStatus.innerHTML = "Cannot reach the server at this moment";
    });

    socket.on("prevent_double_session", () => {
        socket.disconnect();

        // persistent modal forcing the user to reload when he return to the previous tab
        // after connecting on a new tab
        $("#preventMultModal").modal("show");
        if (getUser.innerHTML) {
            getUser.innerHTML = "";
            userStatusInfo.innerHTML = "";
        }
    });


    // emits to handle_messages event on the server side
    if (messageSendButton) {
        document.querySelector("#sendbutton").onclick = () => {

            if (localStorage.getItem("current_room_id")) {
                if (document.querySelector("#myMessage").value.trim() != "") {

                    const uniqueUID = createUniqueUID(); 

                    var data = {
                        "messages": document.querySelector("#myMessage").value,
                        "author": username, 
                        "room_id": localStorage.getItem("current_room_id"),
                        "uuid": uniqueUID,
                        "from_db": false
                    };
                    socket.emit("handle_messages", data, serverReceivedCallback);
                    append_msgs(data);
                    document.querySelector("#myMessage").value = "";
                    

                    // scrollDownChatWindow();
                    messageInput.focus();
                }
            }
            else {
                alert("There's been an error. please reload")
            }
        }
    }

    // let"s the sender know that the server received their message
    function serverReceivedCallback(data) {
        messageStatusTimeInfoWrapper = document.getElementById(data["uuid"]);

        // adds one tick to the element with uuid as id
        addOneTick(messageStatusTimeInfoWrapper);

        // rearranges the current room so that it"s on top
        swapRoomPostionOnNewMessage(data.room_id)

        // put the last message on the badge only after we are sure the server received it
        addLastMessageBadge(data)
    }

    socket.on("message_delivered", uuid => {
        console.log("user received message")
        messageStatusTimeInfoWrapper = document.getElementById(uuid);
        if (messageStatusTimeInfoWrapper) {
            addTwoTicks(messageStatusTimeInfoWrapper);
        }
    });

    socket.on("notification", data => {

        handleNotificationsHelper(data["room_id"], data["count"])

        // rearranges the latest msg so that it is on top
        swapRoomPostionOnNewMessage(data.room_id)

        addLastMessageBadge(data)
    });

    // receives message from an the handle_messages event on the server side and displays them to a client
    socket.on("handle_messages", (data, userReceivedCallback) => {
        // send the msg only to the intended room
        if (localStorage.getItem("current_room_id") && data.room_id === localStorage.getItem("current_room_id")) {
            append_msgs(data);
            // scrollDownChatWindow();
        }
        else {
            // do not add to notification counter id user is in the target room already
            var count = 1;
            handleNotificationsHelper(data.room_id, count)
        }

        swapRoomPostionOnNewMessage(data.room_id)

        // put the last message on the badge
        addLastMessageBadge(data)
        
        // let"s the sender know that his msg has been received by the intended recipient
        userReceivedCallback(data);
    });

    // receives the message emitted by broadcast event and confirms that the client is connected/disconnected to/from the server
    socket.on("broadcast", data => {
        console.log(`${data.username} is ${data.info}`);

        // verify user status 2 seconds after key up
        if (data.info == "verify_status" && getUser.innerHTML == data.username) {
            verify_status();
        }

        // get the html element and update it
        if (getUser.innerHTML == data.username && data.info != "verify_status") {
            // userStatusInfo.innerHTML = `${data.username} is ${data.info} from broadcast`;
            userStatusInfo.innerHTML = `${data.info}`;
        }
    });

    socket.on("update_remove_users", data => {

        const userRemove = data.user_to_remove;
        var userElement = document.querySelectorAll(`button[value=${CSS.escape(userRemove)}]`)[0]
        processRemoveUser(data, userElement);
        alert(`${userRemove} removed you`);


        if (userRemove === getUser.innerHTML) {
            userStatusInfo.innerHTML = "";
            currentRoomName.innerHTML = "";
            getUser.innerHTML = "";
            localStorage.removeItem("current_room_id");
            clearInputResources(true);
        }
    });

    socket.on("update_add_users", data => {
        const userAdd = data.user_to_add;
        var userElement = document.querySelectorAll(`button[value=${CSS.escape(userAdd)}]`)[0];
        processAddUser(data, userElement);
        alert(`${userAdd} added you`);
    });

    socket.on("update_users", data => {
        processRemoveUser(data, data)
    });

    socket.on("update_rooms", data => {
        processLeaveRoom(data, data)
    });

    // check for typing
    if (messageInput) {
        // could have used keypress which will be easier to implement but that doesn"t work on mobile browsers
        messageInput.addEventListener("keydown", handleKeyPress);
        messageInput.addEventListener("keyup", handleKeyUp);
    }

    var initialTextLength = 0;
    function testTyping(newLength) {
        var value;
        if (newLength > initialTextLength) {
            value = true;
        }
        else {
            value = false;
            socket.emit(
                "broadcast", {
                "username": username, 
                "info": "verify_status", 
                "room_id": localStorage.getItem("current_room_id") 
            });
        }
        initialTextLength = newLength;
        return value;
    }

    // when user is pressing down on keys, clear the timeout
    function handleKeyPress(e) {
        // since keydown registers regardless of whether a chatacter is produced or not
        // check the input and see if there"s any character
        var newLength = document.querySelector("#myMessage").value.length;
        var typingCheck = testTyping(newLength);
        if (typingCheck == true) {
            clearTimeout(timer);
            if (localStorage.getItem("current_room_id")) {
                socket.emit(
                    "broadcast", {
                    "username": username, 
                    "info": "typing...", 
                    "room_id": localStorage.getItem("current_room_id")
                });
            }
        }
    }

    // when the user has stopped pressing on keys, set the timeout
    // if the user presses on keys before the timeout is reached, then this timeout is canceled
    function handleKeyUp(e) {

        // make enter key to be send
        if (event.keyCode === 13) {
            messageSendButton.click();
        }


        clearTimeout(timer); // prevent errant multiple timeouts from being generated
        timer = setTimeout(() => {
            // emit to broadcast so that the server knows that we are done typing so verify_status can be called
            // to verify the users online/offline status afresh
            
            if (localStorage.getItem("current_room_id")) {
                socket.emit(
                    "broadcast", {
                    "username": username, 
                    "info": "verify_status", 
                    "room_id": localStorage.getItem("current_room_id") 
                });
            }

        }, timeoutVal);
    }

    socket.on("reconnecting", function() {
        myStatus.innerHTML = "Reconnecting...";
    });
});