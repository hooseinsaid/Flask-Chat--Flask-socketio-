from datetime import datetime
from flask import render_template, flash, redirect, url_for, session, abort, request, jsonify
from flask_socketio import send, emit, join_room, leave_room
from chezchat import socketio, app, db, moment
from chezchat.models import *
from chezchat.forms import *
from flask_login import current_user, login_user, logout_user, login_required

current_room_session = None

@app.route('/', methods=['GET', 'POST'])
@login_required
def home():
    form = MessageForm()
    form2 = CreateRoomForm()
    check_private_rooms = []
    friends_list = []
    room_members = []
    current_room = None
    all_users = Users.query.all()
    all_rooms = Room.query.all()
    rooms = current_user.room_subscribed
    private_friend_room = []
    for room in rooms:
        if room.private_room == True:
            for friends_id in room.name:
                if int(friends_id) != current_user.id:
                    friends_list.append(Users.query.filter_by(id=friends_id).first())
                    private_friend_room.append(room)
    zipped_friends_list = zip(friends_list, private_friend_room)
    for room_check in all_rooms:
        if room_check.private_room == True:
            check_private_rooms.append(room_check.name)
    # if request.args.get("r"):
    #     room_members = Users.query.filter(Users.room_subscribed.any(room_url=request.args.get("r"))).all()
    #     current_room = Room.query.filter_by(room_url=request.args.get("r")).first()
    #     if current_room not in current_user.room_subscribed:
    #         abort(403)
    #         pass
    #     else:
    #         session['current_room'] = current_room.room_id
    # else:
    #     session.pop('current_room', None)
    if form2.submit.data:
        if form2.validate_on_submit():
            # consider making this a seperate function
            new_room = Room(name=form2.name.data, room_created=current_user)
            new_room.create_room_url()
            db.session.add(new_room)
            new_room.subscribers.append(current_user)
            db.session.commit()
            flash(f'{new_room.name} has been created')
            return redirect(url_for('home'))
        else:
            flash('Room not created. Make sure the name field is not empty and is at least 4 characters long ')
    return render_template('chatroom.html', form=form, form2=form2, rooms=rooms, room_members=room_members, 
                            current_user=current_user, current_room=current_room, all_rooms=all_rooms, 
                            all_users=all_users, check_private_rooms=check_private_rooms, 
                            zipped_friends_list=zipped_friends_list)

@app.route('/private-room', methods=['GET', 'POST'])
@login_required
def private_room():
    global current_room_session
    current_room = Room.query.filter_by(room_id=request.json['room_id']).first()
    room_schema = RoomSchema()
    current_room_schema = room_schema.dump(current_room)
    if current_room not in current_user.room_subscribed:
        abort(403)
    else:
        current_room_session = request.json['room_id']
        print(f"\n\n\n{current_room_session} from private\n\n\n")
    return jsonify({'current_room' : current_room_schema})

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
        flash('You have been successfully registered')
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
            flash('Invalid username or password')
            return redirect(url_for('login'))
        login_user(user)
        return redirect(url_for('home'))
    return render_template('login.html', form=form)

@app.route('/logout')
def logout():
    logout_user()
    flash('Login again from here to continue chatting')
    return redirect(url_for('login'))

@app.route('/join-room', methods=['GET', 'POST'])
@login_required
def join_room():
    room = Room.query.filter_by(room_id=request.json['room_id']).first()
    if room is not None:
        if room not in current_user.room_subscribed:
            room.subscribers.append(current_user)
            db.session.commit()
    return jsonify()

@app.route('/leave-room', methods=['GET', 'POST'])
@login_required
def leave_room():
    room = Room.query.filter_by(room_id=request.json['room_id']).first()
    if room is not None:
        if room in current_user.room_subscribed:
            room.subscribers.remove(current_user)
            db.session.commit()
    return jsonify()

@app.route('/add-user', methods=['GET', 'POST'])
@login_required
def add_user():
    print(f"\n\n\n{current_room_session} from add user\n\n\n")
    private_room = None
    user_to_add = Users.query.filter_by(id=request.json['user_id']).first()
    if user_to_add is not None:
        private_room_name = (f'{user_to_add.id}{current_user.id}')
        private_room_name2 = (f'{current_user.id}{user_to_add.id}')
        if not Room.query.filter_by(name=private_room_name).first():
            if not Room.query.filter_by(name=private_room_name2).first():
                private_room = Room(name=private_room_name, room_created=current_user, private_room=True)
                private_room.create_room_url()
                db.session.add(private_room)
                private_room.subscribers.append(current_user)
                private_room.subscribers.append(user_to_add)
                db.session.commit()
    if private_room is not None:
        return jsonify(roomID=private_room.room_id)
    else:
        return "<h1>An error has occurred</h1>"

@app.route('/remove-user', methods=['GET', 'POST'])
@login_required
def remove_user():
    global current_room_session
    current_room_session = None
    print(f"\n\n\n{current_room_session} from remove user\n\n\n")
    private_room = Room.query.filter_by(room_id=request.json['room_id']).first()
    room_history = private_room.room_history
    if private_room is not None:
        for history in room_history:
            db.session.delete(history)
        db.session.delete(private_room)
        db.session.commit()
    return jsonify()

@socketio.on('handle_messages')
def handleMessage(data):
    print(f"\n\n\n{current_room_session} from handle msgs \n\n\n")
    if current_room_session is not None:
        current_room = Room.query.filter_by(room_id=current_room_session).first()
    print(f"\n\n\n{current_room.room_id} from handle msgs query \n\n\n")
    if current_room is not None:
        message = History(messages=data['msg'], user_history=current_user, room_records=current_room)
        db.session.add(message)
    db.session.commit()
    emit('handle_messages', data, include_self=False, broadcast=True)

@socketio.on('connect')
def test_connect():
    # use session to put the sid generated when the client connects in session
    # like this session[current_user.username] = sid
    print(f'\n\n\n\n{current_user.username} has connection re-established\n\n\n\n')
    current_user.online_at = datetime.utcnow()
    db.session.commit()
    emit('broadcast', {'username': current_user.username, 'info': 'online'}, include_self=False, broadcast=True)

# triggered when the server pongs the client and can't connect with it
@socketio.on('disconnect')
def test_disconnect():
    print(f'\n\n\n\n{current_user.username} has connection lost\n\n\n\n')
    current_user.last_seen = datetime.utcnow()
    current_user.last_seen_update_on_server_restart = False
    db.session.commit()
    emit('broadcast', {'username': current_user.username, 'info': 'offline'}, include_self=False, broadcast=True)

@socketio.on('broadcast')
def broadcast(data):
    emit('broadcast', {'username': data['username'], 'info': data['info']}, include_self=False, broadcast=True)

@app.route('/get-user-status', methods=['GET', 'POST'])
@login_required
def get_user():
    status = 'online'
    user = Users.query.filter_by(username=request.json['user']).first()
    if user.last_seen >= user.online_at:
        status = 'offline'
    return jsonify(username=user.username, last_seen=user.last_seen, online_at=user.online_at, 
                   forced_offline=user.last_seen_update_on_server_restart, status=status)
