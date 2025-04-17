# StyleWeaver API Documentation

## Base URL
```
http://127.0.0.1:8000
```

## POST /generate

Generate an image using IP‑Adapter and ComfyUI workflow.

### Request

- **Endpoint**: `/generate`
- **Method**: POST
- **Content-Type**: `multipart/form-data`

#### Form Fields

| Field           | Type    | Description                                                                                                   |
|-----------------|---------|---------------------------------------------------------------------------------------------------------------|
| `file`          | File    | Reference image file (JPEG/PNG).                                                                              |
| `prompt`        | String  | Positive prompt describing desired content (required).                                                        |
| `negative_prompt` | String  | Negative prompt to avoid undesired elements (default: `"worst quality, low quality, text, censored, deformed, bad hand, blurry, watermark"`). |
| `weight`        | Float   | IP‑Adapter style weight, between 0 and 1 (default: `0.5`).                                                     |
| `steps`         | Integer | Number of sampling steps (default: `28`).                                                                     |
| `cfg`           | Float   | Classifier-free guidance scale (default: `7.0`).                                                              |
| `width`         | Integer | Output image width in pixels (default: `1024`).                                                               |
| `height`        | Integer | Output image height in pixels (default: `1024`).                                                              |

### Responses

#### 200 OK
```json
{
  "success": true,
  "image_url": "http://127.0.0.1:8188/view?filename=output_<session>_00001_.png"
}
```

#### 400 Bad Request
```json
{
  "error": "file and prompt are required"
}
```

#### 500 Internal Server Error
```json
{
  "error": "Image generation failed"
}
```

### Example cURL

```bash
curl -X POST http://127.0.0.1:8000/generate \
  -F "file=@./reference.jpg" \
  -F "prompt=An oil painting of a sunset over the mountains" \
  -F "negative_prompt=low quality, text" \
  -F "weight=0.6" \
  -F "steps=30" \
  -F "cfg=7.5" \
  -F "width=1024" \
  -F "height=1024"
```

### Python Example

```python
import requests

url = "http://127.0.0.1:8000/generate"
files = {"file": open("reference.jpg", "rb")}
data = {
    "prompt": "A fantasy landscape with castles",
    "negative_prompt": "blurry, text",
    "weight": 0.5,
    "steps": 28,
    "cfg": 7.0,
    "width": 1024,
    "height": 1024
}

resp = requests.post(url, files=files, data=data)
print(resp.json())