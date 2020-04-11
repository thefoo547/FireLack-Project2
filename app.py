#import ext modules
from flask import Flask, render_template, redirect, url_for, session, request, jsonify
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

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "GET":
        return render_template("login.htm", rooms=rooms)
    else:
        #get the user and the room
        usrname=request.form.get("usrname")
        room=request.form.get("room")

        if usrname=="" or room=="" or usrname is None or room is None:
            return error("Please fill the form")

        #if the room doesn't exist
        if room not in rooms:
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
        #go to the chat
        return redirect(url_for("chat"))

@app.route("/chat")
def chat():
    try:
        session["usrname"] or session["room"]
    except:
        return error("You are not logged in")
    else:
        #getting the messages
        messages = rooms[session["room"]]["msgs"]
        return render_template("chat.htm", usrname=session["usrname"], room=session["room"], messages=messages)

@app.errorhandler(404)
def not_found(e):
    return error("404 not found"), 404 

def error(msg):
    return render_template("error.htm", message=msg)

#AJAX API routes
@app.route("/check_user", methods = ["POST"])
def check_user():
    #get the data
    usr = request.form.get("usr")
    room = request.form.get("room")
    #validate
    if room not in rooms:
        return jsonify({"code": 301})
    if(usr in rooms[room]["usrs"]):
        return jsonify({"code": 200, "exists": True})
    else:
        return jsonify({"code": 200, "exists": False})

@app.route("/check_room", methods = ["POST"])
def check():
    #get the data
    room = request.form.get("room")
    #validate
    if room in rooms:
        return jsonify({"code": 200, "exists": True})
    else:
        return jsonify({"code": 200, "exists": False})

    
# socketio events
@socketio.on("join")
def join(data):
    #ask for the data
    usrname = data["usrname"]
    room = data["room"]
    #for the functioning of javascript, i have to check if the user is already in
    if usrname in rooms[room]["usrs"]:
        #to not send the message
        return
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
    usrname = data["usrname"]
    room = data["room"]
    #leave the access to the room
    leave_room(room)
    #remove the user from set
    rooms[room]["usrs"].discard(usrname)
    #if the rooms gets empty
    if len(rooms[room]["usrs"]) == 0:
        #remove it
        del rooms[room]
    #remove the session
    del session["usrname"]
    del session["room"]
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