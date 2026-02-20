/**
 * Unit tests for WHATWG-compliant SSE parser
 * Tests all spec-compliance areas including field parsing, line endings,
 * BOM handling, chunk boundary management, and edge cases.
 */

import { describe, expect, it } from 'vitest';
import { SSEParser, RawSSEEvent } from '../../src/sse-parser.js';

describe('SSEParser - WHATWG SSE Spec Compliance', () => {
  describe('Field parsing', () => {
    it('should parse data field', () => {
      const parser = new SSEParser();
      const events = parser.feed('data: hello\n\n');
      expect(events).toEqual([{ event: 'message', data: 'hello' }]);
    });

    it('should parse event field', () => {
      const parser = new SSEParser();
      const events = parser.feed('event: custom\ndata: payload\n\n');
      expect(events).toEqual([{ event: 'custom', data: 'payload' }]);
    });

    it('should parse id field', () => {
      const parser = new SSEParser();
      const events = parser.feed('id: 42\ndata: hello\n\n');
      expect(events).toEqual([{ event: 'message', data: 'hello', id: '42' }]);
    });

    it('should parse retry field', () => {
      const parser = new SSEParser();
      parser.feed('retry: 3000\ndata: hello\n\n');
      expect(parser.getRetryMs()).toBe(3000);
    });

    it('should ignore unknown fields', () => {
      const parser = new SSEParser();
      const events = parser.feed('foo: bar\ndata: hello\n\n');
      expect(events).toEqual([{ event: 'message', data: 'hello' }]);
    });
  });

  describe('Space stripping', () => {
    it('should strip exactly one leading space after colon', () => {
      const parser = new SSEParser();
      const events = parser.feed('data: x\n\n');
      expect(events[0].data).toBe('x');
    });

    it('should preserve additional leading spaces beyond the first', () => {
      const parser = new SSEParser();
      const events = parser.feed('data:  x\n\n');
      expect(events[0].data).toBe(' x');
    });

    it('should handle no space after colon', () => {
      const parser = new SSEParser();
      const events = parser.feed('data:x\n\n');
      expect(events[0].data).toBe('x');
    });

    it('should handle colon with no value', () => {
      const parser = new SSEParser();
      const events = parser.feed('data:\n\n');
      expect(events[0].data).toBe('');
    });
  });

  describe('Multi-line data', () => {
    it('should join multiple data lines with newlines', () => {
      const parser = new SSEParser();
      const events = parser.feed('data: a\ndata: b\n\n');
      expect(events[0].data).toBe('a\nb');
    });

    it('should strip trailing newline from data', () => {
      const parser = new SSEParser();
      const events = parser.feed('data: a\ndata: b\ndata: c\n\n');
      expect(events[0].data).toBe('a\nb\nc');
      // Ensure no trailing newline
      expect(events[0].data.endsWith('\n')).toBe(false);
    });

    it('should handle single data line without trailing newline in output', () => {
      const parser = new SSEParser();
      const events = parser.feed('data: only\n\n');
      expect(events[0].data).toBe('only');
    });
  });

  describe('Comments', () => {
    it('should ignore lines starting with colon', () => {
      const parser = new SSEParser();
      const events = parser.feed(': this is a comment\ndata: hello\n\n');
      expect(events).toEqual([{ event: 'message', data: 'hello' }]);
    });

    it('should ignore empty comments', () => {
      const parser = new SSEParser();
      const events = parser.feed(':\ndata: hello\n\n');
      expect(events).toEqual([{ event: 'message', data: 'hello' }]);
    });

    it('should not dispatch on comment-only blocks', () => {
      const parser = new SSEParser();
      const events = parser.feed(': comment\n\n');
      expect(events).toEqual([]);
    });
  });

  describe('Event dispatch on empty lines', () => {
    it('should dispatch event when empty line is encountered', () => {
      const parser = new SSEParser();
      const events = parser.feed('data: hello\n\n');
      expect(events).toHaveLength(1);
    });

    it('should not dispatch without an empty line', () => {
      const parser = new SSEParser();
      const events = parser.feed('data: hello\n');
      expect(events).toHaveLength(0);
    });

    it('should not dispatch with only data lines and no blank line', () => {
      const parser = new SSEParser();
      const events = parser.feed('data: a\ndata: b\n');
      expect(events).toHaveLength(0);
    });
  });

  describe('Event type without data fires nothing', () => {
    it('should not dispatch event when only event type is set (no data)', () => {
      const parser = new SSEParser();
      const events = parser.feed('event: custom\n\n');
      expect(events).toEqual([]);
    });

    it('should reset event type buffer after failed dispatch', () => {
      const parser = new SSEParser();
      // First: event type without data (discarded, resets eventTypeBuffer)
      parser.feed('event: custom\n\n');
      // Second: data without event type should default to "message"
      const events = parser.feed('data: hello\n\n');
      expect(events).toEqual([{ event: 'message', data: 'hello' }]);
    });
  });

  describe('ID field with NULL byte', () => {
    it('should ignore id field containing U+0000 NULL', () => {
      const parser = new SSEParser();
      parser.feed('id: abc\ndata: first\n\n');
      expect(parser.getLastEventId()).toBe('abc');

      // ID with NULL should be ignored entirely
      parser.feed('id: x\0y\ndata: second\n\n');
      expect(parser.getLastEventId()).toBe('abc');
    });

    it('should ignore id field that is only a NULL byte', () => {
      const parser = new SSEParser();
      parser.feed('id: prev\ndata: first\n\n');
      parser.feed('id: \0\ndata: second\n\n');
      expect(parser.getLastEventId()).toBe('prev');
    });
  });

  describe('ID field with empty value', () => {
    it('should set id to empty string when id field has empty value', () => {
      const parser = new SSEParser();
      parser.feed('id: abc\ndata: first\n\n');
      expect(parser.getLastEventId()).toBe('abc');

      // Empty id resets to ""
      parser.feed('id:\ndata: second\n\n');
      expect(parser.getLastEventId()).toBe('');
    });

    it('should set id to empty string with space after colon', () => {
      const parser = new SSEParser();
      parser.feed('id: abc\ndata: first\n\n');
      // "id: " -> value is " ", strip one leading space -> ""
      parser.feed('id: \ndata: second\n\n');
      expect(parser.getLastEventId()).toBe('');
    });
  });

  describe('ID persistence across events', () => {
    it('should persist id across events unless overwritten', () => {
      const parser = new SSEParser();
      const events1 = parser.feed('id: 1\ndata: first\n\n');
      expect(events1[0].id).toBe('1');

      // Second event with no id — should still carry id "1"
      const events2 = parser.feed('data: second\n\n');
      expect(events2[0].id).toBe('1');
    });

    it('should overwrite id when new id is provided', () => {
      const parser = new SSEParser();
      parser.feed('id: 1\ndata: first\n\n');
      const events = parser.feed('id: 2\ndata: second\n\n');
      expect(events[0].id).toBe('2');
    });

    it('should not include id in event when lastEventId is empty string', () => {
      const parser = new SSEParser();
      // With no id set, lastEventId is "" -> event.id should be undefined
      const events = parser.feed('data: hello\n\n');
      expect(events[0].id).toBeUndefined();
    });
  });

  describe('Retry field validation', () => {
    it('should accept all-ASCII-digit values', () => {
      const parser = new SSEParser();
      parser.feed('retry: 5000\n\n');
      expect(parser.getRetryMs()).toBe(5000);
    });

    it('should reject negative values', () => {
      const parser = new SSEParser();
      parser.feed('retry: -1\n\n');
      expect(parser.getRetryMs()).toBeUndefined();
    });

    it('should reject decimal values', () => {
      const parser = new SSEParser();
      parser.feed('retry: 1.5\n\n');
      expect(parser.getRetryMs()).toBeUndefined();
    });

    it('should reject empty retry value', () => {
      const parser = new SSEParser();
      parser.feed('retry:\n\n');
      expect(parser.getRetryMs()).toBeUndefined();
    });

    it('should reject non-numeric values', () => {
      const parser = new SSEParser();
      parser.feed('retry: abc\n\n');
      expect(parser.getRetryMs()).toBeUndefined();
    });

    it('should accept zero as a valid retry value', () => {
      const parser = new SSEParser();
      parser.feed('retry: 0\n\n');
      expect(parser.getRetryMs()).toBe(0);
    });
  });

  describe('Line endings', () => {
    it('should handle LF line endings', () => {
      const parser = new SSEParser();
      const events = parser.feed('data: hello\n\n');
      expect(events).toEqual([{ event: 'message', data: 'hello' }]);
    });

    it('should handle CR line endings', () => {
      const parser = new SSEParser();
      const events = parser.feed('data: hello\r\r');
      expect(events).toEqual([{ event: 'message', data: 'hello' }]);
    });

    it('should handle CRLF line endings', () => {
      const parser = new SSEParser();
      const events = parser.feed('data: hello\r\n\r\n');
      expect(events).toEqual([{ event: 'message', data: 'hello' }]);
    });

    it('should handle mixed line endings', () => {
      const parser = new SSEParser();
      const events = parser.feed('data: a\rdata: b\ndata: c\r\n\n');
      expect(events[0].data).toBe('a\nb\nc');
    });
  });

  describe('BOM stripping', () => {
    it('should strip BOM from first chunk only', () => {
      const parser = new SSEParser();
      const bom = '\uFEFF';
      const events = parser.feed(bom + 'data: hello\n\n');
      expect(events).toEqual([{ event: 'message', data: 'hello' }]);
    });

    it('should not strip BOM from subsequent chunks', () => {
      const parser = new SSEParser();
      // First chunk — BOM stripped
      parser.feed('data: first\n\n');
      // Second chunk — BOM NOT stripped, treated as part of content
      const events = parser.feed('\uFEFFdata: second\n\n');
      // BOM becomes part of the field name, making it an unknown field
      expect(events).toEqual([]);
    });

    it('should handle first chunk that is only a BOM', () => {
      const parser = new SSEParser();
      const events1 = parser.feed('\uFEFF');
      expect(events1).toEqual([]);
      const events2 = parser.feed('data: hello\n\n');
      expect(events2).toEqual([{ event: 'message', data: 'hello' }]);
    });
  });

  describe('Partial chunks across TCP boundaries', () => {
    it('should buffer partial lines across chunks', () => {
      const parser = new SSEParser();
      const events1 = parser.feed('data: hel');
      expect(events1).toEqual([]);
      const events2 = parser.feed('lo\n\n');
      expect(events2).toEqual([{ event: 'message', data: 'hello' }]);
    });

    it('should handle event split across many chunks', () => {
      const parser = new SSEParser();
      expect(parser.feed('da')).toEqual([]);
      expect(parser.feed('ta')).toEqual([]);
      expect(parser.feed(': he')).toEqual([]);
      expect(parser.feed('llo')).toEqual([]);
      expect(parser.feed('\n')).toEqual([]);
      const events = parser.feed('\n');
      expect(events).toEqual([{ event: 'message', data: 'hello' }]);
    });
  });

  describe('CR at end of chunk (ambiguous CRLF)', () => {
    it('should hold CR at end of chunk and resolve with next chunk LF', () => {
      const parser = new SSEParser();
      // CR at end — parser should wait
      const events1 = parser.feed('data: hello\r');
      expect(events1).toEqual([]);
      // Next chunk starts with LF — CRLF resolved
      const events2 = parser.feed('\n\r\n');
      expect(events2).toEqual([{ event: 'message', data: 'hello' }]);
    });

    it('should treat trailing CR as line ending when next chunk does not start with LF', () => {
      const parser = new SSEParser();
      const events1 = parser.feed('data: hello\r');
      expect(events1).toEqual([]);
      // Next chunk does NOT start with LF — bare CR was a line ending
      const events2 = parser.feed('\r');
      // The trailing CR on first chunk processed the data line,
      // the CR in second chunk processes the empty line -> dispatch
      expect(events2).toEqual([{ event: 'message', data: 'hello' }]);
    });
  });

  describe('Chunk boundary splitting a CRLF pair', () => {
    it('should handle CRLF split across chunks for event dispatch', () => {
      const parser = new SSEParser();
      // "data: hello\r\n" processes the data line via CRLF mid-chunk.
      // Trailing "\r" at end of chunk sets pendingCR and processes empty line -> dispatch.
      const events1 = parser.feed('data: hello\r\n\r');
      expect(events1).toHaveLength(1);
      expect(events1[0]).toEqual({ event: 'message', data: 'hello' });
      // Next chunk starts with LF — completes the CRLF from the pending CR.
      // The empty line was already processed, so this LF is consumed silently.
      const events2 = parser.feed('\n');
      expect(events2).toEqual([]);
    });

    it('should handle CRLF split in middle of event data', () => {
      const parser = new SSEParser();
      // "data: a" then CR at end of chunk -> pendingCR set, data line processed, lineBuffer cleared
      const events1 = parser.feed('data: a\r');
      expect(events1).toEqual([]);
      // Next chunk: LF resolves pendingCR (was CRLF), processLine('') dispatches "a".
      // Then "data: b\r\n\r\n" processes second data line and dispatches "b".
      const events2 = parser.feed('\ndata: b\r\n\r\n');
      expect(events2).toHaveLength(2);
      expect(events2[0]).toEqual({ event: 'message', data: 'a' });
      expect(events2[1]).toEqual({ event: 'message', data: 'b' });
    });
  });

  describe('Field split across two chunks', () => {
    it('should handle field name split across chunks', () => {
      const parser = new SSEParser();
      const events1 = parser.feed('dat');
      expect(events1).toEqual([]);
      const events2 = parser.feed('a: hello\n\n');
      expect(events2).toEqual([{ event: 'message', data: 'hello' }]);
    });

    it('should handle field value split across chunks', () => {
      const parser = new SSEParser();
      const events1 = parser.feed('data: hel');
      expect(events1).toEqual([]);
      const events2 = parser.feed('lo world\n\n');
      expect(events2).toEqual([{ event: 'message', data: 'hello world' }]);
    });

    it('should handle colon split across chunks', () => {
      const parser = new SSEParser();
      const events1 = parser.feed('data');
      expect(events1).toEqual([]);
      const events2 = parser.feed(': hello\n\n');
      expect(events2).toEqual([{ event: 'message', data: 'hello' }]);
    });
  });

  describe('Incomplete events at stream end discarded', () => {
    it('should discard incomplete event with no trailing blank line', () => {
      const parser = new SSEParser();
      const events = parser.feed('data: hello\n');
      // No blank line -> no dispatch
      expect(events).toEqual([]);
    });

    it('should dispatch complete events but discard trailing incomplete event', () => {
      const parser = new SSEParser();
      const events = parser.feed('data: first\n\ndata: second\n');
      expect(events).toEqual([{ event: 'message', data: 'first' }]);
    });

    it('should discard buffered data on stream end without dispatch', () => {
      const parser = new SSEParser();
      parser.feed('data: partial');
      parser.feed('data: more');
      // No blank line was ever sent, so no events
      const events = parser.feed('');
      expect(events).toEqual([]);
    });
  });

  describe('Unknown field names silently ignored', () => {
    it('should silently ignore fields with unknown names', () => {
      const parser = new SSEParser();
      const events = parser.feed('unknown: value\nfoo: bar\ndata: hello\n\n');
      expect(events).toEqual([{ event: 'message', data: 'hello' }]);
    });

    it('should not affect other fields when unknown fields are present', () => {
      const parser = new SSEParser();
      const events = parser.feed('id: 1\nbogus: whatever\nevent: ping\ndata: pong\n\n');
      expect(events).toEqual([{ event: 'ping', data: 'pong', id: '1' }]);
    });
  });

  describe('Field with no colon', () => {
    it('should treat entire line as field name with empty value', () => {
      const parser = new SSEParser();
      // "data" with no colon -> field name is "data", value is ""
      // This adds "" + "\n" to data buffer
      parser.feed('data\n\n');
      const events = parser.feed('');
      // The "data" line sets dataBuffer to "\n", dispatch strips trailing newline -> ""
      // Wait, dispatchEvent checks if dataBuffer is empty string.
      // dataBuffer = "" + "\n" = "\n", which is not empty, so it dispatches.
      // data = "\n" stripped of trailing newline = ""
    });

    it('should dispatch event with empty data when bare "data" line is used', () => {
      const parser = new SSEParser();
      const events = parser.feed('data\n\n');
      expect(events).toEqual([{ event: 'message', data: '' }]);
    });

    it('should ignore unknown bare field names', () => {
      const parser = new SSEParser();
      const events = parser.feed('unknown\ndata: hello\n\n');
      expect(events).toEqual([{ event: 'message', data: 'hello' }]);
    });
  });

  describe('data::value (first colon splits)', () => {
    it('should split on first colon only', () => {
      const parser = new SSEParser();
      const events = parser.feed('data::value\n\n');
      // field = "data", value after first colon = ":value"
      // No leading space to strip, so data = ":value"
      expect(events[0].data).toBe(':value');
    });

    it('should handle data with multiple colons and leading space', () => {
      const parser = new SSEParser();
      const events = parser.feed('data: http://example.com\n\n');
      expect(events[0].data).toBe('http://example.com');
    });

    it('should handle data with colon in value after space', () => {
      const parser = new SSEParser();
      const events = parser.feed('data: key:value\n\n');
      expect(events[0].data).toBe('key:value');
    });
  });

  describe('Multiple events in a single chunk', () => {
    it('should parse multiple events from one chunk', () => {
      const parser = new SSEParser();
      const events = parser.feed('data: first\n\ndata: second\n\ndata: third\n\n');
      expect(events).toHaveLength(3);
      expect(events[0].data).toBe('first');
      expect(events[1].data).toBe('second');
      expect(events[2].data).toBe('third');
    });

    it('should handle multiple events with different types', () => {
      const parser = new SSEParser();
      const events = parser.feed('event: add\ndata: one\n\nevent: remove\ndata: two\n\n');
      expect(events).toEqual([
        { event: 'add', data: 'one' },
        { event: 'remove', data: 'two' },
      ]);
    });

    it('should handle multiple events with IDs accumulating', () => {
      const parser = new SSEParser();
      const events = parser.feed('id: 1\ndata: first\n\ndata: second\n\nid: 3\ndata: third\n\n');
      expect(events[0]).toEqual({ event: 'message', data: 'first', id: '1' });
      expect(events[1]).toEqual({ event: 'message', data: 'second', id: '1' });
      expect(events[2]).toEqual({ event: 'message', data: 'third', id: '3' });
    });
  });

  describe('reset() preserves lastEventId and retryMs but clears buffers', () => {
    it('should preserve lastEventId after reset', () => {
      const parser = new SSEParser();
      parser.feed('id: 42\ndata: hello\n\n');
      expect(parser.getLastEventId()).toBe('42');
      parser.reset();
      expect(parser.getLastEventId()).toBe('42');
    });

    it('should preserve retryMs after reset', () => {
      const parser = new SSEParser();
      parser.feed('retry: 5000\ndata: hello\n\n');
      expect(parser.getRetryMs()).toBe(5000);
      parser.reset();
      expect(parser.getRetryMs()).toBe(5000);
    });

    it('should clear data buffer on reset', () => {
      const parser = new SSEParser();
      // Feed partial data without dispatching
      parser.feed('data: partial\n');
      parser.reset();
      // Now feed a new blank line — should not dispatch the old data
      const events = parser.feed('\n');
      expect(events).toEqual([]);
    });

    it('should clear event type buffer on reset', () => {
      const parser = new SSEParser();
      parser.feed('event: custom\n');
      parser.reset();
      // Feed new data without event type
      const events = parser.feed('data: hello\n\n');
      expect(events[0].event).toBe('message');
    });

    it('should clear line buffer on reset', () => {
      const parser = new SSEParser();
      // Feed a partial line
      parser.feed('data: hel');
      parser.reset();
      // Feed new complete event
      const events = parser.feed('data: world\n\n');
      expect(events).toEqual([{ event: 'message', data: 'world' }]);
    });

    it('should reset BOM detection so next chunk can strip BOM', () => {
      const parser = new SSEParser();
      parser.feed('data: first\n\n');
      parser.reset();
      // After reset, firstChunk is true again — BOM should be stripped
      const events = parser.feed('\uFEFFdata: second\n\n');
      expect(events).toEqual([{ event: 'message', data: 'second' }]);
    });

    it('should clear pendingCR on reset', () => {
      const parser = new SSEParser();
      // Feed data ending with CR — sets pendingCR
      parser.feed('data: hello\r');
      parser.reset();
      // Feed new event — should not have residual CR processing
      const events = parser.feed('data: world\n\n');
      expect(events).toEqual([{ event: 'message', data: 'world' }]);
    });
  });
});
