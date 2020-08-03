document.addEventListener('DOMContentLoaded', () => {
    var socket = io();
    moment.locale('en-gb')

    function noHours_btw_dates(lastSeen) {
        var currentDate = new Date();

        // To calculate the time difference of two dates 
        var Difference_In_Time = moment(currentDate) - moment(lastSeen);
        
        // To calculate the no. of days between two dates 
        var Difference_In_Hours = Difference_In_Time / (1000 * 3600);

        return Difference_In_Hours;
    }

    function verify_status() {
        // query the db on connect of current_user using ajax to 
        // know the current recipient's status and update id #user_status below
        // grab current user variable on the page and query with it
        // document.getElementById("user_status").innerHTML = '';
        var xhttp = new XMLHttpRequest();
        xhttp.open("POST", "/get-user", true);
        xhttp.setRequestHeader("Content-Type", "application/json"); 
        xhttp.onreadystatechange = function() {
            if (this.readyState === 4 && this.status === 200) {
                var data = JSON.parse(this.responseText);
                var hours = noHours_btw_dates(data['last_seen'])
                if (data['status'] === 'offline') {
                    if (data['forced_offline'] == true) {
                        document.getElementById("user_status").innerHTML = `${data['username']} is offline from verify_status after server crashed`;
                    }
                    else {
                        if (hours <= 1) {
                            document.getElementById("user_status").innerHTML = `${data['username']} was last seen ${moment(data['last_seen']).fromNow()} from verify_status`;
                        }
                        else if (hours > 1 && hours <= (6 * 24)) {
                            document.getElementById("user_status").innerHTML = `${data['username']} was last seen ${moment(data['last_seen']).subtract(hours/24, 'days').calendar()} from verify_status`;
                        }
                        else {
                            document.getElementById("user_status").innerHTML = `${data['username']} was last seen ${moment(data['last_seen']).format('LL')} from verify_status`;
                        }
                    }
                }
                else {
                    document.getElementById("user_status").innerHTML = `${data['username']} is ${data['status']} from verify_status`;
                }
            }
        };
        var data = JSON.stringify({'user': document.getElementById('get_user_status').innerHTML});
        xhttp.send(data);
    }

    // triggered when the client tries to connect to the server
    // and it emits to the on_connect event on the server side
    socket.on('connect', () => {
        socket.emit('on_connect', {'username': username });
        
        verify_status();

        // enable send button and text input again when server or client is back online
        document.getElementById("sendbutton").disabled = false;
        document.getElementById("myMessage").disabled = false;
        document.getElementById("my_status").innerHTML = 'You are online';
    });

    // triggered when the client pings the server and can't connect
    socket.on('disconnect', () => {
        // alert('Cannot reach the server at this moment');
        console.log('Cannot reach the server at this moment');

        document.getElementById("user_status").innerHTML = '';
        document.getElementById("my_status").innerHTML = 'Cannot reach the server at this moment';

        // disable send button and text input until server or client is back online
        document.getElementById("sendbutton").disabled = true;
        document.getElementById("myMessage").disabled = true;
    });

    // emits to handle_messages event on the server side
    document.querySelector('#sendbutton').onclick = () => {
        var data = {'msg': document.querySelector('#myMessage').value, 'username': username };
        socket.emit('handle_messages', data);
        append_msgs(data);
        document.querySelector('#myMessage').value = '';
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

    // receives the message emitted by the on_disconnect event
    socket.on('on_disconnect', data => {
        // alert(`${data.username} is offline`)
        console.log(`${data.username} is offline`);

        // get the html element and update it
        document.getElementById("user_status").innerHTML = `${data.username} is offline from on_disconnect`;
    });

    // receives the message emitted by the on_connect event and confirms that the client is connected to the server
    socket.on('on_connect', data => {
        // alert(`${data.username} is online`)
        console.log(`${data.username} is online`);

        // get the html element and update it
        document.getElementById("user_status").innerHTML = `${data.username} is online from on_connect`;
    });
});