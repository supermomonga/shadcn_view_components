/**
 * upstream デモ集(A〜M)。demos.tsx から統合される。
 * 各デモは dummy 側プレビューと同じテキスト・props・順序で構成する。
 */
import type { ComponentType } from "react"
import { ja } from "date-fns/locale"

import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "./components/ui/accordion.tsx"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "./components/ui/alert-dialog.tsx"
import { Alert, AlertDescription, AlertTitle } from "./components/ui/alert.tsx"
import { AspectRatio } from "./components/ui/aspect-ratio.tsx"
import { Avatar, AvatarFallback, AvatarGroup } from "./components/ui/avatar.tsx"
import { Badge } from "./components/ui/badge.tsx"
import {
  Breadcrumb, BreadcrumbEllipsis, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from "./components/ui/breadcrumb.tsx"
import { Button } from "./components/ui/button.tsx"
import { Calendar } from "./components/ui/calendar.tsx"
import {
  Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from "./components/ui/card.tsx"
import {
  Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious,
} from "./components/ui/carousel.tsx"
import { Checkbox } from "./components/ui/checkbox.tsx"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./components/ui/collapsible.tsx"
import {
  ComboboxChip, ComboboxChips, ComboboxChipsInput, ComboboxContent, ComboboxEmpty,
  ComboboxInput, ComboboxItem, ComboboxList, Combobox,
} from "./components/ui/combobox.tsx"
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
  CommandShortcut,
} from "./components/ui/command.tsx"
import {
  ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger,
} from "./components/ui/context-menu.tsx"
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader,
  DialogTitle, DialogTrigger,
} from "./components/ui/dialog.tsx"
import {
  Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader,
  DrawerTitle, DrawerTrigger,
} from "./components/ui/drawer.tsx"
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator,
  DropdownMenuShortcut, DropdownMenuTrigger,
} from "./components/ui/dropdown-menu.tsx"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "./components/ui/empty.tsx"
import {
  Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldTitle,
} from "./components/ui/field.tsx"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./components/ui/hover-card.tsx"
import { Input } from "./components/ui/input.tsx"
import { Switch } from "./components/ui/switch.tsx"

const box = (text: string) => (
  <div className="flex size-40 items-center justify-center rounded-md border">{text}</div>
)

export const demosAToM: Record<string, ComponentType> = {
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

  "alert-dialog/default": () => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">アカウント削除</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>本当に削除しますか?</AlertDialogTitle>
          <AlertDialogDescription>この操作は取り消せません。データが完全に削除されます。</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>キャンセル</AlertDialogCancel>
          <AlertDialogAction variant="destructive">削除する</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),

  "alert/default": () => (
    <Alert>
      <AlertTitle>注意</AlertTitle>
      <AlertDescription>説明テキスト</AlertDescription>
    </Alert>
  ),

  "alert/destructive": () => (
    <Alert variant="destructive">
      <AlertTitle>エラー</AlertTitle>
      <AlertDescription>破壊的な内容</AlertDescription>
    </Alert>
  ),

  "aspect-ratio/default": () => (
    <AspectRatio ratio={16 / 9} className="bg-muted">16 / 9</AspectRatio>
  ),

  "avatar/default": () => (
    <Avatar>
      <AvatarFallback>AB</AvatarFallback>
    </Avatar>
  ),

  "avatar/sizes": () => (
    <>
      {(["sm", "default", "lg"] as const).map((size) => (
        <Avatar key={size} data-size={size}>
          <AvatarFallback>{size}</AvatarFallback>
        </Avatar>
      ))}
    </>
  ),

  "avatar/group": () => (
    <AvatarGroup>
      <Avatar><AvatarFallback>A</AvatarFallback></Avatar>
      <Avatar><AvatarFallback>B</AvatarFallback></Avatar>
      <Avatar><AvatarFallback>C</AvatarFallback></Avatar>
    </AvatarGroup>
  ),

  "badge/default": () => <Badge>Badge</Badge>,

  "badge/variants": () => (
    <>
      {(["default", "secondary", "destructive", "outline", "ghost", "link"] as const).map((variant) => (
        <Badge key={variant} variant={variant}>{variant}</Badge>
      ))}
    </>
  ),

  "breadcrumb/default": () => (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem><BreadcrumbLink href="#">Home</BreadcrumbLink></BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem><BreadcrumbLink href="#">記事</BreadcrumbLink></BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem><BreadcrumbPage>現在のページ</BreadcrumbPage></BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  ),

  "breadcrumb/ellipsis": () => (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem><BreadcrumbLink href="#">Home</BreadcrumbLink></BreadcrumbItem>
        <BreadcrumbItem><BreadcrumbEllipsis /></BreadcrumbItem>
        <BreadcrumbItem><BreadcrumbPage>現在</BreadcrumbPage></BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  ),

  "button/default": () => <Button>Button</Button>,
  "button/variants": () => <Button variant="secondary">Secondary</Button>,
  "button/destructive": () => <Button variant="destructive">Destructive</Button>,
  "button/outline": () => <Button variant="outline">Outline</Button>,
  "button/ghost": () => <Button variant="ghost">Ghost</Button>,
  "button/link": () => <Button variant="link">Link</Button>,
  "button/sizes": () => <Button size="sm">Small</Button>,
  "button/with-icon": () => <Button size="icon">☑</Button>,
  "button/as-link": () => (
    <Button asChild><a href="#">Link Button</a></Button>
  ),

  "calendar/default": () => (
    <Calendar mode="single" locale={ja} month={new Date(2026, 7, 1)} selected={new Date(2026, 7, 27)} />
  ),

  "calendar/plain": () => (
    <Calendar mode="single" locale={ja} month={new Date(2026, 7, 1)} />
  ),

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

  "card/with-action": () => (
    <Card>
      <CardHeader>
        <CardTitle>タイトル</CardTitle>
        <CardAction>
          <Button variant="ghost" size="sm">編集</Button>
        </CardAction>
      </CardHeader>
      <CardContent>本文</CardContent>
    </Card>
  ),

  "carousel/default": () => (
    <Carousel className="max-w-xs">
      <CarouselContent>
        {["スライド1", "スライド2", "スライド3", "スライド4"].map((text) => (
          <CarouselItem key={text}>{box(text)}</CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  ),

  "checkbox/default": () => <Checkbox id="check" name="check" />,

  "checkbox/disabled": () => <Checkbox disabled />,

  "collapsible/default": () => (
    <Collapsible>
      <CollapsibleTrigger>開く/閉じる</CollapsibleTrigger>
      <CollapsibleContent>折りたたまれる内容</CollapsibleContent>
    </Collapsible>
  ),

  "combobox/default": () => (
    <Combobox>
      <ComboboxInput placeholder="フレームワークを検索…" />
      <ComboboxContent>
        <ComboboxList>
          <ComboboxEmpty>見つかりません</ComboboxEmpty>
          <ComboboxItem value="rails">Ruby on Rails</ComboboxItem>
          <ComboboxItem value="hanami">Hanami</ComboboxItem>
          <ComboboxItem value="sinatra">Sinatra</ComboboxItem>
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  ),

  "combobox/chips": () => (
    <Combobox>
      <ComboboxChips>
        <ComboboxChip>Rails</ComboboxChip>
      <ComboboxChip>Hanami</ComboboxChip>
        <ComboboxChipsInput placeholder="追加…" />
      </ComboboxChips>
    </Combobox>
  ),

  "command/default": () => (
    <Command className="rounded-lg border shadow-md">
      <CommandInput placeholder="コマンドを検索…" />
      <CommandList>
        <CommandEmpty>結果が見つかりません</CommandEmpty>
        <CommandGroup>
          <CommandItem value="copy">
            コピー <CommandShortcut>⌘C</CommandShortcut>
          </CommandItem>
          <CommandItem value="paste">
            貼り付け <CommandShortcut>⌘V</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  ),

  "context-menu/default": () => (
    <ContextMenu>
      <ContextMenuTrigger className="rounded-md border p-8" style={{ display: "inline-block" }}>
        ここを右クリック
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem>開く</ContextMenuItem>
        <ContextMenuItem>名前を変更</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem>削除</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  ),

  "dialog/default": () => (
    <Dialog>
      <DialogTrigger asChild><Button variant="outline">設定を開く</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>プロフィール編集</DialogTitle>
          <DialogDescription>公開される情報です</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose>閉じる</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),

  "drawer/default": () => (
    <Drawer>
      <DrawerTrigger asChild><Button variant="outline">ドロワーを開く</Button></DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>お知らせ</DrawerTitle>
          <DrawerDescription>下部からスライドインします</DrawerDescription>
        </DrawerHeader>
        <DrawerFooter>
          <DrawerClose>閉じる</DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  ),

  "dropdown-menu/default": () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild><Button variant="outline">メニューを開く</Button></DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>操作</DropdownMenuLabel>
        <DropdownMenuItem>コピー</DropdownMenuItem>
        <DropdownMenuItem>
          貼り付け <DropdownMenuShortcut>⌘V</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem checked>通知を受け取る</DropdownMenuCheckboxItem>
        <DropdownMenuRadioGroup>
          <DropdownMenuRadioItem checked>簡易表示</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  ),

  "empty/default": () => (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">☑</EmptyMedia>
        <EmptyTitle>データがありません</EmptyTitle>
        <EmptyDescription>新しい項目を追加してください</EmptyDescription>
      </EmptyHeader>
    </Empty>
  ),

  "field/default": () => (
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor="field-email">メールアドレス</FieldLabel>
        <Input id="field-email" type="email" placeholder="you@example.com" />
        <FieldDescription>ログインに使うアドレスです</FieldDescription>
      </Field>
      <Field>
        <FieldLabel htmlFor="field-name">名前</FieldLabel>
        <Input id="field-name" />
        <FieldDescription>表示名として使われます</FieldDescription>
      </Field>
    </FieldGroup>
  ),

  "field/horizontal": () => (
    <Field orientation="horizontal">
      <FieldContent>
        <FieldTitle>公開する</FieldTitle>
        <FieldDescription>プロフィールを全員に表示します</FieldDescription>
      </FieldContent>
      <Switch />
    </Field>
  ),

  // form は base-nova のレジストリに存在しない(local-override の独自契約)。
  // upstream docs/forms ガイドと同じ Field プリミティブの組み立てで、
  // Form::Item(= data-invalid 付き Field) + Form::Error の描画を再現する
  "form/default": () => (
    <Field data-invalid="true">
      <FieldLabel htmlFor="preview-email">メールアドレス</FieldLabel>
      <Input id="preview-email" type="email" placeholder="you@example.com" aria-invalid="true" />
      <FieldDescription>ログインに使うアドレスです</FieldDescription>
      <FieldError errors={[{ message: "メールアドレスを入力してください" }]} />
    </Field>
  ),

  "form/without-error": () => (
    <Field data-invalid="false">
      <FieldLabel htmlFor="preview-name">名前</FieldLabel>
      <Input id="preview-name" />
      <FieldDescription>エラーが無いときはError要素自体が描かれません</FieldDescription>
      <FieldError />
    </Field>
  ),

  "hover-card/default": () => (
    <HoverCard>
      <HoverCardTrigger asChild><a href="#">@rails</a></HoverCardTrigger>
      <HoverCardContent>Ruby on Rails — ホバーで表示されるカードです</HoverCardContent>
    </HoverCard>
  ),
}
