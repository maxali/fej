/**
 * WHATWG-compliant Server-Sent Events parser
 *
 * Pure logic — no I/O, no fetch, no dependencies on Fej internals.
 * Implements the SSE event stream processing per:
 * https://html.spec.whatwg.org/multipage/server-sent-events.html#event-stream-interpretation
 *
 * @internal
 */

/** A raw parsed SSE event before JSON coercion */
export interface RawSSEEvent {
  /** Event type — "message" if not specified by the server */
  event: string;
  /** Raw data string (multi-line data joined with newlines) */
  data: string;
  /** Last event ID (persists across events unless overwritten) */
  id?: string;
}

/**
 * Stateful WHATWG-compliant SSE parser
 *
 * Feed decoded text chunks via `feed()` and receive complete SSE events.
 * Handles line endings (CR, LF, CRLF), BOM stripping, field parsing,
 * multi-line data, comments, and all spec edge cases.
 */
export class SSEParser {
  private dataBuffer = '';
  private eventTypeBuffer = '';
  private lastEventId = '';
  private retryMs: number | undefined;
  private lineBuffer = '';
  private firstChunk = true;
  // Track if last char was CR (may be start of CRLF)
  private pendingCR = false;

  /**
   * Feed a decoded text chunk to the parser
   *
   * @param chunk - Decoded text (from TextDecoder with stream: true)
   * @returns Array of complete SSE events parsed from this chunk
   */
  feed(chunk: string): RawSSEEvent[] {
    const events: RawSSEEvent[] = [];

    // Strip BOM from the very first chunk only
    if (this.firstChunk) {
      if (chunk.charCodeAt(0) === 0xfeff) {
        chunk = chunk.slice(1);
      }
      this.firstChunk = false;
    }

    let i = 0;

    // Handle pending CR from previous chunk
    if (this.pendingCR) {
      this.pendingCR = false;
      if (chunk.length > 0 && chunk.charAt(0) === '\n') {
        // The CR was part of a CRLF — skip the LF
        i = 1;
      }
      // Either way, the CR was a line ending — process the line
      const event = this.processLine(this.lineBuffer);
      if (event) events.push(event);
      this.lineBuffer = '';
    }

    while (i < chunk.length) {
      const char = chunk.charAt(i);

      if (char === '\r') {
        // Check if this is at the end of the chunk (ambiguous CRLF)
        if (i === chunk.length - 1) {
          // CR at end of chunk — hold it, wait for next chunk
          const event = this.processLine(this.lineBuffer);
          if (event) events.push(event);
          this.lineBuffer = '';
          this.pendingCR = true;
          i++;
          continue;
        }
        // CR followed by LF — consume both as one line ending
        if (chunk.charAt(i + 1) === '\n') {
          const event = this.processLine(this.lineBuffer);
          if (event) events.push(event);
          this.lineBuffer = '';
          i += 2;
          continue;
        }
        // Bare CR — line ending
        const event = this.processLine(this.lineBuffer);
        if (event) events.push(event);
        this.lineBuffer = '';
        i++;
        continue;
      }

      if (char === '\n') {
        const event = this.processLine(this.lineBuffer);
        if (event) events.push(event);
        this.lineBuffer = '';
        i++;
        continue;
      }

      this.lineBuffer += char;
      i++;
    }

    return events;
  }

  /** Get the last received event ID (for Last-Event-ID header on reconnect) */
  getLastEventId(): string {
    return this.lastEventId;
  }

  /** Get server-suggested retry interval in ms, if any */
  getRetryMs(): number | undefined {
    return this.retryMs;
  }

  /**
   * Reset buffers for reconnect.
   * Preserves lastEventId and retryMs per spec.
   */
  reset(): void {
    this.dataBuffer = '';
    this.eventTypeBuffer = '';
    this.lineBuffer = '';
    this.firstChunk = true;
    this.pendingCR = false;
    // lastEventId and retryMs intentionally preserved
  }

  /**
   * Process a single line per the SSE spec.
   * Returns an event if a blank line triggers dispatch.
   */
  private processLine(line: string): RawSSEEvent | undefined {
    // Empty line → dispatch event
    if (line === '') {
      return this.dispatchEvent();
    }

    // Comment: line starts with ':'
    if (line.charAt(0) === ':') {
      return undefined;
    }

    // Find first colon
    const colonIndex = line.indexOf(':');

    let fieldName: string;
    let fieldValue: string;

    if (colonIndex === -1) {
      // No colon — entire line is field name, value is ""
      fieldName = line;
      fieldValue = '';
    } else {
      fieldName = line.slice(0, colonIndex);
      fieldValue = line.slice(colonIndex + 1);
      // Remove exactly one leading U+0020 space from value
      if (fieldValue.charAt(0) === ' ') {
        fieldValue = fieldValue.slice(1);
      }
    }

    switch (fieldName) {
      case 'data':
        this.dataBuffer += fieldValue + '\n';
        break;
      case 'event':
        this.eventTypeBuffer = fieldValue;
        break;
      case 'id':
        // If value contains U+0000 NULL, ignore entirely
        if (fieldValue.indexOf('\0') === -1) {
          this.lastEventId = fieldValue;
        }
        break;
      case 'retry':
        // Only accept all-ASCII-digit values
        if (fieldValue.length > 0 && /^\d+$/.test(fieldValue)) {
          this.retryMs = parseInt(fieldValue, 10);
        }
        break;
      // Unknown field names — silently ignored
    }

    return undefined;
  }

  /**
   * Dispatch an event when a blank line is encountered.
   * Returns the event or undefined if data buffer is empty.
   */
  private dispatchEvent(): RawSSEEvent | undefined {
    // If data buffer is empty, discard and reset event type buffer
    if (this.dataBuffer === '') {
      this.eventTypeBuffer = '';
      return undefined;
    }

    // Strip trailing newline from data buffer (the one added by the last data: line)
    let data = this.dataBuffer;
    if (data.endsWith('\n')) {
      data = data.slice(0, -1);
    }

    const event: RawSSEEvent = {
      event: this.eventTypeBuffer || 'message',
      data,
      id: this.lastEventId || undefined,
    };

    // Clear data buffer and event type buffer (NOT lastEventId — persists)
    this.dataBuffer = '';
    this.eventTypeBuffer = '';

    return event;
  }
}
