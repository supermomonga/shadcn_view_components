# 設計ドキュメント

このディレクトリには、`shadcn_view_components` の公開設計資料を収録します。

## 現行の保守者向け資料

次の文書は、現在の実装・運用を理解し変更するメンテナー向けの資料です。

- [00 — プロジェクト概要](00-overview.md)
- [01 — アーキテクチャとリポジトリ構成](01-architecture.md)
- [02 — upstream同期](02-upstream-sync.md)
- [03 — 抽出・コード生成パイプライン](03-extraction-codegen.md)
- [04 — コンポーネント実装規約](04-component-conventions.md)
- [05 — Stimulus・Hotwire設計](05-stimulus-hotwire.md)
- [06 — テーマ・Tailwind CSS](06-theming-tailwind.md)
- [07 — テスト戦略](07-testing.md)
- [08 — Sorbet型付け方針](08-sorbet.md)
- [09 — CIとドリフト自動検知](09-ci-drift-detection.md)

## 履歴資料

- [10 — ロードマップ（Phase 0〜4）](10-roadmap.md)は、初期実装時のフェーズ分割と判断を保存する履歴資料です。Phase 0〜4は完了しているため、現在の実装状況や作業計画の情報源には使用しません。現在の提供範囲は[ルートREADME](../README.md)と[coverage registry](../spec/coverage/registry.yml)を参照してください。

各文書内に将来案が残る場合も、文書先頭のstatusと本文の時制に従って、現行仕様と履歴上の計画を区別してください。
