document.addEventListener("DOMContentLoaded", function(){
    document.querySelector("#join-ch").onchange = enable_join;
    document.querySelector("#create-ch").onchange = enable_create;
    
});

function enable_join(){
    document.querySelector("#room-cmb").disabled=false;
    document.querySelector("#room-txt").disabled=true;
}

function enable_create(){
    document.querySelector("#room-cmb").disabled=true;
    document.querySelector("#room-txt").disabled=false;
}