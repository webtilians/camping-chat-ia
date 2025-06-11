const sessions = {};

export function getSession(callSid) {
  if (!sessions[callSid]) {
    sessions[callSid] = [];
  }
  return sessions[callSid];
}

export function clearSession(callSid) {
  delete sessions[callSid];
}
