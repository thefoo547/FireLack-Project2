#import ext modules
from flask import Flask, render_template, redirect, url_for, session, request, jsonify
from flask_session import Session
from tempfile import mkdtemp
from flask_socketio import SocketIO, join_room, leave_room, send, emit

import time
import uuid
import json

from models import Message

#app config
app = Flask(__name__)
app.secret_key="Llave secreta"
app.config['WTF_CSRF_SECRET_KEY'] = "b'f\xfa\x8b{X\x8b\x9eM\x83l\x19\xad\x84\x08\xaa"

#session config
app.config["SESSION_FILE_DIR"] = mkdtemp()
app.config["SESSION_PERMANENT"] = True
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
    if "room" not in session or "usrname" not in session:
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
        #NOTIF will be a reserved username for notifications
        if usrname in rooms[room]["usrs"] or usrname == "NOTIF":
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
        if(session["room"] not in rooms):
            return redirect(url_for("login"))
        
        n=len(rooms[session["room"]]["msgs"])
        #if there are less than 20 messages
        if n <= 20:
            #get all
            messages = rooms[session["room"]]["msgs"]
        else:
            #if not, get only the last 20
            messages = rooms[session["room"]]["msgs"][n-20:]
        users = rooms[session["room"]]["usrs"]
        return render_template("chat.htm", usrname=session["usrname"], room=session["room"], messages=messages, users=users)

@app.errorhandler(404)
def not_found(e):
    return error("404 not found"), 404 

def error(msg):
    return render_template("error.htm", message=msg)

#AJAX API routes
@app.route("/check_user", methods = ["POST"])
def check_user():
    '''Check if a username is already in a room'''
    #get the data
    usr = request.form.get("usr")
    room = request.form.get("room")
    #validate
    if room not in rooms:
        return jsonify({"code": 301})
    #NOTIF will be a reserved username for notifications
    if(usr in rooms[room]["usrs"] or usr=="NOTIF"):
        return jsonify({"code": 200, "exists": True})
    else:
        return jsonify({"code": 200, "exists": False})

@app.route("/check_room", methods = ["POST"])
def check_room():
    '''Check if a room exists'''
    #get the data
    room = request.form.get("room")
    #validate
    if room in rooms:
        return jsonify({"code": 200, "exists": True})
    else:
        return jsonify({"code": 200, "exists": False})

@app.route("/get_users", methods = ["POST"])
def get_users():
    '''Returns the users logged in a room'''
    room = request.form.get("room")
    if room not in rooms:
        return "ERROR"
    else:
        users=rooms[room]["usrs"]
        stre = f"{list(users)}".replace('\'', '\"')
        return stre

@app.route("/get_messages", methods=["POST"])
def get_messages():

    room = request.form.get("room")
    start = int(request.form.get("start"))
    end = int(request.form.get("end"))

    r_len = len(rooms[room]["msgs"])

    if r_len < 20 :
        return "EMPTY"

    sl_end = 0 if(start>=r_len) else r_len-start
    sl_start = 0 if(end>=r_len) else r_len-end

    msgs = rooms[room]["msgs"][sl_start:sl_end]



    smsgs = []

    for msg in msgs:
        smsgs.append(json.dumps(msg.__dict__))


    return jsonify(smsgs)

# socketio events
@socketio.on("join")
def join(data):
    #ask for the data
    usrname = data["usrname"]
    room = data["room"]

    # join room
    join_room(room)
    #add user to the list
    if room in rooms:
        if usrname in rooms[room]["usrs"]:
            #to not send the message
            return
    rooms[room]["usrs"].add(usrname)

    notif = usrname + " has joined the room."
    addmessage(uuid.uuid1(), "NOTIF", room, notif, time.strftime('%b-%d %I:%M%p', time.localtime()))
    #emit notification
    emit("new-user", {"msg": notif}, room=room)

@socketio.on("leave")
def leave(data):
    #ask for the data
    usrname = data["usrname"]
    room = data["room"]
    #leave the access to the room
    leave_room(room)
    #remove the user from set
    rooms[room]["usrs"].discard(usrname)
    notif =  usrname + " has left the room."
    addmessage(uuid.uuid1(), "NOTIF", room, notif, time.strftime('%b-%d %I:%M%p', time.localtime()))
    #if the rooms gets empty
    if len(rooms[room]["usrs"]) == 0:
        #remove it
        del rooms[room]
    #remove the session
    del session["usrname"]
    del session["room"]
    #emit notification
    emit("exit-user", {"msg":notif}, room=room)

@socketio.on("message")
def message(data):
    #get the data
    usr = data["usr"]
    room = data["room"]
    msg = data["msg"]
    msgid = str(uuid.uuid1())
    hr = str(time.strftime('%b-%d %I:%M%p', time.localtime()))
    addmessage(msgid, usr, room, msg, hr)
    #emit message
    emit("message", {"msg_id":msgid,"msg": msg, "usr": usr, "hr": hr}, room=room)

@socketio.on("del-message")
def del_message(data):
    #get the data
    usr = data["usr"]
    room = data["room"]
    msg_id = data["msg_id"]
    #search the message
    index = search_msgs(room, msg_id)
    
    #if not found, do nothing
    if index < 0:
        return
    # get the message
    msg = rooms[room]["msgs"][index]

    #security protect, if is a message not from the same user, do nothing
    if msg.usr != usr:
        return
    
    #delete the message from the list
    rooms[room]["msgs"].pop(index)

    #send the event to room
    emit("del-message", {"msg_id": msg_id}, room=room)
    

#helpers
def addmessage(msgid, usr, room, msg, hr):
    '''Add a new message to the list of a determined room'''
    #add the message to the list
    #limit the messages list to 100
    if len(rooms[room]["msgs"]) <= 100: 
        rooms[room]["msgs"].append(Message(str(msgid) , usr, msg, hr))
    else:
        #remove the last message
        rooms[room]["msgs"].pop(0)
        #add the new one
        rooms[room]["msgs"].append(Message(str(msgid), usr, msg, hr))

#i have to do linear search because i have to preserve the time order in the message list
def search_msgs(room, msg_id):
    '''Linear search in the message lists of a room for a particula msg_id'''
    for i in range(len(rooms[room]["msgs"])):
        if rooms[room]["msgs"][i].msg_id == msg_id:
            return i
    return -1