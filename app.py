#import ext modules
from flask import Flask, render_template, redirect, url_for, session
from flask_socketio import SocketIO, join_room, leave_room, send

#app config
app = Flask(__name__)
app.secret_key="Llave secreta"
app.config['WTF_CSRF_SECRET_KEY'] = "b'f\xfa\x8b{X\x8b\x9eM\x83l\x19\xad\x84\x08\xaa"

#flask routes
@app.route("/")
def index():
    return render_template("login.htm")
    