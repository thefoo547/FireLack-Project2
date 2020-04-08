#import ext modules
from flask import Flask, render_template, redirect, url_for, session, request
from flask_session import Session
from tempfile import mkdtemp()
from flask_socketio import SocketIO, join_room, leave_room, send

#app config
app = Flask(__name__)
app.secret_key="Llave secreta"
app.config['WTF_CSRF_SECRET_KEY'] = "b'f\xfa\x8b{X\x8b\x9eM\x83l\x19\xad\x84\x08\xaa"

#session config
app.config["SESSION_FILE_DIR"] = mkdtemp()
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)

#global vars
rooms = []

#flask routes
@app.route("/")
def index():
    return render_template("login.htm", rooms=rooms)

@app.route("/chat", methods=["POST"])
def chat():
    if request.method == "POST":
        usrname=request.form.get("usrname")
        print(usrname)
        room=request.form.get("room")
        print(room)
        print(rooms)
        session["usrname"]=usrname
        if not room in rooms:
            rooms.append(room)
        return render_template("chat.htm", room=room)
    else:
        return redirect(url_for("index"))

    