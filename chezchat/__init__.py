import os
from flask_script import Manager
from flask_migrate import Migrate
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_marshmallow import Marshmallow
from flask_socketio import SocketIO
from flask_login import LoginManager

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY') or 'Thisshouldbeasecret'
socketio = SocketIO(app, engineio_logger=True, logger=True, cors_allowed_origins='*')

manager = Manager(app)

DATABASE_URL = 'sqlite:///database.db'

app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL') or DATABASE_URL
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
ma = Marshmallow(app)
migrate = Migrate(app, db)

login = LoginManager(app)
login.login_view = 'login'
login.login_message_category = "info"

from chezchat import main

# with app.app_context():
#     if db.engine.url.drivername == 'sqlite':
#         migrate.init_app(app, db, render_as_batch=True)
#     else:
#         migrate.init_app(app, db)
