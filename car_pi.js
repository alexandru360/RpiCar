var rpio = require('rpio');
var consloe = require('console');

function initalizePins(){
    /* Configure P11, 12, 13, 15 as an output pins, setting its initial state to low */
    rpio.open(11, rpio.OUTPUT, rpio.LOW);
    rpio.open(12, rpio.OUTPUT, rpio.LOW);
    rpio.open(13, rpio.OUTPUT, rpio.LOW);
    rpio.open(15, rpio.OUTPUT, rpio.LOW);
};

var exports = module.exports = {};

exports.ActionDrive = {
    driving : 0,
    front : function(){
        // if(driving > 0) stop();
        
        initalizePins();
        //Wheel 1
        rpio.write(11, rpio.HIGH);
        rpio.write(13, rpio.LOW);

        //Wheel 2
        rpio.write(15, rpio.LOW);
        rpio.write(12, rpio.HIGH);
        
        driving = 1;
    },
    back : function(){
        initalizePins();
        //Wheel 1
        rpio.write(11, rpio.LOW);
        rpio.write(13, rpio.HIGH);

        //Wheel 2
        rpio.write(15, rpio.HIGH);
        rpio.write(12, rpio.LOW);
    },
    left : function(){
        initalizePins();
        //Wheel 1
        rpio.write(11, rpio.LOW);
        rpio.write(13, rpio.HIGH);

        //Wheel 2
        rpio.write(15, rpio.LOW);
        rpio.write(12, rpio.HIGH);
    },
    right : function(){
        initalizePins();
        //Wheel 1
        rpio.write(11, rpio.HIGH);
        rpio.write(13, rpio.LOW);

        //Wheel 2
        rpio.write(15, rpio.HIGH);
        rpio.write(12, rpio.LOW);
    },
    // stop : "dealocateAndClosePins()",
    carWrapperTest : function(){
        console.log("Car api online and loaded ...");
    }
};

exports.ActionDrive.stop = function dealocateAndClosePins(){
    // Close !
    rpio.write(11, rpio.LOW);
    rpio.write(12, rpio.LOW);
    rpio.write(13, rpio.LOW);
    rpio.write(15, rpio.LOW);

    rpio.close(11);
    rpio.close(12);
    rpio.close(13);
    rpio.close(15);
    
    // driving = 0;
};
