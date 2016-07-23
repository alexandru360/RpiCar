var Express = require("express");
var Cors = require("cors");
var BodyParser = require("body-parser");
var App = Express();

// App.use(Cors());
App.use(BodyParser.json());
App.use(BodyParser.urlencoded({ extended: true }));

var Car = require("./car_pi.js");
Car.ActionDrive.carWrapperTest();

//Controller actions
var OCtlActions = ["front", "back", "right", "left", "stop"];

App.post("/api", function(req, res) {
    App.all('*', function (req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "X-Requested-With");
        res.header('Access-Control-Allow-Headers', 'Content-Type');
        next();

        console.log(req.query);

        var request = req.query;
        var actionIndex = OCtlActions.indexOf(request.action);
        var oMsg = "";

        if (request.action)
            console.log("Actiune existenta: " + OCtlActions.indexOf(request.action));

        //Blank request no action
        if (IsEmpty(request)) {
            return res.send(
                {
                    "status": "error",
                    "message": "request must be [server ip]:3000/api/?action=[name] Ex:(front, back, right, left, stop)"
                });
        }
        //Action is mentioned but blank name parameter
        else if (!request.action) {
            return res.send(
                {
                    "status": "error",
                    "message": "Invalid action"
                });
        }
        //Action is mentioned but parameter is not in list: < oCtlActions >
        else if (actionIndex < 0) {
            return res.send(
                {
                    "status": "error",
                    "message": "Possible actions: front, back, right, left, stop"
                });
        }
        //Action is mentioned but blank name parameter
        else if (actionIndex === 0) {
            Car.ActionDrive.front();
            oMsg = "Going forward !";
        }
        else if (actionIndex === 1) {
            Car.ActionDrive.back();
            oMsg = "Going backwards !";
        }
        else if (actionIndex === 2) {
            Car.ActionDrive.right();
            oMsg = "Going right !";
        }
        else if (actionIndex === 3) {
            Car.ActionDrive.left();
            oMsg = "Going left !";
        }
        else if (actionIndex === 4) {
            Car.ActionDrive.stop();
            oMsg = "Car has stopped !";
        }

        return res.send(
            {
                "status": "Success",
                "action": OCtlActions[actionIndex],
                "message": oMsg
            });

    });

    var Server = App.listen(3000, function () {
        console.log("Listening on port %s...", Server.address().port);
    });

    function IsEmpty(obj) {
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop))
                return false;
        }

        return true && JSON.stringify(obj) === JSON.stringify({});
    }
});
