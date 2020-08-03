import os
from flask_script import Manager
from flask_migrate import Migrate
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_socketio import SocketIO
from flask_login import LoginManager
from flask_moment import Moment

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY')
socketio = SocketIO(app, engineio_logger=True, cors_allowed_origins='*')

moment = Moment(app)

manager = Manager(app)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
migrate = Migrate(app, db)

login = LoginManager(app)
login.login_view = 'login'

from chezchat import main
