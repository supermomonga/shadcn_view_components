# frozen_string_literal: true

# data-controller / target 形式の組み立てヘルパ(07-testing §2)。
# Stimulusコントローラ規約(05-stimulus-hotwire §2.1)どおりの属性名を組み立てる。
module StimulusHelpers
  def stimulus_controller_identifier(component)
    "shadcn--#{component}"
  end

  def stimulus_target_attribute(component, _target)
    "data-shadcn--#{component}-target"
  end

  def stimulus_value_attribute(component, name)
    "data-shadcn--#{component}-#{name}-value"
  end

  def stimulus_state_class_attribute(component, state)
    "data-shadcn--#{component}-#{state}-class"
  end
end
