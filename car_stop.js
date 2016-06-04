var rpio = require('rpio');
var consloe = require('console');

/* Configure P11 as an output pin, setting its initial state to low */
rpio.open(11, rpio.OUTPUT, rpio.LOW);
rpio.open(12, rpio.OUTPUT, rpio.LOW);
rpio.open(13, rpio.OUTPUT, rpio.LOW);
rpio.open(15, rpio.OUTPUT, rpio.LOW);

var oDrive = {
    stop : function(){
        // Close !
        rpio.write(11, rpio.LOW);
        rpio.write(12, rpio.LOW);
        rpio.write(13, rpio.LOW);
        rpio.write(15, rpio.LOW);

        rpio.close(11);
        rpio.close(12);
        rpio.close(13);
        rpio.close(15);
    }
};

oDrive.stop();
