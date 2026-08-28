/**
 * upstream デモ集。キーは spec/visual/parity_spec.rb のマニフェストと対応する。
 * 各デモは dummy 側プレビューと同じテキスト・props・順序で構成すること
 * (比較は等価な入力に対してのみ意味を持つため)。
 */
import type { ComponentType } from "react"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./components/ui/accordion.tsx"
import { Alert, AlertDescription, AlertTitle } from "./components/ui/alert.tsx"
import { Avatar, AvatarFallback } from "./components/ui/avatar.tsx"
import { Badge } from "./components/ui/badge.tsx"
import { Button } from "./components/ui/button.tsx"
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from "./components/ui/card.tsx"
import { Label } from "./components/ui/label.tsx"
import { Separator } from "./components/ui/separator.tsx"
import { Skeleton } from "./components/ui/skeleton.tsx"
import { Switch } from "./components/ui/switch.tsx"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs.tsx"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./components/ui/tooltip.tsx"

export const demos: Record<string, ComponentType> = {
  "accordion/default": () => (
    <Accordion>
      <AccordionItem value="1">
        <AccordionTrigger>最初の項目</AccordionTrigger>
        <AccordionContent>内容その1</AccordionContent>
      </AccordionItem>
      <AccordionItem value="2">
        <AccordionTrigger>2番目の項目</AccordionTrigger>
        <AccordionContent>内容その2</AccordionContent>
      </AccordionItem>
    </Accordion>
  ),

  "alert/default": () => (
    <Alert>
      <AlertTitle>注意</AlertTitle>
      <AlertDescription>説明テキスト</AlertDescription>
    </Alert>
  ),

  "avatar/default": () => (
    <Avatar>
      <AvatarFallback>AB</AvatarFallback>
    </Avatar>
  ),

  "badge/default": () => <Badge>Badge</Badge>,

  "badge/variants": () => (
    <>
      {(["default", "secondary", "destructive", "outline", "ghost", "link"] as const).map((variant) => (
        <Badge key={variant} variant={variant}>{variant}</Badge>
      ))}
    </>
  ),

  "button/default": () => <Button>Button</Button>,

  "card/default": () => (
    <Card>
      <CardHeader>
        <CardTitle>カードタイトル</CardTitle>
        <CardDescription>説明</CardDescription>
      </CardHeader>
      <CardContent>本文</CardContent>
      <CardFooter>フッター</CardFooter>
    </Card>
  ),

  "label/default": () => <Label>ラベル</Label>,

  "separator/horizontal": () => <Separator />,

  "skeleton/default": () => <Skeleton className="h-8 w-full" />,

  "switch/default": () => <Switch id="switch" name="switch" />,

  "tabs/default": () => (
    <Tabs defaultValue="account">
      <TabsList>
        <TabsTrigger value="account">アカウント</TabsTrigger>
        <TabsTrigger value="password">パスワード</TabsTrigger>
      </TabsList>
      <TabsContent value="account">アカウント設定の内容</TabsContent>
      <TabsContent value="password">パスワード変更の内容</TabsContent>
    </Tabs>
  ),

  "tooltip/default": () => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>ホバーしてね</TooltipTrigger>
        <TooltipContent id="preview-tip">ツールチップの内容</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ),
}
