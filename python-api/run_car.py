from flask import Flask, jsonify
import RPi.GPIO as GPIO
import pigpio
import time

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
pi = pigpio.pi()
CENTER_PULSE = 1500  # Center position
LEFT_LIMIT = 1000    # Maximum left
RIGHT_LIMIT = 2000   # Maximum right
INCREMENT = 100       # 10-degree increment (adjust as needed)
current_pulse = CENTER_PULSE  # Store the current position

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
    GPIO.output(TRIG, True)
    time.sleep(0.00001)  # Send 10µs pulse
    GPIO.output(TRIG, False)

    pulse_start = time.time()
    pulse_end = time.time()

    while GPIO.input(ECHO) == 0:
        pulse_start = time.time()

    while GPIO.input(ECHO) == 1:
        pulse_end = time.time()

    pulse_duration = pulse_end - pulse_start
    distance_mm = (pulse_duration * 17150) * 10  # Convert to mm

    return round(distance_mm, 2)

def sensor_left():
    """Move the servo 10 degrees left (incrementally)."""
    global current_pulse
    if current_pulse - INCREMENT >= LEFT_LIMIT:
        current_pulse -= INCREMENT
    pi.set_servo_pulsewidth(SERVO_PIN, current_pulse)
    return f"Servo moved left to {current_pulse}", 200

def sensor_right():
    """Move the servo 10 degrees right (incrementally)."""
    global current_pulse
    if current_pulse + INCREMENT <= RIGHT_LIMIT:
        current_pulse += INCREMENT
    pi.set_servo_pulsewidth(SERVO_PIN, current_pulse)
    return f"Servo moved right to {current_pulse}", 200

def sensor_center():
    """Move the servo back to center position."""
    global current_pulse
    current_pulse = CENTER_PULSE
    pi.set_servo_pulsewidth(SERVO_PIN, current_pulse)
    return "Servo centered", 200

def read_ir_sensors():
    """Read IR sensor states"""
    left_state = GPIO.input(IR_SENSOR_LEFT)
    right_state = GPIO.input(IR_SENSOR_RIGHT)
    return {"left": left_state, "right": right_state}

@app.route('/api/sonar', methods=['GET'])
def handle_sonar():
    """Handle sonar API request and return distance in mm."""
    distance = measure_distance()
    return jsonify({"distance_mm": distance}), 200

@app.route('/api/irsensors', methods=['GET'])
def handle_ir_sensors():
    """API to return IR sensor readings"""
    return jsonify(read_ir_sensors()), 200

@app.route('/forward', methods=['GET'])
def handle_forward():
    forward()
    return "Moving forward", 200

@app.route('/reverse', methods=['GET'])
def handle_reverse():
    reverse()
    return "Moving backward", 200

@app.route('/left', methods=['GET'])
def handle_left():
    turn_left()
    return "Turning left", 200

@app.route('/right', methods=['GET'])
def handle_right():
    turn_right()
    return "Turning right", 200

@app.route('/stop', methods=['GET'])
def handle_stop():
    stop()
    return "Stopped", 200

@app.route('/sensorleft', methods=['GET'])
def handle_sensor_left():
    return sensor_left()

@app.route('/sensorright', methods=['GET'])
def handle_sensor_right():
    return sensor_right()

@app.route('/sensorcenter', methods=['GET'])
def handle_sensor_center():
    return sensor_center()

if __name__ == "__main__":
    try:
        print("Starting Flask server. Use endpoints /api/sonar, /api/irsensors, /forward, /reverse, /left, /right, /stop, /sensorleft, /sensorright, /sensorcenter")
        app.run(host="0.0.0.0", port=5000)
    finally:
        GPIO.cleanup()
        pi.set_servo_pulsewidth(SERVO_PIN, 0)  # Turn off servo
        pi.stop()
        print("GPIO cleaned up. Goodbye!")
