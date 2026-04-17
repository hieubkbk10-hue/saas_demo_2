# Core Operating Principles
- Trả lời bằng Tiếng Việt có dấu.
- Tuân thủ KISS, YAGNI, DRY.
- Tuân thủ Rails Convention Over Configuration.
- Không mở rộng scope ngoài yêu cầu.
- Ưu tiên thay đổi nhỏ, dễ rollback.

# Clean-by-construction
- Ưu tiên đọc code kỹ, bám pattern sẵn có để giảm lỗi ngay từ lúc viết.
- Cấm tuyệt đối tự chạy lint/unit test.
- Verification runtime/integration do tester phụ trách.
- Tự review tĩnh trước khi bàn giao: typing, null-safety, edge cases, tương thích dữ liệu cũ.

# Sub-agent Delegation (Speed-first)
- Với task từ mức trung bình trở lên, ưu tiên dùng sub-agent (Task) trước khi tự xử lý tuần tự.
- Mục tiêu tối ưu wall-clock time hơn token cost; chấp nhận “tốn thêm ~80 để nhanh thêm ~20”.
- Luôn kiểm tra custom droids sẵn có; nếu có droid phù hợp thì ưu tiên dùng ngay.
- Khi có thể tách discovery/research/review song song hoặc cần rà nhiều khu vực code, phải cân nhắc Task.
- Ngoại lệ tối thiểu: việc cực nhỏ, một bước, hoặc chỉ sửa vài file đã biết rõ và không lợi từ song song.

# UI/UX Design Guardrails (2026, practical)
- Clarity > Decoration: ưu tiên dễ hiểu, dễ thao tác; nếu đẹp hơn nhưng khó dùng hơn thì chọn dễ dùng.
- Text economy (UI text/microcopy only): nếu rút gọn ~50% số chữ mà người dùng vẫn hiểu đúng ý thì rút; nếu vẫn rút tiếp mà không mất nghĩa thì rút tiếp.
- Responsive-first: thiết kế mobile trước, scale lên desktop; giữ hierarchy và CTA rõ ở breakpoint chính.
- Accessibility-first (WCAG 2.2 AA practical): focus-visible rõ, keyboard navigation OK, contrast đủ đọc, touch target khuyến nghị 44x44px.
- Clean & Premium by system: spacing scale nhất quán, typography rõ cấp bậc, tránh lạm dụng màu/gradient/shadow/animation.
- Micro-checklist trước khi chốt UI: hiểu trong 5 giây? dùng 1 tay được? focus/contrast ổn? có trang trí thừa không?
- Repo note: ưu tiên pattern sẵn có trong Shadcn + Tailwind để giữ đồng bộ.

# Evidence over Opinion
- Tách bạch Observation / Inference / Decision.
- Mọi kết luận phải có evidence: log, file path, line, command output, repro, history.
- Thiếu evidence: nêu rõ gap + cách lấy evidence.
- Khi có nhiều hướng hợp lý: nêu Confidence High/Medium/Low + reason ngắn.

# Audit & Root Cause Protocol
- Trigger Audit khi gặp: fix, bug, lỗi, root cause, spec, optimize, refactor.
- Quy trình bắt buộc: Audit → Root Cause → Fix/Proposal → Verify ( tuyệt đối cấm tự chạy npm run lint hoặc npm run build).
- Trước khi kết luận Root Cause, trả lời tối thiểu 5/8 câu (bắt buộc #1 #3 #6 #8):
  1. Triệu chứng quan sát được là gì (expected vs actual)?
  2. Phạm vi ảnh hưởng (user, module, môi trường)?
  3. Có tái hiện ổn định không? điều kiện tái hiện tối thiểu?
  4. Mốc thay đổi gần nhất (commit/config/dependency/data)?
  5. Dữ liệu nào đang thiếu để kết luận chắc chắn?
  6. Có giả thuyết thay thế hợp lý nào chưa bị loại trừ?
  7. Rủi ro nếu fix sai nguyên nhân là gì?
  8. Tiêu chí pass/fail sau khi sửa?
- DARE (chỉ dùng khi vấn đề phức tạp): Audit → Decompose → Analyze → Reflect → Execute.
- Khi cần phân tích sâu, dùng format:
  ## Problem Graph
  1. [Main] <- depends on 1.1, 1.2
     1.1 [Sub] <- depends on 1.1.1
        1.1.1 [ROOT CAUSE] <- Solve first
     1.2 [Sub]

  ## Execution (with reflection)
  1. Solving 1.1.1...
     - Thought: ...
     - Action: ...
     - Reflection: ✓ Valid / ✗ Retry
  2. ...

# Decision & AskUser Quality Rules
- Chỉ dùng AskUser khi decision ảnh hưởng behavior/API/UX/scope/cost/risk.
- Không đưa option vô nghĩa hoặc dominated (kém hơn + đắt/rủi ro hơn mà không có upside).
- Nếu chỉ có 1 hướng hợp lý, không hỏi; tự quyết và nêu rõ lý do.
- Mỗi option phải theo format:
  - Option X (Recommend) — Confidence 85% (lý do ngắn, gắn evidence/tradeoff).
  - Option Y — Confidence 60% (phù hợp khi ..., tradeoff ...).
- Recommend phải giải thích: vì sao tốt nhất trong ngữ cảnh, tradeoff, evidence.
- Nếu option không recommend vẫn đưa ra, phải nói rõ khi nào phù hợp.
- Giữ 2–4 option thật sự khác nhau về tradeoff.

# Spec Mode Rules
- Pre-Audit → Root Cause → Counter-Hypothesis → Proposal → Post-Audit.
- Plan phải actionable, step-by-step, nêu file nào đổi gì, logic cụ thể.
- Lưu spec ở `.factory/docs`.
- Output spec bắt buộc có 3 block: Audit Summary (Tóm tắt kiểm tra), Root Cause Confidence (Độ tin cậy nguyên nhân gốc: High/Medium/Low + reason), Verification Plan (Kế hoạch kiểm chứng: typecheck/test/repro).
- Quy tắc AskUser tham chiếu ở section Decision & AskUser Quality Rules, không lặp.
- Spec output bắt buộc có `TL;DR kiểu Feynman` (3–6 bullet, nói như cho người mới vào dự án).
- Spec output bắt buộc có `Elaboration & Self-Explanation`: giải thích lại vấn đề, nguyên nhân và hướng xử lý bằng ngôn ngữ chậm, rõ, ít jargon; đủ để người mới có thể tự kể lại.
- Spec output bắt buộc có `Concrete Examples & Analogies`: ít nhất 1 ví dụ cụ thể bám sát task/repo; nếu phù hợp, thêm 1 analogy đời thường để làm rõ trực giác.
- `Files Impacted (Tệp bị ảnh hưởng)`: mỗi file có 1 câu mô tả vai trò hiện tại + 1 câu nêu thay đổi; ghi rõ `Sửa:`/`Thêm:`; nếu >5 file thì nhóm theo UI / server / schema / shared.
- `Execution Preview (Xem trước thực thi)`: liệt kê thứ tự thay đổi chính (đọc/chỉnh, cập nhật logic, nối wiring, review tĩnh).
- `Acceptance Criteria (Tiêu chí chấp nhận)`: điều kiện pass/fail quan sát được.
- `Out of Scope (Ngoài phạm vi)` và `Risk / Rollback (Rủi ro / Hoàn tác)` phải có nếu thay đổi ảnh hưởng rộng; `Open Questions (Câu hỏi mở)` chỉ xuất hiện khi thật sự còn ambiguity.
- Spec output bắt buộc tuân theo `Spec Output Contract (Hợp đồng đầu ra spec)` bên dưới; được phép ẩn section không áp dụng nhưng không được đổi thứ tự section còn lại.
- Ưu tiên markdown rõ ràng, dễ scan: dùng heading `#`, `##`, list `-`, `*`, `+` và indentation nhất quán; mỗi section phải có xuống dòng tách bạch.
- Ưu tiên tiếng Việt nếu diễn đạt được rõ nghĩa; nếu cần dùng thuật ngữ tiếng Anh hoặc jargon thì phải ghi dạng `English Term (Tiếng Việt)` ngay lần xuất hiện đầu tiên trong section, đặc biệt với các cụm phức tạp hơn mức phổ thông.
- Không dùng heading/label tiếng Anh trơn khi có thể chú thích nghĩa; ví dụ viết `Acceptance Criteria (Tiêu chí chấp nhận)`, không viết `Acceptance Criteria` đơn lẻ.
- Mặc định format spec theo khung sau:
  - `# I. Primer`
    - `## 1. TL;DR kiểu Feynman`
    - `## 2. Elaboration & Self-Explanation`
    - `## 3. Concrete Examples & Analogies`
  - `# II. Audit Summary (Tóm tắt kiểm tra)`
  - `# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)`
  - `# IV. Proposal (Đề xuất)`
  - `# V. Files Impacted (Tệp bị ảnh hưởng)`
  - `# VI. Execution Preview (Xem trước thực thi)`
  - `# VII. Verification Plan (Kế hoạch kiểm chứng)`
  - `# VIII. Todo`
  - `# IX. Acceptance Criteria (Tiêu chí chấp nhận)`
  - `# X. Risk / Rollback (Rủi ro / Hoàn tác)`
  - `# XI. Out of Scope (Ngoài phạm vi)`
  - `# XII. Open Questions (Câu hỏi mở)` (optional)
- Thứ tự 3 mục trong `# I. Primer` là cố định tuyệt đối: `1. TL;DR kiểu Feynman` → `2. Elaboration & Self-Explanation` → `3. Concrete Examples & Analogies`.
- Quy tắc đánh số bắt buộc:
  - Cấp 1 dùng số La Mã: `I, II, III...`
  - Cấp 2 dùng số thường: `1, 2, 3...`
  - Cấp 3 dùng chữ cái: `a), b), c)...`
- `# VIII. Todo` là mục bắt buộc trong spec và phải nằm ngay trước `# IX. Acceptance Criteria (Tiêu chí chấp nhận)`.

# Mermaid Diagram Defaults
- Khi spec cần biểu đồ, ưu tiên 3 loại mặc định:
  - `flowchart` cho luồng logic tổng thể, decision branches, pipeline xử lý.
  - `sequenceDiagram` cho tương tác giữa nhiều actor/service theo thời gian.
  - `stateDiagram-v2` cho lifecycle, status và transition.
- Quick selector:
  - Câu hỏi “luồng chạy ra sao?” → `flowchart`.
  - Câu hỏi “ai gọi ai, theo thứ tự nào?” → `sequenceDiagram`.
  - Câu hỏi “trạng thái đổi khi nào?” → `stateDiagram-v2`.
- Nếu bullet list đã đủ rõ thì không cần diagram.
- Tránh lạm dụng `classDiagram` và `usecase` cho task dev hằng ngày; chỉ dùng khi thật sự cần domain modeling hoặc BA-level analysis.
- Tên participant/node ngắn, dưới ~20 ký tự, để render tốt trong terminal.

# Execution & Verification Rules
- Khi user đưa URL localhost, đọc route Next.js tương ứng, không hỏi lại.
- Mọi thay đổi code khi hoàn thành đều phải commit, không push.
- Khi commit luôn add kèm `.factory/docs` (nếu có).
- Trước commit chỉ chạy `bunx tsc --noEmit` khi có thay đổi code/TS; không chạy khi chỉ sửa docs/cấu hình không liên quan.

# Convex Real Data Ops (Best Practices)
- Mặc định ưu tiên sửa dữ liệu thật qua query/mutation/action đã có sẵn; không tự ý thêm schema/table/function mới nếu yêu cầu chỉ là chỉnh data.
- Quy trình chuẩn khi user yêu cầu sửa data thật: Read surface đang dùng → xác định Convex function đang đọc/ghi → đọc dữ liệu hiện tại → patch tối thiểu → đọc lại để verify.
- Ưu tiên đúng source of truth: route admin/site nào đang dùng function nào thì bám đúng function đó; tránh sửa “đoán mò” ở bảng khác.
- Chỉ thêm function mới khi thiếu đúng capability cần thiết; ví dụ chưa có mutation để sửa field user yêu cầu, hoặc chưa có query đủ hẹp để lấy đúng record cần sửa.
- Không đổi schema chỉ để tiện thao tác tay cho agent; schema change chỉ hợp lệ khi business data model thực sự đổi.
- Trước khi mutate phải xác định rõ phạm vi: deployment nào, module nào, record nào, field nào, expected before/after ra sao.
- Luôn đọc trước khi ghi: ưu tiên query record hiện tại để lấy `_id`, trạng thái hiện tại, quan hệ cha-con và thứ tự trước khi update.
- Luôn patch tối thiểu: chỉ gửi field cần đổi, không overwrite cả object nếu không cần, để giảm rủi ro mất dữ liệu cũ.
- Tận dụng validation sẵn có ở Convex function; nếu mutation hiện tại đã validate URL/range/enum thì dùng lại, không bypass bằng đường khác.
- Khi đọc danh sách lớn, bám best practice Convex: dùng index phù hợp, `withIndex`, limit/pagination; tránh fetch all rồi lọc ở client/JS.
- Với thao tác hàng loạt, ưu tiên lô nhỏ, có thể verify từng bước; tránh “clear all / rewrite all” nếu user chỉ muốn sửa vài record.
- Với dữ liệu production hoặc dữ liệu khó rollback, luôn nêu trước plan thao tác ngắn gọn theo dạng: sẽ đọc gì → sẽ sửa gì → sẽ verify gì; không silent mutate diện rộng.
- Nếu Convex đã có CLI/dashboard/function call phù hợp thì ưu tiên dùng luôn; không tạo thêm UI/tool/script chỉ để phục vụ một lần chỉnh data, trừ khi user yêu cầu productize.
- Khi user chỉ muốn agent chỉnh nhanh dữ liệu (ví dụ menu, settings, featured item), mặc định hiểu là sửa trực tiếp qua data functions hiện có, không mở rộng scope sang refactor hệ thống.
- Evidence bắt buộc khi bàn giao tác vụ data thật: function đã dùng, record đã chạm, field đã đổi, before/after ngắn gọn, và bước verify đã thực hiện.

# 7 Nguyên tắc DB Bandwidth Optimization
- Filter ở DB, không ở JS; không fetch ALL rồi filter/count.
- Không N+1; batch load + Map O(1).
- Luôn có index phù hợp filter/sort.
- Luôn có limit + pagination (default 20, max 100–500).
- Chỉ lấy data cần thiết (projection, no select *).
- Load song song bằng Promise.all cho query độc lập.
- Monitor trước deploy: budget alerts + ước lượng Records × Size × Requests/day; track slow queries >1s.