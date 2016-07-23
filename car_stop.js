var Rpio = require('rpio');
var Consloe = require('console');

/* Configure P11 as an output pin, setting its initial state to low */
Rpio.open(11, Rpio.OUTPUT, Rpio.LOW);
Rpio.open(12, Rpio.OUTPUT, Rpio.LOW);
Rpio.open(13, Rpio.OUTPUT, Rpio.LOW);
Rpio.open(15, Rpio.OUTPUT, Rpio.LOW);

var ODrive = {
    stop: function () {
        // Close !
        Rpio.write(11, Rpio.LOW);
        Rpio.write(12, Rpio.LOW);
        Rpio.write(13, Rpio.LOW);
        Rpio.write(15, Rpio.LOW);

        Rpio.close(11);
        Rpio.close(12);
        Rpio.close(13);
        Rpio.close(15);
    }
};

ODrive.stop();
