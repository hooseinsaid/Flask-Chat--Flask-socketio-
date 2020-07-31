document.addEventListener('DOMContentLoaded', () => {
    var socket = io()

    // triggered when the client successfully connect to the server
    // and it emits to the on_connect event on the server side
    socket.on('connect', () => {
        socket.emit('on_connect', {'username': username })
    });

    // triggered when the client pings the server and can't connect
    socket.on('disconnect', () => {
        alert('Cannot reach the server at this moment');
    });

    // emits to handle_messages event on the server side
    document.querySelector('#sendbutton').onclick = () => {
        socket.emit('handle_messages', {'msg': document.querySelector('#myMessage').value, 'username': username });
        document.querySelector('#myMessage').value = '';
    }

    // receives message from an unnamed event on the server sent using 'send()'
    // and displays them to a client
    socket.on('handle_messages', data => {
        const local_time = moment().format('MMM-D H:mm');
        const li = document.createElement('li');
        li.innerHTML = data.username+' says '+data.msg+' @ '+local_time;
        document.getElementById("messages").append(li); 
    });

    // receives the message emitted by the on_disconnect event
    socket.on('on_disconnect', data => {
        alert(data.username + ' is offline')
    });

    // receives the message emitted by the on_connect event
    socket.on('on_connect', data => {
        alert(data.username + ' is online')
    });
});