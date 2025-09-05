// random_walker.cpp
#include <bits/stdc++.h>    // or include <iostream>, <string>, <random>, <vector>
#include "picojson.h"

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    std::mt19937 rng(1u);                   // deterministic
    std::vector<std::string> moves = {"N","S","E","W"};

    bool first_tick = true;
    std::string line;

    while (std::getline(std::cin, line)) {
        picojson::value v;
        std::string err = picojson::parse(v, line);
        if (!err.empty()) {
            // If parsing fails, still emit a move to avoid timeouts.
            std::cout << moves[rng() % 4] << "\n" << std::flush;
            continue;
        }

        if (first_tick && v.is<picojson::object>()) {
            const auto& obj = v.get<picojson::object>();
            auto it_cfg = obj.find("config");
            if (it_cfg != obj.end() && it_cfg->second.is<picojson::object>()) {
                const auto& cfg = it_cfg->second.get<picojson::object>();
                int width  = 0, height = 0;
                auto it_w = cfg.find("width");
                auto it_h = cfg.find("height");
                if (it_w != cfg.end() && it_w->second.is<double>()) width  = (int)it_w->second.get<double>();
                if (it_h != cfg.end() && it_h->second.is<double>()) height = (int)it_h->second.get<double>();
                std::cerr << "Random walker (C++) launching on a "
                          << width << "x" << height << " map\n" << std::flush;
            }
        }

        // Random move every tick
        std::cout << moves[rng() % 4] << "\n" << std::flush;
        first_tick = false;
    }
    return 0;
}
