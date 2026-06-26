#!/bin/bash
# cc-tui-engine.sh <prompt_file> <output_file> [workspace_dir]
# Runs claude-code via interactive TUI (PTY, OAuth) in a tmux session.
# Used as a bench engineAdapter for the 'cc-tui' engine.

PROMPT_FILE="$1"
OUTPUT_FILE="$2"
WORKSPACE="${3:-$PWD}"
SESSION="ccbench-$(echo $$${RANDOM} | md5sum | head -c 8)"

cleanup() { tmux kill-session -t "$SESSION" 2>/dev/null; }
trap cleanup EXIT

# Validate inputs
[ -f "$PROMPT_FILE" ] || { echo "ERROR: no prompt file $PROMPT_FILE" >&2; exit 1; }
mkdir -p "$(dirname "$OUTPUT_FILE")"

# Launch claude in a real PTY via tmux (PTY = keychain OAuth works)
# Use tall window + large scrollback so long responses don't scroll off
tmux new-session -d -s "$SESSION" -x 200 -y 300 \
    "cd '$WORKSPACE' && claude --dangerously-skip-permissions" 2>/dev/null
tmux set-option -t "$SESSION" history-limit 50000 2>/dev/null
sleep 6

# Handle any initial dialog (Terms / workspace trust)
CONTENT=$(tmux capture-pane -t "$SESSION" -p 2>/dev/null)
if echo "$CONTENT" | grep -q "No, exit"; then
    # "No, exit" is first option → Down to select "Yes, I accept"
    tmux send-keys -t "$SESSION" Down ""
    sleep 0.5
    tmux send-keys -t "$SESSION" Enter ""
    sleep 3
elif echo "$CONTENT" | grep -q "Yes, I"; then
    tmux send-keys -t "$SESSION" Enter ""
    sleep 3
fi

# Confirm we reached the main prompt
CONTENT=$(tmux capture-pane -t "$SESSION" -p 2>/dev/null)
if ! echo "$CONTENT" | grep -qE "bypass permissions|❯"; then
    echo "ERROR: claude did not reach main prompt" >&2
    exit 1
fi

# Paste prompt via tmux buffer (avoids escaping issues with special chars)
tmux load-buffer "$PROMPT_FILE"
tmux paste-buffer -t "$SESSION"
sleep 0.5
tmux send-keys -t "$SESSION" Enter ""

# Poll for response completion:
# Response is done when pane is stable and no spinner (✻) is visible
PREV=""
STABLE=0
for i in $(seq 1 120); do
    sleep 1
    CONTENT=$(tmux capture-pane -t "$SESSION" -p 2>/dev/null)
    FULL=$(tmux capture-pane -t "$SESSION" -p -S - 2>/dev/null)
    if echo "$CONTENT" | grep -q "bypass permissions" && \
       ! echo "$CONTENT" | grep -qE "✻|● high|Working|Thinking|reading|writing"; then
        if [ "$CONTENT" = "$PREV" ]; then
            STABLE=$((STABLE + 1))
            [ "$STABLE" -ge 3 ] && break
        else
            STABLE=0
        fi
    fi
    PREV="$CONTENT"
done

# Capture full scrollback history (-S - = from beginning of scrollback)
tmux capture-pane -t "$SESSION" -p -S - \
    | sed 's/\x1b\[[0-9;]*[mKHJABCDEFGSTfunlhr]//g; s/[^[:print:]\n]//g' \
    > "$OUTPUT_FILE"
