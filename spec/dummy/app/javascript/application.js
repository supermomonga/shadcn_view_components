// frozen_string_literal: false はJSには無関係。ホストアプリでの登録例そのもの(05-stimulus-hotwire §2.2)。
// エンジンの自動pinにより `import ... from "shadcn"` が解決されることを検証する。
import { Application } from "@hotwired/stimulus"
import { register } from "shadcn"

const application = Application.start()
register(application)

// システムスペック用マーカー: ESMチェーン(importmap → shadcnモジュール → register)が
// エラー無く実行されたことの証拠
document.documentElement.setAttribute("data-stimulus-ready", "1")
