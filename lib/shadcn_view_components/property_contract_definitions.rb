# typed: strict
# frozen_string_literal: true

module ShadcnViewComponents
  module PropertyContracts
    ORIENTATIONS = %w[horizontal vertical].freeze
    TOGGLE_STATES = %w[off on].freeze

    DEFINITIONS = T.let({
      progress: {
        value: { kind: :number, default: nil, allow_nil: true, minimum: 0, maximum: 100 }.freeze
      }.freeze,
      slider: {
        min: { kind: :number, default: 0 }.freeze,
        max: { kind: :number, default: 100 }.freeze,
        value: { kind: :number, default: nil, allow_nil: true }.freeze
      }.freeze,
      "sheet/content": {
        side: { kind: :enum, default: "right", values: %w[top right bottom left].freeze }.freeze
      }.freeze,
      "scroll_area/scrollbar": {
        orientation: { kind: :enum, default: "vertical", values: ORIENTATIONS }.freeze
      }.freeze,
      tabs: {
        orientation: { kind: :enum, default: "horizontal", values: ORIENTATIONS }.freeze
      }.freeze,
      "resizable/panel_group": {
        orientation: { kind: :enum, default: "horizontal", values: ORIENTATIONS }.freeze
      }.freeze,
      "resizable/handle": {
        orientation: { kind: :enum, default: "vertical", values: ORIENTATIONS }.freeze
      }.freeze,
      separator: {
        orientation: { kind: :enum, default: "horizontal", values: ORIENTATIONS }.freeze
      }.freeze,
      toggle: {
        state: { kind: :enum, default: "off", values: TOGGLE_STATES }.freeze
      }.freeze,
      toggle_group: {
        type: { kind: :enum, default: "multiple", values: %w[single multiple].freeze }.freeze,
        spacing: { kind: :number, default: 2, minimum: 0 }.freeze
      }.freeze,
      "toggle_group/item": {
        state: { kind: :enum, default: "off", values: TOGGLE_STATES }.freeze,
        spacing: { kind: :number, default: 2, minimum: 0 }.freeze
      }.freeze,
      direction_provider: {
        dir: { kind: :enum, default: "ltr", values: %w[ltr rtl].freeze }.freeze
      }.freeze,
      sidebar: {
        state: { kind: :enum, default: "open", values: %w[open closed].freeze }.freeze
      }.freeze,
      "sidebar/provider": {
        state: { kind: :enum, default: "open", values: %w[open closed].freeze }.freeze
      }.freeze,
      "sidebar/menu_sub_button": {
        size: { kind: :enum, default: "md", values: %w[sm md].freeze }.freeze
      }.freeze,
      "alert_dialog/content": {
        size: { kind: :enum, default: "default", values: %w[default sm].freeze }.freeze
      }.freeze,
      avatar: {
        size: { kind: :enum, default: "default", values: %w[default sm lg].freeze }.freeze
      }.freeze,
      switch: {
        size: { kind: :enum, default: "default", values: %w[default sm].freeze }.freeze
      }.freeze,
      "select/trigger": {
        size: { kind: :enum, default: "default", values: %w[default sm].freeze }.freeze
      }.freeze,
      native_select: {
        size: { kind: :enum, default: "default", values: %w[default sm].freeze }.freeze
      }.freeze,
      aspect_ratio: {
        ratio: { kind: :number, default: nil, allow_nil: true, minimum: 0, exclusive_minimum: true }.freeze
      }.freeze,
      input_otp: {
        length: { kind: :number, default: 6, integer: true, minimum: 1 }.freeze
      }.freeze
    }.freeze, T::Hash[Symbol, T::Hash[Symbol, T::Hash[Symbol, T.untyped]]])
  end
end
