from run import update_db_or_create_db


update_db_or_create_db()

port = 5000
bind = "0.0.0.0:5000"
worker_class = "eventlet"
workers = 1
