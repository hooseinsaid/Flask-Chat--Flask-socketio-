from datetime import datetime
from flask import render_template, flash, redirect, url_for, session, abort, request, jsonify
from flask_socketio import send, emit, disconnect
from chezchat import socketio, app, db
from chezchat.models import *
from chezchat.forms import *
from flask_login import current_user, login_user, logout_user, login_required

sessionID = {}

@app.route('/', methods=['GET', 'POST'])
@login_required
def home():
    form = CreateRoomForm()
    non_friend_users = []
    all_users = Users.query.all()
    all_rooms = Room.query.outerjoin(History).order_by(History.timestamp.desc().nullslast())
    current_user_rooms = current_user.room_subscribed
    rooms_ordered = []
    room_params = []
    notification_counts = []
    for room in all_rooms:
        if room in current_user_rooms:
            last_message_params = room.room_history.order_by(None).order_by(History.timestamp.desc()).first()
            room_notification_count = persistentNotifications(room.room_id)
            rooms_ordered.append(room)
            room_params.append(last_message_params)
            notification_counts.append(room_notification_count)
            print(room_notification_count)
    rooms = zip(rooms_ordered, room_params, notification_counts)

    # find users not in current_user's friend's list
    for user in all_users:
        room_name_variant_one = f"{user.id}{current_user.id}"
        room_name_variant_two = f"{current_user.id}{user.id}"
        if not Room.query.filter_by(name=room_name_variant_one).first() and not Room.query.filter_by(name=room_name_variant_two).first():
            non_friend_users.append(user)
    
    if form.submit.data:
        if form.validate_on_submit():
            create_rooms(form)
            return redirect(url_for('home'))
        flash('Room not created. Make sure the name field is not empty and is at least 4 characters long', 'danger')
        return redirect(url_for('home'))

    return render_template('chatroom.html', form=form, rooms=rooms, current_user=current_user, all_rooms=all_rooms, non_friend_users=non_friend_users)


def create_rooms(form):
    # create new room
    new_room = Room(name=form.name.data, room_created=current_user)
    db.session.add(new_room)
    new_room.subscribers.append(current_user)
    db.session.commit()
    flash(f'{new_room.name} has been created', 'success')
    # updates the rooms list in real time for every other user
    socketio.emit('update_rooms', {'name': new_room.name, 'value': new_room.room_id}, broadcast=True)

def persistentNotifications(room_id):
    notification = Notifications.query.filter_by(recipient_id=current_user.id, room_id=room_id).first()
    data = {}
    if notification:
        data['count'] = notification.count
        data['messages'] = notification.last_message
        data['author'] = notification.last_author
        data['timestamp'] = notification.last_time.strftime("%Y-%m-%d %H:%M:%S.%f")
        data['room_id'] = notification.room_id

    return data


@app.route('/clear-notifications', methods=['GET', 'POST'])
@login_required
def clear_notifications():
    delete_notification(request.json['room_id'])
    return jsonify()


def delete_notification(room_id):
    room = Room.query.filter_by(room_id=room_id).first()
    if room:
        if room.private_room == True:
            notifications = Notifications.query.filter_by(room_id=room_id).all()
            if notifications:
                for notification in notifications:
                    db.session.delete(notification)
        else:
            notification = Notifications.query.filter_by(recipient_id=current_user.id, room_id=room_id).first()    
            if notification:
                db.session.delete(notification)

    db.session.commit()


@app.route('/time-refresh', methods=['GET', 'POST'])
@login_required
def time_refresh():
    current_user_rooms = current_user.room_subscribed
    if current_user_rooms:
        timestamps = {}
        for room in current_user_rooms:
            last_message = room.room_history.order_by(None).order_by(History.timestamp.desc()).first()
            if last_message:
                timestamps[last_message.room_id] = last_message.timestamp
    return jsonify({'timestamps' : timestamps})


@app.route('/room-details', methods=['GET', 'POST'])
@login_required
def room_details():
    current_room = Room.query.filter_by(room_id=request.json['room_id']).first()
    if current_room is not None and current_room in current_user.room_subscribed:
        room_members = current_room.subscribers
        room_schema = RoomSchema()
        current_room_schema = room_schema.dump(current_room)
        users_schema = UsersSchema(many=True, exclude=("password_hash",))
        room_members_schema = users_schema.dump(room_members)
    else:
        socketio.emit('reload', room=sessionID[current_user.username])
    return jsonify({'current_room' : current_room_schema, 'room_members' : room_members_schema})
    

@app.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('home'))
    form = UserRegistrationForm()
    if form.validate_on_submit():
        user = Users(name_surname=form.name_surname.data, username=form.username.data)
        user.set_password(form.password.data)
        db.session.add(user)
        db.session.commit()
        # updates the users list in real time for every other user
        socketio.emit('update_users', {'name': user.name_surname, 'value': user.username}, broadcast=True)
        logout_user()
        flash('You have been successfully registered.<br> Login here', 'success')
        return redirect(url_for('login'))
    return render_template('register.html', form=form)


@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('home'))
    form = LoginForm()
    if form.validate_on_submit():
        user = Users.query.filter_by(username=form.username.data).first()
        if user is None or not user.check_password(form.password.data):
            flash('Invalid username or password', 'danger')
            return redirect(url_for('login'))
        login_user(user)
        return redirect(url_for('home'))
    return render_template('login.html', form=form)


@app.route('/logout')
def logout():
    logout_user()
    return redirect(url_for('login'))


@app.route('/join-room', methods=['GET', 'POST'])
@login_required
def join_room():
    room = Room.query.filter_by(room_id=request.json['room_id']).first()
    room_history = room.room_history.order_by(None).order_by(History.timestamp.desc()).first()
    history_schema = HistorySchema()
    room_last_message = history_schema.dump(room_history)
    if room is not None:
        if room not in current_user.room_subscribed:
            room.subscribers.append(current_user)
            db.session.commit()
    return jsonify({'room_last_message' : room_last_message})


@app.route('/leave-room', methods=['GET', 'POST'])
@login_required
def leave_room():
    room = Room.query.filter_by(room_id=request.json['room_id']).first()
    delete_notification(room.room_id)
    if room is not None:
        if room in current_user.room_subscribed:
            room.subscribers.remove(current_user)
        db.session.commit()
    return jsonify()


@app.route('/add-user', methods=['GET', 'POST'])
@login_required
def add_user():
    private_room = None
    user_to_add = Users.query.filter_by(username=request.json['user_username']).first()
    if user_to_add is not None:
        private_room_name = (f'{user_to_add.id}{current_user.id}')
        private_room_name2 = (f'{current_user.id}{user_to_add.id}')
        if not Room.query.filter_by(name=private_room_name).first() and not Room.query.filter_by(name=private_room_name2).first():
            private_room = Room(name=private_room_name, room_created=current_user, private_room=True)
            db.session.add(private_room)
            private_room.subscribers.append(current_user)
            private_room.subscribers.append(user_to_add)
            db.session.commit()
    if private_room is not None:
        recipients_list = handle_recipients(private_room)
        # sends an emit to the user who has been removed by the current_user and updates their friend's list automatically without refreshing
        for recipient in recipients_list:
            socketio.emit('update_add_users', {'roomID': private_room.room_id, 'user_to_add': current_user.username}, room=recipient)
        return jsonify(roomID=private_room.room_id)
    else:
        return "An error has occurred"


@app.route('/remove-user', methods=['GET', 'POST'])
@login_required
def remove_user():
    private_room = Room.query.filter_by(room_id=request.json['room_id']).first()

    if private_room is not None:
        delete_notification(private_room.room_id)

        for history in private_room.room_history:
            db.session.delete(history)

        recipients_list = handle_recipients(private_room)
        # sends an emit to the user who has been removed by the current_user and updates their friend's list automatically without refreshing
        for recipient in recipients_list:
            socketio.emit('update_remove_users', {'room_id': private_room.room_id, 'user_to_remove': current_user.username}, room=recipient)

        db.session.delete(private_room)
        db.session.commit()
    return jsonify()


def userReceivedCallback(data):
    room = Room.query.filter_by(room_id=data['room_id']).first()
    if room.private_room == True:
        delivered_msg = History.query.filter_by(msg_id=data['msg_id']).first()
        userReceivedDBUpdate(delivered_msg)
        socketio.emit('message_delivered', data['uuid'], room=sessionID[current_user.username])


def userReceivedDBUpdate(msg):
    # here update a boolean history column to true
    msg.msg_delivered = True
    db.session.commit()


@socketio.on('handle_messages')
def handleMessage(data):
    session_current_room = data['room_id']
    current_room = Room.query.filter_by(room_id=session_current_room).first()
    if current_room is not None:
        message = History(messages=data['messages'], uuid=data['uuid'], user_history=current_user, room_records=current_room)
        db.session.add(message)
        db.session.commit()
        data['msg_id'] = message.msg_id
        recipients_list = handle_recipients(current_room)

        for member in current_room.subscribers:
            if member != current_user:
                notification_to_update = Notifications.query.filter_by(recipient_id=member.id, room_id=current_room.room_id).first()
                if notification_to_update:
                    notification_to_update.count += 1
                    notification_to_update.last_message = message.messages
                    notification_to_update.last_author = message.author
                    notification_to_update.last_time = message.timestamp
                else:
                    notification = Notifications(recipient_id=member.id, last_message=message.messages, last_author=message.author, last_time = message.timestamp, room_id=current_room.room_id, count=1)
                    db.session.add(notification)
                db.session.commit()
    else:
        emit('reload', room=sessionID[current_user.username])
        
    for recipient in recipients_list:
        # on the frontend increment a notification count and display on badge
        emit('handle_messages', data, room=recipient, callback=userReceivedCallback)
    return data


def handle_recipients(current_room):
    recipients_list = []
    room_members_username_list = []
    room_members = current_room.subscribers

    for member in room_members:
        room_members_username_list.append(member.username)
    
    # find online users who are members of the current room
    for key in sessionID.keys():
        if key in room_members_username_list and key != current_user.username:
            recipients_list.append(sessionID[key])
    return recipients_list


@socketio.on('connect')
def test_connect():
    # checks whether the user has another sid to his username and if so disconnects it
    # before connecting afresh
    if current_user.username in sessionID.keys():
        # emits to the old sid to disconnect
        emit('prevent_double_session', room=sessionID[current_user.username])

        # diconnect from the server side for good measure
        disconnect(sid=sessionID[current_user.username])

    # once the current_user connects, mark all sent messages as received by him -
    # since they are already in the database and will be displayed to him on click of the -
    # room in question
    for room in current_user.room_subscribed:
        for msg_ in room.room_history:
            if msg_.msg_delivered != True and msg_.author != current_user.username and room.private_room == True:
                userReceivedDBUpdate(msg_)

                recipients_list = handle_recipients(room)
                for recipient in recipients_list:
                    emit('message_delivered', msg_.uuid, room=recipient)

    sessionID[current_user.username] = request.sid
    current_user.online_at = datetime.utcnow()
    db.session.commit()
    emit('broadcast', {'username': current_user.username, 'info': 'online'}, include_self=False, broadcast=True)


@socketio.on('disconnect')
def test_disconnect():
    # if the sid from connect is same as now, means we are offline, then pop
    if sessionID[current_user.username] == request.sid and sessionID[current_user.username] is not None:
        sessionID.pop(current_user.username, None)
        current_user.last_seen = datetime.utcnow()
        current_user.last_seen_update_on_server_restart = False
        db.session.commit()
    emit('broadcast', {'username': current_user.username, 'info': 'offline'}, include_self=False, broadcast=True)


@socketio.on('broadcast')
def broadcast(data):
    session_current_room = data['room_id']
    current_room = Room.query.filter_by(room_id=session_current_room).first()
    if current_room:
        recipients_list = handle_recipients(current_room)
        for recipient in recipients_list:
            emit('broadcast', data, room=recipient)


@app.route('/get-user-status', methods=['GET', 'POST'])
@login_required
def get_user():
    status = 'online'
    user = Users.query.filter_by(username=request.json['user']).first()
    if user.last_seen >= user.online_at:
        status = 'offline'
    return jsonify(username=user.username, last_seen=user.last_seen, online_at=user.online_at, 
                   forced_offline=user.last_seen_update_on_server_restart, status=status)
