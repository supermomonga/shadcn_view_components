# frozen_string_literal: true

# ドリフト検知機構そのもののテスト(10-roadmap Phase 0 DoD の最重要検収項目)。
#
# upstreamを模したダミーアイテム(クラス変更済みfixture)から契約を生成し直したとき、
# 実装のレンダリング結果と契約が一致しなくなる(= 適合試験が赤になる)ことを検証する。
require "rails_helper"
require "digest"
require "tmpdir"
require "fileutils"
require "open3"

RSpec.describe "upstream drift detection", type: :conformance do
  let(:extractor_cli) { File.join(REPO_ROOT, "tools/extractor/src/cli.ts") }
  let(:pnpm) { ENV.fetch("PNPM_PATH", nil) || "pnpm" }

  it "a mutated upstream item produces a contract the implementation no longer matches" do
    Dir.mktmpdir("shadcn-drift-") do |tmp|
      vendor_dir = File.join(tmp, "vendor")
      FileUtils.cp_r(File.join(REPO_ROOT, "vendor/shadcn"), vendor_dir)

      # (1) upstreamがクラスを変更した、をシミュレート
      item_path = File.join(vendor_dir, "registry/items/button.json")
      item = JSON.parse(File.read(item_path))
      mutated_content = item["files"][0]["content"].sub(
        "inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium",
        "flex flex-row-reverse items-start justify-start gap-4 rounded-full text-lg font-bold"
      )
      expect(mutated_content).not_to eq(item["files"][0]["content"]), "fixture mutation did not apply"

      item["files"][0]["content"] = mutated_content
      File.write(item_path, "#{JSON.pretty_generate(item)}\n")

      # (2) 同期が正常に行われた想定でmanifestのsha256を更新
      manifest_path = File.join(vendor_dir, "manifest.json")
      manifest = JSON.parse(File.read(manifest_path))
      manifest["items"]["button"]["sha256"] = Digest::SHA256.file(item_path).hexdigest
      File.write(manifest_path, "#{JSON.pretty_generate(manifest)}\n")

      # (3) 変異済みスナップショットから生成
      gen_dir = File.join(tmp, "gen")
      ruby_dir = File.join(tmp, "ruby")
      css_file = File.join(tmp, "shadcn.css")
      command = [
        pnpm, "-C", File.join(REPO_ROOT, "tools/extractor"), "exec", "tsx", extractor_cli, "generate",
        "--vendor", vendor_dir, "--gen", gen_dir, "--ruby-out", ruby_dir, "--css-out", css_file
      ]
      stdout, stderr, status = Open3.capture3(*command)
      expect(status.success?).to be(true), "extractor failed:\n#{stdout}\n#{stderr}"

      mutated_contract = JSON.parse(File.read(File.join(gen_dir, "button.json")))
      expected_classes = mutated_contract.dig("exports", "Button", "combinations", "size=default&variant=default")

      # (4) 変異は契約に現れている
      expect(expected_classes).to include("flex-row-reverse")
      expect(expected_classes).to include("rounded-full")

      # (5) 実装のレンダリングは(まだ)古い契約どおり = 適合試験がここで赤になる
      render_inline(Shadcn::Button.new)
      rendered_classes = rendered_root_element["class"].split

      expect(rendered_classes).not_to eq(expected_classes.split),
                                      "mutated upstream contract unexpectedly matches the implementation; drift would go undetected"
      expect(rendered_classes).to include("inline-flex")
      expect(rendered_classes).not_to include("flex-row-reverse")
    end
  end
end
