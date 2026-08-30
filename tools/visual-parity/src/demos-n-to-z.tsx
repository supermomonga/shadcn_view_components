/**
 * upstream デモ集(N〜Z)。demos.tsx から統合される。
 * 各デモは dummy 側プレビューと同じテキスト・props・順序で構成する。
 */
import type { ComponentType } from "react"

import { Input } from "./components/ui/input.tsx"
import {
  Item, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemSeparator, ItemTitle,
} from "./components/ui/item.tsx"
import { Kbd, KbdGroup } from "./components/ui/kbd.tsx"
import { Label } from "./components/ui/label.tsx"
import { Marker, MarkerContent } from "./components/ui/marker.tsx"
import {
  Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarSeparator, MenubarShortcut,
  MenubarTrigger,
} from "./components/ui/menubar.tsx"
import {
  NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink,
  NavigationMenuList, NavigationMenuTrigger,
} from "./components/ui/navigation-menu.tsx"
import {
  Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink,
  PaginationNext, PaginationPrevious,
} from "./components/ui/pagination.tsx"
import {
  Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger,
} from "./components/ui/popover.tsx"
import { Button } from "./components/ui/button.tsx"
import { RadioGroup, RadioGroupItem } from "./components/ui/radio-group.tsx"
import {
  ResizableHandle, ResizablePanel, ResizablePanelGroup,
} from "./components/ui/resizable.tsx"
import { ScrollArea } from "./components/ui/scroll-area.tsx"
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger,
  SelectValue,
} from "./components/ui/select.tsx"
import { Separator } from "./components/ui/separator.tsx"
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "./components/ui/sheet.tsx"
import { Skeleton } from "./components/ui/skeleton.tsx"
import { Spinner } from "./components/ui/spinner.tsx"
import { Switch } from "./components/ui/switch.tsx"
import {
  Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow,
} from "./components/ui/table.tsx"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs.tsx"
import { Textarea } from "./components/ui/textarea.tsx"
import { Toggle } from "./components/ui/toggle.tsx"
import { ToggleGroup, ToggleGroupItem } from "./components/ui/toggle-group.tsx"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./components/ui/tooltip.tsx"

const selectLabels = {
  apple: "りんご",
  banana: "バナナ",
  orange: "オレンジ",
} as const

export const demosNToZ: Record<string, ComponentType> = {
  "input/default": () => <Input type="email" placeholder="email@example.com" />,

  "input/disabled": () => <Input placeholder="無効" disabled />,

  "item/default": () => (
    <ItemGroup>
      <Item>
        <ItemMedia>🔑</ItemMedia>
        <ItemContent>
          <ItemTitle>タイトル</ItemTitle>
          <ItemDescription>説明</ItemDescription>
        </ItemContent>
      </Item>
      <ItemSeparator />
      <Item variant="muted" size="sm">
        <ItemContent>ミュート項目</ItemContent>
      </Item>
    </ItemGroup>
  ),

  "kbd/default": () => <Kbd>⌘</Kbd>,

  "kbd/group": () => (
    <KbdGroup>
      <Kbd>⌘</Kbd>
      <Kbd>K</Kbd>
    </KbdGroup>
  ),

  "label/default": () => <Label>ラベル</Label>,

  "label/with-input": () => (
    <>
      <Label htmlFor="preview-email">メール</Label>
      <Input id="preview-email" type="email" />
    </>
  ),

  "marker/default": () => (
    <Marker><MarkerContent>本文</MarkerContent></Marker>
  ),

  "marker/variants": () => (
    <>
      {(["default", "separator", "border"] as const).map((variant) => (
        <Marker key={variant} variant={variant}><MarkerContent>{variant}</MarkerContent></Marker>
      ))}
    </>
  ),

  "menubar/default": () => (
    <Menubar>
      <MenubarMenu>
        <MenubarTrigger>ファイル</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>新規作成</MenubarItem>
          <MenubarItem>保存 <MenubarShortcut>⌘S</MenubarShortcut></MenubarItem>
          <MenubarSeparator />
          <MenubarItem>終了</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  ),

  "navigation-menu/default": () => (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuLink href="#">ホーム</NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  ),

  "navigation-menu/with-trigger": () => (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>ドキュメント</NavigationMenuTrigger>
          <NavigationMenuContent>
            <NavigationMenuLink href="#">はじめに</NavigationMenuLink>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  ),

  "pagination/default": () => (
    <Pagination>
      <PaginationContent>
        <PaginationItem><PaginationPrevious href="#" /></PaginationItem>
        <PaginationItem><PaginationLink href="#">1</PaginationLink></PaginationItem>
        <PaginationItem><PaginationLink href="#" isActive>2</PaginationLink></PaginationItem>
        <PaginationItem><PaginationLink href="#">3</PaginationLink></PaginationItem>
        <PaginationItem><PaginationEllipsis /></PaginationItem>
        <PaginationItem><PaginationNext href="#" /></PaginationItem>
      </PaginationContent>
    </Pagination>
  ),

  "popover/default": () => (
    <Popover>
      <PopoverTrigger asChild><Button variant="outline">開く</Button></PopoverTrigger>
      <PopoverContent>
        <PopoverHeader>
          <PopoverTitle>寸法</PopoverTitle>
          <PopoverDescription>ポップオーバーの内容です</PopoverDescription>
        </PopoverHeader>
      </PopoverContent>
    </Popover>
  ),

  "radio-group/default": () => (
    <RadioGroup>
      <RadioGroupItem name="plan" value="free" />
      <RadioGroupItem name="plan" value="pro" />
    </RadioGroup>
  ),

  "resizable/default": () => (
    <ResizablePanelGroup style={{ display: "flex", height: "200px", width: "100%", border: "1px solid #ccc" }}>
      <ResizablePanel>
        <div style={{ padding: "12px" }}>左パネル</div>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel>
        <div style={{ padding: "12px" }}>右パネル</div>
      </ResizablePanel>
    </ResizablePanelGroup>
  ),

  "resizable/vertical": () => (
    // ライブラリはグループの aria-orientation を自動付与しないため
    // CSS 契約(aria-[orientation=vertical]:flex-col)のために明示する
    <ResizablePanelGroup
      orientation="vertical"
      aria-orientation="vertical"
      style={{ display: "flex", height: "200px", width: "100%", border: "1px solid #ccc" }}
    >
      <ResizablePanel>
        <div style={{ padding: "12px" }}>上パネル</div>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel>
        <div style={{ padding: "12px" }}>下パネル</div>
      </ResizablePanel>
    </ResizablePanelGroup>
  ),

  "scroll-area/default": () => (
    <ScrollArea className="h-48">
      {Array.from({ length: 20 }, (_, i) => (
        <div key={i} className="p-2">行 {i + 1}</div>
      ))}
    </ScrollArea>
  ),

  "select/default": () => (
    <Select defaultValue="apple">
      <SelectTrigger>
        <SelectValue placeholder="果物を選択">
          {(value) => value == null ? "果物を選択" : selectLabels[value as keyof typeof selectLabels]}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>果物</SelectLabel>
          <SelectItem value="apple">りんご</SelectItem>
          <SelectItem value="banana">バナナ</SelectItem>
          <SelectSeparator />
          <SelectItem value="orange">オレンジ</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),

  "separator/horizontal": () => <Separator />,

  "separator/vertical": () => <Separator orientation="vertical" className="h-8" />,

  "sheet/default": () => (
    <Sheet>
      <SheetTrigger asChild><Button variant="outline">メニューを開く</Button></SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>設定</SheetTitle>
          <SheetDescription>右からスライドインします</SheetDescription>
        </SheetHeader>
        <SheetFooter>
          <SheetClose>閉じる</SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),

  "skeleton/default": () => <Skeleton className="h-8 w-full" />,

  "spinner/default": () => <Spinner />,

  "spinner/large": () => <Spinner className="size-8" />,

  "switch/default": () => <Switch id="switch" name="switch" />,

  "switch/small": () => <Switch size="sm" name="switch-sm" />,

  "table/default": () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>名前</TableHead>
          <TableHead>値</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>項目A</TableCell>
          <TableCell>1</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>項目B</TableCell>
          <TableCell>2</TableCell>
        </TableRow>
      </TableBody>
      <TableCaption>キャプション</TableCaption>
    </Table>
  ),

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

  "tabs/line": () => (
    <Tabs defaultValue="a">
      <TabsList variant="line">
        <TabsTrigger value="a">概要</TabsTrigger>
        <TabsTrigger value="b">設定</TabsTrigger>
      </TabsList>
      <TabsContent value="a">概要の内容</TabsContent>
      <TabsContent value="b">設定の内容</TabsContent>
    </Tabs>
  ),

  "tabs/vertical": () => (
    <Tabs orientation="vertical" defaultValue="account">
      <TabsList>
        <TabsTrigger value="account">アカウント</TabsTrigger>
        <TabsTrigger value="password">パスワード</TabsTrigger>
      </TabsList>
      <TabsContent value="account">アカウント設定の内容</TabsContent>
      <TabsContent value="password">パスワード変更の内容</TabsContent>
    </Tabs>
  ),

  "textarea/default": () => <Textarea placeholder="自由入力" />,

  "toggle/default": () => <Toggle>トグル</Toggle>,

  "toggle/variants": () => (
    <>
      {(["default", "outline"] as const).map((variant) => (
        <Toggle key={variant} variant={variant}>{variant}</Toggle>
      ))}
    </>
  ),

  "toggle/sizes": () => (
    <>
      {(["sm", "default", "lg"] as const).map((size) => (
        <Toggle key={size} size={size}>{size}</Toggle>
      ))}
    </>
  ),

  "toggle/pressed": () => <Toggle pressed variant="outline">オン</Toggle>,

  "toggle-group/multiple": () => (
    <ToggleGroup variant="outline" type="multiple" defaultValue={["太字"]}>
      <ToggleGroupItem value="太字">太字</ToggleGroupItem>
      <ToggleGroupItem value="斜体">斜体</ToggleGroupItem>
      <ToggleGroupItem value="下線">下線</ToggleGroupItem>
    </ToggleGroup>
  ),

  "toggle-group/single": () => (
    <ToggleGroup variant="outline" type="single" defaultValue="日">
      <ToggleGroupItem value="日" size="sm">日</ToggleGroupItem>
      <ToggleGroupItem value="週" size="sm">週</ToggleGroupItem>
      <ToggleGroupItem value="月" size="sm">月</ToggleGroupItem>
    </ToggleGroup>
  ),

  "tooltip/default": () => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild><Button variant="outline">ホバーしてね</Button></TooltipTrigger>
        <TooltipContent id="preview-tip">ツールチップの内容</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ),
}
