from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
import uuid
import os
from PIL import Image
import requests
import io
import time

from workflows.script_ipadapter import BasicArgs, IPAdapterArgs, gen_image_with_ipadapter

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

def ensure_dir(path):
    """Ensure directory exists"""
    if not os.path.exists(path):
        os.makedirs(path)

def get_absolute_path(relative_path):
    """Get absolute path from relative path"""
    return os.path.abspath(os.path.join(os.path.dirname(__file__), relative_path))

def wait_for_image(url, max_attempts=30, delay=1):
    """Wait for image to be available"""
    for attempt in range(max_attempts):
        try:
            response = requests.get(url)
            if response.status_code == 200:
                return response.content
        except:
            pass
        time.sleep(delay)
    return None

@app.route("/", methods=["HEAD"])
def health_check():
    """
    Health check endpoint
    """
    return jsonify(status="ok"), 200

@app.route("/generate", methods=["POST"])
def generate_image():
    """
    Generate an image using IP-Adapter
    """
    temp_image_path = None
    try:
        # Generate unique identifier for this request
        session_id = str(uuid.uuid4())
        output_name = f"output_{session_id}"
        logger.debug(f"Starting image processing session: {session_id}")

        # Ensure temp directory exists
        temp_dir = get_absolute_path("temp")
        ensure_dir(temp_dir)

        # Parse inputs
        uploaded_file = request.files.get("file")
        prompt = request.form.get("prompt")
        negative_prompt = request.form.get("negative_prompt", "worst quality, low quality, text, censored, deformed, bad hand, blurry, watermark")
        weight = float(request.form.get("weight", 0.5))
        steps = int(request.form.get("steps", 28))
        cfg = float(request.form.get("cfg", 7.0))
        width = int(request.form.get("width", 1024))
        height = int(request.form.get("height", 1024))

        if uploaded_file is None or prompt is None:
            return jsonify(error="file and prompt are required"), 400

        # Save the uploaded file
        temp_image_path = os.path.join(temp_dir, f"ref_{session_id}.jpg")
        content = uploaded_file.read()
        img = Image.open(io.BytesIO(content))
        img.save(temp_image_path, "JPEG")
        logger.debug(f"Saved reference image to: {temp_image_path}")

        # Create args
        basic_args = BasicArgs(
            positive_prompt=prompt,
            negative_prompt=negative_prompt,
            width=width,
            height=height,
            cfg=cfg,
            steps=steps,
            batch_size=1,
            output_path=output_name
        )

        ip_args = IPAdapterArgs(
            input_image=temp_image_path,
            weight=weight
        )

        logger.debug(f"Starting generation with:\nPrompt: {prompt}\nWeight: {weight}\nSteps: {steps}")

        # Generate image
        result = gen_image_with_ipadapter(basic_args, ip_args)

        if result is None:
            logger.error("Image generation failed")
            return jsonify(error="Image generation failed"), 500

        # Wait for the image to be available
        view_url = f"http://127.0.0.1:8188/view?filename={output_name}_00001_.png"
        logger.debug(f"Waiting for image at: {view_url}")

        image_data = wait_for_image(view_url)
        if image_data:
            return jsonify(success=True, image_url=view_url)

        logger.error("Failed to download generated image")
        return jsonify(error="Failed to download generated image"), 500

    except Exception as e:
        logger.exception(f"Error during image processing: {str(e)}")
        return jsonify(error=str(e)), 500

    finally:
        # Clean up temp file with delay
        if temp_image_path and os.path.exists(temp_image_path):
            try:
                time.sleep(1)  # Wait for file operations to complete
                os.remove(temp_image_path)
                logger.debug(f"Cleaned up temporary file: {temp_image_path}")
            except Exception as e:
                logger.error(f"Error cleaning up temp file: {str(e)}")

if __name__ == "__main__":
    ensure_dir(get_absolute_path("temp"))
    app.run(host="127.0.0.1", port=8000, debug=True)
