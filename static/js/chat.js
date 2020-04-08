document.addEventListener("DOMContentLoaded", () => {
    
    var messageBody = document.querySelector('#msgs');
    messageBody.scrollTop = messageBody.scrollHeight - messageBody.clientHeight;
    
    var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);

    const usrname= document.querySelector("#usrname").innerHTML;
    let room= document.querySelector("#room-name").innerHTML;
    
    document.querySelector("#exit-btn").onclick = leaveRoom;

    joinRoom(room);

    socket.on("new-user", data => {
        const msg=data.msg;
        const notif_template=Handlebars.compile('<div class="notif">'+
        '<span class="text-center user-notif">{{ msg }}</span>'+
        '</div>');
        const element = notif_template({"msg" : msg});
        console.log(element);
        document.querySelector("#msgs").innerHTML += element;
    });

    //functions
    function joinRoom(room){
        socket.emit("join", {'usrname': usrname, 'room':room});
    }

    function leaveRoom(){
        console.log("leave");
        socket.emit("leave", {'usrname': usrname, 'room':room});
    }

});

