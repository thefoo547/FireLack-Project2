document.addEventListener("DOMContentLoaded", () => {
    const msg_box = document.querySelector("#msgs");

    //go to scroll bottom
    msg_box.scrollTop = msg_box.scrollHeight;
    // the app inits with at least 20 msgs if exists 
    let counter = 20;

    msg_box.onscroll = () => {
        if(msg_box.scrollTop <= 0){
            load_msgs();
        }
    }

    //send on click
    document.querySelector("#msg-txt").addEventListener("keyup", evt =>{
        evt.preventDefault();
        if(evt.keyCode == 13)
        {
            document.querySelector("#send-btn").click();
        }
    });

    function load_msgs() {

        const start = counter;
        // wil get 10 new messages
        const end = counter + 10;
        counter = end;

        const request = new XMLHttpRequest();
        request.open("POST", "/get_messages");
        request.onload = () => {
            const data = JSON.parse(request.responseText);
            if (data.length<=0)
            {
                counter -= 10;
                return;
            }
            const msgs = data.reverse();
            msgs.forEach(insert_msg);
        }
        const data = new FormData();
        data.append('start', start);
        data.append('end', end);
        data.append('room', document.querySelector("#room-name").innerHTML);
        request.send(data);
    }
    
    function insert_msg(msg)
    {
        const usrname=document.querySelector("#usrname").innerHTML;
        msg=JSON.parse(msg);
        let msg_template;

        let usr = msg.usr;
        let msgtxt= msg.msg;
        let hr = msg.timest;

        if(usr == usrname)
        {
            msg_template = Handlebars.compile('<div class="out-msg">'+
            '<div class="sent-msg">'+
                '<div class="sent-msg-w">'+
                    '<p>{{ msg }}</p>'+
                    '<span class="msg-info">{{ usr }} | {{ hr }}</span>'+
            '</div></div></div>');
        }
        else if(usr == "NOTIF")
        {
            //prepend notifications
            msg_template=Handlebars.compile('<div class="notif">'+
            '<span class="text-center user-notif">{{ msg }}</span>'+
            '</div>');
            const comp=msg_template({"msg": msgtxt});
            document.querySelector("#msgs").innerHTML = comp + document.querySelector("#msgs").innerHTML;
            return;
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
        const comp=msg_template({"msg": msgtxt, "usr": usr, "hr":hr});
        document.querySelector("#msgs").innerHTML = comp + document.querySelector("#msgs").innerHTML;
    }
});