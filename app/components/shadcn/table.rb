# typed: strict
# frozen_string_literal: true

module Shadcn
  class Table < BaseComponent
    # upstream は table を overflow-x-auto のラッパーdivで挟む構造。
    # 契約のルート(table-container)は cn を経ない静的クラス(static_attributes["class"])を持ち、
    # 契約クラス(combinations)は内側の table 要素が持つ(CLASSES_SLOT = "table")
    sig { override.returns(String) }
    def call
      content_tag(:div, class: container_class, data: { slot: contract_root_slot[:name] }) do
        content_tag(:table, **table_attributes) { content }
      end
    end

    private

    sig { returns(T.nilable(String)) }
    def container_class
      T.cast(contract_root_slot[:static_attributes], T::Hash[Symbol, T.untyped])[:class]
    end

    # 内側の table に契約クラスを適用する。ラッパーの静的クラスは混ぜない
    sig { returns(T::Hash[Symbol, T.untyped]) }
    def table_attributes
      attributes = @html_args.merge(
        class: self.class.classes(extra: @user_class),
        data: { slot: self.class.contract.const_get(:CLASSES_SLOT) }
      )
      merge_nested(attributes, :aria, {})
      attributes
    end

    class Header < BaseComponent; end

    class Body < BaseComponent; end

    class Footer < BaseComponent; end

    class Head < BaseComponent; end

    class Row < BaseComponent; end

    class Cell < BaseComponent; end

    class Caption < BaseComponent; end
  end
end
