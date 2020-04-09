#import ext modules
from flask import Flask, render_template, redirect, url_for, session, request
from flask_session import Session
from tempfile import mkdtemp
from flask_socketio import SocketIO, join_room, leave_room, send, emit

#app config
app = Flask(__name__)
app.secret_key="Llave secreta"
app.config['WTF_CSRF_SECRET_KEY'] = "b'f\xfa\x8b{X\x8b\x9eM\x83l\x19\xad\x84\x08\xaa"

#session config
app.config["SESSION_FILE_DIR"] = mkdtemp()
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)

#socketio
socketio = SocketIO(app, manage_session=False)

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
        return render_template("chat.htm", usrname=session["usrname"], room=room)
    else:
        return redirect(url_for("index"))

    
# socketio events
@socketio.on("join")
def join(data):
    usrname = session["usrname"]
    room = data["room"]
    join_room(room)
    print(usrname, room)
    emit("new-user", {"msg": usrname + " has joined the room."}, room=room)

@socketio.on("leave")
def leave(data):
    usrname = session["usrname"]
    room = data["room"]
    leave_room(room)
    print(usrname, room)
    emit("new-user", {"msg": usrname + " has left the room."}, room=room)

@socketio.on("message")
def message(data):
    usr = data["usr"]
    room = data["room"]
    msg = data["msg"]
    print(usr, room, msg)
    emit("message", {"msg": msg, "usr": usr}, room=room)