#!/usr/bin/env php
<?php
mt_srand(1);
$first = true;
while (($line = fgets(STDIN)) !== false) {
  $data = json_decode($line, true);
  if ($first && isset($data['config'])) {
    $w = $data['config']['width'] ?? '?';
    $h = $data['config']['height'] ?? '?';
    fwrite(STDERR, "Random walker (PHP) launching on a {$w}x{$h} map\n");
    $first = false;
  }
  $moves = ['N','S','E','W'];
  echo $moves[mt_rand(0,3)], "\n";
}
?>