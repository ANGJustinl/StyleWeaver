import os
import gradio as gr
from workflows.script_ipadapter import BasicArgs, IPAdapterArgs, gen_image_with_ipadapter
import logging
import uuid
from PIL import Image
import requests
import io
import time

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

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

def process_image(ref_image, prompt, negative_prompt, weight, steps, cfg, width, height):
    """
    Process the image with IP-Adapter
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
        
        # Save the temporary reference image
        temp_image_path = os.path.join(temp_dir, f"ref_{session_id}.jpg")
        ref_image.save(temp_image_path, "JPEG")
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
            return None
            
        # Wait for the image to be available
        view_url = f"http://127.0.0.1:8188/view?filename={output_name}_00001_.png"
        logger.debug(f"Waiting for image at: {view_url}")
        
        image_data = wait_for_image(view_url)
        if image_data:
            img = Image.open(io.BytesIO(image_data))
            logger.debug("Successfully loaded generated image")
            return img
            
        logger.error("Failed to download generated image")
        return None
        
    except Exception as e:
        logger.exception(f"Error during image processing: {str(e)}")
        return None
    finally:
        # Clean up temp file with delay
        if temp_image_path and os.path.exists(temp_image_path):
            try:
                time.sleep(1)  # Wait for file operations to complete
                os.remove(temp_image_path)
                logger.debug(f"Cleaned up temporary file: {temp_image_path}")
            except Exception as e:
                logger.error(f"Error cleaning up temp file: {str(e)}")

# Create the interface
demo = gr.Interface(
    fn=process_image,
    inputs=[
        gr.Image(type="pil", label="参考图像"),
        gr.Textbox(label="正向提示词 Positive Prompt", value="mountain, river, landscape, masterpiece, best quality"),
        gr.Textbox(label="负向提示词 Negative Prompt", value="human, worst quality, low quality, text, censored, deformed, bad hand, blurry, watermark"),
        gr.Slider(minimum=0, maximum=1.0, value=0.5, step=0.05, label="IP-Adapter 权重"),
        gr.Slider(minimum=1, maximum=50, value=28, step=1, label="步数"),
        gr.Slider(minimum=1, maximum=20, value=7, step=0.5, label="CFG 缩放"),
        gr.Slider(minimum=512, maximum=2048, value=1024, step=64, label="宽度"),
        gr.Slider(minimum=512, maximum=2048, value=1024, step=64, label="高度")
    ],
    outputs=gr.Image(label="生成的图像"),
    title="StyleWeaver --风格迁移",
    description="上传一张参考图像并输入提示词，生成具有相似风格的新图像。",
    flagging_mode=None,
    cache_examples=False
)

if __name__ == "__main__":
    demo.queue(max_size=1).launch(show_error=True)
