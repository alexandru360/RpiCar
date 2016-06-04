var express = require("express");
var bodyParser = require("body-parser");
var app = express();
 
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
 
var car = require("./car_pi.js");
car.ActionDrive.carWrapperTest();

//Controller actions
var oCtlActions = ["front", "back", "right", "left", "stop"];

// app.post("/api", function(req, res) {
app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
    
    console.log(req.query);

    var request = req.query;
    var actionIndex = oCtlActions.indexOf(request.action);
    var oMsg = "";
    
    if(request.action)
        console.log("Actiune existenta: " + oCtlActions.indexOf(request.action));

    //Blank request no action
    if( isEmpty(request) ) {
        return res.send(
            {
                "status": "error", 
                "message": "request must be [server ip]:3000/api/?action=[name] Ex:(front, back, right, left, stop)"
            });
    }
    //Action is mentioned but blank name parameter
    else if( !request.action ){
        return res.send(
            {
                "status": "error", 
                "message": "Invalid action"
            });
    }
    //Action is mentioned but parameter is not in list: < oCtlActions >
    else if(actionIndex < 0){
        return res.send(
            {
                "status": "error", 
                "message": "Possible actions: front, back, right, left, stop"
            });
    }
    //Action is mentioned but blank name parameter
    else if(actionIndex == 0){
        car.ActionDrive.front();
        oMsg = "Going forward !";
    }
    else if(actionIndex == 1){
        car.ActionDrive.back();
        oMsg = "Going backwards !";
    }
    else if(actionIndex == 2){
        car.ActionDrive.right();
        oMsg = "Going right !";
    }
    else if(actionIndex == 3){
        car.ActionDrive.left();
        oMsg = "Going left !";
    }
    else if(actionIndex == 4){
        car.ActionDrive.stop();
        oMsg = "Car has stopped !";
    }
    
    return res.send(
    {
        "status": "Success",
        "action" : oCtlActions[actionIndex] ,
        "message": oMsg
    });
    
});
 
var server = app.listen(3000, function () {
    console.log("Listening on port %s...", server.address().port);
});

function isEmpty(obj) {
    for(var prop in obj) {
        if(obj.hasOwnProperty(prop))
            return false;
    }

    return true && JSON.stringify(obj) === JSON.stringify({});
}