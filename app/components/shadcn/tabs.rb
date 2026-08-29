# typed: strict
# frozen_string_literal: true

module Shadcn
  # ARIA tabs パターン + roving tabindex(10-roadmap Phase 2 / 05 §4)。
  # 選択状態は data-state で持ち、パネルの表示切替もコントローラが行う
  # JS無効時フォールバック: Readable(SSRされた全パネルが展開された状態で出力される)
  class Tabs < BaseComponent
    CONTROLLER = "shadcn--tabs"

    sig { params(orientation: T.any(Symbol, String), args: T::Hash[Symbol, T.untyped]).void.checked(:never) }
    def initialize(orientation: "horizontal", **args)
      @orientation = T.let(orientation.to_s, String)
      super(**args)
    end

    sig { override.returns(T::Hash[Symbol, T.untyped]) }
    def contract_data_attributes
      super.merge(
        controller: CONTROLLER,
        orientation: @orientation
      )
    end

    class List < BaseComponent
      sig do
        params(
          variant: T.any(Symbol, String),
          orientation: T.any(Symbol, String),
          args: T::Hash[Symbol, T.untyped]
        ).void.checked(:never)
      end
      def initialize(variant: ShadcnViewComponents::Contracts::Tabs::List::DEFAULTS.fetch(:variant),
                     orientation: "horizontal", **args)
        @variant = T.let(normalize_option(:variant, variant), Symbol)
        @orientation = T.let(orientation.to_s, String)
        super(**args)
      end

      sig { override.returns(T::Hash[Symbol, VariantOption]) }
      def variant_options
        { variant: @variant }
      end

      sig { override.returns(T::Hash[Symbol, T.untyped]) }
      def html_attributes
        attributes = super
        merge_nested(attributes, :data, { variant: @variant })
        merge_nested(attributes, :aria, { orientation: @orientation })
        attributes[:role] = "tablist"
        attributes
      end
    end

    class Trigger < BaseComponent
      CONTROLLER = "shadcn--tabs"

      sig do
        params(
          value: T.nilable(String),
          active: T::Boolean,
          args: T::Hash[Symbol, T.untyped]
        ).void.checked(:never)
      end
      def initialize(value: nil, active: false, **args)
        @value = value
        @active = active
        super(**args)
      end

      sig { override.returns(String) }
      def default_tag
        "button"
      end

      sig { override.returns(T::Hash[Symbol, T.untyped]) }
      def html_attributes
        attributes = super
        # base-nova は選択状態を data-active(属性の存在)で表現する
        state_attributes = @active ? { active: "" } : {}
        merge_nested(attributes, :data, {
          value: @value
        }.compact.merge(state_attributes))
        merge_nested(attributes, :aria, { selected: @active.to_s })
        attributes[:role] = "tab"
        attributes[:tabindex] = @active ? 0 : -1
        attributes[:type] = "button" unless attributes.key?(:type) || tag == "a"
        attributes
      end

      # contract_data_attributes の slot に action を足す(ルートが button のため)
      sig { override.returns(T::Hash[Symbol, T.untyped]) }
      def contract_data_attributes
        super.merge(
          action: "click->#{CONTROLLER}#select keydown->#{CONTROLLER}#navigate"
        )
      end
    end

    class Content < BaseComponent
      sig { params(value: T.nilable(String), args: T::Hash[Symbol, T.untyped]).void.checked(:never) }
      def initialize(value: nil, **args)
        @value = value
        super(**args)
      end

      sig { override.returns(T::Hash[Symbol, T.untyped]) }
      def html_attributes
        attributes = super
        merge_nested(attributes, :data, { value: @value }.compact)
        attributes[:role] = "tabpanel"
        attributes
      end
    end
  end
end
