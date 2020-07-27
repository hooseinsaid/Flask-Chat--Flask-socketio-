from werkzeug.security import generate_password_hash, check_password_hash
from chezchat import db

class Users(db.Model):
    user_id = db.Column(db.Integer, primary_key=True)
    name_surname = db.Column(db.String(128), index=True)
    username = db.Column(db.String(64), index=True, unique=True)
    password_hash = db.Column(db.String(128))
    user_history = db.relationship('History', backref='user_history', lazy='dynamic')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class History(db.Model):
    room_id = db.Column(db.Integer, primary_key=True)
    messages = db.Column(db.String)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'))