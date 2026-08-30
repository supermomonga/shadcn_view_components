# typed: strict
# frozen_string_literal: true

module Shadcn
  # Checkbox / Radio / Switch が共有する、ネイティブ input の checked 状態を
  # upstream 契約の data 属性へ投影するための内部実装。
  module NativeCheckedState
    extend T::Sig

    CONTROLLER = "shadcn--checked-state"
    CHANGE_ACTION = T.let("change->#{CONTROLLER}#sync".freeze, String)

    private

    sig { params(attributes: T::Hash[Symbol, T.untyped], checked: T::Boolean).void }
    def merge_native_checked_state(attributes, checked:)
      attributes[:data] = native_checked_data_attributes(attributes[:data], checked:)
      normalize_explicit_aria_checked(attributes, checked:)
    end

    sig { params(raw_data: T.untyped, checked: T::Boolean).returns(T::Hash[T.untyped, T.untyped]) }
    def native_checked_data_attributes(raw_data, checked:)
      data = T.cast(raw_data, T.nilable(T::Hash[T.untyped, T.untyped])) || {}
      data = data.dup
      user_controller = delete_native_data_value(data, :controller)
      user_action = delete_native_data_value(data, :action)
      delete_native_data_value(data, :checked)
      delete_native_data_value(data, :unchecked)
      data[:controller] = compose_checked_state_tokens(CONTROLLER, user_controller)
      data[:action] = compose_checked_state_tokens(CHANGE_ACTION, user_action)
      data[checked ? :checked : :unchecked] = ""
      data
    end

    sig { params(data: T::Hash[T.untyped, T.untyped], key: Symbol).returns(T.untyped) }
    def delete_native_data_value(data, key)
      symbol_value = data.delete(key)
      string_value = data.delete(key.to_s)
      symbol_value || string_value
    end

    sig { params(html_args: T::Hash[Symbol, T.untyped]).returns(T::Boolean) }
    def native_checked?(html_args)
      value = html_args[:checked]
      !value.nil? && value != false
    end

    sig { params(checked: T::Boolean).returns(T::Hash[Symbol, String]) }
    def native_checked_data(checked:)
      checked ? { checked: "" } : { unchecked: "" }
    end

    sig { params(tokens: T.untyped).returns(String) }
    def compose_checked_state_tokens(*tokens)
      tokens.compact.flat_map { |token| token.to_s.split }.uniq.join(" ")
    end

    sig { params(attributes: T::Hash[Symbol, T.untyped], checked: T::Boolean).void }
    def normalize_explicit_aria_checked(attributes, checked:)
      aria = T.cast(attributes[:aria], T.nilable(T::Hash[T.untyped, T.untyped]))
      if aria&.key?(:checked) || aria&.key?("checked")
        normalized = aria.dup
        normalized.delete("checked")
        normalized[:checked] = checked.to_s
        attributes[:aria] = normalized
      end

      key = :"aria-checked"
      attributes[key] = checked.to_s if attributes.key?(key)
    end
  end

  private_constant :NativeCheckedState
end
