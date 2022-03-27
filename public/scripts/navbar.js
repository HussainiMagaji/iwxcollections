{//======================================================
let menu = document.getElementById("menu"),
    dropDown = document.getElementById("dropdown");

let navbar = document.getElementById("navbar"),
    search = document.getElementById("search"),
    searchForm = document.getElementById("search-form");

let handler = {

    handleEvent(event) {
        let target = event.target;
        switch (target.id) {
            case "menu":
	    case "account":
            case "about":
            case "search":
                this[target.id]( ); 
                break;
            case "home":
            case "cart":
                location.href = `${target.id}`; 
                break; 
            default: {
                dropDown.hidden = true;
                searchForm.hidden = true;
            }
        }
    },

    menu( ) {
        searchForm.hidden = true;
        if(dropDown.hidden) {
            dropDown.hidden = false;
            dropDown.style.display = "flex";
        } else {
            dropDown.style.display = "";
            dropDown.hidden = true;
        }
    },

    account( ) { location.href = "login"; },

    search( ) { },

    about( ) { }
};

document.addEventListener("click", handler);
};//======================================================
