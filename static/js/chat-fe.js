document.addEventListener("DOMContentLoaded", () => {
    const msg_box = document.querySelector("#msg.box")

    //go to scroll bottom
    msg_box.scrollTop = msg_box.scrollHeight;
    //send on click
    document.querySelector("#msg-txt").addEventListener("keyup", evt =>{
        evt.preventDefault();
        if(evt.keyCode == 13)
        {
            document.querySelector("#send-btn").click();
        }
    });

    
});