"use client"

import { useState } from "react"
import React from "react"
import Link from "next/link"
import { ArrowLeft, Copy, ChevronDown, ChevronUp, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible } from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"

export default function ApiDocsPage() {
  // 在 useState 声明部分添加 apiBaseUrl 状态
  const [apiBaseUrl, setApiBaseUrl] = useState<string>(
    typeof window !== "undefined"
      ? localStorage.getItem("apiBaseUrl") || "http://127.0.0.1:8000"
      : "http://127.0.0.1:8000",
  )
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    generate: true,
    examples: false,
    future: false,
  })

  // 在组件初始化时从 localStorage 获取 API 端点
  React.useEffect(() => {
    const savedApiUrl = localStorage.getItem("apiBaseUrl")
    if (savedApiUrl) {
      setApiBaseUrl(savedApiUrl)
    }
  }, [])

  // 修改复制到剪贴板的函数
  const copyToClipboard = (endpoint: string) => {
    const textToCopy = endpoint === "base" ? apiBaseUrl : `${apiBaseUrl}/generate`
    navigator.clipboard.writeText(textToCopy)
    setCopiedEndpoint(endpoint)
    setTimeout(() => setCopiedEndpoint(null), 2000)
  }

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" size="icon" asChild>
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">StyleWeaver API 文档</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* 侧边导航 */}
        <div className="md:col-span-1">
          <div className="sticky top-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>目录</CardTitle>
              </CardHeader>
              <CardContent>
                <nav className="space-y-2">
                  <a href="#overview" className="block text-sm hover:underline text-blue-600">
                    概述
                  </a>
                  <a href="#endpoints" className="block text-sm hover:underline text-blue-600">
                    API 端点
                  </a>
                  <a href="#generate" className="block text-sm hover:underline text-blue-600">
                    生成图像 API
                  </a>
                  <a href="#examples" className="block text-sm hover:underline text-blue-600">
                    示例代码
                  </a>
                  <a href="#future" className="block text-sm hover:underline text-blue-600">
                    未来功能
                  </a>
                </nav>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 主要内容 */}
        <div className="md:col-span-3 space-y-8">
          {/* 概述 */}
          <section id="overview">
            <Card>
              <CardHeader>
                <CardTitle>StyleWeaver API 概述</CardTitle>
                <CardDescription>
                  StyleWeaver 提供了一套简洁的 API，用于使用 IP-Adapter 和 ComfyUI 工作流生成风格化图像。
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  StyleWeaver 是一个基于 ComfyUI 的风格化图像生成服务，它提供了简单易用的 API
                  接口，允许开发者通过程序化方式生成风格化图像。通过这些 API，您可以：
                </p>
                <ul className="list-disc list-inside space-y-2 text-sm text-gray-600 mb-4">
                  <li>上传参考图像作为风格来源</li>
                  <li>提供文本提示词描述所需内容</li>
                  <li>调整生成参数如权重、步数等</li>
                  <li>获取生成的图像结果</li>
                </ul>
                <p className="text-sm text-gray-600">
                  本文档提供了 StyleWeaver API 的详细说明，包括端点、参数、请求和响应示例，以及常见用例的代码示例。
                </p>
              </CardContent>
            </Card>
          </section>

          {/* API 端点 */}
          <section id="endpoints">
            <Card>
              <CardHeader>
                <CardTitle>API 端点</CardTitle>
                <CardDescription>StyleWeaver 提供以下主要 API 端点</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">基础 URL</p>
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">{apiBaseUrl}</code>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard("base")} className="gap-1">
                      {copiedEndpoint === "base" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {copiedEndpoint === "base" ? "已复制" : "复制"}
                    </Button>
                  </div>

                  <div className="border rounded-md p-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">生成图像</p>
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">{`${apiBaseUrl}/generate`}</code>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard("generate")} className="gap-1">
                        {copiedEndpoint === "generate" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        {copiedEndpoint === "generate" ? "已复制" : "复制"}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* 生成图像 API */}
          <section id="generate">
            <Card>
              <CardHeader className="cursor-pointer" onClick={() => toggleSection("generate")}>
                <div className="flex justify-between items-center">
                  <CardTitle>生成图像 API</CardTitle>
                  {openSections.generate ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </div>
                <CardDescription>使用 IP-Adapter 和 ComfyUI 工作流生成图像</CardDescription>
              </CardHeader>
              <Collapsible open={openSections.generate}>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-md font-medium mb-2">请求</h3>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge>POST</Badge>
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">/generate</code>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">Content-Type: multipart/form-data</p>

                      <h4 className="text-sm font-medium mt-4 mb-2">表单字段</h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                字段
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                类型
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                描述
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            <tr>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">file</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">File</td>
                              <td className="px-6 py-4 text-sm text-gray-500">参考图像文件 (JPEG/PNG)</td>
                            </tr>
                            <tr>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">prompt</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">String</td>
                              <td className="px-6 py-4 text-sm text-gray-500">描述所需内容的正面提示词（必填）</td>
                            </tr>
                            <tr>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                negative_prompt
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">String</td>
                              <td className="px-6 py-4 text-sm text-gray-500">
                                避免不需要元素的负面提示词（默认值：worst quality, low quality, text, censored,
                                deformed, bad hand, blurry, watermark）
                              </td>
                            </tr>
                            <tr>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">weight</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Float</td>
                              <td className="px-6 py-4 text-sm text-gray-500">
                                IP-Adapter 风格权重，范围 0-1（默认值：0.5）
                              </td>
                            </tr>
                            <tr>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">steps</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Integer</td>
                              <td className="px-6 py-4 text-sm text-gray-500">采样步数（默认值：28）</td>
                            </tr>
                            <tr>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">cfg</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Float</td>
                              <td className="px-6 py-4 text-sm text-gray-500">无分类器引导缩放（默认值：7.0）</td>
                            </tr>
                            <tr>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">width</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Integer</td>
                              <td className="px-6 py-4 text-sm text-gray-500">输出图像宽度（默认值：1024）</td>
                            </tr>
                            <tr>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">height</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Integer</td>
                              <td className="px-6 py-4 text-sm text-gray-500">输出图像高度（默认值：1024）</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-md font-medium mb-2">响应</h3>

                      <h4 className="text-sm font-medium mt-4 mb-2">200 OK</h4>
                      <pre className="bg-gray-100 p-3 rounded-md text-sm overflow-x-auto">
                        <code>
                          {`{
  "success": true,
  "image_url": "${apiBaseUrl}/view?filename=output_<session>_00001_.png"
}`}
                        </code>
                      </pre>

                      <h4 className="text-sm font-medium mt-4 mb-2">400 Bad Request</h4>
                      <pre className="bg-gray-100 p-3 rounded-md text-sm overflow-x-auto">
                        <code>
                          {`{
  "error": "file and prompt are required"
}`}
                        </code>
                      </pre>

                      <h4 className="text-sm font-medium mt-4 mb-2">500 Internal Server Error</h4>
                      <pre className="bg-gray-100 p-3 rounded-md text-sm overflow-x-auto">
                        <code>
                          {`{
  "error": "Image generation failed"
}`}
                        </code>
                      </pre>
                    </div>
                  </div>
                </CardContent>
              </Collapsible>
            </Card>
          </section>

          {/* 示例代码 */}
          <section id="examples">
            <Card>
              <CardHeader className="cursor-pointer" onClick={() => toggleSection("examples")}>
                <div className="flex justify-between items-center">
                  <CardTitle>示例代码</CardTitle>
                  {openSections.examples ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </div>
                <CardDescription>常见用例的完整示例代码</CardDescription>
              </CardHeader>
              <Collapsible open={openSections.examples}>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-md font-medium mb-2">cURL 示例</h3>
                      <pre className="bg-gray-100 p-3 rounded-md text-sm overflow-x-auto">
                        <code>
                          {`curl -X POST ${apiBaseUrl}/generate \\
  -F "file=@./reference.jpg" \\
  -F "prompt=An oil painting of a sunset over the mountains" \\
  -F "negative_prompt=low quality, text" \\
  -F "weight=0.6" \\
  -F "steps=30" \\
  -F "cfg=7.5" \\
  -F "width=1024" \\
  -F "height=1024"`}
                        </code>
                      </pre>
                    </div>

                    <div>
                      <h3 className="text-md font-medium mb-2">JavaScript 示例</h3>
                      <pre className="bg-gray-100 p-3 rounded-md text-sm overflow-x-auto">
                        <code>
                          {`// JavaScript 示例：使用 fetch API 生成图像
async function generateImage(imageFile, prompt) {
  // 创建表单数据
  const formData = new FormData();
  formData.append("file", imageFile);
  formData.append("prompt", prompt);
  formData.append("negative_prompt", "worst quality, low quality, text, censored");
  formData.append("weight", "0.5");
  formData.append("steps", "28");
  formData.append("cfg", "7.0");
  formData.append("width", "1024");
  formData.append("height", "1024");

  try {
    // 发送请求
    const response = await fetch("${apiBaseUrl}/generate", {
      method: "POST",
      body: formData,
    });

    // 处理响应
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "图像生成失败");
    }

    const data = await response.json();
    
    if (data.success && data.image_url) {
      console.log("生成成功:", data.image_url);
      return data.image_url;
    } else {
      throw new Error("返回数据格式错误");
    }
  } catch (error) {
    console.error("生成失败:", error);
    throw error;
  }
}

// 使用示例
// 假设有一个文件输入元素 <input type="file" id="imageInput">
document.getElementById("generateButton").addEventListener("click", async () => {
  const fileInput = document.getElementById("imageInput");
  const promptInput = document.getElementById("promptInput");
  
  if (fileInput.files.length > 0 && promptInput.value) {
    try {
      const imageUrl = await generateImage(fileInput.files[0], promptInput.value);
      document.getElementById("resultImage").src = imageUrl;
    } catch (error) {
      alert("生成失败: " + error.message);
    }
  } else {
    alert("请选择图像文件并输入提示词");
  }
});`}
                        </code>
                      </pre>
                    </div>

                    <div>
                      <h3 className="text-md font-medium mb-2">Python 示例</h3>
                      <pre className="bg-gray-100 p-3 rounded-md text-sm overflow-x-auto">
                        <code>
                          {`import requests

url = "${apiBaseUrl}/generate"
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
print(resp.json())`}
                        </code>
                      </pre>
                    </div>
                  </div>
                </CardContent>
              </Collapsible>
            </Card>
          </section>

          {/* 未来功能 */}
          <section id="future">
            <Card>
              <CardHeader className="cursor-pointer" onClick={() => toggleSection("future")}>
                <div className="flex justify-between items-center">
                  <CardTitle>未来功能</CardTitle>
                  {openSections.future ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </div>
                <CardDescription>计划中的 API 功能</CardDescription>
              </CardHeader>
              <Collapsible open={openSections.future}>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-md font-medium mb-2">批量处理 API</h3>
                      <p className="text-sm text-gray-600 mb-2">计划添加批量处理 API，允许一次提交多个图像进行处理。</p>
                      <pre className="bg-gray-100 p-3 rounded-md text-sm overflow-x-auto">
                        <code>
                          {`// 未来的批量处理 API
POST /batch-generate
Content-Type: multipart/form-data

// 请求参数
files[]: File (多个文件)
prompts[]: String (对应每个文件的提示词)
...其他参数

// 响应
{
  "success": true,
  "results": [
    {
      "original_filename": "image1.jpg",
      "image_url": "${apiBaseUrl}/view?filename=output_1.png"
    },
    {
      "original_filename": "image2.jpg",
      "image_url": "${apiBaseUrl}/view?filename=output_2.png"
    }
  ]
}`}
                        </code>
                      </pre>
                    </div>

                    <div>
                      <h3 className="text-md font-medium mb-2">历史记录 API</h3>
                      <p className="text-sm text-gray-600 mb-2">计划添加历史记录 API，允许查询和管理生成历史。</p>
                      <pre className="bg-gray-100 p-3 rounded-md text-sm overflow-x-auto">
                        <code>
                          {`// 未来的历史记录 API
GET /history
// 响应
{
  "history": [
    {
      "id": "12345",
      "timestamp": "2023-05-15T14:30:45Z",
      "prompt": "A fantasy landscape",
      "image_url": "${apiBaseUrl}/view?filename=output_12345.png"
    },
    ...
  ]
}

GET /history/{id}
// 响应
{
  "id": "12345",
  "timestamp": "2023-05-15T14:30:45Z",
  "prompt": "A fantasy landscape",
  "negative_prompt": "blurry, text",
  "parameters": {
    "weight": 0.5,
    "steps": 28,
    "cfg": 7.0,
    "width": 1024,
    "height": 1024
  },
  "image_url": "${apiBaseUrl}/view?filename=output_12345.png"
}`}
                        </code>
                      </pre>
                    </div>

                    <div>
                      <h3 className="text-md font-medium mb-2">模型管理 API</h3>
                      <p className="text-sm text-gray-600 mb-2">计划添加模型管理 API，允许切换和管理不同的基础模型。</p>
                      <pre className="bg-gray-100 p-3 rounded-md text-sm overflow-x-auto">
                        <code>
                          {`// 未来的模型管理 API
GET /models
// 响应
{
  "models": [
    {
      "id": "sd15",
      "name": "Stable Diffusion 1.5",
      "active": true
    },
    {
      "id": "sdxl",
      "name": "Stable Diffusion XL",
      "active": false
    }
  ]
}

POST /models/activate
// 请求
{
  "model_id": "sdxl"
}
// 响应
{
  "success": true,
  "active_model": {
    "id": "sdxl",
    "name": "Stable Diffusion XL"
  }
}`}
                        </code>
                      </pre>
                    </div>
                  </div>
                </CardContent>
              </Collapsible>
            </Card>
          </section>
        </div>
      </div>
    </div>
  )
}
