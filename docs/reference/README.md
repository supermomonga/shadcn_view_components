# ドキュメント案内

`shadcn_view_components` のドキュメントは、役割ごとに次の階層へ分けています。

## 利用者向けガイド

- [コンポーネントAPIリファレンス](components/README.md) — 全公開クラスのinitializer、slot、HTML属性、フォーム送信、状態、JavaScript要件、upstreamとの差異
- [非対応コンポーネントと代替](../guides/unsupported-components.md) — `questionnaire` / `toast`の代替レシピと再評価条件

## 現行仕様

次の文書は、現在の実装・運用を理解し変更するメンテナー向けの参照資料です。採用理由と再評価条件は[ADR一覧](../adr/README.md)を正本とします。

- [プロジェクト概要](overview.md)
- [アーキテクチャとリポジトリ構成](architecture.md)
- [upstream同期](upstream-sync.md)
- [抽出・コード生成パイプライン](extraction-codegen.md)
- [コンポーネント実装規約](component-conventions.md)
- [Stimulus・Hotwire設計](stimulus-hotwire.md)
- [テーマ・Tailwind CSS](theming-tailwind.md)
- [テスト戦略](testing.md)
- [Sorbet型付け方針](sorbet.md)
- [CIとドリフト自動検知](ci-drift-detection.md)
- [サポートmatrix](support-matrix.md) — Ruby・Rails・Node・pnpm・ブラウザのサポート範囲と、CIでの検証構成

APIリファレンスはコードとregistryから生成します。コードから推測できない意味上の仕様は[component-specifications](component-specifications/README.md)に置き、生成済みの`components/`は直接編集しません。

## 設計判断と履歴

- [Architecture Decision Records](../adr/README.md) — 長期的な設計判断、選択肢、結果、再評価の根拠
- [初期ロードマップ](../history/initial-roadmap.md) — 完了済みPhase 0〜4の計画。現在の提供範囲や作業計画の正本ではありません

現在の提供範囲は[ルートREADME](../../README.md)と[coverage registry](../../spec/coverage/registry.yml)を参照してください。
