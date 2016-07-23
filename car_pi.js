var Rpio = require("rpio");
//var Consloe = require("console");

function InitalizePins() {
    /* Configure P11, 12, 13, 15 as an output pins, setting its initial state to low */
    Rpio.open(11, Rpio.OUTPUT, Rpio.LOW);
    Rpio.open(12, Rpio.OUTPUT, Rpio.LOW);
    Rpio.open(13, Rpio.OUTPUT, Rpio.LOW);
    Rpio.open(15, Rpio.OUTPUT, Rpio.LOW);
};

//var Exports = module.exports = {};

exports.ActionDrive = {
    driving: 0,
    front: function () {
        // if(driving > 0) stop();

        InitalizePins();
        //Wheel 1
        Rpio.write(11, Rpio.HIGH);
        Rpio.write(13, Rpio.LOW);

        //Wheel 2
        Rpio.write(15, Rpio.LOW);
        Rpio.write(12, Rpio.HIGH);

        //var driving = 1;
    },
    back: function () {
        InitalizePins();
        //Wheel 1
        Rpio.write(11, Rpio.LOW);
        Rpio.write(13, Rpio.HIGH);

        //Wheel 2
        Rpio.write(15, Rpio.HIGH);
        Rpio.write(12, Rpio.LOW);
    },
    left: function () {
        InitalizePins();
        //Wheel 1
        Rpio.write(11, Rpio.LOW);
        Rpio.write(13, Rpio.HIGH);

        //Wheel 2
        Rpio.write(15, Rpio.LOW);
        Rpio.write(12, Rpio.HIGH);
    },
    right: function () {
        InitalizePins();
        //Wheel 1
        Rpio.write(11, Rpio.HIGH);
        Rpio.write(13, Rpio.LOW);

        //Wheel 2
        Rpio.write(15, Rpio.HIGH);
        Rpio.write(12, Rpio.LOW);
    },
    // stop : "dealocateAndClosePins()",
    carWrapperTest: function () {
        console.log("Car api online and loaded ...");
    }
};

exports.ActionDrive.stop = function dealocateAndClosePins() {
    // Close !
    Rpio.write(11, Rpio.LOW);
    Rpio.write(12, Rpio.LOW);
    Rpio.write(13, Rpio.LOW);
    Rpio.write(15, Rpio.LOW);

    Rpio.close(11);
    Rpio.close(12);
    Rpio.close(13);
    Rpio.close(15);

    // driving = 0;
};
