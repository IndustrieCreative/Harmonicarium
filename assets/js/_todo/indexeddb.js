(function() {

    // all the variables to run our database
    var database, idb_request;

    // request to open the specified database by name and version number
    // if version number changes, the database is updated
    idb_request = window.indexedDB.open("indexed-db", 1);

    // if there is an error, tell the user
    idb_request.addEventListener("error", function(event) {

        alert("Could not open Indexed DB due to error: " + this.errorCode);

    });

    /* if the database you specified cannot be found or the version number
    is old, you will need an upgrade to create the new database schema */
    idb_request.addEventListener("upgradeneeded", function(event) {

        /* Here we create a new object store called data, and give it an auto-
        generated key path */
        var storage = this.result.createObjectStore("data", { autoIncrement: true });

        // add an object to the "data" objectStore with the key, "save-data"
        storage.add({ color: "#2793e8", date: "not found.", presses: "0" }, "save-data");

        alert("Creating a new database!");

    });

    // if you successfully open the database use this callback function
    idb_request.addEventListener("success", function(event) {

        database = this.result;// store the database for later use

        // now we are going to use some data from our database
        var storage = database.transaction("data", "readwrite").objectStore("data");

        storage.get("save-data").addEventListener("success", function(event) {

            background = document.body.style.backgroundColor = this.result.color;
            document.getElementById("date").innerHTML = this.result.date;
            presses = document.getElementById("presses").innerHTML = this.result.presses;

            this.result.date = new Date().toString();

            storage.put(this.result, "save-data");

        });

        alert("Successfully opened database!");

    });

    // all the variables to run our application
    var buttons, background, presses;

    // get the array of buttons, which are just a elements:
    buttons = document.querySelectorAll("a");

    // set presses equal to zero (this will be reset if our database loads):
    presses = 0;

    // loop through all the buttons:
    for (let index = buttons.length - 1; index > -1; -- index) {

        // add a click listener to each button:
        buttons[index].addEventListener("click", function(event) {

            // Clear the database if the X button is pressed:
            if (database && this.innerHTML == "X") {

                window.indexedDB.deleteDatabase("indexed-db");

                database = undefined;

                // set up html for the white screen after deleting database
                document.getElementById("button-container").style.visibility = "hidden";
                document.querySelector("h1").innerHTML = "You just deleted the database! Refresh the page to create a new one.";
                document.querySelector("h1").style = "color:" + background;
                document.body.style.backgroundColor = "#ffffff";

                return;

            } else if (database) { // if the database was established

                presses ++;

                // when a button is clicked, store its background color for saving:
                background = this.style.backgroundColor;
                // change the background color of the page to the button's color:
                document.body.style.backgroundColor = background;

                document.getElementById("presses").innerHTML = presses;

                // save the new data to the database in the objectStore, "data"
                var storage = database.transaction("data", "readwrite").objectStore("data");
                // get returns the object pointed to by the key, "save-data"
                storage.get("save-data").addEventListener("success", function(event) {

                    // this.result is the object "save-data" was pointing to
                    this.result.color = background;
                    this.result.presses = presses;

                    // put writes the changed object back to the "data" objectStore
                    storage.put(this.result, "save-data");

                });

            }

        });

    }

})();