import os
import secrets
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from chezchat import db, ma, login, app
from flask_login import UserMixin

@app.before_request
def before_request():
    database_name = os.path.basename(os.environ.get('DATABASE_URL'))
    db_dir = os.path.join(app.root_path, database_name)
    if not os.path.exists(db_dir):
        db.create_all()

room_members = db.Table('room_members',
                        db.Column('user_id', db.Integer, db.ForeignKey('users.id')),
                        db.Column('room_id', db.Integer, db.ForeignKey('room.room_id')))

class Users(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name_surname = db.Column(db.String(128), index=True)
    username = db.Column(db.String(64), index=True, unique=True)
    password_hash = db.Column(db.String(128))
    online_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_seen = db.Column(db.DateTime, default=datetime.utcnow)
    last_seen_update_on_server_restart = db.Column(db.Boolean)
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
    uuid = db.Column(db.String)
    messages = db.Column(db.String)
    msg_delivered = db.Column(db.Boolean)
    timestamp = db.Column(db.DateTime, index=True, default=datetime.utcnow)
    author = db.Column(db.String, db.ForeignKey('users.username'))
    room_id = db.Column(db.Integer, db.ForeignKey('room.room_id'))

class Notifications(db.Model):
    notification_id = db.Column(db.Integer, primary_key=True)
    recipient_id = db.Column(db.Integer)
    last_message = db.Column(db.String)
    last_author = db.Column(db.String)
    last_time = db.Column(db.DateTime)
    room_id = db.Column(db.Integer)
    count = db.Column(db.Integer)

class Room(db.Model):
    room_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(128), index=True)
    private_room = db.Column(db.Boolean, default=False)
    date_created = db.Column(db.DateTime, default=datetime.utcnow)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    room_history = db.relationship('History', backref='room_records', lazy='dynamic')

class HistorySchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = History
        include_fk = True

class RoomSchema(ma.SQLAlchemyAutoSchema):
    room_history = ma.Nested(HistorySchema, many=True)
    class Meta:
        model = Room
        include_fk = True

class UsersSchema(ma.SQLAlchemyAutoSchema):
    user_history = ma.Nested(HistorySchema, many=True)
    room_created = ma.Nested(RoomSchema, many=True)
    room_subscribed = ma.Nested(RoomSchema, many=True)
    class Meta:
        model = Users
        include_fk = True