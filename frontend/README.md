# StyleWeaver Frontend

## 介绍
StyleWeaver 前端是一款基于 Next.js 和 Tailwind CSS 的风格化图像生成界面，提供直观易用的参数面板与实时预览功能。

## 先决条件
- Node.js >= 16
- pnpm
- 后端服务已启动并可通过 HTTP 访问，默认地址为 `http://127.0.0.1:8000`

## 安装依赖
```bash
npm install -g pnpm
pnpm install
```

## 本地开发
```bash
pnpm dev
```
访问 http://localhost:3000 查看应用

## API 配置
打开界面右上角的 **API 设置**，输入后端服务地址并保存。  
默认生成端点：`http://127.0.0.1:8000/generate`

## 功能说明
- 上传参考图像（支持 JPG/PNG）
- 输入正面/负面提示词
- 调整生成参数：权重、步数、CFG、分辨率
- 生成并下载结果图像
- 查看 API 连接状态和日志

## 项目结构
```
├─ app/         应用入口和页面
├─ components/  可复用 UI 组件
├─ hooks/       自定义 Hook
├─ lib/         工具函数
├─ public/      静态资源
└─ styles/      全局样式
```

## 贡献
欢迎提交 Issue 和 PR，更多详情请查看项目仓库。