let timer,
  timeoutVal = 2000; // time it takes to wait for user to stop typing in ms
var messageInput = document.getElementById("myMessage");
var messageSendButton = document.getElementById("sendbutton");
var getUser = document.getElementById("get_user_status");
var userStatusInfo = document.getElementById("user_status");
var myStatus = document.getElementById("my_status");
var currentRoomName = document.getElementById("currentRoomName");

function verify_status() {
  var params = { url: "/get-user-status", payload: getUser.innerHTML, key: "user" };
  ajaxCalls(params, null, processVerifyStatus);
}

function processVerifyStatus(data) {
  if (data["status"] === "offline") {
    if (data["forced_offline"] == true) {
      userStatusInfo.innerHTML = "offline";
    } else {
      userStatusInfo.innerHTML = checkDate(data["last_seen"], true);
    }
  } else {
    userStatusInfo.innerHTML = `${data["status"]}`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  var socket = io();

  document.getElementById("msgInput").hidden = true;

  // update the present status of the recipient after 20 seconds
  setInterval(function () {
    if (getUser.innerHTML) {
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

    var allTypingElements = document.querySelectorAll(".roomDivInfo span.lastMessage.typing");
    var allLastMessageElements = document.querySelectorAll(".roomDivInfo span.lastMessage.msg");

    removeTypingOnOffline(allTypingElements, allLastMessageElements);
  });

  function removeTypingOnOffline(allTypingElements, allLastMessageElements) {
    for (y in allLastMessageElements) {
      if (allLastMessageElements[y].tagName) {
        unsetLastMessageBadgeFromHidden(allLastMessageElements[y]);
      }
    }
    for (x in allTypingElements) {
      if (allTypingElements[x].tagName) {
        setTypingBadgeToHidden(allTypingElements[x]);
      }
    }
  }

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

  socket.on("reload", () => {
    alert("There's been an error. please reload");
  });

  // emits to handle_messages event on the server side
  if (messageSendButton) {
    document.querySelector("#sendbutton").onclick = () => {
      if (localStorage.getItem("current_room_id")) {
        if (document.querySelector("#myMessage").value.trim() != "") {
          const uniqueUID = createUniqueUID();

          var data = {
            messages: document.querySelector("#myMessage").value,
            author: username,
            room_id: localStorage.getItem("current_room_id"),
            uuid: uniqueUID,
            from_db: false,
          };
          socket.emit("handle_messages", data, serverReceivedCallback);
          append_msgs(data);
          document.querySelector("#myMessage").value = "";

          messageInput.focus();
        }
      } else {
        alert("There's been an error. please reload");
      }
    };
  }

  // let"s the sender know that the server received their message
  function serverReceivedCallback(data) {
    messageStatusTimeInfoWrapper = receiveStatusElement(data["uuid"]);

    // rearranges the current room so that it"s on top
    swapRoomPostionOnNewMessage(data.room_id);

    if (messageStatusTimeInfoWrapper) {
      addOneTick(messageStatusTimeInfoWrapper);
    }

    // put the last message on the badge only after we are sure the server received it
    addLastMessageBadge(data);
  }

  socket.on("message_delivered", (uuid) => {
    console.log("user received message");
    messageStatusTimeInfoWrapper = receiveStatusElement(uuid);
    if (messageStatusTimeInfoWrapper) {
      addTwoTicks(messageStatusTimeInfoWrapper);
    }
  });

  socket.on("read_receipt", (uuid) => {
    console.log("message read", uuid);
    messageStatusTimeInfoWrapper = receiveStatusElement(uuid);
    if (messageStatusTimeInfoWrapper) {
      addBlueTick(messageStatusTimeInfoWrapper);
    }
  });

  function receiveStatusElement(uuid) {
    return document.getElementById(uuid);
  }

  // receives message from an the handle_messages event on the server side and displays them to a client
  socket.on("handle_messages", (data, userReceivedCallback) => {
    // let"s the sender know that his msg has been received by the intended recipient
    userReceivedCallback(data);

    // send the msg only to the intended room
    if (localStorage.getItem("current_room_id") && data.room_id === localStorage.getItem("current_room_id")) {
      append_msgs(data);

      // do not add to notification counter if user is in the target room already
      resetNotificationBadgeCounter(data.room_id);
    } else {
      var count = 1;
      addNotificationBadge(data.room_id, count);
    }

    swapRoomPostionOnNewMessage(data.room_id);

    // put the last message on the badge
    addLastMessageBadge(data);
  });

  // receives the message emitted by broadcast event and confirms that the client is connected/disconnected to/from the server
  socket.on("broadcast", (data) => {
    console.log(`${data.username} is ${data.info}`);

    if (data.room_id === localStorage.getItem("current_room_id")) {
      if (getUser.innerHTML == data.username) {
        if (data.info == "verify_status") {
          verify_status();
        } else {
          userStatusInfo.innerHTML = `${data.info}`;
        }
      } else {
        if (data.info == "typing...") {
          userStatusInfo.innerHTML = `${data.username} is ${data.info}`;
        } else {
          userStatusInfo.innerHTML = "click here for group info";
        }
      }
    }

    if (data.info == "typing...") {
      unhideTypingBadge(data);
    } else if (data.info == "verify_status") {
      hideTypingBadge(data);
    }
  });

  socket.on("update_remove_users", (data) => {
    const userRemove = data.user_to_remove;
    var userElement = document.querySelectorAll(`button[value=${CSS.escape(userRemove)}]`)[0];
    processRemoveUser(data, userElement);

    if (userRemove === getUser.innerHTML) {
      resetChatArea(false, false, true, true);
    }
    alert(`${userRemove} removed you`);
  });

  socket.on("update_add_users", (data) => {
    const userAdd = data.user_to_add;
    var userElement = document.querySelectorAll(`button[value=${CSS.escape(userAdd)}]`)[0];
    processAddUser(data, userElement);
    alert(`${userAdd} added you`);
  });

  socket.on("update_users", (data) => {
    processRemoveUser(data, data);
  });

  socket.on("update_rooms", (data) => {
    processLeaveRoom(data, data);
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
    } else {
      value = false;
      emitToBroadcast("verify_status");
    }
    initialTextLength = newLength;
    return value;
  }

  // when user is pressing down on keys, clear the timeout
  function handleKeyPress(event) {
    // since keydown registers regardless of whether a chatacter is produced or not
    // check the input and see if there"s any character

    // if not enter key
    if (event.keyCode !== 13 && event.keyCode !== 8) {
      var newLength = document.querySelector("#myMessage").value.length;
      var typingCheck = testTyping(newLength);
      if (typingCheck == true) {
        clearTimeout(timer);
        if (localStorage.getItem("current_room_id")) {
          emitToBroadcast("typing...");
        }
      }
    }
  }

  function emitToBroadcast(value) {
    socket.emit("broadcast", {
      username: username,
      info: value,
      room_id: localStorage.getItem("current_room_id"),
    });
  }

  // when the user has stopped pressing on keys, set the timeout
  // if the user presses on keys before the timeout is reached, then this timeout is canceled
  function handleKeyUp(event) {
    // make enter key to be send
    if (event.keyCode === 13) {
      messageSendButton.click();
    }

    clearTimeout(timer); // prevent errant multiple timeouts from being generated
    timer = setTimeout(() => {
      // emit to broadcast so that the server knows that we are done typing so verify_status can be called
      // to verify the users online/offline status afresh

      if (localStorage.getItem("current_room_id")) {
        emitToBroadcast("verify_status");
      }
    }, timeoutVal);
  }

  socket.on("reconnecting", function () {
    myStatus.innerHTML = "Reconnecting...";
  });
});
