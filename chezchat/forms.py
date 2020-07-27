from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SubmitField, TextAreaField
from wtforms.validators import ValidationError, DataRequired, Email, EqualTo, Length
from chezchat.models import Users, History

class UserRegistrationForm(FlaskForm):
    name_surname = StringField('Company Name', validators=[DataRequired(), Length(min=4, max=64)])
    username = StringField('Username', validators=[DataRequired(), Length(min=4, max=64)], render_kw={"placeholder": "username"})
    password = PasswordField('Password', validators=[DataRequired()])
    confirm_password = PasswordField('Repeat Password', validators=[DataRequired(), EqualTo('company_password', message='passwords must match')])
    submit = SubmitField('Register')

    def validate_username(self, username):
        user = Companies.query.filter_by(username=username.data).first()
        if user is not None:
            raise ValidationError('Username is already taken. Please choose a different one')

class LoginForm(FlaskForm):
    username = StringField('Username', validators=[DataRequired()])
    password = PasswordField('Password', validators=[DataRequired()])
    submit = SubmitField('Sign In')

class MessageForm(FlaskForm):
    message = TextAreaField('Message')
    submit = SubmitField('Send')