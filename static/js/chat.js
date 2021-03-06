document.addEventListener("DOMContentLoaded", () => {
    
    //connect the socket
    var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);

    //username and room to be used in the session
    const usrname= document.querySelector("#usrname").innerHTML;
    const room= document.querySelector("#room-name").innerHTML;
    
    document.querySelector("#exit-btn").onclick = leaveRoom;

    document.querySelector("#send-btn").onclick = sendMsg;

    document.addEventListener("click", evt => {
        const element = evt.target;
        if(element.className == "delete-btn"){
            let msg_id = element.dataset.msgid;
            if(msg_id == undefined || msg_id == null){
                alert("ISE");
            }else{
                delete_msg(msg_id);
            }
        }
    });

    joinRoom();

    //socketio events
    socket.on("new-user", data => {
        const msg=data.msg;
        const notif_template=Handlebars.compile('<div class="notif">'+
        '<span class="text-center user-notif">{{ msg }}</span>'+
        '</div>');
        const element = notif_template({"msg" : msg});
        let msg_box = document.querySelector("#msgs");
        msg_box.innerHTML += element;
        update_users();
        playNewusr();
        //scroll on bottom
        msg_box.scrollTop = msg_box.scrollHeight;
    });

    socket.on("exit-user", data => {
        const msg=data.msg;
        const notif_template=Handlebars.compile('<div class="notif">'+
        '<span class="text-center user-notif">{{ msg }}</span>'+
        '</div>');
        const element = notif_template({"msg" : msg});
        let msg_box = document.querySelector("#msgs");
        msg_box.innerHTML += element;
        update_users();
        playOutusr();
        //scroll on bottom
        msg_box.scrollTop = msg_box.scrollHeight;
    });

    socket.on("message", data => {
        const msg_id = data.msg_id;
        const msg = data.msg;
        const usr = data.usr;
        const hr = data.hr;
        let msg_template;
        // own user messages
        
        if(usr == usrname)
        {
            msg_template = Handlebars.compile('<div class="out-msg"><div class="sent-msg"><div class="sent-msg-w">'+
                '<p id="{{msg_id}}">{{msg}}</p>'+
                '<span class="msg-info">{{usr}} | {{hr}} <button class="delete-btn" data-msgid="{{msg_id}}"> <i class="icon-trash-empty"></i> Delete for all</button></span>'+
            '</div></div></div>');
        }
        // incoming messages
        
        else
        {
            msg_template = Handlebars.compile('<div class="in-msg"><div class="rec-msg"><div class="rec-msg-w">'+
            '<p id="{{msg_id}}">{{msg}}</p>'+
            '<span class="msg-info">{{usr}} | {{hr}}</span>'+
            '</div></div></div>');
            
            playNewmsg();
        }
        // template processing
        const element = msg_template({"msg_id": msg_id ,"msg": msg, "usr": usr, "hr":hr});
        // add to div
        let msg_box = document.querySelector("#msgs");
        msg_box.innerHTML += element;
        //scroll on bottom
        msg_box.scrollTop = msg_box.scrollHeight;

    });

    socket.on("del-message", data=>{  
        const msg_id = data.msg_id;
        const element = document.getElementById(msg_id);
        if(element == null){
            console.log("ISE");
            return;
        }
        element.innerHTML = "This message has been deleted"
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

    function delete_msg(msg_id){
        socket.emit("del-message", {"usr": usrname, "room": room, "msg_id":msg_id});
    }

    function update_users(){
        const req=new XMLHttpRequest();
        req.open("POST", "/get_users");
        req.onload = () => {
            const resp = req.responseText;
    
            if(resp != "ERROR")
            {
                const data = JSON.parse(String(resp));
                let usr_template = Handlebars.compile('<a href="#" id="exit-btn"class="dropdown-item"><i class="icon-circle-notch mr-1"></i>{{user}}</a>'); 
                let content = "";
                data.forEach(user => {
                    const element = usr_template({"user": user});
                    content += element;
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


    //notification sounds
    function playNewmsg(){
        let sound = new Audio("/static/audio/newmsg.mp3");
        sound.play();
    }

    function playNewusr(){
        let sound = new Audio("/static/audio/newusr.mp3");
        sound.play();
    }

    function playOutusr(){
        let sound = new Audio("/static/audio/outusr.mp3");
        sound.play();
    }
});


