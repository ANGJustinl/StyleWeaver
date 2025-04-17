"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentApiUrl: string
  onSave: (url: string) => void
}

export function SettingsDialog({ open, onOpenChange, currentApiUrl, onSave }: SettingsDialogProps) {
  const [apiUrl, setApiUrl] = useState(currentApiUrl)

  const handleSave = () => {
    onSave(apiUrl)
  }

  const resetToDefault = () => {
    setApiUrl("http://127.0.0.1:8000")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>API 设置</DialogTitle>
          <DialogDescription>
            配置 StyleWeaver API 的连接设置。如果您已部署自己的后端服务，可以在此处修改 API 端点。
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="api-url" className="text-right">
              API 端点
            </Label>
            <Input
              id="api-url"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="http://127.0.0.1:8000"
              className="col-span-3"
            />
          </div>
          <div className="text-xs text-gray-500 mt-2">
            <p>默认端点: http://127.0.0.1:8000</p>
            <p className="mt-1">确保您的 API 端点支持 StyleWeaver API 规范，包括 /generate 端点和所有必要的参数。</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={resetToDefault}>
            重置为默认
          </Button>
          <Button onClick={handleSave}>保存设置</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
