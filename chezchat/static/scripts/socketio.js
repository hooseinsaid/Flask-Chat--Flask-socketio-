let timer, timeoutVal = 2000; // time it takes to wait for user to stop typing in ms
var messageInput = document.getElementById("myMessage");
var messageSendButton = document.getElementById("sendbutton");
var getUser = document.getElementById("get_user_status");
var userStatusInfo = document.getElementById("user_status");
var myStatus = document.getElementById("my_status");
var currentRoomName = document.getElementById("currentRoomName");

function verify_status() {
    // query the db on connect of current_user using ajax to 
    // know the current recipient's status and update id #user_status below
    // grab current user variable on the page and query with it
    var xhttp = new XMLHttpRequest();
    xhttp.open("POST", "/get-user-status", true);
    xhttp.setRequestHeader("Content-Type", "application/json"); 

    xhttp.onreadystatechange = function() {

        if (this.readyState === 4 && this.status === 200) {

            var data = JSON.parse(this.responseText);
            var hours = (moment() - moment(data['last_seen'])) / (1000 * 3600)
            console.log(hours)
            
            if (data['status'] === 'offline') {
                if (data['forced_offline'] == true) {
                    userStatusInfo.innerHTML = `${data['username']} is offline from verify_status after server crashed`;
                }
                else {
                    if (hours <= (24 * 7)) {
                        userStatusInfo.innerHTML = `${data['username']} was last seen ${moment(data['last_seen']).fromNow()} from verify_status`;
                    }
                    else {
                        userStatusInfo.innerHTML = `${data['username']} was last seen ${moment(data['last_seen']).format('LL')} from verify_status`;
                    }
                }
            }
            else {
                userStatusInfo.innerHTML = `${data['username']} is ${data['status']} from verify_status`;
            }
        }
    };
    console.log(getUser.innerHTML)
    var data = JSON.stringify({'user': getUser.innerHTML});
    xhttp.send(data);
}


document.addEventListener('DOMContentLoaded', () => {
    var socket = io();

    if(!getUser.innerHTML) {
        localStorage.removeItem("current_room_id");
    }

    document.getElementById("msgInput").hidden = true;
    
    // messageSendButton.hidden = true;
    // messageInput.hidden = true;
    
    // update the presence status of the recipient
    setInterval(function() {
        if(getUser.innerHTML) {
            verify_status();    
        }
    }, 20000);

    // triggered when the client tries to connect to the server
    // and it emits to the on_connect event on the server side
    socket.on('connect', () => {
        console.log(`${localStorage.getItem('current_room_id')} from connect`)
        console.log('Verify Status running from connect')

        
        // localStorage.removeItem("current_room_id");

        // getUser.innerHTML = '';
        // userStatusInfo.innerHTML = '';
        // currentRoomName.innerHTML = '';
        myStatus.innerHTML = 'You are online';
    });

    // triggered when the client pings the server and can't connect
    socket.on('disconnect', () => {
        console.log('Cannot reach the server at this moment');
        console.log('disconnected');

        // localStorage.removeItem("current_room_id");

        userStatusInfo.innerHTML = '';
        // currentRoomName.innerHTML = '';
        // getUser.innerHTML = '';
        myStatus.innerHTML = 'Cannot reach the server at this moment';

        // disable send button and text input until server or client is back online
        // allow users to peruse current history even if offline
        // if (messageInput || messageSendButton) {
        //     clearInputResources(true);
        // }
        console.log(`${localStorage.getItem('current_room_id')} from disconnect`)
    });

    socket.on('prevent_double_session', () => {
        // make here a persistent modal forcing the user to reload
        socket.disconnect();
        $('#preventMultModal').modal('show');
        if (getUser.innerHTML) {
            getUser.innerHTML = '';
            userStatusInfo.innerHTML = '';
        }
    });


    // emits to handle_messages event on the server side
    if (messageSendButton) {
        document.querySelector('#sendbutton').onclick = () => {
            
            // think of a mechanism to prevent from sending when offline
            if (localStorage.getItem('current_room_id')) {
                if (document.querySelector('#myMessage').value.trim() != "") {

                    const uniqueUID = createUniqueUID(); 

                    var data = {
                        'messages': document.querySelector('#myMessage').value,
                        'author': username, 
                        'room_id': localStorage.getItem('current_room_id'),
                        'uuid': uniqueUID,
                        'from_db': false
                    };
                    socket.emit('handle_messages', data, serverReceivedCallback);
                    append_msgs(data);
                    document.querySelector('#myMessage').value = '';
                    

                    scrollDownChatWindow();
                    document.getElementById("myMessage").focus();
                }
            }
            else {
                alert("There's been an error sendmsg. please reload")
            }
        }
    }

    // let's the sender know that the server received their message
    function serverReceivedCallback(data, uuid) {
        console.log(data);
        messageStatusTimeInfoWrapper = document.getElementById(uuid);
        addOneTick(messageStatusTimeInfoWrapper);
        console.log(messageStatusTimeInfoWrapper);
        // ! get the docByID of the css element and change to one tick
        // ! by default it should be on pending
    }

    socket.on('message_delivered', () => {
        console.log("user received message")
        // ! get the docByID of the css element and change to one tick
        // ! by default it should be on pending
    });

    // receives message from an the handle_messages event on the server side and displays them to a client
    socket.on('handle_messages', (data, userReceivedCallback) => {
        // send the msg only to the intended room
        if (localStorage.getItem('current_room_id') && data.room_id === localStorage.getItem('current_room_id')) {
            append_msgs(data);
            scrollDownChatWindow();
        }

        // let's the sender know that his msg has been received
        userReceivedCallback();
        // alert(`${data.username} says ${data.msg}`)
    });

    // receives the message emitted by broadcast event and confirms that the client is connected/disconnected to/from the server
    socket.on('broadcast', data => {
        console.log(`${data.username} is ${data.info}`);
        // compare data.username and getUserInfo and if they're the same show the typing or online msg
        // for notification use a callback. when the msg is delivered increase a counter or something
        // when a user logs in elsewhere, log them out on the previous place and display an alert saying they've 
        // been loggeg out of the previous place they were logged in
        if (data.info == 'verify_status' && getUser.innerHTML == data.username) {
            verify_status();
        }


        // get the html element and update it
        if (getUser.innerHTML == data.username && data.info != 'verify_status') {
            userStatusInfo.innerHTML = `${data.username} is ${data.info} from broadcast`;
            // alert(`${data.username} is ${data.info}`)
        }
    });

    socket.on('update_remove_users', data => {

        const userRemove = data.user_to_remove;
        var userElement = document.querySelectorAll(`button[value=${CSS.escape(userRemove)}]`)[0]
        console.log(userElement);
        processRemoveUser(data, userElement);
        alert(`${userRemove} removed you`);


        if (userRemove === getUser.innerHTML) {
            document.getElementById("user_status").innerHTML = "";
            document.getElementById("currentRoomName").innerHTML = "";
            document.getElementById("get_user_status").innerHTML = "";
            localStorage.removeItem("current_room_id");
            clearInputResources(true);
        }
    });

    socket.on('update_add_users', data => {
        const userAdd = data.user_to_add;
        var userElement = document.querySelectorAll(`button[value=${CSS.escape(userAdd)}]`)[0];
        processAddUser(data, userElement);
        alert(`${userAdd} added you`);
    });

    socket.on('update_users', data => {
        processRemoveUser(data, data)
    });

    socket.on('update_rooms', data => {
        processLeaveRoom(data, data)
    });


    // maybe this does not make sense as message input always exist just hidden
    if (messageInput) {
        // could have used keypress which will be easier to implement but that doesn't work on mobile browsers
        messageInput.addEventListener('keydown', handleKeyPress);
        messageInput.addEventListener('keyup', handleKeyUp);
    }
    

    var initialTextLength = 0;
    function testTyping(newLength) {
        var value;
        if (newLength > initialTextLength) {
            value = true;
        }
        else {
            value = false;
            // sorta duplicate because if I press a character key and a non character key quickly
            // the timer will not expire and it will look like i am still typing
            socket.emit(
                'broadcast', {
                'username': username, 
                'info': 'verify_status', 
                'room_id': localStorage.getItem('current_room_id') 
            });
        }
        console.log(initialTextLength)
        console.log(newLength)
        initialTextLength = newLength;
        return value;
    }

    // when user is pressing down on keys, clear the timeout
    function handleKeyPress(e) {
        // since keydown registers regardless of whether a chatacter is produced or not
        // check the input and see if there's any character
        var newLength = document.querySelector('#myMessage').value.length;
        console.log(newLength+' from keypress')
        var typingCheck = testTyping(newLength);
        console.log(typingCheck+' from keypress')
        if (typingCheck == true) {
            clearTimeout(timer);
            if (localStorage.getItem('current_room_id')) {
                socket.emit(
                    'broadcast', {
                    'username': username, 
                    'info': 'typing', 
                    'room_id': localStorage.getItem('current_room_id')
                });
            }
            else {
                alert("There's been an error handlepress. please reload to continue")
            }
        }
    }

    // when the user has stopped pressing on keys, set the timeout
    // if the user presses on keys before the timeout is reached, then this timeout is canceled
    function handleKeyUp(e) {

        // make enter key to be send
        if (event.keyCode === 13) {
            document.getElementById("sendbutton").click();
        }


        clearTimeout(timer); // prevent errant multiple timeouts from being generated
        timer = setTimeout(() => {
            // emit to broadcast so that the server knows that we are done typing so verify_status can be called
            // to verify the users online/offline status afresh
            
            if (localStorage.getItem('current_room_id')) {
                socket.emit('broadcast', {'username': username, 'info': 'verify_status', 'room_id': localStorage.getItem('current_room_id') });
            }
            else {
                alert("There's been an error handleup. please reload to continue")
            }

        }, timeoutVal);
    }
            
    socket.on('error', function() {
        console.log("error");
    });

    socket.on('reconnecting', function() {
        console.log("reconnecting");
        myStatus.innerHTML = 'Reconnecting...';
    });
});