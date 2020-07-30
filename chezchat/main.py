from flask import render_template, flash, redirect, url_for, session, abort, request
from flask_socketio import send
from chezchat import socketio, app, db
from chezchat.models import Users, History, Room
from chezchat.forms import *
from flask_login import current_user, login_user, logout_user, login_required

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
    if request.args.get("r"):
        room_members = Users.query.filter(Users.room_subscribed.any(room_url=request.args.get("r"))).all()
        current_room = Room.query.filter_by(room_url=request.args.get("r")).first()
        if current_room not in current_user.room_subscribed:
            abort(403)
        else:
            session['current_room'] = current_room.room_id
    else:
        session.pop('current_room', None)
    if form2.submit.data:
        if form2.validate_on_submit():
            # consider making this a seperate function
            new_room = Room(name=form2.name.data, room_created=current_user)
            new_room.create_room_url()
            db.session.add(new_room)
            new_room.subscribers.append(current_user)
            db.session.commit()
            flash(f'{new_room.name} has been created')
        else:
            flash('Room not created. Make sure the name field is not empty')
        return redirect(url_for('home'))
    return render_template('chatroom.html', form=form, form2=form2, rooms=rooms, room_members=room_members, current_user=current_user, current_room=current_room, all_rooms=all_rooms, all_users=all_users, check_private_rooms=check_private_rooms, zipped_friends_list=zipped_friends_list)

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

@app.route('/add-contact', methods=['GET', 'POST'])
def add_contact():
    if request.form.get("join_room"):
        room = Room.query.filter_by(room_id=request.form.get("join_room")).first()
        if room is not None:
            if room not in current_user.room_subscribed:
                room.subscribers.append(current_user)
                db.session.commit()
    if request.form.get("add_user"):
        user = Users.query.filter_by(id=request.form.get("add_user")).first()
        if user is not None:
            private_room_name = (f'{user.id}{current_user.id}')
            private_room_name2 = (f'{current_user.id}{user.id}')
            if not Room.query.filter_by(name=private_room_name).first():
                if not Room.query.filter_by(name=private_room_name2).first():
                    private_room = Room(name=private_room_name, room_created=current_user, private_room=True)
                    private_room.create_room_url()
                    db.session.add(private_room)
                    private_room.subscribers.append(current_user)
                    private_room.subscribers.append(user)
                    db.session.commit()
    return redirect(url_for('home'))

@socketio.on('message')
def handleMessage(msg):
    current_room = Room.query.filter_by(room_id=session.get('current_room')).first()
    if current_room is not None:
        message = History(messages=msg, user_history=current_user, room_records=current_room)
        db.session.add(message)
    db.session.commit()
    send(msg, broadcast=True)