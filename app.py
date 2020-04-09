#import ext modules
from flask import Flask, render_template, redirect, url_for, session, request
from flask_session import Session
from tempfile import mkdtemp
from flask_socketio import SocketIO, join_room, leave_room, send, emit

from models import Message

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
'''rooms dict'''
rooms = {}

#flask routes
@app.route("/")
def index():
    # if the user is not logged
    try:
        session["usrname"]

        session["room"]
        # redirect to login
    except:
        return redirect(url_for("login"))
    else:
        # redirect to the previous chat
        return redirect(url_for("chat"))

@app.route("/login")
def login():
    return render_template("login.htm", rooms=rooms)


@app.route("/chat", methods=["GET", "POST"])
def chat():
    #if the user is post to log into a chat
    if request.method == "POST":
        #get the user and the room
        usrname=request.form.get("usrname")
        room=request.form.get("room")
        #if the room doesn't exist
        try: 
            rooms[room]
        except:
            '''create a new one, saving a space for
            users and a space for messages'''
            # usrs set, msgs list
            rooms[room]={"usrs": set(), "msgs": []}
        #if the room exists and there is already a user with the same name in it
        
        if usrname in rooms[room]["usrs"]:
            return error("The user is already taken")
        
        #saving the room and the user in session
        session["usrname"]=usrname
        session["room"]=room
        #rendering to chatroom
        return render_template("chat.htm", usrname=session["usrname"], room=session["room"])
    else:
        # if the user is not logged in
        try:
            session["usrname"] or session["room"]
        except:
            return error("You are not logged in")
        else:
            return render_template("chat.htm", usrname=session["usrname"], room=session["room"])

def error(msg):
    return render_template("error.htm", message=msg)
    
# socketio events
@socketio.on("join")
def join(data):
    #ask for the data
    usrname = session["usrname"]
    room = data["room"]
    # join room
    join_room(room)
    #add user to the list
    rooms[room]["usrs"].add(usrname)
    print(rooms)
    #emit notification
    emit("new-user", {"msg": usrname + " has joined the room."}, room=room)

@socketio.on("leave")
def leave(data):
    #ask for the data
    usrname = session["usrname"]
    room = data["room"]
    #leave the access to the room
    leave_room(room)
    #remove the user from set
    rooms[room]["usrs"].discard(usrname)
    #if the rooms gets empty
    if len(rooms[room]["usrs"]) == 0:
        #remove it
        del rooms[room]
    print(rooms)
    #emit notification
    emit("new-user", {"msg": usrname + " has left the room."}, room=room)

@socketio.on("message")
def message(data):
    #get the data
    usr = data["usr"]
    room = data["room"]
    msg = data["msg"]
    #add the message to the list
    rooms[room]["msgs"].append(Message(usr, msg))
    print(rooms)
    #emit message
    emit("message", {"msg": msg, "usr": usr}, room=room)