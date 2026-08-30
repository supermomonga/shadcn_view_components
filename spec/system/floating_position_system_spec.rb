# frozen_string_literal: true

require "rails_helper"

module FloatingPositionSystemHelpers
  POSITION_TOLERANCE = 1.0
  COLLISION_PADDING = 5.0

  def enable_fixture(id)
    page.execute_script("document.getElementById(arguments[0]).hidden = false", id)
    expect(page).to have_selector("##{id}:not([hidden])", visible: :all)
  end

  def settle_layout(selector)
    settled = page.evaluate_async_script(<<~JS, selector)
      const selector = arguments[0]
      const done = arguments[1]
      const deadline = performance.now() + 4000
      let quietFrames = 0

      function check() {
        const element = document.querySelector(selector)
        const animations = element ? element.getAnimations({ subtree: true }) : []
        const active = animations.some((animation) =>
          animation.playState === "pending" || animation.playState === "running"
        )

        quietFrames = active ? 0 : quietFrames + 1
        if (quietFrames >= 2) return done(true)
        if (performance.now() >= deadline) return done(false)
        requestAnimationFrame(check)
      }

      requestAnimationFrame(check)
    JS
    expect(settled).to be(true)
  end

  def wait_for_inline_style_change(selector, property, previous)
    page.evaluate_async_script(<<~JS, selector, property, previous)
      const selector = arguments[0]
      const property = arguments[1]
      const previous = arguments[2]
      const done = arguments[3]
      const deadline = performance.now() + 4000

      function check() {
        const element = document.querySelector(selector)
        if (element && element.style[property] !== previous) return done(true)
        if (performance.now() >= deadline) return done(false)
        requestAnimationFrame(check)
      }

      requestAnimationFrame(check)
    JS
  end

  def element_rect(selector)
    page.evaluate_script(<<~JS, selector)
      (() => {
        const rect = document.querySelector(arguments[0]).getBoundingClientRect()
        return {
          bottom: rect.bottom,
          height: rect.height,
          left: rect.left,
          right: rect.right,
          top: rect.top,
          width: rect.width,
        }
      })()
    JS
  end

  def viewport_rect
    page.evaluate_script("({ height: window.innerHeight, width: window.innerWidth })")
  end

  def expect_near(actual, expected)
    expect(actual).to be_within(POSITION_TOLERANCE).of(expected)
  end

  def expect_inside_viewport(rect)
    viewport = viewport_rect
    clearances = [
      rect.fetch("left"),
      rect.fetch("top"),
      viewport.fetch("width") - rect.fetch("right"),
      viewport.fetch("height") - rect.fetch("bottom")
    ]
    expect(clearances.min).to be >= COLLISION_PADDING - POSITION_TOLERANCE
  end

  def close_native_popover(selector)
    page.execute_script("document.querySelector(arguments[0]).hidePopover()", selector)
    expect(page).to have_selector("#{selector}[data-state='closed']", visible: :all)
  end

  def center_x(rect)
    rect.fetch("left") + (rect.fetch("width") / 2)
  end

  def center_y(rect)
    rect.fetch("top") + (rect.fetch("height") / 2)
  end
end

RSpec.describe "Floating element positioning", type: :system do
  include FloatingPositionSystemHelpers

  it "flips at all four viewport edges and reports the rendered side" do
    visit "/pages/popovers"
    enable_fixture("floating-position-popover-fixtures")

    cases = {
      "top" => "bottom",
      "bottom" => "top",
      "left" => "right",
      "right" => "left"
    }

    cases.each do |requested_side, rendered_side|
      trigger_selector = "#fp-collision-#{requested_side}-trigger"
      content_selector = "#fp-collision-#{requested_side}-content"

      find(trigger_selector).click
      expect(page).to have_selector("#{content_selector}[data-state='open'][data-side='#{rendered_side}']")
      settle_layout(content_selector)

      trigger = element_rect(trigger_selector)
      content = element_rect(content_selector)
      expect_inside_viewport(content)

      case rendered_side
      when "top"
        expect_near(trigger.fetch("top") - content.fetch("bottom"), 4)
      when "right"
        expect_near(content.fetch("left") - trigger.fetch("right"), 4)
      when "bottom"
        expect_near(content.fetch("top") - trigger.fetch("bottom"), 4)
      when "left"
        expect_near(trigger.fetch("left") - content.fetch("right"), 4)
      end

      close_native_popover(content_selector)
    end
  end

  it "resolves start and end against the inherited RTL direction" do
    visit "/pages/popovers"
    enable_fixture("floating-position-popover-fixtures")

    find("#fp-ltr-start-trigger").click
    expect(page).to have_selector("#fp-ltr-start-content[data-state='open'][data-align='start']")
    settle_layout("#fp-ltr-start-content")
    expect_near(
      element_rect("#fp-ltr-start-content").fetch("left"),
      element_rect("#fp-ltr-start-trigger").fetch("left")
    )
    close_native_popover("#fp-ltr-start-content")

    find("#fp-rtl-start-trigger").click
    expect(page).to have_selector("#fp-rtl-start-content[data-state='open'][data-align='start']")
    settle_layout("#fp-rtl-start-content")
    expect_near(
      element_rect("#fp-rtl-start-content").fetch("right"),
      element_rect("#fp-rtl-start-trigger").fetch("right")
    )
    close_native_popover("#fp-rtl-start-content")

    find("#fp-rtl-end-trigger").click
    expect(page).to have_selector("#fp-rtl-end-content[data-state='open'][data-align='end']")
    settle_layout("#fp-rtl-end-content")
    expect_near(
      element_rect("#fp-rtl-end-content").fetch("left"),
      element_rect("#fp-rtl-end-trigger").fetch("left")
    )
  end

  it "tracks a trigger inside an independently scrolling container" do
    visit "/pages/popovers"
    enable_fixture("floating-position-popover-fixtures")
    page.execute_script("document.getElementById('fp-scroll-box').scrollTop = 130")
    settle_layout("#fp-scroll-trigger")

    page.execute_script("document.getElementById('fp-scroll-trigger').click()")
    expect(page).to have_selector("#fp-scroll-content[data-state='open'][data-side='bottom']")
    settle_layout("#fp-scroll-content")
    before_trigger = element_rect("#fp-scroll-trigger")
    before_content = element_rect("#fp-scroll-content")
    before_top_style = page.evaluate_script("document.getElementById('fp-scroll-content').style.top")

    page.execute_script("document.getElementById('fp-scroll-box').scrollTop += 40")
    expect(wait_for_inline_style_change("#fp-scroll-content", "top", before_top_style)).to be(true)
    settle_layout("#fp-scroll-content")
    after_trigger = element_rect("#fp-scroll-trigger")
    after_content = element_rect("#fp-scroll-content")

    expect_near(before_trigger.fetch("top") - after_trigger.fetch("top"), 40)
    expect_near(before_content.fetch("top") - after_content.fetch("top"), 40)
    expect_near(after_content.fetch("top") - after_trigger.fetch("bottom"), 4)
    expect_near(center_x(after_content), center_x(after_trigger))
  end

  it "repositions on window resize and ResizeObserver size notifications" do
    visit "/pages/popovers"
    enable_fixture("floating-position-popover-fixtures")

    find("#fp-resize-trigger").click
    expect(page).to have_selector("#fp-resize-content[data-state='open'][data-side='bottom']")
    settle_layout("#fp-resize-content")

    previous_left = page.evaluate_script("document.getElementById('fp-resize-content').style.left")
    page.execute_script(<<~JS)
      document.getElementById("fp-resize-trigger").style.left = "520px"
      window.dispatchEvent(new Event("resize"))
    JS
    expect(wait_for_inline_style_change("#fp-resize-content", "left", previous_left)).to be(true)
    settle_layout("#fp-resize-content")
    expect_near(center_x(element_rect("#fp-resize-content")), center_x(element_rect("#fp-resize-trigger")))

    previous_left = page.evaluate_script("document.getElementById('fp-resize-content').style.left")
    page.execute_script("document.getElementById('fp-resize-trigger').style.width = '140px'")
    expect(wait_for_inline_style_change("#fp-resize-content", "left", previous_left)).to be(true)
    settle_layout("#fp-resize-content")
    expect_near(element_rect("#fp-resize-trigger").fetch("width"), 140)
    expect_near(center_x(element_rect("#fp-resize-content")), center_x(element_rect("#fp-resize-trigger")))

    previous_left = page.evaluate_script("document.getElementById('fp-resize-content').style.left")
    page.execute_script("document.getElementById('fp-resize-content').style.width = '180px'")
    expect(wait_for_inline_style_change("#fp-resize-content", "left", previous_left)).to be(true)
    settle_layout("#fp-resize-content")
    expect_near(element_rect("#fp-resize-content").fetch("width"), 180)
    expect_near(center_x(element_rect("#fp-resize-content")), center_x(element_rect("#fp-resize-trigger")))
  end

  it "positions a context menu from the pointer point and avoids both viewport edges" do
    visit "/pages/menus"
    enable_fixture("floating-position-menu-fixtures")

    find("#fp-context-trigger").right_click
    expect(page).to have_selector("#fp-context-content[data-state='open'][data-side='left'][data-align='end']")
    settle_layout("#fp-context-content")
    trigger = element_rect("#fp-context-trigger")
    content = element_rect("#fp-context-content")
    pointer_x = center_x(trigger)
    pointer_y = center_y(trigger)

    expect_inside_viewport(content)
    expect_near(content.fetch("right"), pointer_x)
    expect_near(content.fetch("bottom"), pointer_y - 4)
  end

  it "positions a submenu from its own trigger rather than the root trigger" do
    visit "/pages/menus"
    enable_fixture("floating-position-menu-fixtures")

    find("#fp-submenu-main-trigger").click
    expect(page).to have_selector("#fp-submenu-main-content[data-state='open']")
    find("#fp-submenu-trigger").click
    expect(page).to have_selector("#fp-submenu-content[data-state='open']")
    expect(page).to have_selector("#fp-submenu-content[data-side='right'][data-align='start']")
    settle_layout("#fp-submenu-content")
    trigger = element_rect("#fp-submenu-trigger")
    content = element_rect("#fp-submenu-content")

    expect(page.evaluate_script("document.getElementById('fp-submenu-main-content').matches(':popover-open')")).to be(true)
    expect_inside_viewport(content)
    expect_near(content.fetch("left"), trigger.fetch("right"))
    expect_near(content.fetch("top"), trigger.fetch("top") - 3)
  end
end
