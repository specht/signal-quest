#!/usr/bin/env dart
import 'dart:convert';
import 'dart:io';
import 'dart:math';

void main() async {
  final rng = Random(1); // deterministic
  var firstTick = true;
  const moves = ['N', 'S', 'E', 'W'];

  // Read one JSON object per line from stdin
  final lines =
      stdin.transform(utf8.decoder).transform(const LineSplitter());

  await for (final line in lines) {
    Map<String, dynamic>? data;
    try {
      data = jsonDecode(line) as Map<String, dynamic>;
    } catch (_) {
      // ignore parse errors; still emit a move to avoid timeouts
    }

    if (firstTick && data != null && data['config'] is Map) {
      final cfg = data['config'] as Map;
      final width = cfg['width'];
      final height = cfg['height'];
      stderr.writeln(
          'Random walker (Dart) launching on a ${width}x${height} map');
      firstTick = false;
    }

    // Emit a random move
    stdout.writeln(moves[rng.nextInt(moves.length)]);
    // Ensure the line is flushed promptly (IOSink.flush returns a Future)
    await stdout.flush();
  }
}
