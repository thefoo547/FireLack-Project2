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
        update_users();
    });

    socket.on("message", data => {
        const msg = data.msg;
        const usr = data.usr;
        const hr = data.hr;
        let msg_template;
        // own user messages
        if(usr == usrname)
        {
            msg_template = Handlebars.compile('<div class="out-msg">'+
            '<div class="sent-msg">'+
                '<div class="sent-msg-w">'+
                    '<p>{{ msg }}</p>'+
                    '<span class="msg-info">{{ usr }} | {{ hr }}</span>'+
            '</div></div></div>');
        }
        // incoming messages
        else
        {
            msg_template = Handlebars.compile('<div class="in-msg">'+
            '<div class="rec-msg">'+
                '<div class="rec-msg-w">'+
                    '<p>{{ msg }}</p>'+
                    '<span class="msg-info">{{ usr }} | {{ hr }}</span>'+
            '</div></div></div>');
        }
        // template processing
        const element = msg_template({"msg": msg, "usr": usr, "hr":hr});
        // add to div
        let msg_box = document.querySelector("#msgs");
        msg_box.innerHTML += element;
        //scroll on bottom
        msg_box.scrollTop = msg_box.scrollHeight;

    });

    //functions
    function joinRoom(){
        socket.emit("join", {'usrname': usrname, 'room':room});
    }

    function leaveRoom(){
        socket.emit("leave", {'usrname': usrname, 'room':room});
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

    function update_users(){
        const req=new XMLHttpRequest();
        req.open("POST", "/get_users");
        console.log("update users");
        req.onload = () => {
            const resp = req.responseText;
    
            if(resp != "ERROR")
            {
                const data = JSON.parse(String(resp));
                console.log(resp);
                console.log(data);
                let usr_template = Handlebars.compile('<a href="#" id="exit-btn"class="dropdown-item"><i class="icon-circle-notch mr-1"></i>{{user}}</a>'); 
                let content = "";
                data.forEach(user => {
                    const element = usr_template({"user": user});
                    content += element;
                    console.log(content);
                });
                const user_list = document.querySelector("#user-list");
                user_list.innerHTML = content;
            }
            else
            {
                alert("Internal error");
                return;
            }
        }
        const data = new FormData();
        data.append("room", room);
        req.send(data)
    }
});


