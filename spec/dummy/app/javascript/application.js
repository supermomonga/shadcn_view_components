// frozen_string_literal: false はJSには無関係。ホストアプリでの登録例そのもの(05-stimulus-hotwire §2.2)。
// エンジンの自動pinによりpackage固有名が解決されることを検証する。
import "@hotwired/turbo-rails"
import { Application } from "@hotwired/stimulus"
import { register } from "@supermomonga/shadcn-view-components"

const application = Application.start()

register(application)

// システムスペック用マーカー: ESMチェーン(importmap → shadcnモジュール → register)が
// エラー無く実行されたことの証拠
document.documentElement.setAttribute("data-stimulus-ready", "1")
