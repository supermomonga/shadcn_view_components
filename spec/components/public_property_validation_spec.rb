# frozen_string_literal: true

require "rails_helper"

RSpec.describe "public property validation", type: :component do
  describe ShadcnViewComponents::PropertyContracts do
    it "defines a valid default for every declared property" do
      described_class::DEFINITIONS.each do |component, properties|
        properties.each do |property, definition|
          normalized = described_class.normalize(
            component:,
            owner: component.to_s,
            property:,
            value: definition.fetch(:default)
          )
          expect(normalized).to eq(definition.fetch(:default)), "invalid default for #{component}.#{property}"
        end
      end
    end
  end

  enum_contracts = [
    [Shadcn::Sheet::Content, :side, %w[top right bottom left], "right"],
    [Shadcn::ScrollArea::Scrollbar, :orientation, %w[horizontal vertical], "vertical"],
    [Shadcn::Tabs, :orientation, %w[horizontal vertical], "horizontal"],
    [Shadcn::Carousel, :orientation, %w[horizontal vertical], "horizontal"],
    [Shadcn::Carousel, :direction, %w[ltr rtl], "ltr"],
    [Shadcn::Resizable::PanelGroup, :orientation, %w[horizontal vertical], "horizontal"],
    [Shadcn::Resizable::Handle, :orientation, %w[horizontal vertical], "vertical"],
    [Shadcn::Separator, :orientation, %w[horizontal vertical], "horizontal"],
    [Shadcn::Toggle, :state, %w[off on], "off"],
    [Shadcn::ToggleGroup, :type, %w[single multiple], "multiple"],
    [Shadcn::ToggleGroup::Item, :state, %w[off on], "off"],
    [Shadcn::DirectionProvider, :dir, %w[ltr rtl], "ltr"],
    [Shadcn::Sidebar, :state, %w[open closed], "open"],
    [Shadcn::Sidebar::Provider, :state, %w[open closed], "open"],
    [Shadcn::Sidebar::MenuSubButton, :size, %w[sm md], "md"],
    [Shadcn::AlertDialog::Content, :size, %w[default sm], "default"],
    [Shadcn::Avatar, :size, %w[default sm lg], "default"],
    [Shadcn::Switch, :size, %w[default sm], "default"],
    [Shadcn::Select::Trigger, :size, %w[default sm], "default"],
    [Shadcn::NativeSelect, :size, %w[default sm], "default"]
  ]

  enum_contracts.each do |component_class, property, values, default|
    describe "#{component_class}##{property}" do
      it "publishes its allowed values and default" do
        expect(component_class.property_contract(property)).to eq(
          kind: :enum,
          default:,
          values:
        )
      end

      it "accepts every allowed String and Symbol" do
        values.each do |value|
          expect { component_class.new(**{ property => value }) }.not_to raise_error
          expect { component_class.new(**{ property => value.to_sym }) }.not_to raise_error
        end
      end

      it "rejects unknown, nil, and non-string values during initialization" do
        hostile_value = Class.new do
          define_method(:to_s) { raise "enum validation must reject this type before coercion" }
        end.new

        [:unknown, nil, 1, Object.new, hostile_value].each do |value|
          expect { component_class.new(**{ property => value }) }
            .to raise_error(ArgumentError, /#{Regexp.escape(component_class.to_s)} #{property} must be one of/)
        end
      end
    end
  end

  describe "normalized enum output" do
    it "emits only normalized side, orientation, type, state, direction, and size values" do
      render_inline(Shadcn::Sheet::Content.new(side: :left)) { "Sheet" }
      expect(rendered_root_element["data-side"]).to eq("left")

      render_inline(Shadcn::Separator.new(orientation: :vertical))
      expect(rendered_root_element["data-orientation"]).to eq("vertical")
      expect(rendered_root_element["aria-orientation"]).to eq("vertical")

      render_inline(Shadcn::ToggleGroup.new(type: :single))
      expect(rendered_root_element["data-type"]).to eq("single")

      render_inline(Shadcn::Toggle.new(state: :on))
      expect(rendered_root_element["data-state"]).to eq("on")
      expect(rendered_root_element["aria-pressed"]).to eq("true")

      render_inline(Shadcn::DirectionProvider.new(dir: :rtl))
      expect(rendered_root_element["dir"]).to eq("rtl")

      render_inline(Shadcn::Avatar.new(size: :lg))
      expect(rendered_root_element["data-size"]).to eq("lg")
    end
  end

  describe Shadcn::Progress do
    it "publishes a nullable 0..100 numeric contract" do
      expect(described_class.property_contract(:value)).to eq(
        kind: :number,
        default: nil,
        allow_nil: true,
        minimum: 0,
        maximum: 100
      )
    end

    it "accepts boundary values and strict numeric strings" do
      { 0 => "0", 100 => "100", "37.5" => "37.5" }.each do |value, expected|
        render_inline(described_class.new(value:))
        expect(rendered_root_element["aria-valuenow"]).to eq(expected)
      end
    end

    it "treats nil as indeterminate without emitting an empty aria-valuenow" do
      render_inline(described_class.new(value: nil))

      expect(rendered_root_element).not_to have_attribute("aria-valuenow")
      expect(rendered_root_element["aria-valuemin"]).to eq("0")
      expect(rendered_root_element["aria-valuemax"]).to eq("100")
    end

    it "rejects non-finite, malformed, and out-of-range values during initialization" do
      [-0.1, 100.1, Float::NAN, Float::INFINITY, "12px", Object.new].each do |value|
        expect { described_class.new(value:) }
          .to raise_error(ArgumentError, /Shadcn::Progress value must be a finite number between 0 and 100 or nil/)
      end
    end
  end

  describe Shadcn::Slider do
    it "publishes defaults and nullable value separately" do
      expect(described_class.property_contract(:min)).to eq(kind: :number, default: 0)
      expect(described_class.property_contract(:max)).to eq(kind: :number, default: 100)
      expect(described_class.property_contract(:step)).to eq(
        kind: :number,
        default: 1,
        minimum: 0,
        exclusive_minimum: true
      )
      expect(described_class.property_contract(:value)).to eq(kind: :number, default: nil, allow_nil: true)
      expect(described_class.property_contract(:orientation)).to eq(
        kind: :enum,
        default: "horizontal",
        values: %w[horizontal vertical]
      )
    end

    it "accepts inclusive value boundaries and normalizes strict numeric strings" do
      expect { described_class.new(min: "-10.5", max: "20", step: "0.5", value: "-10.5") }.not_to raise_error

      render_inline(described_class.new(min: "-10.5", max: "20", step: "0.5", value: "20"))
      input = rendered_fragment.at_css("input[type='range']")

      expect(input.attributes.transform_values(&:value)).to include(
        "min" => "-10.5",
        "max" => "20",
        "value" => "20"
      )
    end

    it "omits value when nil while retaining min and max defaults" do
      render_inline(described_class.new(value: nil))
      input = rendered_fragment.at_css("input[type='range']")

      expect(input["min"]).to eq("0")
      expect(input["max"]).to eq("100")
      expect(input).not_to have_attribute("value")
    end

    it "requires max to be greater than min" do
      expect { described_class.new(min: 10, max: 10) }
        .to raise_error(ArgumentError, /max must be greater than min/)
      expect { described_class.new(min: 10, max: 0) }
        .to raise_error(ArgumentError, /max must be greater than min/)
    end

    it "requires a non-nil value to be inside the inclusive range" do
      expect { described_class.new(min: 0, max: 10, value: -0.1) }
        .to raise_error(ArgumentError, /value must be between min and max/)
      expect { described_class.new(min: 0, max: 10, value: 10.1) }
        .to raise_error(ArgumentError, /value must be between min and max/)
    end

    it "rejects nil bounds, non-finite values, and malformed numeric strings" do
      [
        { min: nil },
        { max: nil },
        { step: nil },
        { step: 0 },
        { step: -1 },
        { min: Float::NAN },
        { max: Float::INFINITY },
        { step: Float::INFINITY },
        { value: Float::NAN },
        { min: "0px" },
        { step: "any" },
        { value: "" }
      ].each do |options|
        expect { described_class.new(**options) }.to raise_error(ArgumentError, /Shadcn::Slider/)
      end
    end

    it "rejects unsupported orientations" do
      expect { described_class.new(orientation: :diagonal) }
        .to raise_error(ArgumentError, /orientation must be one of/)
    end
  end

  describe "non-negative spacing" do
    [Shadcn::ToggleGroup, Shadcn::ToggleGroup::Item].each do |component_class|
      it "publishes the non-negative default for #{component_class}" do
        expect(component_class.property_contract(:spacing)).to eq(kind: :number, default: 2, minimum: 0)
      end

      it "accepts zero, finite decimals, and strict numeric strings for #{component_class}" do
        [0, 1.5, "2.5"].each do |spacing|
          expect { component_class.new(spacing:) }.not_to raise_error
        end
      end

      it "rejects invalid spacing for #{component_class}" do
        [-0.1, nil, Float::NAN, Float::INFINITY, "2px"].each do |spacing|
          expect { component_class.new(spacing:) }
            .to raise_error(ArgumentError, /spacing must be a finite number greater than or equal to 0/)
        end
      end
    end
  end

  describe Shadcn::AspectRatio do
    it "publishes its nullable positive-number contract" do
      expect(described_class.property_contract(:ratio)).to eq(
        kind: :number,
        default: nil,
        allow_nil: true,
        minimum: 0,
        exclusive_minimum: true
      )
    end

    it "allows nil to mean no inline ratio and otherwise requires a positive finite number" do
      render_inline(described_class.new)
      expect(rendered_root_element).not_to have_attribute("style")

      render_inline(described_class.new(ratio: "1.5"))
      expect(rendered_root_element["style"]).to include("aspect-ratio: 1.5")

      [0, -1, Float::NAN, Float::INFINITY, "16/9"].each do |ratio|
        expect { described_class.new(ratio:) }
          .to raise_error(ArgumentError, /ratio must be a finite number greater than 0 or nil/)
      end
    end
  end

  describe Shadcn::InputOTP do
    it "publishes its positive-integer contract" do
      expect(described_class.property_contract(:length)).to eq(
        kind: :number,
        default: 6,
        integer: true,
        minimum: 1
      )
    end

    it "requires a positive integer length while accepting a strict integer string" do
      render_inline(described_class.new(length: "1"))
      expect(rendered_fragment.at_css("input[data-slot='input-otp']")["maxlength"]).to eq("1")

      [nil, 0, -1, 1.0, Float::NAN, Float::INFINITY, "1.5", "six"].each do |length|
        expect { described_class.new(length:) }
          .to raise_error(ArgumentError, /length must be a finite integer greater than or equal to 1/)
      end
    end

    it "uses the normalized length for the native maximum and initial value" do
      render_inline(described_class.new(length: "3", value: "1234"))

      input = rendered_fragment.at_css("input[data-slot='input-otp']")
      expect(input.attributes.transform_values(&:value)).to include(
        "maxlength" => "3",
        "value" => "123"
      )
    end
  end

  describe Shadcn::InputOTP::Slot do
    it "publishes its non-negative integer index contract" do
      expect(described_class.property_contract(:index)).to eq(
        kind: :number,
        default: 0,
        integer: true,
        minimum: 0
      )
    end

    it "requires a non-negative integer index while accepting a strict integer string" do
      render_inline(described_class.new(index: "2"))
      expect(rendered_root_element["data-index"]).to eq("2")

      [nil, -1, 1.5, Float::NAN, Float::INFINITY, "1.5", "first"].each do |index|
        expect { described_class.new(index:) }
          .to raise_error(ArgumentError, /index must be a finite integer greater than or equal to 0/)
      end
    end
  end

  describe "contract-backed variant validation" do
    it "turns invalid runtime types into the same early ArgumentError" do
      [nil, 1, Object.new].each do |value|
        expect { Shadcn::Button.new(variant: value) }.to raise_error(ArgumentError, /unknown variant value/)
      end

      [1, Object.new].each do |value|
        expect { Shadcn::Button.classes(variant: value) }.to raise_error(ArgumentError, /unknown variant value/)
      end
    end

    it "validates composed Button options during initialization" do
      expect { Shadcn::Pagination::Link.new(size: :nope) }
        .to raise_error(ArgumentError, /unknown variant value/)
      expect { Shadcn::AlertDialog::Action.new(variant: :nope) }
        .to raise_error(ArgumentError, /unknown variant value/)
      expect { Shadcn::AlertDialog::Cancel.new(size: :nope) }
        .to raise_error(ArgumentError, /unknown variant value/)
      expect { Shadcn::InputGroup::Button.new(variant: :nope) }
        .to raise_error(ArgumentError, /unknown variant value/)
    end

    it "does not treat false as an omitted optional variant" do
      expect { Shadcn::ToggleGroup.new(variant: false) }
        .to raise_error(ArgumentError, /unknown variant value/)
      expect { Shadcn::ToggleGroup.new(size: false) }
        .to raise_error(ArgumentError, /unknown variant value/)
      expect { Shadcn::Sheet::Trigger.new(variant: false) }
        .to raise_error(ArgumentError, /unknown variant value/)
      expect { Shadcn::Sheet::Trigger.new(size: false) }
        .to raise_error(ArgumentError, /unknown variant value/)
    end
  end
end
