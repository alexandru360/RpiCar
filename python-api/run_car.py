import RPi.GPIO as GPIO
import pigpio
import time
import cv2
from flask import Flask, jsonify, Response
import atexit
import signal
import sys
# from camera_utils import video_stream


# GPIO pins for L298N motor driver
IN1 = 23  # IN1 connected to GPIO 23
IN2 = 24  # IN2 connected to GPIO 24
IN3 = 25  # IN3 connected to GPIO 25
IN4 = 12  # IN4 connected to GPIO 12

# Servo motor on GPIO18 (Pin 12)
SERVO_PIN = 18  # PWM Pin for SG90 servo

# Sonar sensor pins
TRIG = 16  # GPIO pin for trigger
ECHO = 20  # GPIO pin for echo

# IR Sensor Pins
IR_SENSOR_LEFT = 19   # GPIO19 (Physical Pin 35)
IR_SENSOR_RIGHT = 13  # GPIO13 (Physical Pin 33)

# Setup GPIO
GPIO.setwarnings(False)
GPIO.setmode(GPIO.BCM)
GPIO.setup(IN1, GPIO.OUT)
GPIO.setup(IN2, GPIO.OUT)
GPIO.setup(IN3, GPIO.OUT)
GPIO.setup(IN4, GPIO.OUT)
GPIO.setup(TRIG, GPIO.OUT)
GPIO.setup(ECHO, GPIO.IN)
GPIO.setup(IR_SENSOR_LEFT, GPIO.IN)
GPIO.setup(IR_SENSOR_RIGHT, GPIO.IN)

# Initialize Flask app
app = Flask(__name__)

# Initialize pigpio for servo control
try:
    pi = pigpio.pi()
    # pigpio.pi() may return an object even when it failed to connect
    # (its internal socket may be None). Check the `connected` attribute
    # and treat a non-connected instance as unavailable.
    if not getattr(pi, "connected", 0):
        print("%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%")
        print("Can't connect to pigpio at localhost(8888)")
        print("Did you start the pigpio daemon? E.g. sudo pigpiod")
        print("Did you specify the correct Pi host/port in the environment")
        print("variables PIGPIO_ADDR/PIGPIO_PORT?")
        print("E.g. export PIGPIO_ADDR=soft, export PIGPIO_PORT=8888")
        print("Did you specify the correct Pi host/port in the")
        print("pigpio.pi() function? E.g. pigpio.pi('soft', 8888)")
        print("%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%")
        try:
            # try to stop/cleanup the returned object if it exposes stop
            pi.stop()
        except Exception:
            pass
        pi = None
except Exception:
    pi = None
CENTER_PULSE = 1500  # Center position
LEFT_LIMIT = 1000    # Maximum left
RIGHT_LIMIT = 2000   # Maximum right
INCREMENT = 100       # 10-degree increment (adjust as needed)
current_pulse = CENTER_PULSE  # Store the current position
# Sonar cache + retry settings
LAST_DISTANCE = None
LAST_DISTANCE_TIME = 0
CACHE_MAX_AGE = 5.0  # seconds to consider last value fresh
RETRY_COUNT = 3
RETRY_DELAY = 0.05  # seconds between retries

if pi:
    pi.set_servo_pulsewidth(SERVO_PIN, current_pulse)  # Start at center

def stop():
    """Stop all motors."""
    GPIO.output(IN1, GPIO.LOW)
    GPIO.output(IN2, GPIO.LOW)
    GPIO.output(IN3, GPIO.LOW)
    GPIO.output(IN4, GPIO.LOW)

def forward():
    """Move forward."""
    GPIO.output(IN1, GPIO.HIGH)
    GPIO.output(IN2, GPIO.LOW)
    GPIO.output(IN3, GPIO.HIGH)
    GPIO.output(IN4, GPIO.LOW)

def reverse():
    """Move backward."""
    GPIO.output(IN1, GPIO.LOW)
    GPIO.output(IN2, GPIO.HIGH)
    GPIO.output(IN3, GPIO.LOW)
    GPIO.output(IN4, GPIO.HIGH)

def turn_left():
    """Turn left."""
    GPIO.output(IN1, GPIO.LOW)
    GPIO.output(IN2, GPIO.HIGH)
    GPIO.output(IN3, GPIO.HIGH)
    GPIO.output(IN4, GPIO.LOW)

def turn_right():
    """Turn right."""
    GPIO.output(IN1, GPIO.HIGH)
    GPIO.output(IN2, GPIO.LOW)
    GPIO.output(IN3, GPIO.LOW)
    GPIO.output(IN4, GPIO.HIGH)

def measure_distance():
    """Measure distance using HC-SR04 sonar sensor and return distance in mm."""
    try:
        # Ensure trigger is low, send a short pulse, then measure echo with timeouts
        GPIO.output(TRIG, False)
        time.sleep(0.00005)
        GPIO.output(TRIG, True)
        time.sleep(0.00001)  # Send 10µs pulse
        GPIO.output(TRIG, False)

        timeout = 0.02  # 20ms max wait for edge (adjust if needed)

        pulse_start = time.time()
        start_wait = time.time()
        while GPIO.input(ECHO) == 0:
            pulse_start = time.time()
            if time.time() - start_wait > timeout:
                raise TimeoutError("Echo start timeout")

        pulse_end = time.time()
        start_wait = time.time()
        while GPIO.input(ECHO) == 1:
            pulse_end = time.time()
            if time.time() - start_wait > timeout:
                raise TimeoutError("Echo end timeout")

        pulse_duration = pulse_end - pulse_start
        distance_mm = (pulse_duration * 17150) * 10  # Convert to mm
        return round(distance_mm, 2)
    except TimeoutError as e:
        print(f"measure_distance: timeout: {e}")
        return None
    except RuntimeError as e:
        print(f"measure_distance: runtime error: {e}")
        return None
    except Exception as e:
        print(f"measure_distance: unexpected error: {e}")
        return None

def sensor_left():
    """Move the servo 10 degrees left (incrementally)."""
    global current_pulse
    if current_pulse - INCREMENT >= LEFT_LIMIT:
        current_pulse -= INCREMENT
    if pi:
        pi.set_servo_pulsewidth(SERVO_PIN, current_pulse)
    return f"Servo moved left to {current_pulse}", 200

def sensor_right():
    """Move the servo 10 degrees right (incrementally)."""
    global current_pulse
    if current_pulse + INCREMENT <= RIGHT_LIMIT:
        current_pulse += INCREMENT
    if pi:
        pi.set_servo_pulsewidth(SERVO_PIN, current_pulse)
    return f"Servo moved right to {current_pulse}", 200

def sensor_center():
    """Move the servo back to center position."""
    global current_pulse
    current_pulse = CENTER_PULSE
    if pi:
        pi.set_servo_pulsewidth(SERVO_PIN, current_pulse)
    return "Servo centered", 200


def _cleanup():
    try:
        stop()
    except Exception:
        pass
    try:
        GPIO.cleanup()
    except Exception:
        pass
    try:
        if pi:
            pi.set_servo_pulsewidth(SERVO_PIN, 0)
            pi.stop()
    except Exception:
        pass


def _handle_signal(signum, frame):
    _cleanup()
    sys.exit(0)


# register cleanup handlers
atexit.register(_cleanup)
signal.signal(signal.SIGTERM, _handle_signal)
signal.signal(signal.SIGINT, _handle_signal)

def read_ir_sensors():
    """Read IR sensor states"""
    left_state = GPIO.input(IR_SENSOR_LEFT)
    right_state = GPIO.input(IR_SENSOR_RIGHT)
    return {"left": left_state, "right": right_state}

@app.route('/sonar', methods=['GET'])
@app.route('/api/sonar', methods=['GET'])
def handle_sonar():
    """Handle sonar API request and return distance in mm."""
    global LAST_DISTANCE, LAST_DISTANCE_TIME
    # Try a small number of retries before giving up
    distance = None
    for attempt in range(RETRY_COUNT):
        distance = measure_distance()
        if distance is not None:
            break
        time.sleep(RETRY_DELAY)

    if distance is not None:
        LAST_DISTANCE = distance
        LAST_DISTANCE_TIME = time.time()
        return jsonify({"distance_mm": distance}), 200

    # No fresh reading — return last known value if it's recent
    if LAST_DISTANCE is not None and (time.time() - LAST_DISTANCE_TIME) <= CACHE_MAX_AGE:
        return jsonify({"distance_mm": LAST_DISTANCE, "cached": True}), 200

    return jsonify({"distance_mm": None, "error": "no reading"}), 504

@app.route('/irsensors', methods=['GET'])
@app.route('/api/irsensors', methods=['GET'])
def handle_ir_sensors():
    """API to return IR sensor readings"""
    return jsonify(read_ir_sensors()), 200

@app.route('/forward', methods=['GET'])
@app.route('/api/forward', methods=['GET'])
def handle_forward():
    forward()
    return "Moving forward", 200

@app.route('/reverse', methods=['GET'])
@app.route('/api/reverse', methods=['GET'])
def handle_reverse():
    reverse()
    return "Moving backward", 200

@app.route('/left', methods=['GET'])
@app.route('/api/left', methods=['GET'])
def handle_left():
    turn_left()
    return "Turning left", 200

@app.route('/right', methods=['GET'])
@app.route('/api/right', methods=['GET'])
def handle_right():
    turn_right()
    return "Turning right", 200

@app.route('/stop', methods=['GET'])
@app.route('/api/stop', methods=['GET'])
def handle_stop():
    stop()
    return "Stopped", 200

@app.route('/sensorleft', methods=['GET'])
@app.route('/api/sensorleft', methods=['GET'])
def handle_sensor_left():
    return sensor_left()

@app.route('/sensorright', methods=['GET'])
@app.route('/api/sensorright', methods=['GET'])
def handle_sensor_right():
    return sensor_right()

@app.route('/sensorcenter', methods=['GET'])
@app.route('/api/sensorcenter', methods=['GET'])
def handle_sensor_center():
    return sensor_center()

@app.route('/video-stream')
@app.route('/api/video-stream')
def video_stream():
    """Flask route to stream video from USB OTG camera."""
    # return Response(video_stream(), mimetype='multipart/x-mixed-replace; boundary=frame')
    return Response("Streaming video.")

if __name__ == "__main__":
    try:
        print("Starting Flask server. Use endpoints /api/sonar, /api/irsensors, /forward, /reverse, /left, /right, /stop, /sensorleft, /sensorright, /sensorcenter")
        app.run(host="0.0.0.0", port=5000)
    finally:
        try:
            GPIO.cleanup()
        except Exception:
            pass
        # Only call pigpio methods if we successfully connected earlier
        try:
            if pi:
                try:
                    pi.set_servo_pulsewidth(SERVO_PIN, 0)  # Turn off servo
                except Exception:
                    pass
                try:
                    pi.stop()
                except Exception:
                    pass
        except Exception:
            pass
        print("GPIO cleaned up. Goodbye!")
