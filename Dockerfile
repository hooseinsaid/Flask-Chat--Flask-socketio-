# syntax=docker/dockerfile:1

FROM python:3.9.6-alpine

WORKDIR /flask-chat

# install psycopg2 dependencies
RUN apk update \
    && apk add postgresql-dev gcc python3-dev musl-dev

COPY requirements.txt requirements.txt

RUN pip install --upgrade pip
RUN pip install -r requirements.txt

COPY . .

# CMD [ "python", "run.py", "runserver" ]