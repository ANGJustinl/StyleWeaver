# StyleWeaver 项目设计与开发文档

## 1. 项目概述

### 1.1 项目简介
StyleWeaver 是一个基于 ComfyUI 和 IP-Adapter 模型的图像风格迁移工具。该项目允许用户上传参考图像，并将其视觉风格应用于文本提示生成的新图像中，实现高质量的风格迁移效果。项目使用 [ComfyScript](https://github.com/Chaoses-Ib/ComfyScript) 控制 ComfyUI 工作流运行。

### 1.2 项目目标
- 提供简洁易用的图像风格迁移功能
- 支持高度可定制的参数调整
- 确保生成图像的质量和效率
- 实现友好的用户界面体验

## 2. 系统架构

### 2.1 整体架构
StyleWeaver 采用前后端分离的设计模式：
- 前端：使用 Gradio 构建的交互式界面
- 后端：基于 Python 的图像处理逻辑和 ComfyUI 工作流
- 核心：IP-Adapter 风格迁移模型和 Stable Diffusion 图像生成

### 2.2 核心组件
1. **用户界面层**：Gradio 界面提供参数调整和图像上传功能
2. **业务逻辑层**：处理图像和参数，调用 ComfyScript 执行工作流
3. **模型层**：包含 IP-Adapter 和 Stable Diffusion 模型
4. **工作流层**：ComfyUI 工作流定义和执行

### 2.3 文件结构
```
StyleWeaver/
├── ui.py                  # Gradio 界面和请求处理
├── workflows/             # 工作流定义目录
│   └── script_ipadapter.py # IP-Adapter 工作流脚本
├── temp/                  # 临时文件存储目录
└── models/                # 模型文件（未显式包含但必要）
```

## 3. 功能描述

### 3.1 主要功能
- **参考图像上传**：用户可以上传参考图像作为风格来源
- **文本提示输入**：通过正面和负面提示词引导图像生成
- **参数调整**：调整 IP-Adapter 权重、步数、CFG 缩放等参数
- **图像生成**：结合参考图像风格和文本提示生成新图像
- **图像下载**：用户可以下载生成的图像

### 3.2 参数配置
- **正面提示词**：描述希望生成的内容
- **负面提示词**：描述希望避免的内容
- **IP-Adapter 权重**：控制风格迁移的强度（0-1）
- **步数**：影响生成质量和时间（1-50）
- **CFG 缩放**：控制对提示词的遵循程度（1-20）
- **图像尺寸**：控制输出图像的宽度和高度（512-2048）

## 4. 技术实现

### 4.1 数据流程
1. 用户提交参考图像和参数
2. 系统保存参考图像到临时目录
3. 创建 BasicArgs 和 IPAdapterArgs 实例
4. 调用 gen_image_with_ipadapter 函数
5. ComfyScript 构建并执行工作流
6. 生成的图像通过 HTTP 获取并显示在界面上

### 4.2 核心工作流
IP-Adapter 工作流包括以下步骤：
1. 加载模型：IP-Adapter、CLIP Vision、Checkpoint
2. 处理参考图像
3. 设置提示词条件
4. 使用 KSampler 生成潜空间
5. 解码生成图像
6. （可选）图像放大处理
7. 保存并返回结果

### 4.3 异常处理
- 文件操作异常处理
- 图像生成失败的错误处理
- 网络请求超时处理

## 5. 部署指南

### 5.1 环境要求
- Python 3.8+ 环境
- ComfyUI 实例（本地或远程）
- ComfyScript 库
- 必要的模型文件：
  - Stable Diffusion 模型（如 realDream_sdxl5.safetensors）
  - IP-Adapter 模型（ip-adapter-plus_sdxl_vit-h.safetensors）
  - CLIP Vision 模型（CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors）

### 5.2 安装步骤
1. 安装 ComfyUI：遵循 ComfyUI 官方文档
2. 安装 ComfyScript：`pip install comfyscript`
3. 安装依赖库：`pip install gradio pillow requests`
4. 下载必要的模型文件并放置在正确位置
5. 运行 ComfyUI 服务器：`python main.py --listen`
6. 启动 StyleWeaver：`python ui.py`

### 5.3 配置说明
- 确保 ComfyUI 服务器运行在 http://127.0.0.1:8188
- 确保模型路径正确设置
- 创建 temp 目录用于临时文件存储

## 6. 使用指南

### 6.1 基本使用流程
1. 上传参考风格图像
2. 输入描述目标内容的正面提示词
3. （可选）调整负面提示词避免不需要的元素
4. 调整 IP-Adapter 权重、步数等参数
5. 点击"提交"按钮
6. 等待生成结果
7. 下载或继续调整参数重新生成

### 6.2 参数调优建议
- IP-Adapter 权重：0.5-0.7 通常是风格和内容平衡的良好范围
- 步数：20-30 步通常足够获得高质量结果
- CFG 缩放：7-8 是大多数场景的推荐值
- 分辨率：推荐先在较低分辨率（1024×1024）测试效果

## 7. 开发者指南

### 7.1 代码结构
- **ui.py**：处理用户界面和请求
  - `ensure_dir`：确保目录存在
  - `get_absolute_path`：获取绝对路径
  - `wait_for_image`：等待图像生成完成
  - `process_image`：处理图像和调用工作流

- **script_ipadapter.py**：定义 IP-Adapter 工作流
  - `BasicArgs`：基本参数数据类
  - `IPAdapterArgs`：IP-Adapter 参数数据类
  - `UpscaleArgs`：放大参数数据类
  - `gen_image_with_ipadapter`：生成图像的主函数

### 7.2 扩展指南
要添加新功能，可以考虑：
1. **支持更多模型**：修改 `script_ipadapter.py` 添加新模型选项
2. **添加后处理功能**：在 `gen_image_with_ipadapter` 中增加后处理步骤
3. **增强用户界面**：在 `ui.py` 中添加更多 Gradio 组件

### 7.3 测试方法
- 单独测试工作流：运行 `python workflows/script_ipadapter.py`
- 测试用户界面：运行 `python ui.py` 并通过浏览器访问

## 8. 未来展望

### 8.1 功能增强
- 批量处理多张参考图像
- 增加更多预设风格模板
- 支持图像分割和区域风格迁移
- 添加历史记录和收藏功能

### 8.2 性能优化
- 实现图像缓存机制
- 添加队列管理优化多用户场景
- GPU 内存优化

### 8.3 界面改进
- 移动端友好的响应式设计
- 拖放式工作流编辑器
- 实时预览功能

## 9. 附录

### 9.1 常见问题解答
- **Q: 生成图像失败怎么办？**
  A: 检查 ComfyUI 服务器是否正常运行，并查看日志获取详细错误信息

- **Q: 如何获得更好的风格迁移效果？**
  A: 尝试调整 IP-Adapter 权重，并使用更具描述性的提示词

### 9.2 参考资源
- [ComfyUI 官方文档](https://github.com/comfyanonymous/ComfyUI)
- [ComfyScript 项目](https://github.com/Chaoses-Ib/ComfyScript)
- [IP-Adapter 研究论文](https://arxiv.org/abs/2308.06721)

### 9.3 模型与许可
- 请确保使用的模型符合相应的许可协议
- 注意生成内容的合法合规性
