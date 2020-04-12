document.addEventListener("DOMContentLoaded", () => {
    //send on click
    document.querySelector("#msg-txt").addEventListener("keyup", evt =>{
        evt.preventDefault();
        if(evt.keyCode == 13)
        {
            document.querySelector("#send-btn").click();
        }
    });

    
});