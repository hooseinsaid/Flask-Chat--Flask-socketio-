from run import update_db_or_create_db


update_db_or_create_db()

worker_class = "eventlet"
workers = 1
