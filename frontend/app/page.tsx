"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import {
  Upload,
  ImageIcon,
  Sliders,
  Download,
  History,
  LayoutTemplateIcon as Template,
  Zap,
  FileText,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  X,
  HelpCircle,
  Menu,
  Copy,
  AlertCircle,
  Settings,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { SettingsDialog } from "@/components/settings-dialog"

export default function ComfyUIInterface() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [isParameterPanelOpen, setIsParameterPanelOpen] = useState(true)
  const [isConnected, setIsConnected] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // 在 useState 声明部分添加 apiBaseUrl 状态
  const [apiBaseUrl, setApiBaseUrl] = useState<string>(
    typeof window !== "undefined"
      ? localStorage.getItem("apiBaseUrl") || "http://127.0.0.1:8000"
      : "http://127.0.0.1:8000",
  )
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  // 参数状态
  const [parameters, setParameters] = useState({
    prompt: "",
    negative_prompt: "worst quality, low quality, text, censored, deformed, bad hand, blurry, watermark",
    weight: 0.5,
    steps: 28,
    cfg: 7.0,
    width: 1024,
    height: 1024,
  })

  // 添加保存 API 设置的函数
  const saveApiSettings = (url: string) => {
    setApiBaseUrl(url)
    localStorage.setItem("apiBaseUrl", url)
    setIsSettingsOpen(false)
    toast({
      title: "API 设置已保存",
      description: `API 端点已设置为 ${url}`,
    })
    // 保存后立即检查连接
    checkApiConnection(url)
  }

  // 修改 checkApiConnection 函数，接受可选的 url 参数
  const checkApiConnection = useCallback(
    async (url?: string) => {
      const baseUrl = url || apiBaseUrl
      try {
        const response = await fetch(`${baseUrl}`, {
          method: "HEAD",
          cache: "no-cache",
        })
        const isConnected = response.ok
        setIsConnected(isConnected)
        if (isConnected) {
          toast({
            title: "API 连接成功",
            description: `成功连接到 ${baseUrl}`,
          })
        } else {
          toast({
            title: "API 连接失败",
            description: "无法连接到 API 服务",
            variant: "destructive",
          })
        }
        return isConnected
      } catch (error) {
        console.error("API连接检查失败:", error)
        setIsConnected(false)
        toast({
          title: "API 连接失败",
          description: "无法连接到 API 服务",
          variant: "destructive",
        })
        return false
      }
    },
    [apiBaseUrl, toast],
  )

  // 上传图片
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // 检查文件类型
      if (!file.type.match("image/jpeg") && !file.type.match("image/png")) {
        toast({
          title: "不支持的文件类型",
          description: "请上传 JPEG 或 PNG 格式的图片",
          variant: "destructive",
        })
        return
      }

      // 保存文件对象用于后续API调用
      setUploadedFile(file)

      // 显示预览
      const reader = new FileReader()
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string)
        setGeneratedImage(null)
        setError(null)
      }
      reader.readAsDataURL(file)
    }
  }

  // 生成图像
  const handleGenerate = async () => {
    if (!uploadedFile || !parameters.prompt) {
      toast({
        title: "缺少必要参数",
        description: "请上传参考图像并输入提示词",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    setProgress(0)
    setError(null)

    // 创建进度模拟器
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 96) {
          clearInterval(progressInterval)
          return 96
        }
        return prev + 2
      })
    }, 500)

    try {
      // 检查API连接（跳过严格检查，继续尝试生成）
      checkApiConnection().catch(() => {})

      // 准备表单数据
      const formData = new FormData()
      formData.append("file", uploadedFile)
      formData.append("prompt", parameters.prompt)
      formData.append("negative_prompt", parameters.negative_prompt)
      formData.append("weight", parameters.weight.toString())
      formData.append("steps", parameters.steps.toString())
      formData.append("cfg", parameters.cfg.toString())
      formData.append("width", parameters.width.toString())
      formData.append("height", parameters.height.toString())

      // 发送请求
      const response = await fetch(`${apiBaseUrl}/generate`, {
        method: "POST",
        body: formData,
      })

      // 处理响应
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "图像生成失败")
      }

      const data = await response.json()

      if (data.success && data.image_url) {
        setGeneratedImage(apiBaseUrl + data.image_url)
        toast({
          title: "生成成功",
          description: "图像已成功生成",
        })
      } else {
        throw new Error("返回数据格式错误")
      }
    } catch (err) {
      console.error("生成失败:", err)
      setError(err instanceof Error ? err.message : "未知错误")
      toast({
        title: "生成失败",
        description: err instanceof Error ? err.message : "未知错误",
        variant: "destructive",
      })
    } finally {
      clearInterval(progressInterval)
      setProgress(100)
      setIsGenerating(false)
    }
  }

  // 重置所有内容
  const handleReset = () => {
    setUploadedImage(null)
    setUploadedFile(null)
    setGeneratedImage(null)
    setIsGenerating(false)
    setProgress(0)
    setError(null)
    setParameters({
      prompt: "",
      negative_prompt: "worst quality, low quality, text, censored, deformed, bad hand, blurry, watermark",
      weight: 0.5,
      steps: 28,
      cfg: 7.0,
      width: 1024,
      height: 1024,
    })
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // 加载示例图像
  const loadExampleImage = () => {
    // 这里需要后端支持，暂时只显示占位图
    toast({
      title: "功能未实现",
      description: "此功能需要后端支持，将在后续版本中实现",
    })
    setUploadedImage("/placeholder.svg?height=512&width=512")
    setGeneratedImage(null)
  }

  // 下载生成的图像
  const handleDownloadImage = async () => {
    if (!generatedImage) return

    try {
      // 从URL获取图像
      const response = await fetch(generatedImage)
      const blob = await response.blob()

      // 创建下载链接
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `styleweaver_${new Date().getTime()}.png`
      document.body.appendChild(a)
      a.click()

      // 清理
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "下载成功",
        description: "图像已成功下载到您的设备",
      })
    } catch (err) {
      console.error("下载失败:", err)
      toast({
        title: "下载失败",
        description: "无法下载图像，请稍后重试",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex min-h-screen bg-[#F0F0F0]">
      {/* 简化的侧边栏 */}
      <div className="w-64 bg-white border-r border-gray-200 shadow-sm hidden md:block">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-[#4A90E2] flex items-center justify-center text-white font-bold">
              S
            </div>
            <h1 className="text-lg font-bold">StyleWeaver</h1>
          </div>
        </div>

        <div className="p-2">
          <div className="space-y-1">
            <Button variant="ghost" className="w-full justify-start">
              <Upload size={18} className="mr-2" />
              新建项目
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <History size={18} className="mr-2" />
              历史记录
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <Template size={18} className="mr-2" />
              模板库
            </Button>
          </div>

          <Separator className="my-4" />

          <div className="space-y-1">
            <Button variant="ghost" className="w-full justify-start">
              <Zap size={18} className="mr-2" />
              批量处理
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <FileText size={18} className="mr-2" />
              日志与报错
            </Button>
          </div>
        </div>

        <div className="absolute bottom-0 w-64 p-4 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}></div>
              <span className="text-xs">{isConnected ? "已连接" : "未连接"}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={() => checkApiConnection()}>
              <RefreshCw size={16} />
            </Button>
          </div>
        </div>
      </div>

      {/* 移动端菜单按钮 */}
      <Button variant="outline" size="icon" className="fixed top-4 left-4 z-50 md:hidden">
        <Menu size={20} />
      </Button>

      <main className="flex-1 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">风格化图像生成</h1>
              <Badge
                variant="outline"
                className={`${isConnected ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
              >
                {isConnected ? "API 已连接" : "API 未连接"}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleReset}>
                <X size={16} className="mr-1" /> 清空重置
              </Button>
            </div>
          </div>

          {/* StyleWeaver API 信息卡片 */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium">StyleWeaver API 连接信息</h2>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={isConnected ? "outline" : "destructive"}
                    className={isConnected ? "bg-green-50 text-green-700" : ""}
                  >
                    {isConnected ? "已连接" : "未连接"}
                  </Badge>
                  <Button variant="outline" size="sm" onClick={() => setIsSettingsOpen(true)}>
                    <Settings size={16} className="mr-2" />
                    API 设置
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">API 端点</p>
                  <div className="flex items-center mt-1">
                    <Input value={apiBaseUrl} readOnly className="bg-gray-50" />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-2"
                      onClick={() => {
                        navigator.clipboard.writeText(apiBaseUrl)
                        toast({ title: "已复制到剪贴板" })
                      }}
                    >
                      <Copy size={16} />
                    </Button>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500">生成端点</p>
                  <div className="flex items-center mt-1">
                    <Input value={`${apiBaseUrl}/generate`} readOnly className="bg-gray-50" />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-2"
                      onClick={() => {
                        navigator.clipboard.writeText(`${apiBaseUrl}/generate`)
                        toast({ title: "已复制到剪贴板" })
                      }}
                    >
                      <Copy size={16} />
                    </Button>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <p className="text-sm font-medium text-gray-500">连接状态</p>
                  <div className="flex items-center gap-4 mt-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}></div>
                      <span>{isConnected ? "API 可用" : "API 不可用"}</span>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => checkApiConnection()}>
                      {isConnected ? "检查连接" : "重新连接"}
                    </Button>
                  </div>
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <Button variant="outline" className="gap-2" asChild>
                  <a href="/api-docs">
                    <FileText size={16} />
                    查看API文档
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 左侧面板 */}
            <div className="md:col-span-1 space-y-6">
              {/* 上传区 */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-medium">上传风格图像</h2>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <HelpCircle size={16} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>上传一张参考图像作为风格来源</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${uploadedImage ? "border-[#4A90E2] bg-blue-50" : "border-gray-300 hover:border-[#4A90E2] hover:bg-blue-50"}`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploadedImage ? (
                      <div className="flex flex-col items-center">
                        <div className="relative w-32 h-32 mb-2">
                          <img
                            src={uploadedImage || "/placeholder.svg"}
                            alt="Uploaded"
                            className="w-full h-full object-cover rounded-md"
                          />
                        </div>
                        <p className="text-sm text-gray-500">点击更换图像</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <Upload size={40} className="text-gray-400 mb-2" />
                        <p className="text-sm font-medium mb-1">拖拽或点击上传图像</p>
                        <p className="text-xs text-gray-500">支持 JPG, PNG 格式</p>
                      </div>
                    )}
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/jpeg,image/png"
                      title="Upload reference image"
                      aria-label="Upload reference image"
                      onChange={handleImageUpload}
                    />
                  </div>

                  <div className="mt-4">
                    <Button variant="outline" className="w-full" onClick={loadExampleImage}>
                      <ImageIcon size={16} className="mr-2" /> 加载示例图像
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* 文本提示区 */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-medium">文本提示</h2>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <HelpCircle size={16} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>输入描述生成图像的文本提示</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  <Tabs defaultValue="positive">
                    <TabsList className="grid grid-cols-2 mb-2">
                      <TabsTrigger value="positive">正面提示</TabsTrigger>
                      <TabsTrigger value="negative">负面提示</TabsTrigger>
                    </TabsList>
                    <TabsContent value="positive">
                      <Textarea
                        placeholder="描述你想要的图像内容，如：一只可爱的猫咪，高清照片，自然光线..."
                        className="min-h-[100px]"
                        value={parameters.prompt}
                        onChange={(e) => setParameters({ ...parameters, prompt: e.target.value })}
                      />
                    </TabsContent>
                    <TabsContent value="negative">
                      <Textarea
                        placeholder="描述你不想出现在图像中的内容，如：模糊，低质量，变形..."
                        className="min-h-[100px]"
                        value={parameters.negative_prompt}
                        onChange={(e) => setParameters({ ...parameters, negative_prompt: e.target.value })}
                      />
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              {/* 参数面板 */}
              <Collapsible open={isParameterPanelOpen} onOpenChange={setIsParameterPanelOpen}>
                <Card>
                  <CollapsibleTrigger asChild>
                    <div className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50 rounded-t-lg">
                      <div className="flex items-center gap-2">
                        <Sliders size={18} />
                        <h2 className="text-lg font-medium">参数设置</h2>
                      </div>
                      {isParameterPanelOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <CardContent className="p-4 pt-0">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <label className="text-sm font-medium">IP-Adapter 权重</label>
                            <span className="text-sm text-gray-500">{parameters.weight}</span>
                          </div>
                          <Slider
                            value={[parameters.weight]}
                            min={0}
                            max={1}
                            step={0.01}
                            onValueChange={(value) => setParameters({ ...parameters, weight: value[0] })}
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <label className="text-sm font-medium">步数</label>
                            <span className="text-sm text-gray-500">{parameters.steps}</span>
                          </div>
                          <Slider
                            value={[parameters.steps]}
                            min={10}
                            max={50}
                            step={1}
                            onValueChange={(value) => setParameters({ ...parameters, steps: value[0] })}
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <label className="text-sm font-medium">CFG 缩放</label>
                            <span className="text-sm text-gray-500">{parameters.cfg}</span>
                          </div>
                          <Slider
                            value={[parameters.cfg]}
                            min={1}
                            max={15}
                            step={0.1}
                            onValueChange={(value) => setParameters({ ...parameters, cfg: value[0] })}
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">分辨率</label>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-gray-500 mb-1">宽度</p>
                              <Select
                                value={parameters.width.toString()}
                                onValueChange={(value) =>
                                  setParameters({ ...parameters, width: Number.parseInt(value) })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="选择宽度" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="512">512</SelectItem>
                                  <SelectItem value="768">768</SelectItem>
                                  <SelectItem value="1024">1024</SelectItem>
                                  <SelectItem value="1280">1280</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">高度</p>
                              <Select
                                value={parameters.height.toString()}
                                onValueChange={(value) =>
                                  setParameters({ ...parameters, height: Number.parseInt(value) })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="选择高度" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="512">512</SelectItem>
                                  <SelectItem value="768">768</SelectItem>
                                  <SelectItem value="1024">1024</SelectItem>
                                  <SelectItem value="1280">1280</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setParameters({
                                ...parameters,
                                weight: 0.5,
                                steps: 28,
                                cfg: 7.0,
                                width: 1024,
                                height: 1024,
                              })
                            }
                            className="flex-1"
                          >
                            恢复默认
                          </Button>
                          <Button variant="secondary" size="sm" className="flex-1">
                            推荐配置
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            </div>

            {/* 右侧预览区 */}
            <div className="md:col-span-2">
              <Card className="h-full flex flex-col">
                <CardContent className="p-4 flex-1 flex flex-col">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-medium">{generatedImage ? "生成结果" : "预览区"}</h2>
                    {generatedImage && (
                      <Button variant="outline" size="sm" onClick={handleDownloadImage}>
                        <Download size={16} className="mr-2" /> 下载图像
                      </Button>
                    )}
                  </div>

                  {error && (
                    <Alert variant="destructive" className="mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>生成失败</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex-1 flex items-center justify-center bg-gray-100 rounded-lg overflow-hidden">
                    {isGenerating ? (
                      <div className="text-center p-8 w-full">
                        <Progress value={progress} className="mb-4" />
                        <p className="text-sm text-gray-500 mb-2">生成中... {progress}%</p>
                        <p className="text-xs text-gray-400">正在应用风格转换</p>
                      </div>
                    ) : uploadedImage ? (
                      generatedImage ? (
                        <img
                          src={generatedImage || "/placeholder.svg"}
                          alt="Generated"
                          className="max-w-full max-h-[70vh] object-contain"
                        />
                      ) : (
                        <img
                          src={uploadedImage || "/placeholder.svg"}
                          alt="Preview"
                          className="max-w-full max-h-[70vh] object-contain"
                        />
                      )
                    ) : (
                      <div className="text-center p-8">
                        <ImageIcon size={48} className="text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">请上传风格图像</p>
                      </div>
                    )}
                  </div>
                </CardContent>

                <div className="p-4 border-t">
                  <Button
                    className="w-full bg-[#4A90E2] hover:bg-[#3A80D2] text-white"
                    size="lg"
                    disabled={!uploadedImage || isGenerating || !parameters.prompt}
                    onClick={handleGenerate}
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw size={18} className="mr-2 animate-spin" />
                        生成中...
                      </>
                    ) : (
                      <>
                        <Zap size={18} className="mr-2" />
                        生成图像
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <SettingsDialog
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        currentApiUrl={apiBaseUrl}
        onSave={saveApiSettings}
      />
    </div>
  )
}
