document.addEventListener("DOMContentLoaded", () => {
    
    //connect the socket
    var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);

    //username and room to be used in the session
    const usrname= document.querySelector("#usrname").innerHTML;
    const room= document.querySelector("#room-name").innerHTML;
    
    document.querySelector("#exit-btn").onclick = leaveRoom;

    document.querySelector("#send-btn").onclick = sendMsg;

    joinRoom();

    //socketio events
    socket.on("new-user", data => {
        const msg=data.msg;
        const notif_template=Handlebars.compile('<div class="notif">'+
        '<span class="text-center user-notif">{{ msg }}</span>'+
        '</div>');
        const element = notif_template({"msg" : msg});
        console.log(element);
        document.querySelector("#msgs").innerHTML += element;
    });

    socket.on("message", data => {
        const msg = data.msg;
        const usr = data.usr;
        let msg_template;
        // own user messages
        if(usr == usrname)
        {
            msg_template = Handlebars.compile('<div class="out-msg">'+
            '<div class="sent-msg">'+
                '<div class="sent-msg-w">'+
                    '<p>{{ msg }}</p>'+
                    '<span class="msg-info">{{ usr }}</span>'+
            '</div></div></div>');
        }
        // incoming messages
        else
        {
            msg_template = Handlebars.compile('<div class="in-msg">'+
            '<div class="rec-msg">'+
                '<div class="rec-msg-w">'+
                    '<p>{{ msg }}</p>'+
                    '<span class="msg-info">{{ usr }}</span>'+
            '</div></div></div>');
        }
        // template processing
        const element = msg_template({"msg": msg, "usr": usr});
        // add to div
        document.querySelector("#msgs").innerHTML += element;
    });

    //functions
    function joinRoom(){
        socket.emit("join", {'usrname': usrname, 'room':room});
    }

    function leaveRoom(){
        socket.emit("leave", {'usrname': usrname, 'room':room});
        window.location.href("/");
    }

    function sendMsg(){
        // get value from input
        let msg = document.querySelector("#msg-txt").value;
        // clear input
        document.querySelector("#msg-txt").value = "";
        // if input was empty, do nothing
        if(msg === null || msg === "")
        {
            return;
        }
        // emit the message
        socket.emit("message", {"usr": usrname, "room": room, "msg":msg});
    }

});

