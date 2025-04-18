from flask import Flask, request, jsonify, send_file
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

# 临时上传目录
TEMP_DIR = get_absolute_path("temp")
ensure_dir(TEMP_DIR)
# 正式输出目录，前端可通过 /view 接口获取这里的图片
OUTPUT_DIR = get_absolute_path("output")
ensure_dir(OUTPUT_DIR)

def wait_for_image(url, max_attempts=60, delay=2):
    """Wait for image to be available"""
    for attempt in range(max_attempts):
        logger.debug(f"Attempt {attempt + 1}/{max_attempts} to fetch image from {url}")
        try:
            response = requests.get(url)
            if response.status_code == 200 and response.content:
                logger.debug(f"Successfully downloaded image, size: {len(response.content)} bytes")
                return response.content
            elif response.status_code == 200:
                logger.debug("Got 200 response but no content, continuing to wait...")
        except Exception as e:
            logger.error(f"Error fetching image: {str(e)}")
        time.sleep(delay)
    return None

@app.route("/", methods=["HEAD"])
def health_check():
    """Health check endpoint"""
    return jsonify(status="ok"), 200

@app.route("/generate", methods=["POST"])
def generate_image():
    """
    Generate an image using IP-Adapter,
    并保存到 OUTPUT_DIR，返回前端可访问的 /view?filename=... 链接
    """
    temp_image_path = None
    try:
        session_id = str(uuid.uuid4())
        output_name = f"output_{session_id}"
        logger.debug(f"Starting image processing session: {session_id}")

        # 解析输入
        uploaded_file = request.files.get("file")
        prompt = request.form.get("prompt")
        negative_prompt = request.form.get("negative_prompt",
            "worst quality, low quality, text, censored, deformed, bad hand, blurry, watermark")
        weight = float(request.form.get("weight", 0.5))
        steps = int(request.form.get("steps", 28))
        cfg = float(request.form.get("cfg", 7.0))
        width = int(request.form.get("width", 1024))
        height = int(request.form.get("height", 1024))

        if uploaded_file is None or prompt is None:
            return jsonify(error="file and prompt are required"), 400

        # 保存临时参考图
        temp_image_path = os.path.join(TEMP_DIR, f"ref_{session_id}.jpg")
        content = uploaded_file.read()
        img = Image.open(io.BytesIO(content))
        img.save(temp_image_path, "JPEG")
        logger.debug(f"Saved reference image to: {temp_image_path}")

        # 构造生成参数
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

        # 执行生成
        result = gen_image_with_ipadapter(basic_args, ip_args)
        if result is None:
            logger.error("Image generation failed")
            return jsonify(error="Image generation failed"), 500
        
        time.sleep(3)  # 增加初始等待时间，等待生成完成

        # 远程服务上取图
        view_url = f"http://127.0.0.1:8188/view?filename={output_name}_00001_.png"
        logger.debug(f"Waiting for image at: {view_url}")
        image_data = wait_for_image(view_url)
        if not image_data:
            logger.error("Failed to download generated image")
            return jsonify(error="Failed to download generated image"), 500

        # 保存到本地 OUTPUT_DIR，并返回前端可访问的 /view 路径
        local_filename = f"{output_name}.png"
        local_path = os.path.join(OUTPUT_DIR, local_filename)
        with open(local_path, "wb") as f:
            f.write(image_data)
        logger.debug(f"Saved generated image to: {local_path}")

        return jsonify(success=True, image_url=f"/view?filename={local_filename}")

    except Exception as e:
        logger.exception(f"Error during image processing: {str(e)}")
        return jsonify(error=str(e)), 500

    #finally:
        # 清理临时文件
        if temp_image_path and os.path.exists(temp_image_path):
            try:
                time.sleep(1)
                os.remove(temp_image_path)
                logger.debug(f"Cleaned up temporary file: {temp_image_path}")
            except Exception as e:
                logger.error(f"Error cleaning up temp file: {str(e)}")

@app.route("/view", methods=["GET"])
def view_image():
    """
    前端通过 filename 参数获取生成后的图片，
    例如：GET /view?filename=output_<uuid>.png
    """
    filename = request.args.get("filename")
    if not filename:
        return jsonify(error="filename is required"), 400

    # 只允许访问 OUTPUT_DIR 下的文件
    safe_name = os.path.basename(filename)
    file_path = os.path.join(OUTPUT_DIR, safe_name)
    if not os.path.exists(file_path):
        return jsonify(error="image not found"), 404

    return send_file(file_path, mimetype="image/png")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)