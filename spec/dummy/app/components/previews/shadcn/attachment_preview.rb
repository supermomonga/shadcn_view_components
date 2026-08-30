# frozen_string_literal: true

module Shadcn
  class AttachmentPreview < Shadcn::PreviewBase
    def default
      render(Shadcn::Attachment.new) do
        safe_join([
                    render(Shadcn::Attachment::Media.new(variant: :icon)) { "📄" },
                    render(Shadcn::Attachment::Content.new) do
                      safe_join([
                                  render(Shadcn::Attachment::Title.new) { "report.pdf" },
                                  render(Shadcn::Attachment::Description.new) { "PDF・2.4 MB" }
                                ])
                    end,
                    render(Shadcn::Attachment::Actions.new) do
                      render(Shadcn::Attachment::Action.new(aria: { label: "report.pdfを削除" })) { "削除" }
                    end
                  ])
      end
    end
  end
end
