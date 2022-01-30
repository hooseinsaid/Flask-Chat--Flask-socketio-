import os
import environ
from datetime import datetime
from chezchat import app, socketio, manager, db, inspector
from chezchat.models import Users
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Initialise environment variables from the .env file
env = environ.Env()
overrides = {key: os.environ.pop(key, value) for key, value in os.environ.items()}
environ.Env.read_env(env_file=".env", **overrides)

DEBUG = os.getenv("DEBUG") == "True"


def update_db_or_create_db():
    try:
        users = Users.query.all()
        for user in users:
            if user.online_at > user.last_seen:
                user.last_seen = datetime.utcnow()
                user.last_seen_update_on_server_restart = True
        db.session.commit()
    except Exception as e:
        if not inspector.get_table_names():
            logger.warning("Tables don't exist yet. creating them now")
            db.create_all()
            logger.info("Successfully created the database and related tables")
        else:
            raise e


@manager.command
def runserver():
    update_db_or_create_db()
    socketio.run(app, host="0.0.0.0", debug=DEBUG)


if __name__ == "__main__":
    manager.run()
