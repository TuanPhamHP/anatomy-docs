// The State figure's model: a purchase request's four states, the four actions,
// and each state's own rules. build.mjs inlines this file into the page, so the
// machine's display, the drum's holes and the step captions all come from here.
// The Python and TypeScript examples under code/ run the same scenario and print
// the same results.

// Each state is one row of holes on the drum; `cls` is its class in the code.
export const STATES = [
  { id: "draft", name: "Nháp", display: "NHÁP", cls: "Draft", refusal: "hồ sơ nháp chưa được gửi đi" },
  { id: "pending", name: "Chờ duyệt", display: "CHỜ DUYỆT", cls: "Pending", refusal: "hồ sơ đang chờ duyệt" },
  { id: "approved", name: "Đã duyệt", display: "ĐÃ DUYỆT", cls: "Approved", refusal: "hồ sơ đã duyệt, không đổi được nữa" },
  { id: "rejected", name: "Bị từ chối", display: "BỊ TỪ CHỐI", cls: "Rejected", refusal: "hồ sơ bị từ chối, cần sửa lại trước" },
];

// Each action is one key on the control bar and one track on the drum.
export const ACTIONS = [
  { id: "submit", name: "gửi duyệt" },
  { id: "approve", name: "duyệt" },
  { id: "reject", name: "từ chối" },
  { id: "revise", name: "sửa lại" },
];

// What each state accepts and where it leads. An action a state doesn't list is refused.
export const RULES = {
  draft: { submit: "pending" },
  pending: { approve: "approved", reject: "rejected" },
  approved: {},
  rejected: { revise: "draft" },
};

// The scenario the figure walks through, one step per action.
export const SCENARIO = [
  { state: "draft", action: "submit", label: "Gửi duyệt" },
  { state: "pending", action: "reject", label: "Từ chối" },
  { state: "rejected", action: "revise", label: "Sửa lại" },
  { state: "draft", action: "submit", label: "Gửi lại" },
  { state: "pending", action: "approve", label: "Duyệt" },
  { state: "approved", action: "submit", label: "Gửi lần 3" },
];

export const stateOf = (id) => STATES.find((state) => state.id === id);
export const actionOf = (id) => ACTIONS.find((action) => action.id === id);

// The current state decides: the next state, or a refusal with that state's reason.
export function apply(state, action) {
  const next = RULES[state][action];
  return next ? { ok: true, next } : { ok: false, next: state, reason: stateOf(state).refusal };
}
