using System;
using System.IO;
using System.Text.Json;

var rng = new Random(1);
bool first = true;
string? line;
while ((line = Console.In.ReadLine()) != null)
{
    if (first)
    {
        using var doc = JsonDocument.Parse(line);
        var cfg = doc.RootElement.GetProperty("config");
        int w = cfg.GetProperty("width").GetInt32();
        int h = cfg.GetProperty("height").GetInt32();
        Console.Error.WriteLine($"Random walker (C#) launching on a {w}x{h} map");
        first = false;
    }
    Console.WriteLine(new[] { "N", "S", "E", "W" }[rng.Next(4)]);
}
