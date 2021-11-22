import os
import environ
from datetime import datetime
from chezchat import app, socketio, manager, db, DATABASE_URL
from chezchat.models import Users
import logging as logger

# Initialise environment variables from the .env file
env = environ.Env()
overrides = {key: os.environ.pop(key, value) for key, value in os.environ.items()}
environ.Env.read_env(env_file='.env', **overrides)

DEBUG = os.getenv('DEBUG') == 'True'

def update_db_after_restart():
    try:
        users = Users.query.all()
        for user in users:
            if user.online_at > user.last_seen:
                user.last_seen = datetime.utcnow()
                user.last_seen_update_on_server_restart = True
        db.session.commit()
    except:
        logger.info("Table doesn't exist yet. continuing")

@manager.command
def runserver():
    database_name = os.path.basename(os.environ.get('DATABASE_URL') or DATABASE_URL)
    db_dir = os.path.join(app.root_path, database_name)
    if os.path.exists(db_dir):
        update_db_after_restart()
    socketio.run(app, host='0.0.0.0', debug=DEBUG)

if __name__ == "__main__":
    manager.run()