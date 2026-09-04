# コンポーネントAPIリファレンス

このリファレンスは、実装済み61アイテム・公開ViewComponent 322クラスを対象に、次の正本から決定論的に生成します。

- 公開クラスと最小描画引数: [conformance registry](../../../spec/conformance/registry.yml)
- initializer: [BaseComponentと各公開クラス](../../../app/components/shadcn/base_component.rb)
- variant・slot: [生成契約JSON（例: button）](../../../gen/contracts/button.json)
- Rails固有prop: [property contract definitions](../../../lib/shadcn_view_components/property_contract_definitions.rb)
- JavaScript・操作・代表preview: [coverage registry](../../../spec/coverage/registry.yml)
- 意味上の仕様: [docs/reference/component-specifications/accordion-dialog.yml](../component-specifications/accordion-dialog.yml)、[docs/reference/component-specifications/direction-pagination.yml](../component-specifications/direction-pagination.yml)、[docs/reference/component-specifications/popover-tooltip.yml](../component-specifications/popover-tooltip.yml)

initializerやpreviewを変更したのに生成ページを更新しなかった場合、`bundle exec rake docs:check`が失敗します。代表previewの全exampleは[request spec](../../../spec/requests/lookbook_previews_spec.rb)がHTTP描画するため、掲載例と実行例が分離しません。

## 共通のHTML属性

すべての公開クラスは、明示されたkeywordに加えて`**args`を受け取ります。`tag:`はBaseComponentの標準描画経路を使うクラスの要素、`class:`は契約クラスへ後勝ちで統合する追加クラスです。残りの`id:`、`data:`、`aria:`、`name:`などは各ページの「HTML attributesの適用先」に記載した要素へ渡ります。固定した内部要素を描くクラスや、表示要素と実フォーム要素を分ける複合フォームの例外も同じ節に明記します。

フォーム種別は、`native`がブラウザから単独で送信されるネイティブ要素、`composite`が表示UIと送信用要素の合成、`container`が子要素を束ねるだけ、`action`がフォーム送信を起こしうるボタン、`none`が送信値なしを表します。

## 一覧

| item | 主な公開クラス | クライアント側の動作 | フォーム |
|---|---|---|---|
| [`accordion`](accordion.md) | `Shadcn::Accordion` | `controller` | `none` |
| [`alert`](alert.md) | `Shadcn::Alert` | `static` | `none` |
| [`alert-dialog`](alert-dialog.md) | `Shadcn::AlertDialog` | `controller` | `none` |
| [`aspect-ratio`](aspect-ratio.md) | `Shadcn::AspectRatio` | `static` | `none` |
| [`attachment`](attachment.md) | `Shadcn::Attachment` | `static` | `none` |
| [`avatar`](avatar.md) | `Shadcn::Avatar` | `static` | `none` |
| [`badge`](badge.md) | `Shadcn::Badge` | `static` | `none` |
| [`breadcrumb`](breadcrumb.md) | `Shadcn::Breadcrumb` | `static` | `none` |
| [`bubble`](bubble.md) | `Shadcn::Bubble::Group` | `static` | `none` |
| [`button`](button.md) | `Shadcn::Button` | `native` | `action` |
| [`button-group`](button-group.md) | `Shadcn::ButtonGroup` | `static` | `none` |
| [`calendar`](calendar.md) | `Shadcn::Calendar` | `controller` | `none` |
| [`card`](card.md) | `Shadcn::Card` | `static` | `none` |
| [`carousel`](carousel.md) | `Shadcn::Carousel` | `controller` | `none` |
| [`chart`](chart.md) | `Shadcn::Chart::Container` | `static` | `none` |
| [`checkbox`](checkbox.md) | `Shadcn::Checkbox` | `controller` | `native` |
| [`collapsible`](collapsible.md) | `Shadcn::Collapsible` | `native` | `none` |
| [`combobox`](combobox.md) | `Shadcn::Combobox` | `controller` | `composite` |
| [`command`](command.md) | `Shadcn::Command` | `controller` | `none` |
| [`context-menu`](context-menu.md) | `Shadcn::ContextMenu` | `controller` | `none` |
| [`dialog`](dialog.md) | `Shadcn::Dialog` | `controller` | `none` |
| [`direction`](direction.md) | `Shadcn::DirectionProvider` | `static` | `none` |
| [`drawer`](drawer.md) | `Shadcn::Drawer` | `controller` | `none` |
| [`dropdown-menu`](dropdown-menu.md) | `Shadcn::DropdownMenu` | `controller` | `none` |
| [`empty`](empty.md) | `Shadcn::Empty` | `static` | `none` |
| [`field`](field.md) | `Shadcn::Field` | `static` | `container` |
| [`form`](form.md) | `Shadcn::Form::Item` | `native` | `container` |
| [`hover-card`](hover-card.md) | `Shadcn::HoverCard` | `controller` | `none` |
| [`input`](input.md) | `Shadcn::Input` | `static` | `native` |
| [`input-group`](input-group.md) | `Shadcn::InputGroup` | `static` | `container` |
| [`input-otp`](input-otp.md) | `Shadcn::InputOTP` | `controller` | `composite` |
| [`item`](item.md) | `Shadcn::Item` | `static` | `none` |
| [`kbd`](kbd.md) | `Shadcn::Kbd` | `static` | `none` |
| [`label`](label.md) | `Shadcn::Label` | `static` | `none` |
| [`marker`](marker.md) | `Shadcn::Marker` | `static` | `none` |
| [`menubar`](menubar.md) | `Shadcn::Menubar` | `controller` | `none` |
| [`message`](message.md) | `Shadcn::Message::Group` | `static` | `none` |
| [`message-scroller`](message-scroller.md) | `Shadcn::MessageScroller` | `controller` | `none` |
| [`native-select`](native-select.md) | `Shadcn::NativeSelect` | `native` | `native` |
| [`navigation-menu`](navigation-menu.md) | `Shadcn::NavigationMenu` | `controller` | `none` |
| [`pagination`](pagination.md) | `Shadcn::Pagination` | `static` | `none` |
| [`popover`](popover.md) | `Shadcn::Popover` | `controller` | `none` |
| [`progress`](progress.md) | `Shadcn::Progress` | `static` | `none` |
| [`radio-group`](radio-group.md) | `Shadcn::RadioGroup` | `controller` | `native` |
| [`resizable`](resizable.md) | `Shadcn::Resizable::PanelGroup` | `controller` | `none` |
| [`scroll-area`](scroll-area.md) | `Shadcn::ScrollArea` | `static` | `none` |
| [`select`](select.md) | `Shadcn::Select` | `controller` | `composite` |
| [`separator`](separator.md) | `Shadcn::Separator` | `static` | `none` |
| [`sheet`](sheet.md) | `Shadcn::Sheet` | `controller` | `none` |
| [`sidebar`](sidebar.md) | `Shadcn::Sidebar` | `controller` | `none` |
| [`skeleton`](skeleton.md) | `Shadcn::Skeleton` | `static` | `none` |
| [`slider`](slider.md) | `Shadcn::Slider` | `controller` | `native` |
| [`sonner`](sonner.md) | `Shadcn::Sonner::Toaster` | `event` | `none` |
| [`spinner`](spinner.md) | `Shadcn::Spinner` | `static` | `none` |
| [`switch`](switch.md) | `Shadcn::Switch` | `controller` | `native` |
| [`table`](table.md) | `Shadcn::Table` | `static` | `none` |
| [`tabs`](tabs.md) | `Shadcn::Tabs` | `controller` | `none` |
| [`textarea`](textarea.md) | `Shadcn::Textarea` | `static` | `native` |
| [`toggle`](toggle.md) | `Shadcn::Toggle` | `controller` | `none` |
| [`toggle-group`](toggle-group.md) | `Shadcn::ToggleGroup` | `controller` | `none` |
| [`tooltip`](tooltip.md) | `Shadcn::Tooltip` | `controller` | `none` |
