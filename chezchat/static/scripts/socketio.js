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
    var data = JSON.stringify({'user': getUser.innerHTML});
    xhttp.send(data);
}


document.addEventListener('DOMContentLoaded', () => {
    var socket = io();

    
    messageSendButton.hidden = true;
    messageInput.hidden = true;
    
    // update the presence status of the recipient
    setInterval(function() {
        if(getUser.innerHTML) {
            verify_status();    
        }
    }, 20000);

    // triggered when the client tries to connect to the server
    // and it emits to the on_connect event on the server side
    socket.on('connect', () => {
        console.log('Verify Status running from connect')

        getUser.innerHTML = '';
        userStatusInfo.innerHTML = '';
        currentRoomName.innerHTML = '';
        myStatus.innerHTML = 'You are online';
    });

    // triggered when the client pings the server and can't connect
    socket.on('disconnect', () => {
        console.log('Cannot reach the server at this moment');

        userStatusInfo.innerHTML = '';
        currentRoomName.innerHTML = '';
        getUser.innerHTML = '';
        myStatus.innerHTML = 'Cannot reach the server at this moment';

        // disable send button and text input until server or client is back online
        if (messageInput || messageSendButton) {
            clearInputResources(true);
        }
    });


    // emits to handle_messages event on the server side
    if (messageSendButton) {
        document.querySelector('#sendbutton').onclick = () => {
            var data = {'msg': document.querySelector('#myMessage').value, 'username': username };
            socket.emit('handle_messages', data);
            append_msgs(data);
            document.querySelector('#myMessage').value = '';
        }
    }
    
    
    function append_msgs(data) {
        const local_time = moment().format('MMM-D H:mm');
        const li = document.createElement('li');
        li.innerHTML = `${data.username} says ${data.msg} @ ${local_time}`;
        document.getElementById("messages").append(li);
    }

    // receives message from an the handle_messages event on the server side and displays them to a client
    socket.on('handle_messages', data => { 
        append_msgs(data);
    });

    // receives the message emitted by broadcast event and confirms that the client is connected/disconnected to/from the server
    socket.on('broadcast', data => {
        console.log(`${data.username} is ${data.info}`);
        
        if (data.info == 'verify_status') {
            verify_status();
        }

        // get the html element and update it
        if (getUser.innerHTML && data.info != 'verify_status') {
            userStatusInfo.innerHTML = `${data.username} is ${data.info} from broadcast`;
        }
    });

    if (messageInput) {
        messageInput.addEventListener('keypress', handleKeyPress);
        messageInput.addEventListener('keyup', handleKeyUp);
    }
    

    // when user is pressing down on keys, clear the timeout
    function handleKeyPress(e) {
        clearTimeout(timer);
        socket.emit('broadcast', {'username': username, 'info': 'typing' });
    }

    // when the user has stopped pressing on keys, set the timeout
    // if the user presses on keys before the timeout is reached, then this timeout is canceled
    function handleKeyUp(e) {
        clearTimeout(timer); // prevent errant multiple timeouts from being generated
        timer = setTimeout(() => {
            // emit to broadcast so that the server knows that we are done typing so verify_status can be called
            // to verify the users online/offline status afresh
            socket.emit('broadcast', {'username': username, 'info': 'verify_status' });
        }, timeoutVal);
    }
            
    socket.on('error', function() {
        console.log("error");
    });

    socket.on('reconnect', function() {
        console.log("reconnect");
        myStatus.innerHTML = 'Reconnected';
    });

    socket.on('reconnecting', function() {
        console.log("reconnecting");
        myStatus.innerHTML = 'Reconnecting...';
    });
});