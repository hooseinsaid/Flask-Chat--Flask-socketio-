import secrets
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from chezchat import db, login
from flask_login import UserMixin

room_members = db.Table('room_members',
                        db.Column('user_id', db.Integer, db.ForeignKey('users.id')),
                        db.Column('room_id', db.Integer, db.ForeignKey('room.room_id')))

class Users(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name_surname = db.Column(db.String(128), index=True)
    username = db.Column(db.String(64), index=True, unique=True)
    password_hash = db.Column(db.String(128))
    last_seen = db.Column(db.DateTime)
    user_history = db.relationship('History', backref='user_history', lazy='dynamic')
    room_created = db.relationship('Room', backref='room_created', lazy='dynamic')
    room_subscribed = db.relationship('Room', secondary=room_members, backref=db.backref('subscribers', lazy='dynamic'))

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

@login.user_loader
def load_user(id):
    return Users.query.get(int(id))

class History(db.Model):
    msg_id = db.Column(db.Integer, primary_key=True)
    messages = db.Column(db.String)
    timestamp = db.Column(db.DateTime, index=True, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    room_id = db.Column(db.Integer, db.ForeignKey('room.room_id'))

class Room(db.Model):
    room_id = db.Column(db.Integer, primary_key=True)
    room_url = db.Column(db.String, unique=True)
    name = db.Column(db.String(128), index=True)
    private_room = db.Column(db.Boolean, default=False)
    date_created = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    room_history = db.relationship('History', backref='room_records', lazy='dynamic')

    def create_room_url(self):
        random_hex = secrets.token_hex(16)
        room = Room.query.filter_by(room_url=random_hex).first()
        if room is not None:
           self.create_room_url()
        self.room_url = random_hex