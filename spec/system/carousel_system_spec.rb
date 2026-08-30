# frozen_string_literal: true

require "rails_helper"

module CarouselSystemScripts
  METRICS = <<~JS
    (() => {
      const root = document.getElementById(arguments[0])
      const viewport = root.querySelector("[data-slot='carousel-content']")
      const items = Array.from(root.querySelectorAll("[data-slot='carousel-item']"))
      const viewportRect = viewport.getBoundingClientRect()
      const firstRect = items[0].getBoundingClientRect()
      const vertical = root.dataset.orientation === "vertical"
      const rtl = root.dir === "rtl"
      const maximum = vertical
        ? Math.max(0, viewport.scrollHeight - viewport.clientHeight)
        : Math.max(0, viewport.scrollWidth - viewport.clientWidth)
      const distance = (rect) => vertical
        ? rect.top - firstRect.top
        : rtl
          ? firstRect.right - rect.right
          : rect.left - firstRect.left
      const position = vertical
        ? viewportRect.top - firstRect.top
        : rtl
          ? firstRect.right - viewportRect.right
          : viewportRect.left - firstRect.left
      const snapPositions = items
        .map((item) => Math.min(maximum, Math.max(0, distance(item.getBoundingClientRect()))))
        .concat([0, maximum])
        .sort((left, right) => left - right)
        .filter((value, index, values) => index === 0 || value - values[index - 1] > 1)

      return {
        maximum,
        position: Math.min(maximum, Math.max(0, position)),
        snap_positions: snapPositions,
        stride: Math.abs(distance(items[1].getBoundingClientRect())),
      }
    })()
  JS

  WAIT_FOR_POSITION = <<~JS
    const id = arguments[0]
    const expected = arguments[1]
    const tolerance = arguments[2]
    const done = arguments[3]
    const deadline = performance.now() + 4000
    let quietFrames = 0

    function position() {
      const root = document.getElementById(id)
      const viewport = root.querySelector("[data-slot='carousel-content']")
      const first = root.querySelector("[data-slot='carousel-item']")
      const viewportRect = viewport.getBoundingClientRect()
      const firstRect = first.getBoundingClientRect()

      if (root.dataset.orientation === "vertical") return viewportRect.top - firstRect.top
      if (root.dir === "rtl") return firstRect.right - viewportRect.right
      return viewportRect.left - firstRect.left
    }

    function check() {
      const current = position()
      quietFrames = Math.abs(current - expected) <= tolerance ? quietFrames + 1 : 0
      if (quietFrames >= 3) return done({ position: current, settled: true })
      if (performance.now() >= deadline) return done({ position: current, settled: false })
      requestAnimationFrame(check)
    }

    requestAnimationFrame(check)
  JS

  WAIT_FOR_STRIDE = <<~JS
    const id = arguments[0]
    const expected = arguments[1]
    const tolerance = arguments[2]
    const done = arguments[3]
    const deadline = performance.now() + 4000

    function check() {
      const root = document.getElementById(id)
      const items = root.querySelectorAll("[data-slot='carousel-item']")
      const first = items[0].getBoundingClientRect()
      const second = items[1].getBoundingClientRect()
      const stride = root.dataset.orientation === "vertical"
        ? Math.abs(second.top - first.top)
        : Math.abs(second.left - first.left)

      if (Math.abs(stride - expected) <= tolerance) return done(true)
      if (performance.now() >= deadline) return done(false)
      requestAnimationFrame(check)
    }

    requestAnimationFrame(check)
  JS
end

module CarouselSystemHelpers
  POSITION_TOLERANCE = 1.5

  def carousel_metrics(id)
    page.evaluate_script(CarouselSystemScripts::METRICS, id)
  end

  def wait_for_carousel_position(id, expected)
    result = page.evaluate_async_script(
      CarouselSystemScripts::WAIT_FOR_POSITION, id, expected, POSITION_TOLERANCE
    )

    failure_message = "#{id} did not settle at #{expected}; actual=#{result.fetch('position')}"
    expect(result.fetch("settled")).to be(true), failure_message
    result.fetch("position")
  end

  def wait_for_item_stride(id, expected)
    settled = page.evaluate_async_script(
      CarouselSystemScripts::WAIT_FOR_STRIDE, id, expected, POSITION_TOLERANCE
    )

    expect(settled).to be(true)
  end

  def control_selector(id, direction)
    "##{id}-#{direction}"
  end

  def expect_control_state(id, previous_disabled:, next_disabled:)
    {
      "previous" => previous_disabled,
      "next" => next_disabled
    }.each do |direction, disabled|
      state = disabled ? "[disabled]" : ":not([disabled])"
      expect(page).to have_selector("#{control_selector(id, direction)}#{state}", visible: :all)
    end
  end

  def adjacent_position(id, direction)
    metrics = carousel_metrics(id)
    positions = metrics.fetch("snap_positions")
    current = metrics.fetch("position")

    if direction == :next
      positions.find { |position| position > current + 1 }
    else
      positions.rfind { |position| position < current - 1 }
    end
  end

  def activate_control(id, direction)
    expected = adjacent_position(id, direction)
    expect(expected).not_to be_nil
    # upstream配置では横向きPreviousがルート左端の外側に置かれるため、fixtureの
    # viewport端ではポインター座標が負になる。実ブラウザ上でclickイベントを発火し、
    # 操作処理とスクロール結果を検証する。
    find(control_selector(id, direction), visible: :all).trigger("click")
    wait_for_carousel_position(id, expected)
  end

  def press_key(key)
    page.driver.browser.page.keyboard.type(key)
  end
end

RSpec.describe "Carousel behavior", type: :system do
  include CarouselSystemHelpers

  fixtures = {
    "horizontal-ltr" => 192,
    "horizontal-rtl" => 192,
    "vertical-ltr" => 176,
    "vertical-rtl" => 176
  }.freeze

  it "moves forward and backward and reaches the boundary in every orientation and direction" do
    visit "/pages/carousel"

    fixtures.each do |id, stride|
      expect_control_state(id, previous_disabled: true, next_disabled: false)
      expect(carousel_metrics(id).fetch("position")).to be_within(CarouselSystemHelpers::POSITION_TOLERANCE).of(0)

      expect(activate_control(id, :next)).to be_within(CarouselSystemHelpers::POSITION_TOLERANCE).of(stride)
      expect_control_state(id, previous_disabled: false, next_disabled: false)

      expect(activate_control(id, :previous)).to be_within(CarouselSystemHelpers::POSITION_TOLERANCE).of(0)
      expect_control_state(id, previous_disabled: true, next_disabled: false)

      6.times do
        break if find(control_selector(id, :next), visible: :all).disabled?

        activate_control(id, :next)
      end
      expect_control_state(id, previous_disabled: false, next_disabled: true)
      expect(carousel_metrics(id).fetch("position")).to be_within(CarouselSystemHelpers::POSITION_TOLERANCE)
        .of(carousel_metrics(id).fetch("maximum"))

      previous_position = carousel_metrics(id).fetch("position")
      expect(activate_control(id, :previous)).to be < previous_position - CarouselSystemHelpers::POSITION_TOLERANCE
      expect_control_state(id, previous_disabled: false, next_disabled: false)
    end
  end

  it "maps arrow keys to the logical previous and next directions" do
    visit "/pages/carousel"

    {
      "horizontal-ltr" => %i[right left],
      "horizontal-rtl" => %i[left right],
      "vertical-ltr" => %i[down up],
      "vertical-rtl" => %i[down up]
    }.each do |id, (next_key, previous_key)|
      page.execute_script("document.getElementById(arguments[0]).focus()", id)
      expect(page.evaluate_script("document.activeElement.id")).to eq(id)

      expected = adjacent_position(id, :next)
      press_key(next_key)
      expect(wait_for_carousel_position(id, expected)).to be > CarouselSystemHelpers::POSITION_TOLERANCE

      expected = adjacent_position(id, :previous)
      press_key(previous_key)
      expect(wait_for_carousel_position(id, expected)).to be_within(CarouselSystemHelpers::POSITION_TOLERANCE).of(0)
      expect_control_state(id, previous_disabled: true, next_disabled: false)
    end
  end

  it "remeasures item dimensions and refreshes boundary state after ResizeObserver notifications" do
    visit "/pages/carousel"

    [
      ["horizontal-ltr", "--carousel-item-inline-size", "224px", 224, "width"],
      ["vertical-rtl", "--carousel-item-block-size", "204px", 204, "height"]
    ].each do |id, custom_property, value, stride, viewport_dimension|
      page.execute_script(<<~JS, id, custom_property, value)
        document.getElementById(arguments[0]).style.setProperty(arguments[1], arguments[2])
      JS
      wait_for_item_stride(id, stride)

      expect(activate_control(id, :next)).to be_within(CarouselSystemHelpers::POSITION_TOLERANCE).of(stride)

      page.execute_script(<<~JS, id, viewport_dimension)
        const root = document.getElementById(arguments[0])
        root.querySelector("[data-slot='carousel-content']").style[arguments[1]] = "1600px"
      JS
      expect_control_state(id, previous_disabled: true, next_disabled: true)
      expect(carousel_metrics(id).fetch("maximum")).to be_within(CarouselSystemHelpers::POSITION_TOLERANCE).of(0)

      page.execute_script(<<~JS, id, viewport_dimension)
        const root = document.getElementById(arguments[0])
        root.querySelector("[data-slot='carousel-content']").style[arguments[1]] = ""
      JS
      expect_control_state(id, previous_disabled: true, next_disabled: false)
      expect(carousel_metrics(id).fetch("position")).to be_within(CarouselSystemHelpers::POSITION_TOLERANCE).of(0)
    end
  end

  it "connects carousel, viewport, controls, and labelled slides for assistive technology" do
    visit "/pages/carousel"

    fixtures.each_key do |id|
      orientation, direction = id.split("-")
      root = find("##{id}", visible: :all)
      viewport = root.find("[data-slot='carousel-content']", visible: :all)

      expect(root[:role]).to eq("region")
      expect(root["aria-roledescription"]).to eq("carousel")
      expect(root["aria-label"]).to eq("#{orientation} #{direction} carousel")
      expect(root["data-orientation"]).to eq(orientation)
      expect(root["data-direction"]).to eq(direction)
      expect(root[:dir]).to eq(direction)
      expect(root[:tabindex]).to eq("0")
      expect(viewport[:id]).to eq("#{id}-viewport")
      expect(find(control_selector(id, :previous), visible: :all)["aria-controls"]).to eq(viewport[:id])
      expect(find(control_selector(id, :next), visible: :all)["aria-controls"]).to eq(viewport[:id])

      items = root.all("[data-slot='carousel-item']", visible: :all)
      expect(items.size).to eq(6)
      items.each_with_index do |item, index|
        expect(item[:role]).to eq("group")
        expect(item["aria-roledescription"]).to eq("slide")
        expect(item["aria-label"]).to eq("#{index + 1} of 6")
      end
    end
  end
end
