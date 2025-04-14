import os

# ComfyUI服务器设置
COMFY_SERVER_URL = "http://127.0.0.1:8188"
COMFY_WS_URL = "ws://127.0.0.1:8188/ws"

# 项目路径设置
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
WORKFLOW_DIR = os.path.join(BASE_DIR, "workflows")
OUTPUT_DIR = os.path.join(BASE_DIR, "outputs")
TEMP_DIR = os.path.join(BASE_DIR, "temp")

# 确保必要的目录存在
for directory in [WORKFLOW_DIR, OUTPUT_DIR, TEMP_DIR]:
    os.makedirs(directory, exist_ok=True)

# IP-Adapter模型配置
DEFAULT_IP_ADAPTER_MODEL = "ip-adapter_sd15.bin"
DEFAULT_BASE_MODEL = "sd_1_5.safetensors"

# UI设置
UI_TITLE = "StyleWeaver - IP-Adapter 风格继承"
UI_DESCRIPTION = "上传参考图像,将其风格应用到新生成的图像中"
DEFAULT_WIDTH = 512
DEFAULT_HEIGHT = 512
DEFAULT_STEPS = 20
DEFAULT_CFG = 7.0
