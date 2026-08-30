# コンポーネントリファレンスの手書き仕様

`docs/components/` は、Ruby実装とregistryから機械取得できる情報に、このディレクトリのYAMLを合わせて生成します。

YAMLには、コードから安全に推測できない次の意味上の仕様だけを記載します。

- 主コンポーネントと組み合わせる必須・任意の公開コンポーネント（描画する主コンポーネント自体はregistryから取得）
- HTML attributesの適用先と例外
- フォームの`name`・送信値・disabled時の扱い
- server初期値とbrowser側状態の境界
- browser APIとキーボード操作
- upstreamとの差異と未対応機能

`state.mode`は次の境界を表します。`static`はitem自身に変更可能な状態がなく、`server`はサーバー描画値だけ、`native`はStimulusを介さずネイティブ要素が実行時状態を持つ場合です。`uncontrolled`は初期値だけをRubyから受け取り、接続後はStimulusまたはbrowser側が状態を所有して外部controlled APIを持たない場合です。

実装済みitemとの完全一致、schema、公開クラス名、フォーム記述は`docs:check`と契約specが検証します。変更後は次を実行してください。

```bash
bundle exec rake docs:generate
bundle exec rake docs:check
```

生成後のMarkdownは直接編集しません。代表例はcoverage registryが指定するLookbook previewのソースをそのまま掲載し、同じpreviewをrequest specがHTTP描画します。
