import os
from datetime import datetime
from chezchat import app, socketio, manager, db
from chezchat.models import Users

def update_db_after_restart():
    users = Users.query.all()
    for user in users:
        if user.online_at > user.last_seen:
            user.last_seen = datetime.utcnow()
            user.last_seen_update_on_server_restart = True
    db.session.commit()

@manager.command
def runserver():
    database_name = os.path.basename(os.environ.get('DATABASE_URL'))
    print(database_name)
    db_dir = os.path.join(app.root_path, database_name)
    if os.path.exists(db_dir):
        update_db_after_restart()
    socketio.run(app)

if __name__ == "__main__":
    manager.run()