# 2. Audio Streaming Bitrate and Codec Strategy

Context: Listeners in San José de la Rinconada connect over metered prepaid mobile data with patchy 2G/3G/4G coverage. High bitrates (128 kbps MP3, ~58 MB/hr) cause audio buffering and drain user data plans, while modern Ogg Opus streams lack native playback support on iOS Safari prior to iOS 18.4 (leading to total playback failure on older iPhones).

Decision: Target a 64 kbps AAC+ (HE-AAC) or 64–80 kbps MP3 stream configured at the Virtualtronics Shoutcast encoder, while building progressive reconnect backoff into the client player.

Why: AAC+ at 64 kbps cuts data consumption by ~50% (~29 MB/hr) while retaining FM-grade clarity for voice and vallenato music, guarantees 100% playback compatibility across all Android and iOS generations, and avoids protocol mismatches with Shoutcast DNAS v2.
