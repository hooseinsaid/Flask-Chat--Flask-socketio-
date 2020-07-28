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
    current_room = None
    if request.args.get("r"):
        current_room = Room.query.filter_by(room_url=request.args.get("r")).first()
        if current_room not in current_user.room_subscribed:
            abort(403)
        else:
            session['current_room'] = current_room.room_id
    else:
        session.pop('current_room', None)
    rooms = current_user.room_subscribed
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
            flash('Room not created. Make sure the name name field is not empty')
        return redirect(url_for('home'))
    return render_template('chatroom.html', form=form, form2=form2, rooms=rooms, current_user=current_user, current_room=current_room)

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

@socketio.on('message')
def handleMessage(msg):
    current_room = Room.query.filter_by(room_id=session.get('current_room')).first()
    message = History(messages=msg, user_history=current_user, room_records=current_room)
    db.session.add(message)
    db.session.commit()
    send(msg, broadcast=True)