import os
import gradio as gr
import logging
import requests
from PIL import Image
import io

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

API_URL = "http://127.0.0.1:8000/generate"

def process_image(ref_image, prompt, negative_prompt, weight, steps, cfg, width, height):
    """
    Process the image through FastAPI backend
    """
    try:
        # Save reference image to bytes
        img_byte_arr = io.BytesIO()
        ref_image.save(img_byte_arr, format='JPEG')
        img_byte_arr.seek(0)
        
        # Prepare the files and form data
        files = {
            'file': ('image.jpg', img_byte_arr, 'image/jpeg')
        }
        
        data = {
            'prompt': prompt,
            'negative_prompt': negative_prompt,
            'weight': str(weight),  # Convert to string for form data
            'steps': str(steps),
            'cfg': str(cfg),
            'width': str(width),
            'height': str(height)
        }
        
        # Make request to FastAPI backend
        response = requests.post(API_URL, files=files, data=data)
        response.raise_for_status()
        
        result = response.json()
        if result.get('success'):
            # Get image from the URL
            img_response = requests.get(result['image_url'])
            img_response.raise_for_status()
            return Image.open(io.BytesIO(img_response.content))
        else:
            logger.error("Image generation failed")
            return None
            
    except Exception as e:
        logger.exception(f"Error during image processing: {str(e)}")
        return None

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
