document.addEventListener("DOMContentLoaded", function(){
    // if there are no rooms, the select combobox does not exist
    if(document.querySelector("#room-cmb")===null)
    {
        document.querySelector("#room-txt").disabled=false;
        document.querySelector("#join-ch").disabled= true;
        document.querySelector("#create-ch").disabled=true;
    }
    // if there are rooms, i need to establish the ONCHANGE value of the radio options
    else
    {
        document.querySelector("#join-ch").onchange = enable_join;
        document.querySelector("#create-ch").onchange = enable_create;
    }
    var form = document.querySelector(".needs-validation");
    form.addEventListener("submit", event => {
        document.querySelector("#user-val-feedback").innerHTML = "Please write a username!";
        document.querySelector("#room-val-feedback").innerHTML = "Please type a room to create!";
        
        //validate user
        //this will indicate if something went wrong
        let usr_flag=false;
        let room_flag=false;
        let usr = document.querySelector("#usrname-txt").value;
        // if the user is empty
        if(usr === null || usr == "")
        {
            invalidate_field("#usrname-txt", true);
            usr_flag=true;
        }
        //if not its time to check the rooms
        else
        {
            invalidate_field("#usrname-txt",false);
            usr_flag=false;
        }
        //select for the room combobox
        let r = document.querySelector("#room-cmb");
        let room;
        //if combobox is disabled
        if(r.disabled)
        {
            invalidate_field("#room-cmb", false);
            //we will work with the textfield
            room = document.querySelector("#room-txt").value;
            //if the textfield is empty
            if(room === null || room == "")
            {
                invalidate_field("#room-txt", true);
                room_flag=true;
            }
            //if not, we will validate the room if it already exists
            else
            {    
                invalidate_field("#room-txt", false);
                room_flag=validate_room(room);
                if(room_flag){
                    invalidate_field("#room-txt", true);
                }
            }
        }
        //work with combobox
        else
        {
            invalidate_field("#room-txt", false);
            room = r.value;
            //take care of the placeholder
            if(room=="Choose..."){
                invalidate_field("#room-cmb", true);
                room_flag=true;
            }
            else
            {
                invalidate_field("#room-cmb", false);
                //check if the user is already in the selected room
                usr_flag=validate_user(usr, room);
                if(usr_flag){
                    invalidate_field("#usrname-txt", true); 
                }
            }
        }
        // if in the overall checking something went wrong
        if(usr_flag || room_flag)
        {
            event.preventDefault();
            event.stopPropagation();
        }
    }, false);
});

// enable the join room combobox dropdown
function enable_join(){
    document.querySelector("#room-cmb").disabled=false;
    document.querySelector("#room-txt").disabled=true;
}

// enable the create room text input
function enable_create(){
    document.querySelector("#room-cmb").disabled=true;
    document.querySelector("#room-txt").disabled=false;
}

function validate_user(usr, room){
    // user validation, this validation will only ocur if the combobox is enabled
    if(usr===null || room===null || usr=="" || room =="")
    {
        //error
        return true;
    }
    //open an AJAX request
    const request=new XMLHttpRequest();
    //to /check_user syncronous
    request.open("POST", "/check_user", false);
    //onload
    request.onload = () =>{
        const data = JSON.parse(request.responseText);
        console.log(data);
        console.log(document.querySelector("#usrname-txt").classList);
        // if the request was sucessfull
        if(data.code===200)
        {
            //if the user exists
            if (data.exists){
                document.querySelector("#user-val-feedback").innerHTML = "Username already taken";
                //and the form will not be send
            }
        }
        else
        {
            alert("Internal server error");
            return;
        }
    }
    //send the request
    const data = new FormData();
    data.append("usr", usr);
    data.append("room", room);
    request.send(data);
    return JSON.parse(request.responseText).exists;
}

function validate_room(room)
{
    if(room===null || room =="")
    {
        //error
        return true;
    }
    //open an AJAX request
    const request=new XMLHttpRequest();
    //to /check_user syncronous
    request.open("POST", "/check_room", false);
    //onload
    request.onload = () =>{
        const data = JSON.parse(request.responseText);
        console.log(data);
        console.log(document.querySelector("#usrname-txt").classList);
        // if the request was sucessfull
        if(data.code===200)
        {
            //if the user exists
            if (data.exists){
                document.querySelector("#room-val-feedback").innerHTML = "This room already exists";
                //and the form will not be send
            }
        }
        else
        {
            alert("Internal server error");
            return;
        }
    }
    //send the request
    const data = new FormData();
    data.append("room", room);
    request.send(data);
    return JSON.parse(request.responseText).exists;
}

function invalidate_field(classname, valid){
    if(valid)
    {
        document.querySelector(classname).classList.add("is-invalid");
    }
    else
    {
        document.querySelector(classname).classList.remove("is-invalid");
    }
}