# frozen_string_literal: true

require "fileutils"
require "json"
require "prism"
require "sorbet-runtime"
require "uri"
require "yaml"

require_relative "../../lib/shadcn_view_components/property_contract_definitions"

module Documentation
  class ComponentReference
    Definition = Data.define(:name, :kind, :superclass, :includes, :initializer, :path, :line, :source)

    FORM_KINDS = %w[none native composite container action].freeze
    STATE_MODES = %w[static native server uncontrolled].freeze
    ENTRY_KEYS = %w[attributes browser composition form state summary upstream].freeze
    NESTED_KEYS = {
      "attributes" => %w[default_target exceptions],
      "browser" => %w[apis keyboard],
      "composition" => %w[notes required],
      "form" => %w[details kind],
      "state" => %w[details mode],
      "upstream" => %w[differences unsupported]
    }.freeze
    FLOATING_POSITION_KEYS = %w[side align side_offset align_offset collision_padding].freeze
    FLOATING_POSITION_VALUES = {
      "side" => "top / right / bottom / left / inline-start / inline-end",
      "align" => "start / center / end",
      "side_offset" => "有限の数値",
      "align_offset" => "有限の数値",
      "collision_padding" => "0以上の有限の数値"
    }.freeze
    CVA_CONSTRAINT_REFERENCES = {
      "Shadcn::AlertDialog::Action" => {
        "variant" => ["button", "Button"],
        "size" => ["button", "Button"]
      }.freeze,
      "Shadcn::AlertDialog::Cancel" => {
        "variant" => ["button", "Button"],
        "size" => ["button", "Button"]
      }.freeze,
      "Shadcn::InputGroup::Button" => {
        "variant" => ["button", "Button"]
      }.freeze,
      "Shadcn::Pagination::Link" => {
        "size" => ["button", "Button"]
      }.freeze,
      "Shadcn::ToggleGroup" => {
        "variant" => ["toggle-group", "ToggleGroupItem"],
        "size" => ["toggle-group", "ToggleGroupItem"]
      }.freeze
    }.freeze
    PROPERTY_CONSTRAINT_REFERENCES = {
      "Shadcn::ButtonGroup::Separator" => {
        "orientation" => [:separator, :orientation]
      }.freeze
    }.freeze

    attr_reader :root

    def initialize(root: File.expand_path("../..", __dir__))
      @root = root
    end

    def generate
      validate_metadata!
      FileUtils.mkdir_p(output_directory)
      expected_names = expected_files.keys
      actual_names = Dir.children(output_directory).select { |name| name.end_with?(".md") }
      (actual_names - expected_names).each { |name| File.delete(File.join(output_directory, name)) }
      expected_files.each { |name, contents| File.write(File.join(output_directory, name), contents) }
    end

    def check
      validate_metadata!
      actual_names = if Dir.exist?(output_directory)
                       Dir.children(output_directory).select { |name| name.end_with?(".md") }.sort
                     else
                       []
                     end
      expected_names = expected_files.keys.sort
      failures = []
      failures << "file set differs: expected #{expected_names.inspect}, got #{actual_names.inspect}" unless actual_names == expected_names
      expected_files.each do |name, expected|
        path = File.join(output_directory, name)
        failures << "#{relative(path)} is missing or stale" unless File.file?(path) && File.read(path) == expected
      end
      return if failures.empty?

      raise "component reference is stale; run `bundle exec rake docs:generate`\n#{failures.join("\n")}"
    end

    def expected_files
      @expected_files ||= { "README.md" => index_page }.merge(
        implemented_items.to_h { |item| ["#{item}.md", component_page(item)] }
      ).freeze
    end

    def implemented_items
      @implemented_items ||= component_registry.reject { |_item, entry| entry["pending"] }.keys.sort.freeze
    end

    def metadata
      @metadata ||= begin
        combined = {}
        metadata_paths.each do |path|
          document = YAML.safe_load_file(path, aliases: false)
          raise "#{relative(path)} must contain a mapping" unless document.is_a?(Hash)

          duplicates = combined.keys & document.keys
          raise "duplicate component reference entries: #{duplicates.sort.join(', ')}" unless duplicates.empty?

          combined.merge!(document)
        end
        combined.freeze
      end
    end

    def public_components(item)
      component_registry.fetch(item).fetch("exports").map { |entry| entry.fetch("component") }
    end

    def preview_source(item)
      preview_path = coverage_registry.fetch(item).fetch("preview").fetch("path")
      preview_name = preview_path.split("/")[0...-1].join("/")
      File.join(root, "spec/dummy/app/components/previews", "#{preview_name}_preview.rb")
    end

    def component_page(item)
      entry = metadata.fetch(item)
      coverage = coverage_registry.fetch(item)
      preview_path = coverage.fetch("preview").fetch("path")
      preview_file = preview_source(item)
      exports = component_registry.fetch(item).fetch("exports")
      main_component = exports.first.fetch("component")

      <<~MARKDOWN
        # `#{item}` — `#{main_component}`

        > このページはコード・registry・手書き仕様から生成されています。直接編集せず、[生成元](../component_reference/README.md)を更新して `bundle exec rake docs:generate` を実行してください。

        [コンポーネント一覧](README.md) / [実装](#{source_link_for_component(main_component)}) / [代表preview](#{relative_link(preview_file)})

        #{entry.fetch("summary")}

        ## 構成

        - 主コンポーネント: `#{main_component}`
        - 主コンポーネントと組み合わせる、常に必須のクラス: #{required_components_text(entry, except: main_component)}
        - このitemが公開する任意の補助クラス: #{optional_components_text(item, entry, main_component)}

        #{entry.dig("composition", "notes")}

        ## Ruby APIとslot

        `**args` の共通規則（`tag:`、`class:`、HTML属性）は[一覧ページ](README.md#共通のhtml属性)を参照してください。
        下表の`upstream data-slot`は見た目の契約に使うDOM識別子です。必須・任意の子構成は上の「構成」を正本とし、Rubyがフォーム送信等のために追加する内部要素は「HTML attributesの適用先」と「upstreamとの差異」に記載します。

        #{api_table(item, exports)}

        ## HTML attributesの適用先

        - 既定: #{entry.dig("attributes", "default_target")}
        #{bullet_lines(entry.dig("attributes", "exceptions"), empty: "例外なし。")}

        ## フォーム送信

        - 種別: `#{entry.dig("form", "kind")}`
        - #{entry.dig("form", "details")}

        ## 状態・JavaScript・キーボード

        - 状態モデル: `#{entry.dig("state", "mode")}` — #{entry.dig("state", "details")}
        - Stimulus: #{controller_text(coverage)}
        - browser API: #{inline_list(entry.dig("browser", "apis"), empty: "追加要件なし")}
        - keyboard: #{inline_list(entry.dig("browser", "keyboard"), empty: "コンポーネント固有操作なし")}
        - CIで確認する操作: #{system_coverage_text(coverage)}

        ## upstreamとの差異・未対応機能

        ### 差異

        #{bullet_lines(entry.dig("upstream", "differences"))}

        ### 未対応

        #{bullet_lines(entry.dig("upstream", "unsupported"), empty: "明示的な未対応機能なし。")}

        ## CIで描画する代表例を含むpreview定義

        `#{preview_path}` は [Lookbook request spec](../../spec/requests/lookbook_previews_spec.rb) がHTTP描画します。以下はそのexampleを含む [#{relative(preview_file)}](#{relative_link(preview_file)}) の全定義です。同じファイルにある他のexampleも同specが描画します。

        ```ruby
        #{preview_code(File.read(preview_file))}
        ```
      MARKDOWN
    end

    def validate_metadata!
      raise "component reference entries must exactly match implemented registry items" unless metadata.keys.sort == implemented_items

      metadata.each do |item, entry|
        validate_hash_keys!(entry, ENTRY_KEYS, item)
        validate_string!(entry["summary"], "#{item}.summary")
        NESTED_KEYS.each do |section, keys|
          value = entry.fetch(section)
          validate_hash_keys!(value, keys, "#{item}.#{section}")
        end

        validate_string!(entry.dig("composition", "notes"), "#{item}.composition.notes")
        validate_string_array!(entry.dig("composition", "required"), "#{item}.composition.required")
        unknown = entry.dig("composition", "required") - all_public_components
        raise "#{item}.composition.required has unknown classes: #{unknown.join(', ')}" unless unknown.empty?
        validate_string!(entry.dig("attributes", "default_target"), "#{item}.attributes.default_target")
        validate_string_array!(entry.dig("attributes", "exceptions"), "#{item}.attributes.exceptions")
        validate_enum!(entry.dig("form", "kind"), FORM_KINDS, "#{item}.form.kind")
        validate_string!(entry.dig("form", "details"), "#{item}.form.details")
        validate_enum!(entry.dig("state", "mode"), STATE_MODES, "#{item}.state.mode")
        validate_string!(entry.dig("state", "details"), "#{item}.state.details")
        validate_string_array!(entry.dig("browser", "apis"), "#{item}.browser.apis")
        validate_string_array!(entry.dig("browser", "keyboard"), "#{item}.browser.keyboard")
        validate_string_array!(entry.dig("upstream", "differences"), "#{item}.upstream.differences", empty: false)
        validate_string_array!(entry.dig("upstream", "unsupported"), "#{item}.upstream.unsupported")

        if %w[native composite action].include?(entry.dig("form", "kind"))
          form_details = entry.dig("form", "details")
          raise "#{item}.form.details must describe name" unless form_details.match?(/name/i)
          raise "#{item}.form.details must describe the submitted value" unless form_details.match?(/value|値|送信/i)
          raise "#{item}.form.details must describe disabled controls" unless form_details.match?(/disabled/i)
        end

        interaction = coverage_registry.fetch(item).fetch("interaction")
        accessibility_required = interaction.fetch("kind") != "static" || entry.dig("form", "kind") != "none"
        if accessibility_required && !entry.to_s.match?(/aria/i)
          raise "#{item} must document its current ARIA semantics or unsupported ARIA integration"
        end

        system_behaviors = coverage_registry.dig(item, "system", "behaviors") || []
        if system_behaviors.include?("keyboard") && entry.dig("browser", "keyboard").empty?
          raise "#{item} has keyboard system coverage but no documented keyboard operation"
        end

        next if interaction.fetch("kind") == "static"
        next unless entry.dig("browser", "apis").empty? && entry.dig("browser", "keyboard").empty?

        raise "#{item} is interactive but documents neither a browser API nor keyboard operation"
      end
      true
    end

    private

    def index_page
      rows = implemented_items.map do |item|
        entry = metadata.fetch(item)
        coverage = coverage_registry.fetch(item)
        primary = public_components(item).first
        "| [`#{item}`](#{item}.md) | `#{primary}` | `#{coverage.dig('interaction', 'kind')}` | `#{entry.dig('form', 'kind')}` |"
      end.join("\n")

      metadata_links = metadata_paths.map do |path|
        "[#{relative(path)}](../component_reference/#{File.basename(path)})"
      end.join("、")

      <<~MARKDOWN
        # コンポーネントAPIリファレンス

        このリファレンスは、実装済み#{implemented_items.length}アイテム・公開ViewComponent #{all_public_components.length}クラスを対象に、次の正本から決定論的に生成します。

        - 公開クラスと最小描画引数: [conformance registry](../../spec/conformance/registry.yml)
        - initializer: [BaseComponentと各公開クラス](../../app/components/shadcn/base_component.rb)
        - variant・slot: [生成契約JSON（例: button）](../../gen/contracts/button.json)
        - Rails固有prop: [property contract definitions](../../lib/shadcn_view_components/property_contract_definitions.rb)
        - JavaScript・操作・代表preview: [coverage registry](../../spec/coverage/registry.yml)
        - 意味上の仕様: #{metadata_links}

        initializerやpreviewを変更したのに生成ページを更新しなかった場合、`bundle exec rake docs:check`が失敗します。代表previewの全exampleは[request spec](../../spec/requests/lookbook_previews_spec.rb)がHTTP描画するため、掲載例と実行例が分離しません。

        ## 共通のHTML属性

        すべての公開クラスは、明示されたkeywordに加えて`**args`を受け取ります。`tag:`はBaseComponentの標準描画経路を使うクラスの要素、`class:`は契約クラスへ後勝ちで統合する追加クラスです。残りの`id:`、`data:`、`aria:`、`name:`などは各ページの「HTML attributesの適用先」に記載した要素へ渡ります。固定した内部要素を描くクラスや、表示要素と実フォーム要素を分ける複合フォームの例外も同じ節に明記します。

        フォーム種別は、`native`がブラウザから単独で送信されるネイティブ要素、`composite`が表示UIと送信用要素の合成、`container`が子要素を束ねるだけ、`action`がフォーム送信を起こしうるボタン、`none`が送信値なしを表します。

        ## 一覧

        | item | 主な公開クラス | クライアント側の動作 | フォーム |
        |---|---|---|---|
        #{rows}
      MARKDOWN
    end

    def api_table(item, exports)
      rows = exports.map do |export|
        component = export.fetch("component")
        definition = definitions.fetch(component) { raise "no Ruby definition found for #{component}" }
        initializer = initializer_for(component)
        signature = "`new(#{display_parameters(component, initializer)})`"
        signature += "<br>initializerは#{initializer.name}で定義" if initializer.name != component
        constraints = constraints_for(item, export, component, initializer)
        slots = slots_for(item, export)
        "| [`#{component}`](#{relative_link(File.join(root, definition.path), line: definition.line)}) | #{escape_cell(signature)} | #{escape_cell(constraints)} | #{escape_cell(slots)} |"
      end

      [
        "| class | initializer | 既定値・許容値 | upstream data-slot |",
        "|---|---|---|---|",
        *rows
      ].join("\n")
    end

    def constraints_for(item, export, component, initializer)
      constraints = []
      documented_properties = []
      contract = contract_export(item, export.fetch("export"))
      if contract
        cva = contract.fetch("cva")
        combinations = contract.fetch("combinations").keys
        cva.fetch("prop_names").each do |property|
          values = combinations.flat_map { |combination| query_values(combination, property) }.uniq.sort
          parameter = initializer_keyword_parameters(initializer)[property]
          default = parameter&.fetch(:required) ? nil : cva.fetch("defaults")[property]
          constraints << format_constraint(property, values:, default:)
          documented_properties << property
        end
      end

      property_contracts_for(component).each do |property, specification|
        constraints << format_property_contract(property, specification, initializer:)
        documented_properties << property.to_s
      end

      if effective_feature?(component, "Shadcn::ButtonStyled")
        button_contract = contract_export("button", "Button")
        button_contract.fetch("cva").fetch("prop_names").each do |property|
          next if documented_properties.include?(property)

          values = button_contract.fetch("combinations").keys.flat_map { |key| query_values(key, property) }.uniq.sort
          constraints << "button #{property}: #{values.join(', ')} (未指定時は装飾を追加しない)"
          documented_properties << property
        end
      end

      CVA_CONSTRAINT_REFERENCES.fetch(component, {}).each do |property, (referenced_item, referenced_export)|
        next if documented_properties.include?(property)

        referenced_contract = contract_export(referenced_item, referenced_export)
        values = referenced_contract.fetch("combinations").keys.flat_map { |key| query_values(key, property) }.uniq.sort
        constraints << format_referenced_constraint(property, values, initializer)
        documented_properties << property
      end

      PROPERTY_CONSTRAINT_REFERENCES.fetch(component, {}).each do |property, (contract_key, contract_property)|
        next if documented_properties.include?(property)

        specification = ShadcnViewComponents::PropertyContracts::DEFINITIONS.fetch(contract_key).fetch(contract_property)
        constraints << format_referenced_property_contract(property, specification, initializer)
        documented_properties << property
      end

      if effective_feature?(component, "Shadcn::FloatingPositionOptions")
        defaults = floating_position_defaults(floating_position_definition(component))
        FLOATING_POSITION_KEYS.each do |property|
          constraints << "#{property}: #{FLOATING_POSITION_VALUES.fetch(property)} (default: #{defaults.fetch(property)})"
        end
      end

      constraints.empty? ? "追加制約なし（signatureどおり）" : constraints.join("<br>")
    end

    def format_constraint(property, values:, default:)
      suffix = default.nil? ? "" : " (default: #{default})"
      "#{property}: #{values.join(', ')}#{suffix}"
    end

    def query_values(query, property)
      URI.decode_www_form(query).filter_map { |name, value| value if name == property }
    end

    def format_property_contract(property, specification, initializer:)
      details = []
      details << specification.fetch(:values).join(", ") if specification[:values]
      details << "number" if specification[:kind] == :number
      details << "integer" if specification[:integer]
      details << "> #{specification.fetch(:minimum)}" if specification[:exclusive_minimum]
      details << ">= #{specification.fetch(:minimum)}" if specification.key?(:minimum) && !specification[:exclusive_minimum]
      details << "<= #{specification.fetch(:maximum)}" if specification.key?(:maximum)
      details << "nil可" if specification[:allow_nil]
      parameter = initializer_parameter(initializer, property)
      suffix = parameter.fetch(:required) ? "" : " (default: #{specification[:default].inspect})"
      "#{property}: #{details.join(', ')}#{suffix}"
    end

    def format_referenced_constraint(property, values, initializer)
      parameter = initializer_parameter(initializer, property)
      suffix = parameter.fetch(:required) ? "" : " (default: #{parameter.fetch(:default)})"
      "#{property}: #{values.join(', ')}#{suffix}"
    end

    def format_referenced_property_contract(property, specification, initializer)
      details = specification.fetch(:values).join(", ")
      parameter = initializer_parameter(initializer, property)
      suffix = parameter.fetch(:required) ? "" : " (default: #{parameter.fetch(:default)})"
      "#{property}: #{details}#{suffix}"
    end

    def slots_for(item, export)
      contract = contract_export(item, export.fetch("export"))
      names = if contract
                contract.fetch("slots").map { |slot| slot.fetch("name") }.reject(&:empty?).uniq
              else
                custom_contract_slots(export.fetch("component"))
              end
      names.empty? ? "なし" : names.map { |name| "`#{name}`" }.join("<br>")
    end

    def custom_contract_slots(component)
      require_relative "../../lib/shadcn_view_components/contracts/calendar"
      names = component.delete_prefix("Shadcn::").split("::")
      contract = names.reduce(ShadcnViewComponents::Contracts) { |namespace, name| namespace.const_get(name) }
      contract.const_get(:SLOTS).map { |slot| slot.fetch(:name) }.reject(&:empty?).uniq
    end

    def contract_export(item, export)
      path = File.join(root, "gen/contracts", "#{item}.json")
      return unless File.file?(path)

      contract_documents[item] ||= JSON.parse(File.read(path))
      contract_documents.fetch(item).fetch("exports").fetch(export)
    end

    def contract_documents
      @contract_documents ||= {}
    end

    def property_contracts_for(component)
      key = underscore(component.delete_prefix("Shadcn::")).to_sym
      ShadcnViewComponents::PropertyContracts::DEFINITIONS.fetch(key, {})
    end

    def initializer_parameter(initializer, property)
      initializer_keyword_parameters(initializer).fetch(property.to_s) do
        raise "#{initializer.name} property contract references unknown initializer keyword #{property}"
      end
    end

    def initializer_keyword_parameters(initializer)
      @initializer_keyword_parameters ||= {}
      @initializer_keyword_parameters[[initializer.name, initializer.initializer]] ||= begin
        parsed = Prism.parse("def initialize(#{initializer.initializer})\nend")
        raise "cannot parse initializer for #{initializer.name}" unless parsed.success?

        parameters = parsed.value.statements.body.fetch(0).parameters
        parameters.keywords.to_h do |keyword|
          required = keyword.is_a?(Prism::RequiredKeywordParameterNode)
          default = required ? nil : keyword.value.location.slice
          [keyword.name.to_s, { required:, default: }.freeze]
        end.freeze
      end
    end

    def display_parameters(component, initializer)
      return initializer.initializer unless effective_feature?(component, "Shadcn::FloatingPositionOptions")

      defaults = floating_position_defaults(floating_position_definition(component))
      expanded = FLOATING_POSITION_KEYS.map { |key| "#{key}: #{defaults.fetch(key)}" }.join(", ")
      initializer.initializer == "**args" ? "#{expanded}, **args" : initializer.initializer.sub("**args", "#{expanded}, **args")
    end

    def effective_feature?(component, feature)
      method_lookup_definitions(component).any? { |definition| definition.name == feature }
    end

    def floating_position_definition(component)
      method_lookup_definitions(component).find do |definition|
        definition.source.match?(/FLOATING_POSITION_DEFAULTS\s*=/)
      end || raise("#{component} uses FloatingPositionOptions without FLOATING_POSITION_DEFAULTS")
    end

    def floating_position_defaults(definition)
      body = definition.source.match(/FLOATING_POSITION_DEFAULTS\s*=\s*T\.let\(\s*\{(?<values>.*?)\}\.freeze/m)&.[](:values)
      raise "#{definition.name} includes FloatingPositionOptions without FLOATING_POSITION_DEFAULTS" unless body

      values = body.scan(/([a-z_]+):\s*([^,\n}]+)/).to_h.transform_values(&:strip)
      missing = FLOATING_POSITION_KEYS - values.keys
      raise "#{definition.name} floating defaults are missing: #{missing.join(', ')}" unless missing.empty?

      values
    end

    def initializer_for(component)
      method_lookup_definitions(component).find(&:initializer) || raise("no initializer found for #{component}")
    end

    def method_lookup_definitions(component, ancestors = [])
      raise "Ruby ancestor cycle: #{(ancestors + [component]).join(' -> ')}" if ancestors.include?(component)

      definition = definitions.fetch(component) { raise "no Ruby definition found for #{component}" }
      chain = [definition]
      definition.includes.reverse_each do |included_reference|
        included = resolve_reference(included_reference, component)
        next unless definitions.key?(included)

        chain.concat(method_lookup_definitions(included, ancestors + [component]))
      end

      superclass = resolve_reference(definition.superclass, component)
      if superclass.nil? && definition.kind == :class && component != "Shadcn::BaseComponent"
        superclass = "Shadcn::BaseComponent"
      end
      chain.concat(method_lookup_definitions(superclass, ancestors + [component])) if superclass
      chain
    end

    def resolve_reference(reference, owner)
      return if reference.nil? || reference.empty?

      normalized = reference.delete_prefix("::")
      return normalized if definitions.key?(normalized)

      namespace = owner.split("::")[0...-1]
      until namespace.empty?
        candidate = (namespace + [normalized]).join("::")
        return candidate if definitions.key?(candidate)
        namespace.pop
      end
      candidate = "Shadcn::#{normalized}"
      definitions.key?(candidate) ? candidate : nil
    end

    def definitions
      @definitions ||= begin
        result = {}
        component_paths = Dir[File.join(root, "app/components/shadcn/**/*.rb")]
        component_paths.sort_by { |path| [path.split(File::SEPARATOR).length, path] }.each do |path|
          parsed = Prism.parse_file(path)
          unless parsed.success?
            messages = parsed.errors.map(&:message).join(", ")
            raise "cannot parse #{relative(path)}: #{messages}"
          end
          index_definitions(parsed.value, [], relative(path), result)
        end
        result.freeze
      end
    end

    def index_definitions(node, namespace, path, result)
      case node
      when Prism::ClassNode, Prism::ModuleNode
        local_name = node.constant_path.location.slice.delete_prefix("::")
        name = qualify_constant(local_name, namespace)
        body_nodes = statement_nodes(node.body)
        initializer = body_nodes.find { |child| child.is_a?(Prism::DefNode) && child.name == :initialize }
        includes = body_nodes.filter_map do |child|
          next unless child.is_a?(Prism::CallNode) && child.receiver.nil? && child.name == :include

          child.arguments&.arguments&.map { |argument| argument.location.slice.delete_prefix("::") }
        end.flatten
        current = Definition.new(
          name:,
          kind: node.is_a?(Prism::ClassNode) ? :class : :module,
          superclass: node.is_a?(Prism::ClassNode) ? node.superclass&.location&.slice : nil,
          includes:,
          initializer: initializer&.parameters&.location&.slice || (initializer ? "" : nil),
          path:,
          line: node.location.start_line,
          source: node.location.slice
        )
        result[name] = result.key?(name) ? merge_definitions(result.fetch(name), current) : current
        body_nodes.each { |child| index_definitions(child, name.split("::"), path, result) }
      else
        node.compact_child_nodes.each { |child| index_definitions(child, namespace, path, result) }
      end
    end

    def merge_definitions(existing, current)
      raise "#{existing.name} is reopened with a different kind" unless existing.kind == current.kind

      superclasses = [existing.superclass, current.superclass].compact.uniq
      raise "#{existing.name} is reopened with conflicting superclasses: #{superclasses.join(', ')}" if superclasses.length > 1
      if existing.initializer && current.initializer
        raise "#{existing.name} defines initialize in more than one class body"
      end

      initializer_from_current = existing.initializer.nil? && !current.initializer.nil?
      Definition.new(
        name: existing.name,
        kind: existing.kind,
        superclass: superclasses.first,
        includes: (existing.includes + current.includes).uniq.freeze,
        initializer: existing.initializer || current.initializer,
        path: initializer_from_current ? current.path : existing.path,
        line: initializer_from_current ? current.line : existing.line,
        source: "#{existing.source}\n#{current.source}"
      )
    end

    def qualify_constant(name, namespace)
      return name if name.include?("::")

      (namespace + [name]).join("::")
    end

    def statement_nodes(body)
      return [] unless body
      return body.body if body.is_a?(Prism::StatementsNode)

      body.compact_child_nodes
    end

    def required_components_text(entry, except: nil)
      required = entry.dig("composition", "required") - [except].compact
      required.empty? ? "なし" : required.map { |component| "`#{component}`" }.join("、")
    end

    def optional_components_text(item, entry, main_component)
      optional = public_components(item) - [main_component] - entry.dig("composition", "required")
      optional.empty? ? "なし" : optional.map { |component| "`#{component}`" }.join("、")
    end

    def controller_text(coverage)
      controllers = coverage.dig("interaction", "controllers")
      controllers.empty? ? "不要" : controllers.map { |controller| "`#{controller}`" }.join("、")
    end

    def system_coverage_text(coverage)
      system = coverage.fetch("system")
      return system.fetch("behaviors").map { |behavior| "`#{behavior}`" }.join("、") if system["specs"]

      "対象外 — #{system.dig('excluded', 'reason')}"
    end

    def bullet_lines(values, empty: nil)
      return "- #{empty}" if values.empty? && empty

      values.map { |value| "- #{value}" }.join("\n")
    end

    def inline_list(values, empty:)
      values.empty? ? empty : values.join(" / ")
    end

    def preview_code(source)
      source.rstrip
    end

    def escape_cell(value)
      value.to_s.gsub("|", "\\|").gsub("\n", "<br>")
    end

    def relative_link(path, line: nil)
      from = Pathname.new(output_directory)
      target = Pathname.new(path)
      link = target.relative_path_from(from).to_s
      line ? "#{link}#L#{line}" : link
    end

    def source_link_for_component(component)
      definition = definitions.fetch(component)
      relative_link(File.join(root, definition.path), line: definition.line)
    end

    def relative(path)
      Pathname.new(path).relative_path_from(Pathname.new(root)).to_s
    end

    def underscore(value)
      value.gsub("::", "/")
           .gsub(/([A-Z]+)([A-Z][a-z])/, '\\1_\\2')
           .gsub(/([a-z\d])([A-Z])/, '\\1_\\2')
           .tr("-", "_")
           .downcase
    end

    def validate_hash_keys!(value, expected, label)
      raise "#{label} must be a mapping" unless value.is_a?(Hash)
      raise "#{label} keys must be #{expected.inspect}, got #{value.keys.sort.inspect}" unless value.keys.sort == expected
    end

    def validate_string!(value, label)
      raise "#{label} must be a non-empty string" unless value.is_a?(String) && !value.strip.empty?
    end

    def validate_string_array!(value, label, empty: true)
      raise "#{label} must be an array of non-empty strings" unless value.is_a?(Array) && value.all? { |entry| entry.is_a?(String) && !entry.strip.empty? }
      raise "#{label} must not be empty" if !empty && value.empty?
      raise "#{label} must not contain duplicates" unless value.uniq == value
    end

    def validate_enum!(value, allowed, label)
      raise "#{label} must be one of #{allowed.join(', ')}" unless allowed.include?(value)
    end

    def component_registry
      @component_registry ||= YAML.safe_load_file(File.join(root, "spec/conformance/registry.yml"), aliases: false)
    end

    def coverage_registry
      @coverage_registry ||= YAML.safe_load_file(File.join(root, "spec/coverage/registry.yml"), aliases: false)
    end

    def metadata_paths
      @metadata_paths ||= Dir[File.join(root, "docs/component_reference/*.yml")].sort.freeze
    end

    def all_public_components
      @all_public_components ||= implemented_items.flat_map { |item| public_components(item) }.uniq.sort.freeze
    end

    def output_directory
      File.join(root, "docs/components")
    end
  end
end

if $PROGRAM_NAME == __FILE__
  command = ARGV.fetch(0, "check")
  reference = Documentation::ComponentReference.new
  case command
  when "generate" then reference.generate
  when "check" then reference.check
  else raise ArgumentError, "unknown command #{command.inspect} (valid: generate, check)"
  end
end
