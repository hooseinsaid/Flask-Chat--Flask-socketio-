from flask import render_template
from flask_socketio import send
from chezchat import socketio, app, db
from chezchat.models import Users, History
from chezchat.forms import *

@app.route('/')
def home():
    form = MessageForm()
    messages = History.query.all()
    return render_template('chatroom.html', messages=messages, form=form)

@socketio.on('message')
def handleMessage(msg):
    message = History(messages=msg)
    db.session.add(message)
    db.session.commit()
    send(msg, broadcast=True)