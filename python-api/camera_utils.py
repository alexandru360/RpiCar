import cv2  # OpenCV library


# Any OpenCV-related initialization can go here
def video_stream():
    # Migrate the `video_stream` logic from `run_car.py`
    try:
        camera = cv2.VideoCapture(0)
        while True:
            success, frame = camera.read()
            if not success:
                break
            _, encoded_frame = cv2.imencode('.jpg', frame)
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + encoded_frame.tobytes() + b'\r\n')
    except KeyboardInterrupt:
        print("Video stream interrupted.")
    finally:
        camera.release()
