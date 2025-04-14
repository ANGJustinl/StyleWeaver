import os
from comfy_script.runtime import *
from dataclasses import dataclass


load("http://127.0.0.1:8188/")
from comfy_script.runtime.nodes import *

@dataclass
class BasicArgs:
    """
    Basic arguments for image generation using Stable Diffusion
    """
    positive_prompt: str
    negative_prompt: str = 'worst quality, low quality, text, censored, deformed, bad hand, blurry, watermark, ugly, extra hands, deformed fingers, extra fingers, extra hand, camera, phone, poor_quality_eyes, watermark, extra_limbs, fused_limbs, bad_anatomy, extra legs, extra arms, bad anatomy,open mouth, teeths,nude naked,breasts,nipples'
    width: int = 1344
    height: int = 768
    cfg: float = 7.0
    steps: int = 28
    scheduler: str = "normal"
    add_noise: bool = True
    noise_seed: float = 0
    sampler_name: str = "dpmpp_sde_gpu"
    batch_size: int = 4
    model_path: str = 'realDream_sdxl5.safetensors'
    output_path: str = 'Test_workflow'

@dataclass
class IPAdapterArgs:
    """
    Arguments for IP-Adapter configuration
    """
    ipadapter_path: str = 'ip-adapter-plus_sdxl_vit-h.safetensors'
    clip_vision_path: str = 'CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors'
    input_image: Image = None
    weight: float = 0.7

@dataclass
class UpscaleArgs:
    """
    Arguments for image upscaling configuration
    """
    upscale_model_path: str = 'RealESRGAN_x4plus.pth'
    hires_fix_value: float = 1.5
    tiled_value: float = 1.5

def gen_image_with_ipadapter(basic_args=None, ip_args=None, upscale_args=None):
    if not basic_args:
        basic_args = BasicArgs()
    if not ip_args:
        ip_args = IPAdapterArgs()

    # Get the current script directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    # Create the absolute path to the input image
    input_image_path = os.path.join(os.path.dirname(script_dir), ip_args.input_image)

    with Workflow():
        if basic_args.noise_seed == 0:
            basic_args.noise_seed = SeedGenerator()
            print(f"Generated seed: {basic_args.noise_seed}")
        # Basic Args setup
        sampler = basic_args.sampler_name
        float2 = ImpactFloat(basic_args.cfg)
        steps_int = ImpactInt(basic_args.steps)
        batch_int = IntLiteral(basic_args.batch_size)

        # Load all models first
        ipadapter = IPAdapterModelLoader(ip_args.ipadapter_path)
        clip_vision = CLIPVisionLoader(ip_args.clip_vision_path)
        model, clip, vae, _ = CheckpointLoaderPysssss(basic_args.model_path, '[none]')
        clip = CLIPSetLastLayer(clip, -2)

        # Basic pipe
        conditioning = CLIPTextEncode(basic_args.positive_prompt, clip)
        conditioning2 = CLIPTextEncode(basic_args.negative_prompt, clip)

        ipa_input_image, _ = LoadImage(input_image_path)
        model2 = IPAdapterAdvanced(model, ipadapter, ipa_input_image, ip_args.weight, 'linear', 'concat', 0, 1, 'V only', None, None, clip_vision)

        basic_pipe = ToBasicPipe(model2, clip, vae, conditioning, conditioning2)

        # KSampler
        latent = EmptyLatentImage(basic_args.width, basic_args.height, batch_int)
        _, latent, _ = ImpactKSamplerAdvancedBasicPipe(basic_pipe, basic_args.add_noise, basic_args.noise_seed, steps_int, float2, sampler, basic_args.scheduler, latent, 0, 10000, False, None)

        image2 = VAEDecode(latent, vae)
        image2 = ImageBatchToList(image2)

        if upscale_args:
            # Upscale process
            float3 = ImpactFloat(upscale_args.hires_fix_value)
            tiled_float = ImpactFloat(upscale_args.tiled_value)
            upscale_model = UpscaleModelLoader(upscale_args.upscale_model_path)

            int2, _ = MathExpressionPysssss('a / 2 ', steps_int, None, None)
            image2, _ = CRUpscaleImage(image2, upscale_args.upscale_model_path, 'rescale', float3, 1024, 'lanczos', 'true', 8)
            int4, _ = MathExpressionPysssss('a * b', float3, tiled_float, None)
            int5, _ = MathExpressionPysssss('a.width * b / c', image2, tiled_float, int4)
            int6, _ = MathExpressionPysssss('a.height * b / c', image2, tiled_float, int4)

            final_image = UltimateSDUpscale(image2, model2, basic_args.positive_prompt, basic_args.negative_prompt, vae, tiled_float, basic_args.noise_seed, int2, float2, sampler, basic_args.scheduler, 0.3, upscale_model, 'Linear', int5, int6, 8, 32, 'None', 0.3, 64, 8, 16, False, False)
            SaveImage(final_image, basic_args.output_path)
            return PreviewImage(final_image).wait()
        
        SaveImage(image2, basic_args.output_path)
        print(PreviewImage(image2).wait())
        return PreviewImage(image2).wait()

if __name__ == "__main__":
    # Example usage
    basic_args = BasicArgs(
        positive_prompt="A beautiful landscape with mountains and a river",
        width=1024,
        height=1024,
        cfg=7.0,
        steps=28,
        scheduler="normal",
        add_noise=True,
        sampler_name="dpmpp_sde_gpu",
        batch_size=1,
    )
   
    ip_args = IPAdapterArgs(
        input_image="microsoft365_vision.jpg",
        weight=0.5,
    )
    gen_image_with_ipadapter(basic_args, ip_args)